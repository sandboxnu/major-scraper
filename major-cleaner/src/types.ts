import { IRequiredCourse } from "../../src/graduate-types/major2";

export type MajorChangeHandler = (change: MajorChange, location: number[]) => void;

export type MajorChange = CourseChange

export type CourseChange = {type: "COURSE", newCourse: IRequiredCourse}