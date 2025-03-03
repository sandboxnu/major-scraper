import cheerio from "cheerio";
import { promises as fs } from "fs";
import { getCurrentYear } from "./urls";
import { scrapePlans } from "./runtime";

//const url = "https://catalog.northeastern.edu/undergraduate/health-sciences/nursing/bsn/#planofstudytext";

export async function scrapePlan(url: string, fileName: string) {
  try {
    // Add a User-Agent header to mimic a real browser
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
      },
    });
    const html = await response.text();
    // Debug: log the length of fetched HTML to see if content is returned
    console.log("Fetched HTML length:", html.length);

    const $ = cheerio.load(html);
    // Debug: log the number of headers found with our combined selector
    console.log(
      "Found plan headers:",
      $("#planofstudytextcontainer h3, #planofstudytext h3").length,
    );

    const $tbody = $("tbody").first();

    if (!$tbody.length) {
      console.log(`No plan of study table found for: ${url}`);
      return; // Skip creating JSON if no table is found
    }

    const planTitle = $tbody.prevAll("h3").first().text().trim();

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
              let courseText = "";
              const courses = $cell
                .find("a.bubblelink.code")
                .map((_, link) => $(link).text().trim())
                .get();

              // Get any additional text in the cell
              const tags = $cell
                ?.clone()
                ?.children()
                ?.remove()
                ?.end()
                ?.text()
                ?.trim()
                ?.split("\n")[0]
                ?.replace(/\s+/g, " ")
                .trim();

              if (courses.length > 0) {
                courseText = courses.join(" and ");
                if (tags) {
                  courseText += " " + tags;
                }
              }

              // Map the cell to the corresponding term from our header mapping.
              currentTerm = termMapping[index] || "";
              if (!currentTerm) return;

              if (
                courseText &&
                currentYear &&
                currentTerm &&
                plans[currentPlan]
              ) {
                const yearData = plans[currentPlan]?.[currentYear] ?? {};
                plans[currentPlan]![currentYear] = yearData;
                const termsData = yearData[currentTerm] ?? [];
                yearData[currentTerm] = termsData;
                // Only add the course text if it isn't already present
                if (!termsData.includes(courseText)) {
                  termsData.push(courseText);
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

    // Extract path components from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");

    // Get year from either archive URL or current year
    const year =
      pathParts[1] === "archive"
        ? pathParts[2]?.split("-")[0]
        : new Date().getFullYear().toString();

    // Get college and major parts
    const undergraduateIndex = pathParts.indexOf("undergraduate");
    const college = pathParts[undergraduateIndex + 1] || "unknown";
    const majorPath = pathParts[pathParts.length - 2] || "unknown";

    // Construct standardized output path
    const directory = `./src/output/${year}/${college}/${majorPath}`;
    await fs.mkdir(directory, { recursive: true });

    // Save as plan.json
    const outputFilePath = `${directory}/plan.json`;
    await fs.writeFile(outputFilePath, JSON.stringify(plans, null, 2));
    console.log("URL: " + url);
    console.log("Data successfully saved to " + outputFilePath);
  } catch (error) {
    console.error("Error scraping data:", error);
  }
}

//scrapeData(url);
await scrapePlans(2022, await getCurrentYear());
