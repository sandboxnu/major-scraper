import { describe, expect, it, test } from "vitest";
import { isXOM, tokenizeHTML } from "@/tokenize";
import {
  ARCH_ENGLISH_2022,
  BIOENG_BIOCHEM_2022,
  CHEMICAL_ENG_2022,
  CS_BSCS_2022,
  CS_BUSINESS_ADMIN_2022,
  CS_ENGLISH_2023,
  CS_HISTORY_2022,
  CS_MATH_2022,
  CS_MUSIC_2023,
  HUMAN_SERVICE_INTER_AFFAIRS_2023,
  MEDIA_SCREEN_STUDIES_HISTORY_2022,
  PHARM_SCI_2022,
  PHYSICS_2022,
  PUBLIC_HEALTH_BA_2022,
  formatRawPath,
  formatTokenPath,
} from "./testUrls";
import { load } from "cheerio";
import { readFile } from "fs/promises";
import { SaveStage } from "@/classify";

const readAndTokenizeHTML = async (filePath: string) => {
  const text = await readFile(filePath, {
    encoding: "utf-8",
  });
  return await tokenizeHTML(load(text), 2022, SaveStage.INITIAL, "./test/raw");
};

const testTokenize = (testName: string, fileName: string) => {
  test(testName, async () => {
    await expect(
      JSON.stringify(
        await readAndTokenizeHTML(formatRawPath(fileName)),
        null,
        2,
      ),
    ).toMatchFileSnapshot(formatTokenPath(fileName));
  });
};

describe("Tokenize Phase: 2022 snapshots", () => {
  // CS 4950 is in the same AND twice for the Foundations concentration
  testTokenize(
    "Computer Science BSCS (multiple of the same class per AND course)",
    CS_BSCS_2022,
  );
  testTokenize(
    "CS & Business (nested linked concentration page)",
    CS_BUSINESS_ADMIN_2022,
  );
  testTokenize("Physics (3 courses per AND)", PHYSICS_2022);
  testTokenize(
    "Media screen & study history (range bounded)",
    MEDIA_SCREEN_STUDIES_HISTORY_2022,
  );
  testTokenize("CS and Math (range bounded with exceptions)", CS_MATH_2022);
  testTokenize("CS and History (range lower bounded)", CS_HISTORY_2022);
  testTokenize("Chemical Engineering (range unbounded)", CHEMICAL_ENG_2022);
  testTokenize("Bioeng Biochem (Or of ANDs)", BIOENG_BIOCHEM_2022);
  testTokenize("Architecture and English (no tabs)", ARCH_ENGLISH_2022);

  describe("weird program requirement hours text placement", () => {
    const get = (url: string) =>
      readAndTokenizeHTML(url).then(h => h.programRequiredHours);

    test("Public health BA (Minimum of x hours)", async () => {
      expect(await get(formatRawPath(PUBLIC_HEALTH_BA_2022))).toBeGreaterThan(
        0,
      );
    });

    // test("paragraph in front of `x total hrs`", async () => {
    //   expect(await get(PHARMD)).toBeGreaterThan(0);
    // });

    test("Pharmacy Science (paragraph in front of `Minimum of x hrs`)", async () => {
      expect(await get(formatRawPath(PHARM_SCI_2022))).toBeGreaterThan(0);
    });
  });
});

describe("Tokenize Phase: 2023 snapshots", () => {
  testTokenize(
    "CS and Music (section info phrasing in middle of a section)",
    CS_MUSIC_2023,
  );

  testTokenize(
    "CS and English (subsubsection aka subsection with indentation)",
    CS_ENGLISH_2023,
  );

  testTokenize(
    "Human Service and International Affairs (separated section info and course tables)",
    HUMAN_SERVICE_INTER_AFFAIRS_2023,
  );
});

describe("Tokenize Phase: utils", () => {
  const possibleXOMtexts = [
    "Complete one from the following:",
    "Complete one course from the following:",
    "Complete one of the following courses:",
    "Complete one course in the following range:",
    "Complete 4 credits of CS, CY, DS, or IS classes that are not already required. Choose courses within the following ranges:",

    "Complete two of the following courses:",
    "Complete two of the following:",
    "Complete two courses from the following:",
    "Complete two courses (not used elsewhere) from the following:",
    "Complete two courses in the following range:",
    "Complete 8 credits of upper-division CS, CY, DS, or IS classes that are not already required. Choose courses within the following ranges:",
    "Complete 8 credits of CS, CY, DS, or IS classes that are not already required. Choose courses within the following ranges:",
    "Complete 8 credits of CS, CY, DS or IS classes that are not already required. Choose courses within the following ranges:",

    "Complete three of the following:",
    "Complete three courses in the following range:",
    "Complete three courses from the following:",
    "Complete 12 credits of upper-division CS, CY, DS, or IS classes that are not already required. Choose courses within the following ranges:",
    "Complete 12 credits of CS, CY, DS, or IS classes that are not already required. Choose courses within the following ranges:",
    "Complete 12 credits of upper-division CS, CY, DS, or IS courses that are not already required. Choose courses within the following ranges:",

    "Complete four of the following:",
    "Complete four of the following courses:",
    "Complete four courses in the following range:",
    "Complete 16 credits of upper-division CS, CY, DS, or IS courses that are not already required. Choose courses within the following ranges:",

    "Complete five of the following:",
    "Complete five courses in the following range:",
  ];

  describe("isXOM", () => {
    it.each(possibleXOMtexts)("%s", text => {
      expect(isXOM(text)).toBeTruthy();
    });
  });
});
