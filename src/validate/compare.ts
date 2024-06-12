import type { IAndCourse2, ICourseRange2, IOrCourse2, IRequiredCourse, IXofManyCourse, Requirement2, Section } from "@/types";
import { andMap, compare, logError, logMsg } from "./util";

/**
 * Compares two simple fields (parsed and prod)
 * @param field Name of the field
 * @param f1 parsed field
 * @param f2 prod field
 * @returns true if the two fields are the same
 */
export const compareFields = (f1: any, f2: any) : boolean => {
    return f1 !== undefined && f2 !== undefined && JSON.stringify(f1) === JSON.stringify(f2);
}

/**
 * Compares two requirements (parsed and prod)
 * @param r1 parsed requirement
 * @param r2 prod requirement
 * @returns true if the two requirements are the same
 */
export const compareRequirement = (r1: Requirement2, r2: Requirement2) : boolean => {
    // must be one of:
    //   - "COURSE"
    //   - "RANGE"
    //   - "OR"
    //   - "AND"
    //   - "XOM"
    //   - "SECTION"
    // and both must be the same 

    const ret = (
        (r1.type === "AND" && r2.type === "AND" && compare('AND', r1, r2, compareAndCourse)) ||
        (r1.type === "OR" && r2.type === "OR" && compare('OR', r1, r2, compareOrCourse)) ||
        (r1.type === "XOM" && r2.type === "XOM" && compare('XOM', r1, r2, compareXOfManyCourse)) ||
        (r1.type === "RANGE" && r2.type === "RANGE" && compare('RANGE', r1, r2, compareCourseRange)) ||
        (r1.type === "COURSE" && r2.type === "COURSE" && compare('COURSE', r1, r2, compareRequiredCourse)) || 
        (r1.type === "SECTION" && r2.type === "SECTION" && compare('SECTION', r1, r2, compareSection))
    )

    return ret
}

/**
 * Compares two sections (parsed and prod)
 * @param s1 parsed section
 * @param s2 prod section
 * @returns true if the two sections are the same
 */
export const compareSection = (s1: Section, s2: Section) : boolean => {
    // title must be defined and be the same
    // requirements (an array of Requirement2) must be defined and be the same
    // minRequirementCount must be defined and be the same
    // if warnings (an array of string) is defined for either, then it must be defined for the other and be the same

    const ret = (
        compare('title', s1.title, s2.title, compareFields) &&
        (s1.requirements && s2.requirements && compare('requirements', s1.requirements, s2.requirements, (a, b) => andMap('requirements', a, b, compareRequirement))) &&
        compare('minRequirementCount', s1.minRequirementCount, s2.minRequirementCount, compareFields) &&
        ((!s1.warnings && !s2.warnings) || compare('warnings', s1.warnings, s2.warnings, compareFields))
    )

    const section_json = {
        type: "SECTION",
        title: s1.title !== s2.title ? 'titles are different' : s1.title
    }

    if (!ret) {
        logError(JSON.stringify(section_json, null, 2))
    }

    return ret
}

/**
 * Compares two required courses (parsed and prod)
 * @param c1 parsed required course
 * @param c2 prod required course
 * @returns true if the two courses are the same
 */
const compareRequiredCourse = (c1: IRequiredCourse, c2: IRequiredCourse) : boolean => {
    // subject must be defined and be the same
    // classId must be defined and be the same
    // if description is defined for either, then it must be defined for the other and be the same

    const ret = (
        compare('subject', c1.subject, c2.subject, compareFields) && 
        compare('classId', c1.classId, c2.classId, compareFields) &&
        ((c1.description === undefined && c2.description === undefined) || (compare('description', c1.description, c2.description, compareFields)))
    )

    const course_json = {
        type: "COURSE",
        subject: c1.subject === c2.subject ? c1.subject : `${c1.subject} !== ${c2.subject}`,
        classId: c1.classId === c2.classId ? c1.classId : `${c1.classId} !== ${c2.classId}`,
        description: c1.description === c2.description ? c1.description : `${c1.description} !== ${c2.description}`
    }

    if (!ret) {
        logError(JSON.stringify(course_json, null, 2))
    }

    return ret
}

