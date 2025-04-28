import {
  assertUnreachable,
  ensureAtLeastLength,
  ensureExactLength,
  majorNameToFileName,
  parseText,
} from "@/utils";
import {
  COURSE_REGEX,
  RANGE_BOUNDED_MAYBE_EXCEPTIONS,
  RANGE_LOWER_BOUNDED_MAYBE_EXCEPTIONS_1,
  RANGE_LOWER_BOUNDED_MAYBE_EXCEPTIONS_2,
  RANGE_LOWER_BOUNDED_PARSE,
  RANGE_UNBOUNDED,
  SUBJECT_REGEX,
  XOM_REGEX_CREDITS,
  XOM_REGEX_NUMBER,
} from "./constants";
import { HSectionType, HRowType } from "./types";
import type {
  CountAndHoursRow,
  CourseRow,
  HRow,
  HSection,
  MultiCourseRow,
  RangeBoundedRow,
  RangeLowerBoundedRow,
  RangeUnboundedRow,
  TextRow,
  TokenizedCatalogEntry,
  WithExceptions,
} from "./types";
import { join } from "path";
import { readFile, writeFile } from "fs/promises";
import {
  CatalogEntryType,
  FileName,
  SaveStage,
  type TypedCatalogEntry,
} from "@/classify";
import { load } from "cheerio";

export const tokenize = async (
  entry: TypedCatalogEntry,
): Promise<TokenizedCatalogEntry> => {
  const { sections, programRequiredHours } = await tokenizeHTML(
    entry.html,
    entry.yearVersion,
    entry.saveStage,
  );

  const tokenized = {
    url: entry.url,
    majorName: entry.majorName,
    yearVersion: entry.yearVersion,
    programRequiredHours,
    sections,
  };

  await writeFile(
    `${entry.savePath}/${FileName.TOKENS}.${entry.saveStage}.json`,
    JSON.stringify(tokenized, null, 2),
  );

  return {
    ...entry,
    programRequiredHours,
    sections,
  };
};

/**
 * Helper method, mainly use for snapshot test
 * @param html the raw major
 * @returns the tokens (sections) and the required hours of the major
 */
export const tokenizeHTML = async (
  html: CheerioStatic,
  yearVersion: number,
  saveStage: SaveStage,
  saveDir: string = "degrees",
) => {
  const requirementsContainer = getRequirementsContainer(html);
  const sections = await tokenizeSections(
    html,
    requirementsContainer,
    yearVersion,
    saveStage,
    saveDir,
  );

  const programRequiredHours = getProgramRequiredHours(
    html,
    requirementsContainer,
  );

  return {
    sections,
    programRequiredHours,
  };
};

/**
 * Retrieves the cheerio container containing the degree requirements. If there
 * are no tabs, tries to look for ID ending in 'requirementstextcontainer',
 * otherwise tries to find second tab href.
 *
 * @param $
 */
const getRequirementsContainer = ($: CheerioStatic) => {
  const tabsContainer = $("#contentarea #tabs");
  if (tabsContainer.length === 0) {
    // had no tabs, so just look for id ending in this list
    const containers = [
      "requirementstextcontainer",
      "programtextcontainer",
      "protextcontainer",
      "progrtextcontainer",
      "progtextcontainer",
    ]
      .map(id => $(`[id$='${id}']`))
      .filter(container => container.length === 1);

    if (containers.length >= 1) {
      return containers[0]!;
    }

    throw new Error(
      `Unable to find the requirement container in container without tabs`,
    );
  } else if (tabsContainer.length === 1) {
    const tabsArr = tabsContainer.find("ul > li > a").toArray().map($);
    const [, requirementsTab] = ensureAtLeastLength(
      tabsArr,
      2,
      "Missing tabs for requirements container",
    );
    const containerId = requirementsTab.attr("href");
    return $(containerId);
  }
  throw new Error(
    "Unable to find the requirement container in container with tabs",
  );
};

