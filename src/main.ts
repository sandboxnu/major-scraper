import { scrapeMajorLinks } from "@/urls";
import { CURRENT_CATALOG_YEAR, EARLIEST_CATALOG_YEAR } from "./constants";
import { fatalError } from "./utils";
import { intro, outro, spinner, log, note } from "@clack/prompts";
import color from "picocolors";
import { CatalogEntryType, classify } from "@/classify";
import { matchPipe } from "@/types";

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

spin.start("Scraping Major Links");
const { entries, errors } = await scrapeMajorLinks(2022);
spin.stop("Finish scraping major links");

note(
  `Number of links scraped: ${entries.length}\nNumber of links failed: ${
    errors.length
  }${errors.length !== 0 ? "\n" + JSON.stringify(errors, null, 2) : ""}`,
  "Major link stats",
);

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

classified.forEach(
  matchPipe({
    Ok: () => {
      successCount++;
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
  `Number of links classified: ${successCount}\nNumber of links failed: ${errorCount}\n${classifiedNote.join(
    "\n\n",
  )}`,
  "Classified link stats",
);

outro(`Finished scraping ${years[0]} - ${years[0]! + 1} catalog!`);
