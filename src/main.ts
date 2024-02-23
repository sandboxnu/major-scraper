import { intro, log, outro } from "@clack/prompts";
import { CURRENT_CATALOG_YEAR, EARLIEST_CATALOG_YEAR } from "./constants";
import color from "picocolors";
import { scrape } from "@/runtime/pipeline";

intro(color.inverse(" Welcome to Major Scraper "));

let args = process.argv.slice(2);
if (args.length === 0) {
  args = ["current"];
}

const years: number[] = args.map((arg: string) => {
  if (arg === "current") {
    return CURRENT_CATALOG_YEAR;
  }

  if (arg.match(/\d{4}/)) {
    let year = Number(arg);

    if (year < EARLIEST_CATALOG_YEAR) {
      fatalError(
        `Year "${year}" is earlier than the earliest catalog available as HTML (2016)!`,
      );
    }

    if (year > CURRENT_CATALOG_YEAR) {
      fatalError("Get the Delorean Doc, we are going to the future :)");
    }

    return year;
  }

  fatalError(
    `Unrecognized catalog year "${arg}"! Enter one or more valid catalog years or "current"`,
  );
});

for (const year of years) {
  await scrape(year);
}

outro("Finished scraping! Have fun validating them ;)");

function fatalError(message: string): never {
  log.error(message);
  process.exit(0);
}