/**
 * Retrieves the # of required course-hours for this degree. Looks for a heading
 * with text "program requirements" (ish), and then checks first and last line,
 * first and third word, if it matches a number. if so, returns that #, else 0.
 *
 * @param $
 * @param requirementsContainer
 */
const getProgramRequiredHours = (
  $: CheerioStatic,
  requirementsContainer: Cheerio,
) => {
  const programRequiredHeading = requirementsContainer
    .find("h2")
    .filter((_, element) => {
      const text = parseText($(element)).toLowerCase();
      // "program requirement", "program requirements", or "program credit requirements"
      return /program (\w+ )?requirement(s?)/.test(text);
    });

  const nextAll = programRequiredHeading.nextAll().toArray().map($);
  if (nextAll.length >= 1) {
    for (const next of [nextAll[0], nextAll[nextAll.length - 1]]) {
      // keep if matches "minimum of <n>" or "<n>"
      // regex matches space characters (\x) and non-breaking space (\xa0)
      const parts = parseText(next!).split(/[\s\xa0]+/);
      // regex matches digits (\d) groups of at least 1 (+)
      if (/\d+/.test(parts[0]!)) {
        return Number(parts[0]);
      } else if (/\d+/.test(parts[2]!)) {
        return Number(parts[2]);
      }
    }
  }

  return 0;
};

/**
 * Produces overall HSections for each HTML table in the page
 *
 * @param $
 * @param requirementsContainer
 */
const tokenizeSections = async (
  $: CheerioStatic,
  requirementsContainer: Cheerio,
  yearVersion: number,
  saveStage: SaveStage,
  saveDir: string,
): Promise<HSection[]> => {
  // use a stack to keep track of the course list title and description
  const descriptions: string[] = [];
  const courseList: HSection[] = [];
  let courseListQueue: CheerioElement[] = [];

  for (const element of requirementsContainer.children().toArray()) {
    const isHeaderText = element.name === "h2" || element.name === "h3";
    if (isHeaderText) {
      if (courseListQueue.length === 0) {
        descriptions.push(parseText($(element)));
        continue;
      }
      const tableDesc = descriptions.pop() || "";

      const entries = courseListQueue
        .map(courseListElement => tokenizeRows($, courseListElement))
        .flat();

      const courseTable: HSection = {
        description: tableDesc,
        entries: entries,
        type: tableDesc.toLowerCase().includes("concentration")
          ? HSectionType.CONCENTRATION
          : HSectionType.PRIMARY,
      };
      courseList.push(courseTable);
      courseListQueue = [];

      descriptions.push(parseText($(element)));
    }

    const isCourseList =
      element.name === "table" && element.attribs["class"] === "sc_courselist";
    if (isCourseList) {
      courseListQueue.push(element);
    }

    // some concentrations are in a separate html instead of
    // in the same html as the main major (see CS and Business for example)
    const isConcentrationList =
      element.name === "ul" &&
      parseText($(element).prev()).includes("concentration");
    if (isConcentrationList) {
      const links = constructNestedLinks($, element);

      // get all the concentration locally instead of fetching
      // them from the catalog by mapping the url path (in this case called link)
      // to the local folder path
      const pages = await Promise.all(
        links.map(async link => {
          const [, , college, , majorName] = ensureAtLeastLength(
            link.split("/"),
            5,
            `Link path incomplete for concentration: ${link}`,
          );
          const filePath = join(
            saveDir,
            CatalogEntryType.Concentration,
            yearVersion.toString(),
            college,
            majorNameToFileName(majorName),
            `${FileName.RAW}.${saveStage}.html`,
          );

          const text = await readFile(filePath, {
            encoding: "utf-8",
          });

          return load(text);
        }),
      );

      const containerId = "#concentrationrequirementstextcontainer";
      const concentrations = await Promise.all(
        pages.map(concentrationPage =>
          tokenizeSections(
            concentrationPage,
            concentrationPage(containerId),
            yearVersion,
            saveStage,
            saveDir,
          ),
        ),
      );
      courseList.push(...concentrations.flat());
    }
  }

  if (courseListQueue.length > 0) {
    const tableDesc = descriptions.pop() || "";

    const entries = courseListQueue
      .map(courseListElement => tokenizeRows($, courseListElement))
      .flat();

    const courseTable: HSection = {
      description: tableDesc,
      entries: entries,
      type: tableDesc.toLowerCase().includes("concentration")
        ? HSectionType.CONCENTRATION
        : HSectionType.PRIMARY,
    };
    courseList.push(courseTable);
  }

  return courseList;
};

