import type { Major2 } from "@/types";
import { compareFields, compareRequirement } from "./compare";
import { andMap, compare, logMsg } from "./util";
import { compareConcentrations } from "./compareConcentration";

/**
 * Compares the two majors (parsed and prod)
 * @param m1 parsed major
 * @param m2 prod major
 * @returns true if the two majors are the same
 */
export const compareMajors = (m1: Major2, m2: Major2) : boolean => {
    // name must be defined and be the same
    // metadata if defined for either must be defined for both and be the same
    // requirementsSection (an array of Requirement2) must be defined and be the same
    // totalCreditsRequired must be defined and be the same
    // yearVersion must be defined and be the same
    // concentrations (an array of Concentrations2) must be defined and be the same

    logMsg(m1.name)

    const ret = (
        compare('name', m1.name, m2.name, compareFields) &&
        // ((!m1.metadata && !m2.metadata) || compare('metadata', m1.metadata, m2.metadata, compareFields)) &&
        (m1.requirementSections && m2.requirementSections && compare('requirementSections', m1.requirementSections, m2.requirementSections, (a, b) => andMap('requirementSections', a, b, compareRequirement))) &&
        compare('totalCreditsRequired', m1.totalCreditsRequired, m2.totalCreditsRequired, compareFields) &&
        compare('yearVersion', m1.yearVersion, m2.yearVersion, compareFields) &&
        compare('concentrations', m1.concentrations, m2.concentrations, compareConcentrations)
    )

    return ret;
}