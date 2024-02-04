import { describe, expect, test } from "vitest";
import { tokenizeHTML } from "@/tokenize";
import {
  ARCH_ENGLISH_2022,
  BIOENG_BIOCHEM_2022,
  CHEMICAL_ENG_2022,
  CS_BSCS_2022,
  CS_GAME_DEV_2022,
  CS_HISTORY_2022,
  CS_MATH_2022,
  MEDIA_SCREEN_STUDIES_HISTORY_2022,
  PHARM_SCI_2022,
  PHYSICS_2022,
  PUBLIC_HEALTH_BA_2022,
} from "./testUrls";
import { load } from "cheerio";
import { readFile } from "fs/promises";

const readAndTokenizeHTML = async (filePath: string) => {
  const text = await readFile(filePath, {
    encoding: "utf-8",
  });
  return await tokenizeHTML(load(text));
};

let unregisterAgent: () => Promise<void>;
describe("tokenize", () => {
  test("CS & Game Dev", async () => {
    expect(await readAndTokenizeHTML(CS_GAME_DEV_2022)).toMatchSnapshot();
  });

  // test("CS & Business (nested linked concentration page)", async () => {
  //   expect(await readAndTokenizeHTML(CS_BUSINESS_ADMIN_PATH)).toMatchSnapshot();
  // });

  test("PHYSICS (3 courses per AND)", async () => {
    expect(await readAndTokenizeHTML(PHYSICS_2022)).toMatchSnapshot();
  });

  // CS 4950 is in the same AND twice for the Foundations concentration
  test("CS BSCS (multiple of the same class per AND) ", async () => {
    expect(await readAndTokenizeHTML(CS_BSCS_2022)).toMatchSnapshot();
  });

  // Range bounded
  test("Test range bounded (history)", async () => {
    expect(
      await readAndTokenizeHTML(MEDIA_SCREEN_STUDIES_HISTORY_2022),
    ).toMatchSnapshot();
  });

  // Range bounded with exceptions
  test("Test range bounded with exceptions (cs and math)", async () => {
    expect(await readAndTokenizeHTML(CS_MATH_2022)).toMatchSnapshot();
  });

  // Range lower bounded
  test("Test range lower bounded (cs & history)", async () => {
    expect(await readAndTokenizeHTML(CS_HISTORY_2022)).toMatchSnapshot();
  });

  // Range unbounded
  test("Test range unbounded (chemical engineering)", async () => {
    expect(await readAndTokenizeHTML(CHEMICAL_ENG_2022)).toMatchSnapshot();
  });

  // Or of ands
  test("Test OR of ANDs (bioengineering biochemistry)", async () => {
    expect(await readAndTokenizeHTML(BIOENG_BIOCHEM_2022)).toMatchSnapshot();
  });

  // no tabs
  test("Test NO tabs (architecture and english)", async () => {
    expect(await readAndTokenizeHTML(ARCH_ENGLISH_2022)).toMatchSnapshot();
  });

  describe("weird program requirement hours text placement", () => {
    const get = (url: string) =>
      readAndTokenizeHTML(url).then(h => h.programRequiredHours);

    test("Minimum of x hours", async () => {
      expect(await get(PUBLIC_HEALTH_BA_2022)).toBeGreaterThan(0);
    });

    // test("paragraph in front of `x total hrs`", async () => {
    //   expect(await get(PHARMD)).toBeGreaterThan(0);
    // });

    test("paragraph in front of `Minimum of x hrs`", async () => {
      expect(await get(PHARM_SCI_2022)).toBeGreaterThan(0);
    });
  });
});
