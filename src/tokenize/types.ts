import type { TypedCatalogEntry } from "@/classify";

/**
 * An HTML document (catalog page) has a few identifiable features, along with a
 * bunch of sections.
 */
export type HDocument = {
  yearVersion: number;
  majorName: string;
  programRequiredHours: number;
  sections: HSection[];
};

/** An HTML section (of a document) has a description, and a list of rows that it contains. */
export type HSection = PrimaryHSection | ConcentrationHSection;

export enum HSectionType {
  PRIMARY = "PRIMARY",
  CONCENTRATION = "CONCENTRATION",
}

export type PrimaryHSection = {
  description: string;
  entries: HRow[];
  type: HSectionType.PRIMARY;
};

export type ConcentrationHSection = {
  description: string;
  entries: HRow[];
  type: HSectionType.CONCENTRATION;
};

/**
 * An HTML row (abbreviated HRow) consists of four main different types of row:
 *
 * - TextRow: a row containing text. either an areaHeader, comment, or subHeader.
 * - CourseRow: a single course, that may have an "OR" annotation
 * - MultiCourseRow: multiple courses (2+). currently only AND courses appear as
 *   multiCourseRows
 * - RangeRow: either bounded, unbounded, or only bounded on the bottom (sometimes
 *   with exceptions)
 */
export type HRow =
  // text rows
  | TextRow<HRowType.COMMENT>
  | CountAndHoursRow<HRowType.COMMENT_COUNT> // <-- Can probably just remove this!
  | CountAndHoursRow<HRowType.SECTION_INFO>
  | TextRow<HRowType.X_OF_MANY>
  | TextRow<HRowType.HEADER>
  | TextRow<HRowType.SUBHEADER>
  | TextRow<HRowType.SUBSUBHEADER>
  // course rows
  | CourseRow<HRowType.OR_COURSE>
  | CourseRow<HRowType.PLAIN_COURSE>
  // multi course rows
  | MultiCourseRow<HRowType.AND_COURSE>
  | MultiCourseRow<HRowType.OR_OF_AND_COURSE>
  // range rows
  | RangeLowerBoundedRow<HRowType.RANGE_LOWER_BOUNDED>
  | WithExceptions<
      RangeLowerBoundedRow<HRowType.RANGE_LOWER_BOUNDED_WITH_EXCEPTIONS>
    >
  | RangeBoundedRow<HRowType.RANGE_BOUNDED>
  | WithExceptions<RangeBoundedRow<HRowType.RANGE_BOUNDED_WITH_EXCEPTIONS>>
  | RangeUnboundedRow<HRowType.RANGE_UNBOUNDED>;

// an enum to give a unique discriminator to each of the above cases
// the different outputs we have, by TYPE
export enum HRowType {
  HEADER = "HEADER",
  SUBHEADER = "SUBHEADER",
  SUBSUBHEADER = "SUBSUBHEADER",
  COMMENT = "COMMENT",
  COMMENT_COUNT = "COMMENT_COUNT",
  SECTION_INFO = "SECTION_INFO",

  OR_COURSE = "OR_COURSE",
  AND_COURSE = "AND_COURSE",
  OR_OF_AND_COURSE = "OR_OF_AND_COURSE",
  PLAIN_COURSE = "PLAIN_COURSE",

  RANGE_LOWER_BOUNDED = "RANGE_LOWER_BOUNDED",
  RANGE_LOWER_BOUNDED_WITH_EXCEPTIONS = "RANGE_LOWER_BOUNDED_WITH_EXCEPTIONS",

  RANGE_BOUNDED = "RANGE_BOUNDED",
  RANGE_BOUNDED_WITH_EXCEPTIONS = "RANGE_BOUNDED_WITH_EXCEPTIONS",

  RANGE_UNBOUNDED = "RANGE_UNBOUNDED",

  X_OF_MANY = "X_OF_MANY",
}

export interface TextRow<T> {
  type: T;
  description: string;
  hour: number;
}

export interface CountAndHoursRow<T> {
  type: T;
  description: string;
  parsedCount: number;
  hour: number;
}

export interface CourseRow<T> {
  type: T;
  description: string;
  hour: number;
  subject: string;
  classId: number;
}

export interface MultiCourseRow<T> {
  type: T;
  description: string;
  hour: number;
  // may contain duplicates
  courses: Array<{ subject: string; classId: number; description: string }>;
}

export interface RangeBoundedRow<T> {
  type: T;
  hour: number;
  subject: string;
  classIdStart: number;
  classIdEnd: number;
}

export interface RangeUnboundedRow<T> {
  type: T;
  hour: number;
  subjects: Array<string>;
}

export interface RangeLowerBoundedRow<T> {
  type: T;
  hour: number;
  subject: string;
  classIdStart: number;
}

export type WithExceptions<S> = S & {
  exceptions: Array<{
    subject: string;
    classId: number;
  }>;
};

export type TokenizedCatalogEntry = TypedCatalogEntry & {
  programRequiredHours: number;
  sections: HSection[];
};

/**
 * Enumerations specifying the headers that lead to common concentration name issue. 
 * Typically, the headers within the requirement tables specifiy the requirement section name.
 * However, in some cases, the headers of concentration sections specify the concentration requirements
 * instead of the concentration name. This causes issues with concentration names becoming the requirement section name.
 * This type is used to identify concentration header issues, and provide separate tokenization and parsing logic.
 * 
 * Read more here:
 * https://www.notion.so/sandboxnu/Concentration-Issue-1a118273b1f4806da9e9fa99c9ca9a27?pvs=4
 */
export enum ConcentrationExceptionValue {
  ELECTIVES = "Electives",
  REQUIRED_COURSES = "Required Courses",
}

/**
 * Leading headers are identified to be headers that may need to be replaced by the concentration name.
 */
export enum ConcentrationLeadingHeaderExceptionValue {
  REQUIRED_COURSES = "Required Courses",
  // caused by: https://catalog.northeastern.edu/archive/2021-2022/undergraduate/arts-media-design/journalism/journalism-political-science-ba/#programrequirementstext
  THEORETICAL_REQUIREMENTS = "Theoretical Requirement",
  CORE_COURSE = "Core Course",
  EXPERIENTIAL_REQUIREMENT = "Experiential/Practicum Requirement",
  CORE_REQUIREMENT = "Core Requirement",

}

/**
 * 
 */
export enum ConcentrationTrailingHeaderExceptionValue {
  ELECTIVES = "Electives",
  // caused by: https://catalog.northeastern.edu/archive/2021-2022/undergraduate/arts-media-design/journalism/journalism-political-science-ba/#programrequirementstext
  CAMPAIGNS_AND_ELECTIONS_ELECTIVES = "Campaigns and Elections Electives",
  REGIONAL_REQUIREMENTS = "Regional Requirements",
  EXPERIENTIAL_REQUIREMENT = "Experiential/Practicum Requirement",
  CORE_COURSE = "Core Courses",
}

