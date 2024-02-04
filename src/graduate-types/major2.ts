/**
 * A Major, containing all the requirements.
 *
 * @param name                 The name of the major.
 * @param requirementSections  A list of the sections of requirements.
 * @param totalCreditsRequired Total credits required to graduate with this major.
 * @param yearVersion          The catalog version year of this major.
 * @param concentrations       The possible concentrations within this major.
 */
export interface Major2 {
  name: string;
  metadata?: Metadata;
  requirementSections: Section[];
  totalCreditsRequired: number;
  yearVersion: number;
  concentrations: Concentrations2;
}

export type Metadata = {
  verified: boolean;
  lastEdited: string;
};

/**
 * A Section, containing its related requirements.
 *
 * @param title               The title of the section.
 * @param requirements        A list of the requirements within this section.
 * @param minRequirementCount The minimum number of requirements (counts from
 *   requirements) that are accepted for the section to be fulfilled.
 */
export interface Section {
  type: "SECTION";
  title: string;
  requirements: Requirement2[];
  minRequirementCount: number;
  warnings?: string[];
}

/** Represents a degree requirement that allows a Section to be completed. */
export type Requirement2 =
  | IXofManyCourse
  | IAndCourse2
  | IOrCourse2
  | ICourseRange2
  | IRequiredCourse
  | Section;

/**
 * Represents a requirement where X number of credits need to be completed from
 * a list of courses.
 *
 * @param type          The type of requirement.
 * @param numCreditsMin The minimum number of credits needed to fulfill a given section.
 * @param courses       The list of requirements that the credits can be fulfilled from.
 */
export interface IXofManyCourse {
  type: "XOM";
  numCreditsMin: number;
  courses: Requirement2[];
}

/**
 * Represents an 'AND' series of requirements.
 *
 * @param type    The type of requirement.
 * @param courses The list of requirements, all of which must be taken to
 *   satisfy this requirement.
 */
export interface IAndCourse2 {
  type: "AND";
  courses: Requirement2[];
}

/**
 * Represents an 'OR' set of requirements.
 *
 * @param type    The type of requirement.
 * @param courses The list of requirements, one of which can be taken to satisfy
 *   this requirement.
 */
export interface IOrCourse2 {
  type: "OR";
  courses: Requirement2[];
}

/**
 * Represents a requirement that specifies a range of courses.
 *
 * @param type         The type of requirement.
 * @param subject      The subject area of the range of courses.
 * @param idRangeStart The course ID for the starting range of course numbers.
 * @param idRangeEnd   The course ID for the ending range of course numbers.
 * @param exceptions   The requirements within the mentioned range that do not
 *   count towards fulfulling this requirement.
 */
export interface ICourseRange2 {
  type: "RANGE";
  subject: string;
  idRangeStart: number;
  idRangeEnd: number;
  exceptions: IRequiredCourse[];
}

/**
 * A single required course.
 *
 * @param classId - The numeric ID of the course.
 * @param subject - The subject that the course is concerned with, such as CS
 *   (Computer Science).
 */
export interface IRequiredCourse {
  type: "COURSE";
  classId: number;
  subject: string;
  description?: string;
}

/**
 * A Concentrations, contains all of the available concentrations for the major
 * and their respective requirements.
 *
 * @param minOptions           The minimum number of concentrations required for
 *   the major.
 * @param concentrationOptions The list of sections representing all of the
 *   available concentrations in the major.
 */
export interface Concentrations2 {
  minOptions: number;
  concentrationOptions: Section[];
}
