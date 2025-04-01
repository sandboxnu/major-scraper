import nearly from "nearley";
import type { ParsedCatalogEntry } from "./types";
import { HRowType, HSectionType, ConcentrationLeadingHeaderExceptionValue, ConcentrationTrailingHeaderExceptionValue } from "@/tokenize";
import {
  type HRow,
  type HSection,
  type TextRow,
  type TokenizedCatalogEntry,
} from "@/tokenize";
import { writeFile } from "fs/promises";
import { FileName } from "@/classify";
import grammar from "./grammar";
import type { Major2, Section } from "@/types";

export const parseRows = (errorMessage: string, rows: HRow[]) => {
  const parser = new nearly.Parser(nearly.Grammar.fromCompiled(grammar));

  // according to docs, "you would feed a Parser instance an array of objects"
  // https://nearley.js.org/docs/tokenizers#custom-token-matchers
  // however signature only takes string, so cast to any
  try {
    parser.feed(rows as any);
  } catch (error) {
    const e = error as Error;

    // these two regex code looks kinda curse but it works for now
    const unexpectedTokenList = [...e.message.matchAll(/Unexpected (.+)\./g)]!;

    if (unexpectedTokenList.length === 0) {
      throw error;
    }

    const unexpectedToken = unexpectedTokenList[0]![1]!;

    const expectedTokens = [
      ...e.message.matchAll(/A token matching x=>x.type==="(.+)" based on:/g),
      ...e.message.matchAll(
        /A token matching \(x\) => x.type === "(.+)" based on:/g,
      ),
    ].map(array => array[1]!);

    throw new Error(
      `${errorMessage} Parsing fail: Expected one of these token types\n  ${expectedTokens.join(
        "\n  ",
      )}\nbut instead found this token \n${JSON.stringify(
        JSON.parse(unexpectedToken),
        null,
        2,
      )}`,
    );
  }

  // make sure there are no multiple solutions, as our grammar should be unambiguous
  if (parser.results.length === 0) {
    throw new Error(`${errorMessage} unexpected end of tokens`);
  } else if (parser.results.length === 1) {
    return parser.results[0];
  }
  throw new Error(
    `${errorMessage} ${parser.results.length} solutions, grammar is ambiguous`,
  );
};

export const parse = async (
  entry: TokenizedCatalogEntry,
): Promise<ParsedCatalogEntry> => {
  const { mainReqs, concentrations } = parseTokens(entry.sections);

  const major: Major2 = {
    name: entry.majorName,
    metadata: {
      verified: false,
      lastEdited: new Date(Date.now()).toLocaleDateString("en-US"),
    },
    totalCreditsRequired: entry.programRequiredHours,
    yearVersion: entry.yearVersion,
    requirementSections: mainReqs,
    concentrations: {
      minOptions: concentrations.length >= 1 ? 1 : 0, // Is there any case where this isn't 0 or 1?
      concentrationOptions: concentrations,
    },
  };

  await writeFile(
    `${entry.savePath}/${FileName.PARSED}.${entry.saveStage}.json`,
    JSON.stringify(major, null, 2),
  );

  return {
    url: entry.url,
    degreeType: entry.degreeType,
    parsed: major,
  };
};

