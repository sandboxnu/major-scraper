import cheerio from "cheerio";
import { promises as fs } from "fs";

const url =
  "https://catalog.northeastern.edu/undergraduate/engineering/chemical/chemical-engineering-physics-bsche/#programrequirementstext";

async function scrapeData() {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const plans: Record<string, Record<string, Record<string, any[]>>> = {};
    let currentPlan = "";
    let currentYear = "";
    let currentTerm = "";

    // Find all h3 headers for different plans
    $("#planofstudytextcontainer h3").each((_, header) => {
      const planTitle = $(header).text().trim();
      if (!planTitle.startsWith("Notes") && !planTitle.startsWith("Physics")) {
        currentPlan = planTitle;
        plans[currentPlan] = {};

        // Find the table that follows this header
        const planTable = $(header).nextUntil("h3", "table.sc_plangrid");

        // Process each row in this plan's table
        planTable.find("tr").each((_, element) => {
          const $element = $(element);

          // Check if this is a year header
          if ($element.hasClass("plangridyear")) {
            currentYear = $element.find("th").text().trim();
            if (!plans[currentPlan]![currentYear]) {
              plans[currentPlan]![currentYear] = {};
            }
            return;
          }

          // Check if this is a term header
          if ($element.hasClass("plangridterm")) {
            return; // Skip the term header row
          }

          // Process course data rows
          if (
            !$element.hasClass("plangridsum") &&
            !$element.hasClass("plangridtotal")
          ) {
            const termData = $element.find("td");

            // Process each term's data
            termData.each((i, td) => {
              const $td = $(td);
              if (i % 2 === 0 && $td.length > 0) {
                // Only process course cells, skip hours cells
                let courseText = "";

                // Get all course codes and their "and" relationships
                const courses = $td
                  .find("a.bubblelink.code")
                  .map((_, link) => {
                    return $(link).text().trim();
                  })
                  .get();

                // Get any additional text (like ND, WD, etc.)
                const tags = $td
                  ?.clone()
                  ?.children()
                  ?.remove()
                  ?.end()
                  ?.text()
                  ?.trim()
                  ?.split("\n")[0] // Take first line only
                  ?.replace(/\s+/g, " ") // Normalize whitespace
                  ?.trim();

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
                  // Determine the term based on position
                  switch (i) {
                    case 0:
                      currentTerm = "Fall";
                      break;
                    case 2:
                      currentTerm = "Spring";
                      break;
                    case 4:
                      currentTerm = "Summer 1";
                      break;
                    case 6:
                      currentTerm = "Summer 2";
                      break;
                  }

                  if (
                    courseText &&
                    currentYear &&
                    currentTerm &&
                    plans[currentPlan]
                  ) {
                    const yearData = plans[currentPlan]?.[currentYear] ?? {};
                    plans[currentPlan]![currentYear] = yearData;
                    const termData = yearData[currentTerm] ?? [];
                    yearData[currentTerm] = termData;
                    termData.push(courseText);
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
    console.error("Error fetching the page:", error);
  }
}

scrapeData();
