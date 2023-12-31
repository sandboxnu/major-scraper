import assert from "assert";
import { College } from "../urls";
import {
  ensureAtLeastLength,
  loadHTML,
  majorNameToFileName,
  parseText,
} from "../utils";
import { CatalogEntryType, FilterError } from "./types";
import type { TypedCatalogEntry } from "./types";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { ARCHIVE_PLACEMENT, CURRENT_PLACEMENT } from "../constants";

export const classify = async (
  url: URL,
  filterTypes: CatalogEntryType[],
): Promise<TypedCatalogEntry> => {
  const html = await loadHTML(url.href);

  const { degreeType, yearVersion, college, majorName } = getMetadata(
    html,
    url,
  );

  if (!filterTypes.includes(degreeType)) {
    throw new FilterError(degreeType, filterTypes);
  }

  const savePath = join(
    "degrees",
    degreeType,
    yearVersion.toString(),
    college,
    majorNameToFileName(majorName),
  );
  await mkdir(savePath, { recursive: true });
  await writeFile(`${savePath}/html.html`, html.html());

  return { url, degreeType, yearVersion, college, majorName, savePath, html };
};

const getCollegeFromURL = (url: URL): College => {
  const isArchived = url.href.includes("archive");
  const college = url.toString().split("/")[
    isArchived ? ARCHIVE_PLACEMENT : CURRENT_PLACEMENT
  ] as College;
  assert(
    Object.values(College).includes(college),
    `College ${college} is not supported.`,
  );
  return college;
};

const getMetadata = ($: CheerioStatic, url: URL) => {
  const degreeType = getUrlType($);

  const catalogYear = ensureAtLeastLength(
    parseText($("#edition")).split(" "),
    1,
    "Missing catalog year in html.",
  )[0];
  const unParsedYearVersion = ensureAtLeastLength(
    catalogYear.split("-"),
    1,
    "Missing year version in html.",
  )[0];
  const yearVersion = parseInt(unParsedYearVersion);

  const college = getCollegeFromURL(url);
  const majorName: string = parseText($("#site-title").find("h1"));

  return {
    degreeType,
    yearVersion,
    college,
    majorName,
  };
};

// try to get the type from each strategy, in order (name, tabs, container)
const getUrlType = ($: CheerioStatic) => {
  const typeFromName = getTypeFromNameEnding($);
  if (typeFromName !== CatalogEntryType.Unknown) {
    return typeFromName;
  }
  const typeFromTabs = getTypeFromTabs($);
  if (typeFromTabs !== CatalogEntryType.Unknown) {
    return typeFromTabs;
  }
  const typeFromContainer = getTypeFromContainer($);
  if (typeFromContainer !== CatalogEntryType.Unknown) {
    return typeFromContainer;
  }
  return CatalogEntryType.Unknown;
};

const getTypeFromNameEnding = ($: CheerioStatic) => {
  const nameEnding = getNameEnding($);
  if (nameEnding && isMajorEnding(nameEnding)) {
    return CatalogEntryType.Major;
  } else if (nameEnding?.toLowerCase() === "minor") {
    return CatalogEntryType.Minor;
  }
  return CatalogEntryType.Unknown;
};

const getTypeFromTabs = ($: CheerioStatic) => {
  const tabsContainer = $("#contentarea #tabs");
  if (tabsContainer.length === 0) {
    return CatalogEntryType.Unknown;
  } else if (tabsContainer.length === 1) {
    return getTypeFromTabText(tabsContainer.find("ul > li").toArray().map($));
  }
  throw new Error(
    `Expected 0 or 1 tab container, but found ${tabsContainer.length}.`,
  );
};

const getTypeFromContainer = ($: CheerioStatic) => {
  const container = $("[id$='requirementstextcontainer']");
  if (container.length === 1) {
    const id = container.attr("id");
    if (id === "minorrequirementstextcontainer") {
      return CatalogEntryType.Minor;
    } else if (id === "programrequirementstextcontainer") {
      return CatalogEntryType.Major;
    } else if (id === "concentrationrequirementstextcontainer") {
      return CatalogEntryType.Concentration;
    }
  }
  return CatalogEntryType.Unknown;
};

const getNameEnding = ($: CheerioStatic) => {
  const name = parseText($("#site-title").find("h1"));
  const degree = name.lastIndexOf(",");
  if (degree !== -1) {
    // assume ", "<degree>
    return name
      .substring(degree + 2)
      .toLowerCase()
      .trim();
  }
  return null;
};

const isMajorEnding = (ending: string) => {
  const bs = ending.substring(0, 2) === "bs";
  const ba = ending.charAt(0) + ending.charAt(ending.length - 1) === "ba";
  // very uncommon ending
  const ba1 = ending.substring(0, 2) === "ba";
  return bs || ba || ba1;
};

const getTypeFromTabText = (tabs: Cheerio[]) => {
  // most entries have 3 tabs, but some have 2 or rarely 4
  const tabText = parseText(
    ensureAtLeastLength(tabs, 2, "Missing tabs in html")[1],
  );

  switch (tabText.toLowerCase()) {
    case "minor requirements":
      return CatalogEntryType.Minor;
    case "concentration requirements":
      return CatalogEntryType.Concentration;
    case "program requirements":
      return CatalogEntryType.Major;
    default:
      return CatalogEntryType.Unknown;
  }
};