/**
 * Finds and fetches nested links, for majors with concentration requirements on
 * separate pages.
 *
 * @param $
 * @param element
 */
const constructNestedLinks = ($: CheerioStatic, element: CheerioElement) => {
  return (
    $(element)
      .find("li > a")
      .toArray()
      .map(link => $(link).attr("href"))
      // some majors also have an unordered list but they link to the same page
      // in those case we can just skip them
      // see Health Science and Business Admin BS concentration for an example
      .filter(path => !path.includes("#"))
  );
};

/**
 * Converts tables rows into a list of HRows
 *
 * @param $
 * @param table
 */
const tokenizeRows = ($: CheerioStatic, table: CheerioElement): HRow[] => {
  const courseTable: HRow[] = [];

  for (const [index, tr] of $(table).find("tbody > tr").toArray().entries()) {
    // different row type
    const tds = $(tr).find("td").toArray().map($);
    const type = getRowType($, tr, tds, index, courseTable);
    const row = constructRow($, tds, type);
    courseTable.push(row);
  }

  return courseTable;
};

/**
 * Pre-parses the row to determine its type
 */
const getRowType = (
  $: CheerioStatic,
  tr: CheerioElement,
  tds: Cheerio[],
  rowIndex: number,
  courseTable: HRow[],
) => {
  const trClasses = new Set(tr.attribs["class"]?.split(" "));
  const td = ensureAtLeastLength(tds, 1)[0];
  const tdClasses = new Set(td.attr("class")?.split(" "));

  if (tdClasses.size > 0) {
    if (tdClasses.has("codecol")) {
      if (trClasses.has("orclass") !== tdClasses.has("orclass")) {
        throw new Error("td and tr orclass were not consistent");
      }
      const hasMultipleCourses = td.find(".code").toArray().length > 1;
      if (tdClasses.has("orclass")) {
        if (hasMultipleCourses) {
          return HRowType.OR_OF_AND_COURSE;
        }
        return HRowType.OR_COURSE;
      } else if (hasMultipleCourses) {
        return HRowType.AND_COURSE;
      }
      return HRowType.PLAIN_COURSE;
    }
    throw Error(`td class was not "codecol": "${tdClasses}"`);
  }

  const tdText = parseText(td);

  if (trClasses.has("subheader")) {
    const isSubSubHeader = $(tr).find("span").hasClass("commentindent");
    if (isSubSubHeader) {
      return HRowType.SUBSUBHEADER;
    }
    return HRowType.SUBHEADER;
  } else if (trClasses.has("areaheader")) {
    return HRowType.HEADER;
  }

  // Different range types
  if (
    RANGE_LOWER_BOUNDED_MAYBE_EXCEPTIONS_1.test(tdText) ||
    RANGE_LOWER_BOUNDED_MAYBE_EXCEPTIONS_2.test(tdText)
  ) {
    return HRowType.RANGE_LOWER_BOUNDED;
  } else if (RANGE_BOUNDED_MAYBE_EXCEPTIONS.test(tdText)) {
    return HRowType.RANGE_BOUNDED;
  } else if (RANGE_UNBOUNDED.test(tdText)) {
    return HRowType.RANGE_UNBOUNDED;
  }

  // section info should always be after the header
  // or be the first token in the list of entries
  const isSectionInfoPosition =
    rowIndex == 0 ||
    courseTable[rowIndex - 1]!.type === HRowType.HEADER ||
    courseTable[rowIndex - 1]!.type === HRowType.SUBHEADER ||
    courseTable[rowIndex - 1]!.type === HRowType.SUBSUBHEADER;

  if (isSectionInfoPosition && sectionInfoAll.includes(tdText.toLowerCase())) {
    return HRowType.SECTION_INFO;
  }

  if (isXOM(tdText)) {
    return HRowType.X_OF_MANY;
  }

  return HRowType.COMMENT;
};

