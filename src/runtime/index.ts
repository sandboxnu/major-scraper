import { ConcentrationError, classify } from "@/classify";
import { parse } from "@/parse";
import {
  PhaseLabel,
  type ErrorLog,
  type MandatoryPipelineEntry,
} from "@/runtime/types";
import { scrapePlan } from "@/scrapertest";
import { tokenize } from "@/tokenize";
import { scrapeMajorLinks } from "@/urls";
import { log, note, spinner } from "@clack/prompts";
import color from "picocolors";

export async function scrapePlans(year: number, currentYear: number) {
  log.info(
    color.bold(`Scraping templates for the ${year} - ${year + 1} catalog`),
  );
  const spin = spinner();

  // First get major links from the catalog
  const majorLinksResult = await phaseLogger(
    spin,
    PhaseLabel.ScrapeMajorLinks,
    scrapeMajorLinks(year, currentYear, ""),
  );

  // Then classify them to get proper save paths
  const classifiedEntries = await phaseLogger(
    spin,
    PhaseLabel.Classify,
    phaseResult(majorLinksResult, classify),
  );

  log.info(`Found ${classifiedEntries.length} majors to scrape templates for`);

  let idx = 0;
  const totalEntries = classifiedEntries.length;

  // Process each entry to scrape its plan of study
  for (const entry of classifiedEntries) {
    idx++;
    spin.start(`Scraping template ${idx}/${totalEntries}: ${entry.majorName}`);

    try {
      await scrapePlan(
        entry.url.href,
        entry.savePath || "FAILED_PATH",
        entry.yearVersion,
      );
      spin.stop(`Template ${idx}/${totalEntries}: ${entry.majorName} - Done`);
    } catch (error) {
      spin.stop(
        `Template ${idx}/${totalEntries}: ${entry.majorName} - Failed: ${error}`,
      );
    }
  }

  log.success(`Finished scraping templates for ${year} - ${year + 1} catalog!`);
}

export async function scrape(year: number, currentYear: number) {
  log.info(
    color.bold(
      `Scraping major requirements for the ${year} - ${year + 1} catalog`,
    ),
  );
  const spin = spinner();

  await phaseLogger(
    spin,
    PhaseLabel.ScrapeMajorLinks,
    scrapeMajorLinks(year, currentYear, ""),
  )
    .then(addPhase(spin, PhaseLabel.Classify, classify))
    .then(addPhase(spin, PhaseLabel.Tokenize, tokenize))
    .then(addPhase(spin, PhaseLabel.Parse, parse));

  log.success(
    `Finished scraping major requirements for ${year} - ${year + 1} catalog!`,
  );
}

/**
 * Main function for adding new phase to the scraper
 * This function was made higher-order mainly to shorten the
 * arrow function syntax when using .then
 * See @function scrape for example usage
 * @param spin The spinner object to log to CLI
 * @param name The name of the scraper phase to display
 * @param stageFunc The function to process individual entry
 */
function addPhase<T extends { url: URL; savePath?: string }, R>(
  spin: ReturnType<typeof spinner>,
  name: string,
  stageFunc: (entry: T) => Promise<R>,
) {
  return async function (entries: T[]) {
    return await phaseLogger(spin, name, phaseResult(entries, stageFunc));
  };
}

/**
 * Helper function for separating the successful entries and the errors
 * @param entries The entries to this phase
 * @param phaseFunc The function to process individual entry
 */
async function phaseResult<T extends MandatoryPipelineEntry, R>(
  entries: T[],
  phaseFunc: (entry: T) => Promise<R>,
) {
  const nextEntries: R[] = [];
  const errorLog: ErrorLog[] = [];

  await Promise.all(
    // .forEach would not work here since it
    // doesn't play well with async
    entries.map(async entry => {
      try {
        nextEntries.push(await phaseFunc(entry));
      } catch (e) {
        let message: string = "";
        let savePath: string | undefined;

        if (e instanceof ConcentrationError) {
          message = "Concentration Catalog";
          savePath = e.savePath;
        } else {
          message = (e as Error).message;
          savePath = entry.savePath;
        }

        errorLog.push({
          message,
          entryInfo: savePath ? savePath : entry.url.href,
        });
      }
    }),
  );

  return { errorLog, nextEntries };
}

/**
 * Helper function to log the stats and errors of a phase
 * This abstraction is to maintain consistency between
 * The first phase (Scrape Major Links) and the other phase
 * @param spin The spinner objec to log to CLI
 * @param name The phase name
 * @param result The promised result of the phase
 */
async function phaseLogger<R>(
  spin: ReturnType<typeof spinner>,
  name: string,
  result: Promise<{
    errorLog: ErrorLog[];
    nextEntries: R[];
  }>,
) {
  const phaseName = color.cyan(name);

  spin.start(`${phaseName} - started`);
  const { errorLog, nextEntries } = await result;
  spin.stop(`${phaseName} - finished`);

  // aggregate the catalog entries with similar errors
  const aggregatedLog = new Map<string, string[]>();

  errorLog.forEach(err => {
    if (!aggregatedLog.has(err.message)) {
      aggregatedLog.set(err.message, []);
    }

    aggregatedLog.get(err.message)!.push(err.entryInfo);
  });

  // sort the error based on occurance (how many entries have it)
  const errorNotes = Array.from(aggregatedLog, ([err, entries]) => ({
    err,
    entries,
  }))
    .sort((a, b) => b.entries.length - a.entries.length)
    .map(
      ({ err, entries }) =>
        `${color.bold(err)} ${JSON.stringify(entries, null, 2)}`,
    );

  const stats = `Number of entries: ${
    nextEntries.length + errorLog.length
  }\n  Passed: ${nextEntries.length}\n  Failed: ${errorLog.length}`;

  const errorString = `${
    errorNotes.length === 0 ? "" : "\n\n"
  }${errorNotes.join("\n\n")}`;

  note(`${stats}${errorString}`, `${phaseName} - stats`);

  return nextEntries;
}
