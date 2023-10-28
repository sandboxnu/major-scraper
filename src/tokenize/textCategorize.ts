import { type HRow, HRowType } from "./types";
import { getGlobalStatsLogger } from "../runtime/logger";

type TextRowTypes = HRow & {
  type: HRowType.COMMENT | HRowType.HEADER | HRowType.SUBHEADER;
};

export const categorizeTextRow = (row: TextRowTypes, majorName: string) => {
  // only 8 (~four of each) of the header types match regex
  // ignore headers for now (even the matching ones)
  if (row.type === HRowType.COMMENT) {
    const stats = getGlobalStatsLogger();

    if (!stats?.comments.has(row.description)) {
      stats?.comments.set(row.description, []);
    }
    stats?.comments.get(row.description)?.push(majorName);
  }
};
