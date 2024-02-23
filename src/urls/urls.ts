import {
  ensureAtLeastLength,
  fatalError,
  matchResult,
  retryFetchHTML,
} from "../utils";
import { College } from "./types";
import { join } from "path";
import { BASE_URL } from "../constants";
import type { AssertionError } from "assert";

const isParent = (el: Cheerio) => {
  return el.hasClass("isparent");
};

const getLinkForEl = (element: Cheerio) => {
  const aTag = element.find("a");
  if (aTag.length === 0) {
    const msg = "Catalog is missing a link for a parent element.";
    throw new Error(msg);
  }

  return aTag.attr("href");
};

const getChildrenForPathId = ($: CheerioStatic, url: URL) => {
  // The catalog entries have an ID equal to the path, with a trailing slash
  // We select the element via its ID
  // Note: for getElementById, forward slashes need to be escaped
  let id = url.pathname;

  // Remove archive url prefix if present
  id = id.replaceAll(/^\/archive\/20\d\d-20\d\d/g, "");
  id = id.replaceAll("/", "\\/");

  const current = $(`#${id}`);
  return current.children();
};

export async function scrapeMajorLinks(startYear: number, currentYear: number) {
  const path =
    startYear === currentYear
      ? "undergraduate"
      : `archive/${startYear}-${startYear + 1}/undergraduate`;

  const initQueue = Object.values(College).map(
    college => new URL(join(BASE_URL, path, college, "/")),
  );

  const entries: URL[] = [];
  const errors: { url: URL; message: string }[] = [];
  const seen = new Set(initQueue.map(url => url.href));
  let queue: URL[] = initQueue;

  const processHTML = (html: CheerioStatic, url: URL, nextQueue: URL[]) => {
    const children = getChildrenForPathId(html, url).toArray().map(html);

    for (const element of children) {
      const path = getLinkForEl(element);
      const url = new URL(
        join(
          BASE_URL,
          // some links just includes the dev version of the catalog
          // so we just replace that with the correpsonding url from the current catalog
          path.replace(
            "https://nextcatalog.northeastern.edu/",
            startYear === currentYear
              ? ""
              : `archive/${startYear}-${startYear + 1}/`,
          ),
        ),
      );

      if (
        !seen.has(url.href) &&
        Object.values(College).some(linkPart => url.href.includes(linkPart))
      ) {
        const bucket = isParent(element) ? nextQueue : entries;
        bucket.push(url);
        seen.add(url.href);
      }
    }
  };

  while (queue.length > 0) {
    const nextQueue: URL[] = [];

    await Promise.all(
      queue.map(async url =>
        matchResult(await retryFetchHTML(url), {
          Ok: html => {
            processHTML(html, url, nextQueue);
          },
          Err: message => {
            errors.push({
              url,
              message,
            });
          },
        }),
      ),
    );

    queue = nextQueue;
  }

  return { entries, errors };
}

export async function getCurrentYear(): Promise<number> {
  const $ = matchResult(await retryFetchHTML(new URL(BASE_URL)), {
    Ok: value => value,
    Err: message => {
      fatalError(`Cannot fetch the current year. ${message}`);
    },
  });
  const text = $("a:contains('Academic Catalog')").text();
  try {
    return Number(
      ensureAtLeastLength(
        text.match(/(\d{4})/g)!,
        1,
        "Main catalog missing latest academic year",
      )[0],
    );
  } catch (e) {
    fatalError((e as AssertionError).message);
  }
}