export function isXOM(text: string): boolean {
  const match =
    text.toLowerCase().match(XOM_REGEX_CREDITS) ||
    text.toLowerCase().match(XOM_REGEX_NUMBER);

  return match !== null && match.length > 0;
}

/**
 * Converts a single row based on the passed-in type (determined by {@link getRowType}
 *
 * @param $
 * @param tds
 * @param type
 */
const constructRow = (
  $: CheerioStatic,
  tds: Cheerio[],
  type: HRowType,
): HRow => {
  switch (type) {
    case HRowType.HEADER:
    case HRowType.SUBHEADER:
    case HRowType.SUBSUBHEADER:
    case HRowType.COMMENT:
      return constructTextRow($, tds, type);
    case HRowType.OR_COURSE:
      return constructOrCourseRow($, tds);
    case HRowType.PLAIN_COURSE:
      return constructPlainCourseRow($, tds);
    case HRowType.AND_COURSE:
    case HRowType.OR_OF_AND_COURSE:
      return constructMultiCourseRow($, tds, type);
    case HRowType.RANGE_LOWER_BOUNDED:
    case HRowType.RANGE_LOWER_BOUNDED_WITH_EXCEPTIONS:
      return constructRangeLowerBoundedMaybeExceptions($, tds);
    case HRowType.RANGE_BOUNDED:
    case HRowType.RANGE_BOUNDED_WITH_EXCEPTIONS:
      return constructRangeBoundedMaybeExceptions($, tds);
    case HRowType.RANGE_UNBOUNDED:
      return constructRangeUnbounded($, tds);
    case HRowType.SECTION_INFO:
      return constructSectionInfo($, tds);
    case HRowType.COMMENT_COUNT:
      throw new Error("We don't support comment counts yet!");
    case HRowType.X_OF_MANY:
      return constructXOfMany($, tds);
    default:
      return assertUnreachable(type);
  }
};

const constructTextRow = <T>(
  $: CheerioStatic,
  tds: Cheerio[],
  type: T,
): TextRow<T> => {
  const [c1, c2] = ensureExactLength(
    tds,
    2,
    `Row ${tds} missing hour/description`,
  );
  const description = parseText(c1);
  const hour = parseHour(c2);
  return { hour, description, type };
};

const constructPlainCourseRow = (
  $: CheerioStatic,
  tds: Cheerio[],
): CourseRow<HRowType.PLAIN_COURSE> => {
  const [code, desc, hourCol] = ensureExactLength(tds, 3);
  const { subject, classId } = parseCourseTitle(parseText(code));
  const description = parseText(desc);
  const hour = parseHour(hourCol);
  return { hour, description, type: HRowType.PLAIN_COURSE, subject, classId };
};

const constructOrCourseRow = (
  $: CheerioStatic,
  tds: Cheerio[],
): CourseRow<HRowType.OR_COURSE> => {
  const [code, desc] = ensureExactLength(
    tds,
    2,
    `OR COURSE row ${tds} missing course code/description`,
  );
  // remove "or "
  const { subject, classId } = parseCourseTitle(
    parseText(code).substring(3).trim(),
  );
  const description = parseText(desc);
  // there may be multiple courses in the OR, so we can't backtrack
  return { hour: 0, description, type: HRowType.OR_COURSE, subject, classId };
};

