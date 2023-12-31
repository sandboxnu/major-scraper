import * as cheerio from "cheerio";
import { Err, Ok } from "./graduate-types/common";
import type { Result } from "./graduate-types/common";
import undici from "undici";

export const loadHTML = async (url: string): Promise<CheerioStatic> => {
  return cheerio.load(await wrappedGetRequest(url));
};

export const loadHtmlWithUrl = async (
  url: URL,
): Promise<{ url: URL; result: Result<CheerioStatic, unknown> }> => {
  let result: Result<CheerioStatic, unknown>;
  try {
    const html = cheerio.load(await wrappedGetRequest(url.href));
    result = Ok(html);
  } catch (error) {
    result = Err(error);
  }
  return { url, result };
};

export const wrappedGetRequest = async (url: string) => {
  const response = await undici.request(url, { maxRedirections: 1 });
  if (response.statusCode !== 200) {
    throw new Error(`Non-ok status code: ${response.statusCode}, url: ${url}`);
  }
  return await response.body.text();
};

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
        errorMessage + " "
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
        errorMessage + " "
      }Expected array length to be at least ${length}, but was ${arr.length}`,
    );
  }
}

export const parseText = (td: Cheerio) => {
  // replace &NBSP with space
  return td.text().replaceAll("\xa0", " ").trim();
};

/**
 * Exits the whole program with an error message.
 *
 * Should be used only when the trace isn't going to matter and you want a
 * slightly cleaner error message (good for command line arg errors for example).
 *
 * To use this you may have to "return" the value to convince TypeScript that the
 * program won't keep running, but since the type is "never", you won't have to
 * modify the function signature.
 * @param message the error message to exit with.
 */
export const fatalError = (message: string): never => {
  console.error(message);
  process.exit(1);
};

export const majorNameToFileName = (majorName: string): string => {
  return majorName.replaceAll(",", "").replaceAll(" ", "_");
};
