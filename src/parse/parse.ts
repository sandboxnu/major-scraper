import nearly from "nearley";
import type { ParsedCatalogEntry } from "./types";
import { HRowType, HSectionType } from "@/tokenize";
import type {
  HRow,
  HSection,
  TextRow,
  TokenizedCatalogEntry,
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
        row =>
          row.type !== HRowType.COMMENT && row.type !== HRowType.SUBSUBHEADER,
      );

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
