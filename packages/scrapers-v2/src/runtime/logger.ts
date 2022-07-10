import { Pipeline, StageLabel } from "./types";
import { ResultType } from "@graduate/common";
import { FilterError } from "./pipeline";
import { CatalogEntryType } from "../classify/types";
import { HDocument, HRowType } from "../tokenize/types";

/**
 * Logs the progress of the scrape so the developer knows the scraper isn't deadlocked.
 *
 * As each individual entry pipeline completes, its status is logged. `.` for
 * success, `-` for filtered out, or a # representing the stage it errored on.
 *
 * @param pipelines The in-progress pipelines
 */
export const logProgress = async <T>(
  pipelines: Array<Promise<Pipeline<T>>>
) => {
  // set handlers to log the result of each pipeline
  for (const promise of pipelines) {
    promise.then(({ result, trace }) => {
      if (result.type === ResultType.Ok) {
        process.stdout.write(".");
      } else if (result.err[0] instanceof FilterError) {
        process.stdout.write("-");
      } else {
        process.stdout.write(String(trace.length));
      }
    });
  }

  const awaited = await Promise.all(pipelines);
  process.stdout.write("\n");
  return awaited;
};

/**
 * Logs scrape summary information, error messages, and the URLs of the catalog
 * entries that errored.
 *
 * Note: To display fewer stacktraces, the logger will try to aggregate them.
 * However, this doesn't always work with async stacktraces, so there might
 * sometimes appear two of the same stacktrace.
 *
 * @param results The completed pipelines
 */
export const logResults = (
  results: Pipeline<{
    tokenized: HDocument;
    type: CatalogEntryType;
    url: URL;
  }>[]
) => {
  const stats = new StatsLogger();

  for (const { result, trace, id } of results) {
    if (result.type === ResultType.Ok) {
      logOkResult(stats, result, id);
    } else {
      logErrResult(stats, id, trace, result.err);
    }
  }

  stats.print();
};

const logOkResult = (
  stats: StatsLogger,
  result: { ok: { tokenized: HDocument; type: CatalogEntryType } },
  id: URL
) => {
  stats.recordField("status", "ok");

  // record OK values
  const { tokenized, type } = result.ok;
  stats.recordField("status", "ok");
  stats.recordField("entry type", type);
  if (type === CatalogEntryType.Major && tokenized.programRequiredHours <= 0) {
    // only applies to majors, because concentrations and minors don't have hours requirement
    stats.recordError(new Error("major with hours <= 0"), id);
  }

  const reduce = (t: HRowType) => {
    switch (t) {
      case HRowType.RANGE_LOWER_BOUNDED:
        return HRowType.RANGE_BOUNDED;
      case HRowType.RANGE_LOWER_BOUNDED_WITH_EXCEPTIONS:
        return HRowType.RANGE_BOUNDED;
      case HRowType.RANGE_BOUNDED:
        return HRowType.RANGE_BOUNDED;
      case HRowType.RANGE_BOUNDED_WITH_EXCEPTIONS:
        return HRowType.RANGE_BOUNDED;
      case HRowType.RANGE_UNBOUNDED:
        return HRowType.RANGE_BOUNDED;
      default:
        return t;
    }
  };

  // we want to record all the possible transitions
  // we also want to record all the different comment types
  for (const { entries } of result.ok.tokenized.sections) {
    for (let i = 0; i < entries.length - 1; i += 1) {
      const curr = reduce(entries[i].type);
      const next = reduce(entries[i + 1].type);
      stats.recordField("transitions", `${curr} -> ${next}`);
    }
    for (const r of entries) {
      if (r.type === HRowType.HEADER) {
        stats.recordField("header", r.description);
      } else if (r.type === HRowType.SUBHEADER) {
        stats.recordField("subheader", r.description);
      }
    }
  }
};

const logErrResult = (
  stats: StatsLogger,
  id: URL,
  trace: StageLabel[],
  errors: unknown[]
) => {
  // special case the filter error
  if (errors[0] instanceof FilterError) {
    stats.recordField("status", "filtered");
    stats.recordField("filtered", errors[0].actual);
    if (errors[0].actual === CatalogEntryType.Unknown) {
      console.log("entry with unknown type:", id.toString());
    }
    return;
  }

  stats.recordField("status", "error");
  stats.recordField("stage failures", trace[trace.length - 1]);

  for (const err of errors) {
    if (err instanceof Error) {
      stats.recordError(err, id);
    } else {
      stats.recordError(new Error(`non-error value: ${err}`), id);
    }
  }
};

/**
 * Allows for "recording" fields (and errors) to print a breakdown of the
 * different values at the end.
 *
 * Each field value will be added to a tally. The # of occurrences of each value
 * for a field are then displayed when `print()` is called.
 *
 * Errors are also tallied. Error grouping is done by comparing stacktrace. This
 * doesn't quite work for async stacktraces, so sometimes two of the same error
 * are displayed separately.
 */
class StatsLogger {
  // field -> value -> count
  private fields: Record<string, Map<any, number>> = {};
  // message -> list -> stacktrace
  private errors: Map<
    string,
    Array<{ err: Error; count: number; annot: string; entryIds: URL[] }>
  > = new Map();

  /**
   * Records a field and its value, with the goal of printing the counts for
   * each different value the field has at the end.
   *
   * @param field The name of the field
   * @param value The value of the field
   */
  recordField(field: string, value: any) {
    if (field === "errors") {
      throw new Error(
        "cannot use 'errors' as a field key, use a different name"
      );
    }
    this.record(field, value);
  }

  /**
   * Records an error for a specific entry. Error uniqueness is determined by
   * stack trace. This doesn't quite work for async stacktraces, so sometimes
   * two of the same error are displayed separately.
   *
   * @param err     The error
   * @param entryId The entry URL
   */
  recordError(err: Error, entryId: URL) {
    const key = err.message ?? "had no stacktrace";
    const storedErrors = this.errors.get(key) ?? [];
    for (const stored of storedErrors) {
      // if the stacktrace matches, increment the count
      if (err.stack === stored.err.stack) {
        stored.count += 1;
        stored.entryIds.push(entryId);
        this.record("errors", stored.annot);
        return;
      }
    }
    const id = storedErrors.length === 0 ? "" : ` #${storedErrors.length}`;
    const annot = `${err.message}${id}`;
    // stacktrace didn't match, so add a new stacktrace entry for this error message
    storedErrors.push({ err, count: 1, annot, entryIds: [entryId] });
    this.errors.set(key, storedErrors);
    this.record("errors", annot);
  }

  /**
   * Increments the count for a field, stored in this.fields, or adds it if it
   * doesn't exist. Compares values with reference equality
   *
   * @param field The field name
   * @param value The value
   */
  private record(field: string, value: any) {
    if (!(field in this.fields)) {
      this.fields[field] = new Map();
    }
    const map = this.fields[field];
    map.set(value, (map.get(value) ?? 0) + 1);
  }

  /**
   * Prints field and error information.
   *
   * Prints stacktraces (with URLs) first, then aggregate information. Also
   * prints in order of # of occurrences.
   */
  print() {
    // log errors with stacktraces
    const errors = Array.from(this.errors.values())
      .flat()
      .sort((a, b) => b.count - a.count);
    for (const { err, count, annot, entryIds } of errors) {
      console.log(annot, count);
      console.error(err);
      console.log(entryIds.map((url) => url.toString()));
    }

    // log normal metrics (including error aggregates)
    for (const [field, map] of Object.entries(this.fields)) {
      console.log(field, ":");
      const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
      for (const entry of entries) {
        console.log("\t", ...entry);
      }
    }
  }
}
