import { scrapeMajorLinks } from "@/urls";
import { CURRENT_CATALOG_YEAR, EARLIEST_CATALOG_YEAR } from "./constants";
import { fatalError } from "./utils";
import { intro, outro, note, spinner } from "@clack/prompts";
import color from "picocolors";
import { CatalogEntryType, classify, type TypedCatalogEntry } from "@/classify";
import { Err, Ok, matchPipe, type Result } from "@/types";
import { tokenize, type TokenizedCatalogEntry } from "@/tokenize";
import { parse, type ParsedCatalogEntry } from "@/parse";

let args = process.argv.slice(2);
if (args.length === 0) {
  args = ["current"];
}

const years: number[] = args.map((arg: string) => {
  if (arg === "current") {
    return CURRENT_CATALOG_YEAR;
  } else if (arg.match(/\d{4}/)) {
    let year = Number(arg);
    if (year < EARLIEST_CATALOG_YEAR) {
      return fatalError(
        `Year "${year}" is earlier than the earliest catalog available as HTML (2016)!`,
      );
    } else if (year > CURRENT_CATALOG_YEAR) {
      return fatalError(
        "Either you're attempting to scrape a year in the future (which won't work unless time travel has been invented since this message was written), or you need to update CURRENT_CATALOG_YEAR in constants.ts.",
      );
    }
    return year;
  } else {
    return fatalError(
      `Unrecognized catalog year "${arg}"! Enter one or more valid catalog years or "current"`,
    );
  }
});

intro(color.inverse(`Scraping the ${years[0]} - ${years[0]! + 1} catalog`));
const spin = spinner();

const entries = await scrapeMajorLinksStage(spin);
const classifiedEntries = await classifyStage(spin, entries);
const tokenizedEntries = await tokenizeStage(spin, classifiedEntries);
const parsedEntries = await parseStage(spin, tokenizedEntries);

outro(`Finished scraping ${years[0]} - ${years[0]! + 1} catalog!`);

async function scrapeMajorLinksStage(spin: ReturnType<typeof spinner>) {
  spin.start("Scraping Major Links");
  const { entries, errors } = await scrapeMajorLinks(2022);
  spin.stop("Finish scraping major links");

  note(
    `Number of links scraped: ${entries.length}\nNumber of links failed: ${
      errors.length
    }${errors.length !== 0 ? "\n" + JSON.stringify(errors, null, 2) : ""}`,
    "Major link stats",
  );

  return entries;
}

async function classifyStage(spin: ReturnType<typeof spinner>, entries: URL[]) {
  spin.start("Classifying majors");
  const classified = await Promise.all(
    entries.map(url =>
      classify(url, [
        CatalogEntryType.Minor,
        CatalogEntryType.Major,
        CatalogEntryType.Concentration,
      ]),
    ),
  );
  spin.stop("Finish classifying majors");

  const classifiedLog = new Map<string, string[]>();
  let successCount = 0;
  let errorCount = 0;
  const classifiedEntries: TypedCatalogEntry[] = [];

  classified.forEach(
    matchPipe({
      Ok: value => {
        successCount++;
        classifiedEntries.push(value);
      },
      Err: error => {
        errorCount++;

        if (!classifiedLog.has(error.message)) {
          classifiedLog.set(error.message, []);
        }

        classifiedLog.get(error.message)!.push(error.url.href);
      },
    }),
  );
  const classifiedNote = Array.from(
    classifiedLog,
    ([name, value]) => `${color.bold(name)} ${JSON.stringify(value, null, 2)}`,
  );

  note(
    `Number of links classified: ${successCount}\nNumber of links failed: ${errorCount}\n\n${classifiedNote.join(
      "\n\n",
    )}`,
    "Classified link stats",
  );

  return classifiedEntries;
}

async function tokenizeStage(
  spin: ReturnType<typeof spinner>,
  classifiedEntries: TypedCatalogEntry[],
) {
  spin.start("Tokenizing majors");
  const tokenized: Result<
    TokenizedCatalogEntry,
    { url: URL; message: string }
  >[] = await Promise.all(
    classifiedEntries.map(async entry => {
      try {
        return Ok(await tokenize(entry));
      } catch (e) {
        return Err({
          url: entry.url,
          message: (e as Error).message,
        });
      }
    }),
  );
  spin.stop("Finish tonkenizing majors");

  const tokenizeLog = new Map<string, string[]>();
  let successCount = 0;
  let errorCount = 0;
  const tokenizedEntries: TokenizedCatalogEntry[] = [];

  tokenized.forEach(
    matchPipe({
      Ok: value => {
        successCount++;
        tokenizedEntries.push(value);
      },
      Err: error => {
        errorCount++;

        if (!tokenizeLog.has(error.message)) {
          tokenizeLog.set(error.message, []);
        }

        tokenizeLog.get(error.message)!.push(error.url.href);
      },
    }),
  );
  const tokenizedNote = Array.from(
    tokenizeLog,
    ([name, value]) => `${color.bold(name)} ${JSON.stringify(value, null, 2)}`,
  );

  note(
    `Number of entries tokenize: ${successCount}\nNumber of entries failed: ${errorCount}\n\n${tokenizedNote.join(
      "\n\n",
    )}`,
    "Tokenize link stats",
  );

  return tokenizedEntries;
}

async function parseStage(
  spin: ReturnType<typeof spinner>,
  tokenizedEntries: TokenizedCatalogEntry[],
) {
  spin.start("Parsing majors");
  const tokenized: Result<ParsedCatalogEntry, { url: URL; message: string }>[] =
    await Promise.all(
      tokenizedEntries.map(async entry => {
        try {
          return Ok(await parse(entry));
        } catch (e) {
          return Err({
            url: entry.url,
            message: (e as Error).message,
          });
        }
      }),
    );
  spin.stop("Finish parsing majors");

  const parseLog = new Map<string, string[]>();
  let successCount = 0;
  let errorCount = 0;
  const parsedCatalogEntry: ParsedCatalogEntry[] = [];

  tokenized.forEach(
    matchPipe({
      Ok: value => {
        successCount++;
        parsedCatalogEntry.push(value);
      },
      Err: error => {
        errorCount++;

        if (!parseLog.has(error.message)) {
          parseLog.set(error.message, []);
        }

        parseLog.get(error.message)!.push(error.url.href);
      },
    }),
  );
  const parseNote = Array.from(
    parseLog,
    ([name, value]) => `${color.bold(name)} ${JSON.stringify(value, null, 2)}`,
  );

  note(
    `Number of entries tokenize: ${successCount}\nNumber of entries failed: ${errorCount}\n\n${parseNote.join(
      "\n\n",
    )}`,
    "Tokenize link stats",
  );

  return tokenizedEntries;
}
