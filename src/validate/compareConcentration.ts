import type { Concentrations2 } from "@/types";
import { compareFields, compareSection } from "./compare";
import { andMap, compare, logError } from "./util";

/**
 * Compares the two concentrations (parsed and prod)
 * @param c1 parsed concentration
 * @param c2 prod concentration
 * @returns true if the two concentrations are the same
 */
export const compareConcentrations = (c1: Concentrations2, c2: Concentrations2) : boolean => {
    // minOptions must be defined and be the same
    // concentrationOptions (an array of Section) must be defined and be the same

    const ret = (
        compare('minOptions', c1.minOptions, c2.minOptions, compareFields) &&
        (c1.concentrationOptions && c2.concentrationOptions && compare('concentrations', c1.concentrationOptions, c2.concentrationOptions, (a, b) => andMap('concentrations', a, b, compareSection)))
    )

    if (!ret) {
        logError('concentrations field in major has an error')
    }

    return ret
}