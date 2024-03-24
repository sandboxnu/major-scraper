import * as cheerio from "cheerio";
import { log } from "@clack/prompts";
import { ResultType, type Matcher, type Result, Err, Ok } from "@/types";

export async function retryFetchHTML(
  url: URL,
  numRetries: number = 5,
  sleepTime: number = 500,
): Promise<Result<CheerioStatic, string>> {
  for (let i = 0; i < numRetries - 1; i++) {
    const res = await fetchHTML(url);

    if (res.type === ResultType.Ok) {
      return res;
    }

    // Network fails like 404 etc
    if (res.type === ResultType.Err && !res.err.includes("Fetch failed")) {
      return res;
    }

    setTimeout(() => {}, sleepTime);
  }

  return await fetchHTML(url);
}

export async function fetchHTML(
  url: URL,
): Promise<Result<CheerioStatic, string>> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "text/html",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      return Err(
        `Network response with status ${res.status} when fetching HTML`,
      );
    }

    const rawText = await res.text();
    const html = cheerio.load(rawText);
    return Ok(html);
  } catch (error) {
    return Err(`Fetch failed: ${(error as TypeError).cause}`);
  }
}

export function ensureExactLength<T, N extends number>(
  arr: Array<T>,
  length: N,
  errorMessage?: string,
) {
  assertsExactLength(arr, length, errorMessage);
  return arr;
}

type Tuple<
  T,
  N extends number,
  Acc extends Array<T> = [],
> = Acc["length"] extends N ? Acc : Tuple<T, N, [...Acc, T]>;

function assertsExactLength<T, N extends number>(
  arr: Array<T>,
  length: N,
  errorMessage?: string,
): asserts arr is Tuple<T, N> {
  if (arr.length !== length) {
    throw new Error(
      `${
        errorMessage == null ? "" : errorMessage + "\n"
      }Expected array length to be exactly ${length}, but was ${arr.length}`,
    );
  }
}

export function ensureAtLeastLength<T, N extends number>(
  arr: Array<T>,
  length: N,
  errorMessage?: string,
) {
  assertsAtLeastLength(arr, length, errorMessage);
  return arr;
}

type AtLeast<T, N extends number> = Tuple<T, N> & Array<T>;

function assertsAtLeastLength<T, N extends number>(
  arr: Array<T>,
  length: N,
  errorMessage?: string,
): asserts arr is AtLeast<T, N> {
  if (arr.length < length) {
    throw new Error(
      `${
        errorMessage == null ? "" : errorMessage + "\n"
      }Expected array length to be at least ${length}, but was ${arr.length}`,
    );
  }
}

export const parseText = (td: Cheerio) => {
  // replace &NBSP with space
  return td.text().replaceAll("\xa0", " ").trim();
};

export function fatalError(message: string): never {
  log.error(message);
  process.exit(0);
}

export const assertUnreachable = (_: never): never => {
  throw new Error("This code is unreachable");
};

export const majorNameToFileName = (majorName: string): string => {
  return majorName
    .toLowerCase()
    .replaceAll(",", "")
    .replaceAll(" ", "_")
    .replaceAll("-", "_");
};

export function matchResult<T, E, R1, R2>(
  result: Result<T, E>,
  matcher: Matcher<T, E, R1, R2>,
) {
  return result.type === ResultType.Ok
    ? matcher.Ok(result.ok)
    : matcher.Err(result.err);
}

export function matchPipe<T, E, R1, R2>(matcher: Matcher<T, E, R1, R2>) {
  return (result: Result<T, E>) =>
    result.type === ResultType.Ok
      ? matcher.Ok(result.ok)
      : matcher.Err(result.err);
}
