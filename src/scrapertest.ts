import cheerio from "cheerio";
import { mkdir, writeFile } from "fs/promises";
import { getCurrentYear } from "./urls";
import { scrapePlans } from "./runtime";
import { majorNameToFileName } from "@/utils";

//const url = "https://catalog.northeastern.edu/undergraduate/health-sciences/nursing/bsn/#planofstudytext";

export async function scrapePlan(url: string, savePath: string) {
  try {
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
      const planTitle = $(header).text().trim();
      // Remove the "Notes" exclusion so that all plans are processed.
      if (!planTitle.startsWith("Notes")) {
        // If we've already seen this plan title, skip to avoid duplicate processing
        if (plans[planTitle]) {
          return;
        }

        currentPlan = planTitle;
        plans[currentPlan] = {};

        // Find the table that follows this header
        const planTable = $(header).nextUntil("h3", "table.sc_plangrid");
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
      }
    });

    if (Object.keys(plans).length === 0) {
      console.log(`No valid plans found for: ${url}`);
      return;
    }

    // Ensure the directory exists before writing the file
    await mkdir(savePath, { recursive: true });

    // Save as template.json
    const outputFilePath = `${savePath}/template.json`;
    //console.log("Saving plan to " + outputFilePath);
    await writeFile(outputFilePath, JSON.stringify(plans, null, 2));
  } catch (error) {
    console.error("Error scraping data:", error);
  }
}

//scrapeData(url);
await scrapePlans(2022, await getCurrentYear());