const constructMultiCourseRow = (
  $: CheerioStatic,
  tds: Cheerio[],
  type: HRowType.AND_COURSE | HRowType.OR_OF_AND_COURSE,
):
  | MultiCourseRow<HRowType.AND_COURSE>
  | MultiCourseRow<HRowType.OR_OF_AND_COURSE> => {
  // some ORs of ANDs don't have a third cell for hour column
  const [code, desc, hourCol] = ensureAtLeastLength(tds, 2);
  const titles = code
    .find(".code")
    .toArray()
    .map($)
    .map(parseText)
    .map(parseCourseTitle);
  const firstDescription = parseText(desc.contents().first());
  const restDescriptions = desc
    .children(".blockindent")
    .toArray()
    // ignore the first four characters, "and "
    .map(c => parseText($(c)).substring(4).trim());
  const descriptions = [firstDescription, ...restDescriptions];
  if (titles.length !== descriptions.length) {
    const msg = `found titles: ${titles.length} !== found descs: ${descriptions.length}`;
    throw new Error(msg + titles + descriptions);
  }
  const courses = titles.map(({ subject, classId }, i) => ({
    subject,
    classId,
    description: descriptions[i] as string, // TODO: remove casting later
  }));

  const hour = hourCol ? parseHour(hourCol) : 0;
  return {
    hour,
    type,
    description: descriptions.join(" and "),
    courses,
  };
};

const constructRangeLowerBoundedMaybeExceptions = (
  $: CheerioStatic,
  tds: Cheerio[],
):
  | WithExceptions<
      RangeLowerBoundedRow<HRowType.RANGE_LOWER_BOUNDED_WITH_EXCEPTIONS>
    >
  | RangeLowerBoundedRow<HRowType.RANGE_LOWER_BOUNDED> => {
  const [desc, hourCol] = ensureAtLeastLength(tds, 2);
  const hour = parseHour(hourCol);
  // text should match one of the following:
  // - CS 9999 or higher[, except CS 9999, CS 9999, CS 3999,... <etc>]
  // - Select from any HIST course numbered 3000 or above.
  // - Complete three HIST courses numbered 2303 or above. Cluster is subject to Department approval.
  const text = parseText(desc);
  // should match the form [["CS 9999", "CS", "9999"], [...]]
  const matches = Array.from(text.matchAll(RANGE_LOWER_BOUNDED_PARSE));
  const [[, subject, , , , id], ...exceptions] = ensureAtLeastLength(
    matches,
    1,
  );
  if (exceptions.length > 0) {
    return {
      type: HRowType.RANGE_LOWER_BOUNDED_WITH_EXCEPTIONS,
      hour,
      subject: subject as string, // TODO: remove this casting later
      classIdStart: Number(id),
      exceptions: exceptions.map(([, subject, , , , id]) => ({
        subject: subject as string, // TODO: remove this casting later
        classId: Number(id),
      })),
    };
  }
  return {
    type: HRowType.RANGE_LOWER_BOUNDED,
    hour,
    subject: subject as string, // TODO: remove this casting later
    classIdStart: Number(id),
  };
};

const constructRangeBoundedMaybeExceptions = (
  $: CheerioStatic,
  tds: Cheerio[],
):
  | RangeBoundedRow<HRowType.RANGE_BOUNDED>
  | WithExceptions<RangeBoundedRow<HRowType.RANGE_BOUNDED_WITH_EXCEPTIONS>> => {
  const [desc, hourCol] = ensureExactLength(
    tds,
    2,
    `RANGE row ${tds} missing course description/hour`,
  );
  const hour = parseHour(hourCol);
  // text should match the form:
  // 1. CS 1000 to CS 5999
  // 2. CS 1000-CS 5999
  const text = parseText(desc);
  // should match the form [["CS 9999", "CS", "9999"], [...]]
  const matches = Array.from(text.matchAll(COURSE_REGEX));
  const [[, subject, classIdStart], [, , classIdEnd], ...exceptions] =
    ensureAtLeastLength(matches, 2);
  const result = {
    hour,
    subject: subject as string, // TODO: remove this casting later
    classIdStart: Number(classIdStart),
    classIdEnd: Number(classIdEnd),
  };
  if (exceptions.length > 0) {
    return {
      ...result,
      type: HRowType.RANGE_BOUNDED_WITH_EXCEPTIONS,
      exceptions: exceptions.map(([, subject, id]) => ({
        subject: subject as string, // TODO: remove this casting later
        classId: Number(id),
      })),
    };
  }
  return {
    ...result,
    type: HRowType.RANGE_BOUNDED,
  };
};

