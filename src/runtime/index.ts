import { classify } from "@/classify";
import { parse } from "@/parse";
import { PhaseLabel } from "@/runtime/types";
import { tokenize } from "@/tokenize";
import { Err, Ok, type Result } from "@/types";
import { scrapeMajorLinks } from "@/urls";
import { matchPipe } from "@/utils";
import { log, note, spinner } from "@clack/prompts";
import color from "picocolors";

export async function scrape(year: number, currentYear: number) {
  log.info(color.bold(`Scraping the ${year} - ${year + 1} catalog`));
  const spin = spinner();

  await scrapeMajorLinksPhase(spin, year, currentYear)
    .then(addPhase(spin, PhaseLabel.Classify, classify))
    .then(addPhase(spin, PhaseLabel.Tokenize, tokenize))
    .then(addPhase(spin, PhaseLabel.Parse, parse));

  log.success(`Finished scraping ${year} - ${year + 1} catalog!`);
}

async function scrapeMajorLinksPhase(
  spin: ReturnType<typeof spinner>,
  year: number,
  currentYear: number,
) {
  const stageName = color.cyan(PhaseLabel.ScrapeMajorLinks);
  spin.start(`${stageName} - started`);
  const { entries, errors } = await scrapeMajorLinks(year, currentYear);
  spin.stop(`${stageName} - finished`);

  note(
    `Number of entries passed: ${entries.length}\nNumber of entries failed: ${
      errors.length
    }${errors.length !== 0 ? "\n" + JSON.stringify(errors, null, 2) : ""}`,
    `${stageName} - stats`,
  );

  return entries.map(url => ({
    url,
  }));
}

function addPhase<T extends { url: URL }, R>(
  spin: ReturnType<typeof spinner>,
  name: string,
  stageFunc: (entry: T) => Promise<R>,
) {
  return async function (entries: T[]) {
    const phaseName = color.cyan(name);
    spin.start(`${phaseName} - started`);
    const entryResults: Result<R, { url: URL; message: string }>[] =
      await Promise.all(
        entries.map(async entry => {
          try {
            return Ok(await stageFunc(entry));
          } catch (e) {
            return Err({
              url: entry.url,
              message: (e as Error).message,
            });
          }
        }),
      );
    spin.stop(`${phaseName} - finished`);

    const log = new Map<string, string[]>();
    let successCount = 0;
    let errorCount = 0;
    const nextEntries: R[] = [];

    entryResults.forEach(
      matchPipe({
        Ok: value => {
          successCount++;
          nextEntries.push(value);
        },
        Err: error => {
          errorCount++;

          if (!log.has(error.message)) {
            log.set(error.message, []);
          }

          log.get(error.message)!.push(error.url.href);
        },
      }),
    );
    const notes = Array.from(
      log,
      ([name, value]) =>
        `${color.bold(name)} ${JSON.stringify(value, null, 2)}`,
    );

    note(
      `Number of entries passed: ${successCount}\nNumber of entries failed: ${errorCount}\n\n${notes.join(
        "\n\n",
      )}`,
      `${phaseName} - stats`,
    );

    return nextEntries;
  };
}
