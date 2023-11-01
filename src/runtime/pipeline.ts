import { tokenize } from "../tokenize";
import { classify } from "../classify";
import { CatalogEntryType } from "../classify";
import { Err, Ok, ResultType } from "../graduate-types";
import { StageLabel, type Pipeline } from "./types";
import { createAgent } from "./axios";
import {
  installGlobalStatsLogger,
  logProgress,
  logResults,
  clearGlobalStatsLogger,
  getGlobalStatsLogger,
} from "./logger";
import { writeFile } from "fs/promises";
import { scrapeMajorLinks } from "../urls";
import { parse } from "../parse";

export const runPipeline = async (yearStart: number) => {
  const unregisterAgent = createAgent();
  const { entries, unfinished } = await scrapeMajorLinks(yearStart);

  if (unfinished.length > 0) {
    console.log("didn't finish searching some entries", ...unfinished);
  }

  installGlobalStatsLogger();
  const pipelines = entries.map(entry => {
    return createPipeline(entry)
      .then(
        addPhase(StageLabel.Classify, classify, [
          CatalogEntryType.Minor,
          CatalogEntryType.Major,
          CatalogEntryType.Concentration,
        ]),
      )
      .then(addPhase(StageLabel.Tokenize, tokenize))
      .then(addPhase(StageLabel.Parse, parse));
  });

  const results = await logProgress(pipelines);

  await unregisterAgent();
  logResults(results);
  await saveComments();
  clearGlobalStatsLogger();
};

const saveComments = async () => {
  const comments = getGlobalStatsLogger()?.comments;
  if (comments === undefined) {
    return;
  }

  const obj: { [key: string]: string[] } = {};
  Array.from(comments.entries())
    .sort((a, b) => -a[1].length + b[1].length)
    .forEach(([key, value]) => (obj[key] = value));
  await writeFile("./degrees/comments.json", JSON.stringify(obj, null, 2));
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