const constructRangeUnbounded = (
  $: CheerioStatic,
  tds: Cheerio[],
): RangeUnboundedRow<HRowType.RANGE_UNBOUNDED> => {
  const [desc, hourCol] = ensureExactLength(
    tds,
    2,
    `RANGE UNBOUNDED row ${tds} missing course description/hour`,
  );

  const hour = parseHour(hourCol);
  // text should match one of the following:
  // - Any course in ARTD, ARTE, ARTF, ARTG, ARTH, and GAME subject areas as long as prerequisites have been met.
  // - BIOE, CHME, CIVE, EECE, ME, IE, MEIE, and ENGR to Department approval.
  const text = parseText(desc);
  const matches = Array.from(text.match(SUBJECT_REGEX) ?? []);
  const subjects = ensureAtLeastLength(matches, 3);
  return {
    type: HRowType.RANGE_UNBOUNDED,
    hour,
    subjects,
  };
};

const sectionInfoOnes = ["Choose one:", "Complete one of the following:"].map(
  text => text.toLowerCase(),
);

const sectionInfoTwos = [
  "Complete two courses (and any required labs) from the following science categories:",
].map(text => text.toLowerCase());

const sectionInfoAll = [...sectionInfoOnes, ...sectionInfoTwos];

const constructSectionInfo = (
  $: CheerioStatic,
  tds: Cheerio[],
): CountAndHoursRow<HRowType.SECTION_INFO> => {
  const [c1, c2] = ensureExactLength(
    tds,
    2,
    `SECTION INFO row ${tds} missing course description/hour`,
  );
  const hour = parseHour(c2);
  const description = parseText(c1);

  if (sectionInfoOnes.includes(description.toLowerCase())) {
    return {
      hour,
      description,
      type: HRowType.SECTION_INFO,
      parsedCount: 1,
    };
  }

  if (sectionInfoTwos.includes(description.toLowerCase())) {
    return {
      hour,
      description,
      type: HRowType.SECTION_INFO,
      parsedCount: 2,
    };
  }

  throw new Error(
    "Parsed text not in recognised list! (shouldn't be possible :) ).",
  );
};

const XOM_NUMBERS = new Map([
  ["one", 1],
  ["two", 2],
  ["three", 3],
  ["four", 4],
  ["five", 5],
  ["six", 6],
  ["seven", 7],
  ["eight", 8],
  ["nine", 9],
  ["ten", 10],
]);

const constructXOfMany = (
  $: CheerioStatic,
  tds: Cheerio[],
): TextRow<HRowType.X_OF_MANY> => {
  const [c1, c2] = ensureExactLength(
    tds,
    2,
    `XOM row ${tds} missing course description/hour`,
  );
  let hour = parseHour(c2);
  const description = parseText(c1);

  if (!hour) {
    const matchesNumber = description.toLowerCase().match(XOM_REGEX_NUMBER);
    if (matchesNumber) {
      const numberTranslation = XOM_NUMBERS.get(
        ensureAtLeastLength(matchesNumber, 2)[1],
      );
      if (numberTranslation != undefined) {
        hour = numberTranslation * 4;
      }
    }

    const matchesCredits = description.toLowerCase().match(XOM_REGEX_CREDITS);
    if (matchesCredits) {
      hour = Number(matchesCredits[1]);
    }
  }

  return {
    type: HRowType.X_OF_MANY,
    description,
    hour,
  };
};

const parseHour = (td: Cheerio) => {
  const hourText = td.text();
  return parseInt(ensureAtLeastLength(hourText.split("-"), 1)[0]) || 0;
};

const parseCourseTitle = (parsedCourse: string) => {
  const [subject, classId] = ensureExactLength(
    parsedCourse.split(" "),
    2,
    `Course title ${parsedCourse} missing classID/subject`,
  );
  return {
    subject,
    classId: Number(classId),
  };
};
