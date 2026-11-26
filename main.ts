/**
 * How Many Tabs Do You Have Open?
 *
 * The competition's artifact is one text: a single count of open browser tabs,
 * digits only, 1 to 5 characters, not only white space. The judge compares two
 * counts at a time and picks the more surprising one, weighing whether it reads
 * as a real, lived-in answer.
 *
 * The number is fixed at build time (see COUNT below), so the artifact is
 * byte-identical on every run. The program does three things: build the text,
 * hold it to the gate's own rule, and write it to the output directory.
 *
 * Node 22, standard library only.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The count this entry sends.
 *
 * The judge reads only the artifact, never this file, so the number has to
 * carry the whole argument on its own. It is chosen against the judge's
 * criteria in the order the judge is told to weigh them:
 *
 *   3. surprising, far higher or far lower than the field would guess: a
 *      four-digit count sits well above the ordinary answer, which is tens;
 *   4. believable, not an absurd figure picked to shock: four digits is inside
 *      what a real tab hoarder accumulates, where five and six digits are not;
 *   5. hints at a life behind it: no round hundred, no repeated digit, no
 *      arithmetic run. Round figures (1000, 2500, 5000) are what someone
 *      writes when they want to look extreme; an irregular four-digit count
 *      reads as a number that was actually added up.
 *
 * Criteria 1 and 2 are satisfied by any bare digit string and so separate
 * nothing; the choice is made entirely on 3 through 5, which is why the
 * number is irregular rather than maximal.
 */
const COUNT = "2617";

/** Where the harness mounts the writable output directory. */
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

/** The artifact's file name, fixed by the competition's judge block. */
const ARTIFACT = "entry.txt";

/**
 * The gate's rule, restated here so a bad count can never be written:
 * 1 to 5 characters, not only white space. The competition additionally wants
 * a single number in digits and nothing else, so this entry also refuses
 * anything that is not pure ASCII digits.
 */
function gateReason(text: string): string | null {
  if (text.length < 1 || text.length > 5) {
    return `the text is ${text.length} characters, outside the gate's 1 to 5`;
  }
  if (text.trim() === "") {
    return "the text is only white space";
  }
  if (!/^[0-9]+$/.test(text)) {
    return `the text is not one number in digits: ${JSON.stringify(text)}`;
  }
  return null;
}

function main(): void {
  const reason = gateReason(COUNT);
  if (reason !== null) {
    process.stderr.write(`refusing to write the entry: ${reason}\n`);
    process.exitCode = 1;
    return;
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const path = join(OUTPUT_DIR, ARTIFACT);
  writeFileSync(path, COUNT, { encoding: "utf8" });

  // Read the bytes back and hold them to the gate again. A write that landed
  // truncated, re-encoded or with a newline appended would still be a file on
  // disk, and the grader would judge it as it lies; so the run fails loudly
  // rather than shipping an artifact this program never meant to send.
  const written = readFileSync(path);
  if (!written.equals(Buffer.from(COUNT, "utf8"))) {
    process.stderr.write(
      `refusing to finish: ${path} holds ${JSON.stringify(written.toString("utf8"))}, not ${JSON.stringify(COUNT)}\n`,
    );
    process.exitCode = 1;
    return;
  }
  const landed = gateReason(written.toString("utf8"));
  if (landed !== null) {
    process.stderr.write(`refusing to finish: the written file fails the gate: ${landed}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`wrote ${JSON.stringify(COUNT)} to ${path}\n`);
}

main();
