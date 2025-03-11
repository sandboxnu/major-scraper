import cheerio from "cheerio";
import { mkdir, writeFile } from "fs/promises";
import { getCurrentYear } from "./urls";
import { scrapePlans } from "./runtime";
import { majorNameToFileName } from "@/utils";
import { intro, log, outro } from "@clack/prompts";
import color from "picocolors";
import { EARLIEST_CATALOG_YEAR } from "./constants";
import { fatalError } from "@/utils";

//const url = "https://catalog.northeastern.edu/undergraduate/health-sciences/nursing/bsn/#planofstudytext";

export async function scrapePlan(url: string, savePath: string) {
  try {
    log.info(`Scraping plan from: ${color.blue(url)}`);

    // Add #planofstudytext to the URL if it's not already there
    if (!url.includes("#planofstudytext")) {
      url = url + "#planofstudytext";
    }

    // Add a User-Agent header to mimic a real browser
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
      },
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    const $tbody = $("tbody").first();

    if (!$tbody.length) {
      log.warning(`No table found for: ${color.yellow(url)}`);
      return; // Skip creating JSON if no table is found
    }

    const plans: Record<string, Record<string, Record<string, any[]>>> = {};
    let currentPlan = "";
    let currentYear = "";
    let currentTerm = "";

    // Use a combined selector to handle both container IDs and both h2 and h3 elements:
    $(
      "#planofstudytextcontainer h2, #planofstudytext h2, #planofstudytextcontainer h3, #planofstudytext h3",
    ).each((_, header) => {
      const headerText = $(header).text().trim();

      // Skip notes headers
      if (headerText.startsWith("Notes")) {
        return;
      }

      // Normalize plan title by removing common prefixes
      let planTitle = headerText;
      const prefixesToRemove = [
        "Sample Plan of Study:",
        "Sample Plan of Study",
        "Plan of Study:",
      ];

      for (const prefix of prefixesToRemove) {
        if (planTitle.startsWith(prefix)) {
          planTitle = planTitle.substring(prefix.length).trim();
          break;
        }
      }

      // Log what we found for debugging
      log.info(`Found plan: ${color.green(planTitle)}`);

      // If we've already seen this plan title, skip to avoid duplicate processing
      if (plans[planTitle]) {
        log.info(`Skipping duplicate plan: ${color.yellow(planTitle)}`);
        return;
      }

      currentPlan = planTitle;
      plans[currentPlan] = {};

      // Improved table selection logic with multiple strategies
      let planTable;
      
      // Strategy 1: Look for the table right after the header
      planTable = $(header).next("table.sc_plangrid");
      
      // Strategy 2: If not found, try looking for any table after the header
      if (!planTable.length) {
        planTable = $(header).nextAll("table.sc_plangrid").first();
      }
      
      // Strategy 3: Look for tables in the same container as the header
      if (!planTable.length) {
        const parentContainer = $(header).closest("#planofstudytextcontainer, #planofstudytext");
        planTable = parentContainer.find("table.sc_plangrid").first();
        
        if (planTable.length) {
          log.info(`Found table in parent container for plan: ${color.green(planTitle)}`);
        }
      }
      
      // Debug what we found around the header
      if (!planTable.length) {
        log.warning(`No table found for plan: ${color.yellow(planTitle)}`);
        return;
      }

      log.info(`Processing table for plan: ${color.green(planTitle)}`);

      // We'll store a term mapping for each year. Reset it before processing rows.
      let termMapping: string[] = [];

      // Process each row in this plan's table
      planTable.find("tr").each((_, element) => {
        const $row = $(element);

        // If we find the term header row, extract the mapping.
        if ($row.hasClass("plangridterm")) {
          // Only extract the <th> cells that are not the hours column.
          termMapping = $row
            .find("th:not(.hourscol)")
            .map((i, th) => $(th).text().trim())
            .get();
          // (Optionally, filter allowed terms – though this is now defined by the table itself.)
          return; // Continue to next row
        }

        // Check if this is a year header row
        if ($row.hasClass("plangridyear")) {
          currentYear = $row.find("th").text().trim();
          // Reset the termMapping for each new year.
          termMapping = [];
          if (!plans[currentPlan]![currentYear]) {
            plans[currentPlan]![currentYear] = {};
          }
          return;
        }

        // Process course data rows (skip summary or total rows)
        if (
          !$row.hasClass("plangridsum") &&
          !$row.hasClass("plangridtotal") &&
          !$row.hasClass("plangridsum")
        ) {
          // Only select the course cells (skip hours columns)
          const courseCells = $row.find("td:not(.hourscol)");
          courseCells.each((index, cell) => {
            const $cell = $(cell);
            //note: we can get all the courses in the cell but for simplicity i am only taking the first one
            //could be a good idea to get all the courses in the cell and have cool ui to switch between
            const course = $cell
              .find("a.bubblelink.code")
              .map((_, link) => $(link).text().trim())
              .get()[0];

            // Map the cell to the corresponding term from our header mapping.
            currentTerm = termMapping[index] || "";
            if (!currentTerm) return;

            if (course && currentYear && currentTerm && plans[currentPlan]) {
              const yearData = plans[currentPlan]?.[currentYear] ?? {};
              plans[currentPlan]![currentYear] = yearData;
              const termsData = yearData[currentTerm] ?? [];
              yearData[currentTerm] = termsData;
              // Only add the course text if it isn't already present
              if (!termsData.includes(course)) {
                termsData.push(course);
              }
            }
          });
        }
      });
    });

    if (Object.keys(plans).length === 0) {
      log.warning(`No valid plans found for: ${color.yellow(url)}`);
      return;
    }

    // Log success
    log.info(
      `Found ${Object.keys(plans).length} plan(s): ${Object.keys(plans).join(", ")}`,
    );

    // Ensure the directory exists before writing the file
    await mkdir(savePath, { recursive: true });

    // Save as template.json
    const outputFilePath = `${savePath}/template.json`;
    log.success(`Saving plan to ${color.green(outputFilePath)}`);
    await writeFile(outputFilePath, JSON.stringify(plans, null, 2));
  } catch (error) {
    log.error(`Error scraping data: ${error}`);
  }
}

// Main execution
intro(color.inverse(" Welcome to Major Scraper Test "));

const args = process.argv.slice(2);
const startYear = args[0] ? parseInt(args[0]) : 2022;
const currentYear = await getCurrentYear();

if (startYear < EARLIEST_CATALOG_YEAR) {
  fatalError(
    `Year "${startYear}" is earlier than the earliest catalog available as HTML (2016)!`,
  );
}

if (startYear > currentYear) {
  fatalError(
    `Get the Delorean Doc, we are going to the future :). Year ${startYear} is later than current year ${currentYear}`,
  );
}

log.info(`The current catalog year is ${color.blue(currentYear)}`);
log.info(
  `Scraping plans from ${color.green(startYear)} to ${color.green(currentYear)}`,
);

await scrapePlans(startYear, currentYear);
outro("Finished scraping! Have fun validating them ;)");
