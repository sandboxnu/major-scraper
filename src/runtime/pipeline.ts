import { tokenizeEntry } from "../tokenize/tokenize";
import { addTypeToUrl } from "../classify/classify";
import { CatalogEntryType, TypedCatalogEntry } from "../classify/types";
import { Err, Ok, ResultType } from "../graduate-types/common";
import { Pipeline, StageLabel } from "./types";
import { createAgent } from "./axios";
import {
  installGlobalStatsLogger,
  logProgress,
  logResults,
  clearGlobalStatsLogger,
} from "./logger";
import { writeFile } from "fs/promises";
import { saveComment } from "./saveComment";
import { majorNameToFileName } from "../utils";
import { scrapeMajorLinks } from "../urls";
import { ParsedCatalogEntry, parseEntry } from "../parse";
import { join } from "path";

export const runPipeline2 = async (yearStart: number) => {
  const unregisterAgent = createAgent();
  const { entries, unfinished } = await scrapeMajorLinks(yearStart);
  await unregisterAgent();

  if (unfinished.length > 0) {
    console.log("didn't finish searching some entries", ...unfinished);
  }

  console.log(entries.map(url => url.href));

  // installGlobalStatsLogger();
  // const pipelines = entries.map(entry => {
  //   return createPipeline(entry)
  //     .then(addPhase(StageLabel.Classify, addTypeToUrl))
  //     .then(addPhase(StageLabel.Tokenize, tokenizeEntry))
  //     .then(addPhase(StageLabel.Parse, parseEntry));
  // });

  // const results = await logProgress(pipelines);

  // logResults(results);
  // clearGlobalStatsLogger();
};

/**
 * Runs a full scrape of the catalog, logging the results to the console.
 */
export const runPipeline = async (yearStart: number) => {
  const unregisterAgent = createAgent();
  const { entries, unfinished } = await scrapeMajorLinks(yearStart);
  const comments = new Map();
  if (unfinished.length > 0) {
    console.log("didn't finish searching some entries", ...unfinished);
  }

  // can use for debugging logging throughout the stages
  installGlobalStatsLogger();
  const pipelines = entries.map(entry => {
    return createPipeline(entry)
      .then(addPhase(StageLabel.Classify, addTypeToUrl))
      .then(
        addPhase(StageLabel.Filter, filterEntryType, [
          CatalogEntryType.Minor,
          CatalogEntryType.Major,
          CatalogEntryType.Concentration,
        ]),
      )
      .then(addPhase(StageLabel.Tokenize, tokenizeEntry))
      .then(addPhase(StageLabel.SaveComment, saveComment, comments))
      .then(addPhase(StageLabel.Parse, parseEntry))
      .then(addPhase(StageLabel.Save, saveResults));
  });
  const results = await logProgress(pipelines);
  await unregisterAgent();

  const obj: { [key: string]: number } = {};
  Array.from(comments.entries())
    .sort((a, b) => -a[1].length + b[1].length)
    .forEach(([key, value]) => (obj[key] = value));
  writeFile("./degrees/comments.json", JSON.stringify(obj, null, 2));
  logResults(results);
  clearGlobalStatsLogger();
};

// convenience constructor for making a pipeline
const createPipeline = (input: URL): Promise<Pipeline<URL>> => {
  return Promise.resolve({
    id: input,
    trace: [],
    result: Ok(input),
  });
};

/**
 * Wraps the provided function with a try/catch so that errors don't break the
 * whole scraper.
 *
 * @param phase The identifier for the stage, to be recorded in pipeline trace.
 * @param next  The function representing this stage. the first argument of this
 *   function must be the primary entry input.
 * @param args  Any additional arguments the stage function requires.
 */
const addPhase = <Input, Args extends any[], Output>(
  phase: StageLabel,
  next:
    | ((...args: [Input, ...Args]) => Promise<Output>)
    | ((...args: [Input, ...Args]) => Output),
  ...args: Args
) => {
  return async (input: Pipeline<Input>): Promise<Pipeline<Output>> => {
    const { id, trace, result } = input;
    if (result.type === ResultType.Err) {
      return { id, trace, result };
    }
    const newTrace = [...trace, phase];
    try {
      const applied = await next(result.ok, ...args);
      return { id, trace: newTrace, result: Ok(applied) };
    } catch (e) {
      return { id, trace: newTrace, result: Err([e]) };
    }
  };
};

const filterEntryType = (
  entry: TypedCatalogEntry,
  types: CatalogEntryType[],
) => {
  if (types.includes(entry.type)) {
    return entry;
  }
  throw new FilterError(entry.type, types);
};

export class FilterError {
  actual;
  allowed;

  constructor(actual: CatalogEntryType, allowed: CatalogEntryType[]) {
    this.actual = actual;
    this.allowed = allowed;
  }
}

const saveResults = async (
  entry: ParsedCatalogEntry,
): Promise<ParsedCatalogEntry> => {
  const name = majorNameToFileName(entry.parsed.name);
  const year = entry.parsed.yearVersion;
  const degree = name.includes("Minor") ? "minors" : "majors";
  const college = entry.url.toString().split("/")[6].replaceAll("-", "_");

  const filePath = join(
    "degrees",
    degree,
    year.toString(),
    college,
    majorNameToFileName(name),
    "parsed.json",
  );

  return writeFile(filePath, JSON.stringify(entry.parsed, null, 2))
    .then(() => {
      // console.log("wrote file: " + path)
      return entry;
    })
    .catch(e => {
      console.log(e);
      return entry;
    });
};
