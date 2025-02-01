import cheerio from "cheerio";
import { promises as fs } from "fs";

const url =
  "https://catalog.northeastern.edu/undergraduate/computer-information-science/computer-information-science-combined-majors/computer-science-biology-bs/#planofstudytext";

async function scrapeData() {
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
            // Extract all header cells then allow only provided term names.
            termMapping = $row
              .find("th")
              .map((i, th) => $(th).text().trim())
              .get();
            // Only allow term headers that are one of the allowed terms.
            const allowedTerms = ["Fall", "Spring", "Summer 1", "Summer 2"];
            termMapping = termMapping.filter(term => allowedTerms.includes(term));
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
            !$row.hasClass("plangridtotal")
          ) {
            $row.find("td").each((i, td) => {
              const $td = $(td);
              if (i % 2 === 0 && $td.length > 0) {
                let courseText = "";
                const courses = $td
                  .find("a.bubblelink.code")
                  .map((_, link) => $(link).text().trim())
                  .get();

                // Get any additional text (like ND, WD, etc.)
                const tags = $td
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

                if (
                  courseText &&
                  !courseText.includes("Vacation") &&
                  !courseText.includes("Co-op")
                ) {
                  // Determine the term based on the extracted header mapping.
                  const colIndex = Math.floor(i / 2);
                  currentTerm = termMapping[colIndex] || "";
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
                }
              }
            });
          }
        });
      }
    });

    // Save JSON data to a file
    await fs.writeFile("output.json", JSON.stringify(plans, null, 2));
    console.log("Data successfully saved to output.json");
  } catch (error) {
    console.error("Error scraping data:", error);
  }
}

scrapeData();