/**
 * Compares two course ranges (parsed and prod)
 * @param cr1 parsed course range
 * @param cr2 prod course range
 * @returns true if the two course ranges are the same
 */
const compareCourseRange = (cr1: ICourseRange2, cr2: ICourseRange2) : boolean => {
    // subject must be defined and be the same
    // idRangeStart must be defined and be the same
    // idRangeEnd must be defined and be the same
    // exceptions (an array of IRequiredCourse) must be defined and be the same

    const ret = (
        compare('subject', cr1.subject, cr2.subject, compareFields) && 
        compare('idRangeStart', cr1.idRangeStart, cr2.idRangeStart, compareFields) &&
        compare('idRangeEnd', cr1.idRangeEnd, cr2.idRangeEnd, compareFields) &&
        (cr1.exceptions && cr2.exceptions && compare('exceptions', cr1.exceptions, cr2.exceptions, (a, b) => andMap('exceptions', a, b, compareRequiredCourse)))
    )

    const range_json = {
        type: "RANGE",
        subject: cr1.subject === cr2.subject ? cr1.subject : 'subjects not the same',
        idRangeStart: cr1.idRangeStart === cr2.idRangeStart ? cr1.idRangeStart : 'idRangeStart not the same',
        idRangeEnd: cr1.idRangeEnd === cr2.idRangeEnd ? cr1.idRangeEnd : 'idRangeEnd not the same',
    }

    if (!ret) {
        logError(JSON.stringify(range_json, null, 2))
    }

    return ret
}

/**
 * Compares two "or" courses (parsed and prod)
 * @param o1 parsed "or" course
 * @param o2 prod "or" course
 * @returns true if the two "or" courses are the same
 */
const compareOrCourse = (o1: IOrCourse2, o2: IOrCourse2) : boolean => {
    // courses (an array of Requirement2) must be the same

    const ret = o1.courses && o2.courses && compare('courses', o1.courses, o2.courses, (a, b) => andMap('courses', a, b, compareRequirement))

    const or_json = {
        type: "OR",
    }

    if (!ret) {
        logError(JSON.stringify(or_json, null, 2))
    }

    return ret
}

/**
 * Compares two "and" courses (parsed and prod)
 * @param a1 parsed "and" course
 * @param a2 prod "and" course
 * @returns true if the two "and" courses are the same
 */
const compareAndCourse = (a1: IAndCourse2, a2: IAndCourse2) : boolean => {
    // courses (an array of Requirement2) must be the same
    
    const ret = a1.courses && a2.courses && compare('courses', a1.courses, a2.courses, (a, b) => andMap('courses', a, b, compareRequirement))

    const and_json = {
        type: "AND",
    }

    if (!ret) {
        logError(JSON.stringify(and_json, null, 2))
    }

    return ret
}

/**
 * Compares two "x of many" courses (parsed and prod)
 * @param x1 parsed "x of many" course
 * @param x2 prod "x of many" course
 * @returns true if the two "x of many" courses are the same
 */
const compareXOfManyCourse = (x1: IXofManyCourse, x2: IXofManyCourse) : boolean => {
    // courses (an array of Requirement2) must be the same
    // numCreditsMin must be defined and be the same

    const ret = (
        compare('numCreditsMin', x1.numCreditsMin, x2.numCreditsMin, compareFields) &&
        (x1.courses && x2.courses && compare('courses', x1.courses, x2.courses, (a, b) => andMap('courses', a, b, compareRequirement)))
    )

    const xom_json = {
        type: "XOM",
        numCreditsMin: x1.numCreditsMin === x2.numCreditsMin ? x1.numCreditsMin : 'numCreditsMin not the same'
    }

    if (!ret) {
        logError(JSON.stringify(xom_json, null, 2))
    }

    return ret
}