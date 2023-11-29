import { IRequiredCourse, Requirement2, Section } from "../../src/graduate-types/major2";

export type MajorChangeHandler = (change: MajorChange, location: number[]) => void;

export type MajorChange = CourseChange | SectionChange | TypeChange

export type CourseChange = {type: "COURSE", newCourse: IRequiredCourse}

export type SectionChange = {type: "SECTION", newSection: Section}

export type TypeChange = { type: "type", newType: string, location: number, courses: Requirement2[] }