export const parseTokens = (sections: HSection[]) => {
  const primarySections = sections
    .filter(metaSection => metaSection.type === HSectionType.PRIMARY)
    .map(metaSection => {
      if (
        metaSection.entries.length >= 1 &&
        metaSection.entries[0]?.type != HRowType.HEADER
      ) {
        const newHeader: TextRow<HRowType.HEADER> = {
          type: HRowType.HEADER,
          description: metaSection.description,
          hour: 0,
        };
        metaSection.entries = [newHeader, ...metaSection.entries];
      }
      return metaSection.entries;
    })
    .flat()
    .filter(
      row =>
        row.type !== HRowType.COMMENT && row.type !== HRowType.SUBSUBHEADER,
    );

  const mainReqs =
    primarySections.length === 0
      ? []
      : parseRows("[Primary Section]", primarySections);

  const concentrations = sections
    .filter(metaSection => metaSection.type === HSectionType.CONCENTRATION)
    .map(metaSection => {
      metaSection.entries = metaSection.entries.filter(
        row => row.type !== HRowType.SUBSUBHEADER
      );

      metaSection.entries = metaSection.entries.flatMap((row, index) => {
        console.log("NEW KOBE READING ROW")
        console.log(row)
        // if this row is a comment and the previous row is an exception elective header, 
        // then this row is probably a comment that is meant to be a X_OF_MANY row
        if ((row.type == HRowType.COMMENT || row.type == HRowType.SECTION_INFO) && index > 0) {
          if (row.description.startsWith("If")) {
            // special case introduced by "Concentration in Campaigns and Elections" in the following major
            // https://catalog.northeastern.edu/archive/2021-2022/undergraduate/arts-media-design/journalism/journalism-political-science-ba/#programrequirementstext
            return [];
          }
          const prevRow = metaSection.entries[index - 1]!;
          console.log("KOBE CHECKING PREVIOUS ROW")
          console.log(prevRow)
          if (prevRow.type == HRowType.HEADER && isConcentrationExceptionValue(prevRow.description)) {
            console.log("CONVERTING TO X_OF_MANY")
            return [
              {
                type: HRowType.X_OF_MANY,
                description: row.description,
                hour: row.hour,
              },
            ];
          } else {
            return [];
          }
        }
        
        // if this row is a header and the 'Required Courses' exception type,
        // then the description of the section should be used to identify the concentration section 
        // otherwise, remove the 'Electives' exception type
        if (row.type == HRowType.HEADER && isConcentrationExceptionValue(row.description)) {
          if (isConcentrationLeadingHeaderExceptionValue(row.description) && index == 0) {
            console.log("KOBE CONVERTING TO CONCENTRATION " + metaSection.description)
            return [
              {
                ...row,
                description: metaSection.description,
              }
            ];
          } else {
            console.log("KOBE REMOVING EXCEPTION")
            return []
          }
        }
        return row;
      });

      if (
        metaSection.entries.length >= 1 &&
        metaSection.entries[0]?.type != HRowType.HEADER
      ) {
        const newHeader: TextRow<HRowType.HEADER> = {
          type: HRowType.HEADER,
          description: metaSection.description,
          hour: 0,
        };
        metaSection.entries = [newHeader, ...metaSection.entries];
      }
      return metaSection.entries;
    })
    .map(rows => parseRows("[Concentration Entries]", rows))
    .flat();

  return {
    mainReqs,
    concentrations,
  };
};

/**
 * Checks if the text is a concentration exception type.
 * https://www.geeksforgeeks.org/what-is-type-predicates-in-typescript/
 */
/*
function isConcentrationExceptionValue(value: string): value is ConcentrationValueExceptionType {
  return Object.values(ConcentrationValueExceptionType).includes(value as ConcentrationValueExceptionType);
}
*/
function isConcentrationExceptionValue(
  value: string
): value is (ConcentrationLeadingHeaderExceptionValue | ConcentrationTrailingHeaderExceptionValue) {
  return (
    Object.values(ConcentrationLeadingHeaderExceptionValue).includes(
      value as ConcentrationLeadingHeaderExceptionValue
    ) ||
    Object.values(ConcentrationTrailingHeaderExceptionValue).includes(
      value as ConcentrationTrailingHeaderExceptionValue
    )
  );
}

function isConcentrationLeadingHeaderExceptionValue(value: string): value is ConcentrationLeadingHeaderExceptionValue {
  return Object.values(ConcentrationLeadingHeaderExceptionValue).includes(value as ConcentrationLeadingHeaderExceptionValue);
}

function isConcentrationTrailingHeaderExceptionValue(value: string): value is ConcentrationTrailingHeaderExceptionValue {
  return Object.values(ConcentrationTrailingHeaderExceptionValue).includes(value as ConcentrationTrailingHeaderExceptionValue);
}