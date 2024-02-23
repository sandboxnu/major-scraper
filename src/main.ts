import { intro, log, outro } from "@clack/prompts";
import { EARLIEST_CATALOG_YEAR } from "./constants";
import color from "picocolors";
import { scrape } from "@/runtime/pipeline";
import { fatalError } from "@/utils";
import { getCurrentYear } from "@/urls";

intro(color.inverse(" Welcome to Major Scraper "));

let args = process.argv.slice(2);
if (args.length === 0) {
  args = ["current"];
}

const currentYear = await getCurrentYear();

log.info(`The current catalog year is ${currentYear}`);

const years: number[] = args.map((arg: string) => {
  if (arg === "current") {
    return currentYear;
  }

  if (arg.match(/\d{4}/)) {
    let year = Number(arg);

    if (year < EARLIEST_CATALOG_YEAR) {
      fatalError(
        `Year "${year}" is earlier than the earliest catalog available as HTML (2016)!`,
      );
    }

    if (year > currentYear) {
      fatalError(
        `Get the Delorean Doc, we are going to the future :). Year ${year} is later than current year ${currentYear}`,
      );
    }

    return year;
  }

  fatalError(
    `Unrecognized catalog year "${arg}"! Enter one or more valid catalog years or "current"`,
  );
});

for (const year of years) {
  await scrape(year, currentYear);
}

outro("Finished scraping! Have fun validating them ;)");
