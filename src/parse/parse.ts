import { CompiledRules, Grammar, Parser } from "nearley";
import { ParsedCatalogEntry } from "./types";
import {
  HRow,
  HRowType,
  HSectionType,
  TextRow,
  TokenizedCatalogEntry,
} from "../tokenize";
import { Major2, Section } from "../graduate-types";
import { writeFile } from "fs/promises";

// at runtime, generate the ./grammar.ts file from the grammar.ne file
// eslint-disable-next-line @typescript-eslint/no-var-requires
const grammar: CompiledRules = require("./grammar");

export const parseRows = (rows: HRow[]) => {
  const parser = new Parser(Grammar.fromCompiled(grammar));

  // according to docs, "you would feed a Parser instance an array of objects"
  // https://nearley.js.org/docs/tokenizers#custom-token-matchers
  // however signature only takes string, so cast to any
  parser.feed(rows as any);

  // make sure there are no multiple solutions, as our grammar should be unambiguous
  if (parser.results.length === 0) {
    throw new Error("unexpected end of tokens");
  } else if (parser.results.length === 1) {
    return parser.results[0];
  }
  throw new Error(`${parser.results.length} solutions, grammar is ambiguous`);
};

export const parse = async (
  entry: TokenizedCatalogEntry,
): Promise<ParsedCatalogEntry> => {
  const nonConcentrations = entry.sections.filter(metaSection => {
    return metaSection.type === HSectionType.PRIMARY;
  });

  const entries: HRow[][] = nonConcentrations.map(metaSection => {
    if (
      metaSection.entries.length >= 1 &&
      metaSection.entries[0].type != HRowType.HEADER
    ) {
      const newHeader: TextRow<HRowType.HEADER> = {
        type: HRowType.HEADER,
        description: metaSection.description,
        hour: 0,
      };
      metaSection.entries = [newHeader, ...metaSection.entries];
    }
    return metaSection.entries;
  });

  let allEntries = entries.reduce((prev: HRow[], current: HRow[]) => {
    return prev.concat(current);
  }, []);

  allEntries = allEntries.filter(
    row => row.type !== HRowType.COMMENT && row.type !== HRowType.SUBHEADER,
  );

  const mainReqsParsed = parseRows(allEntries);

  const concentrations = entry.sections
    .filter(metaSection => {
      return metaSection.type === HSectionType.CONCENTRATION;
    })
    .map((concentration): Section => {
      // Add in header based on section name if one isn't already present.
      concentration.entries = concentration.entries.filter(
        row => row.type !== HRowType.COMMENT && row.type !== HRowType.SUBHEADER,
      );
      if (
        concentration.entries.length >= 1 &&
        concentration.entries[0].type != HRowType.HEADER
      ) {
        const newHeader: TextRow<HRowType.HEADER> = {
          type: HRowType.HEADER,
          description: concentration.description,
          hour: 0,
        };
        concentration.entries = [newHeader, ...concentration.entries];
      }
      const parsed = parseRows(concentration.entries);
      // Change this when we allow concentrations to have multiple sections:
      if (parsed.length >= 1 && parsed[0].type == "SECTION") {
        return parsed;
      } else {
        if (parsed.length > 1) {
          throw new Error(
            `Concentration "${concentration.description}" has multiple sections which is not supported right now!`,
          );
        }
        throw new Error(
          `Concentration "${concentration.description}" cannot be parsed!`,
        );
      }
    })
    .flat();

  const major: Major2 = {
    name: entry.majorName,
    metadata: {
      verified: false,
      lastEdited: new Date(Date.now()).toLocaleDateString("en-US"),
    },
    totalCreditsRequired: entry.programRequiredHours,
    yearVersion: entry.yearVersion,
    requirementSections: mainReqsParsed,
    concentrations: {
      minOptions: concentrations.length >= 1 ? 1 : 0, // Is there any case where this isn't 0 or 1?
      concentrationOptions: concentrations,
    },
  };

  await writeFile(
    `${entry.savePath}/parsed.json`,
    JSON.stringify(major, null, 2),
  );

  return {
    url: entry.url,
    degreeType: entry.degreeType,
    parsed: major,
  };
};
