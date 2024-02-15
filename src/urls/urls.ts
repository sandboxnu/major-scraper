import { retryFetchHTML } from "../utils";
import { College } from "./types";
import { join } from "path";
import {
  BASE_URL,
  CURRENT_CATALOG_YEAR,
  EARLIEST_CATALOG_YEAR,
} from "../constants";
import { matchResult } from "@/types";

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

export async function scrapeMajorLinks(startYear: number) {
  if (startYear < EARLIEST_CATALOG_YEAR) {
    throw new Error("Scraping for years before 2016-2017 is not supported.");
  }

  if (startYear > CURRENT_CATALOG_YEAR) {
    throw new Error("Start year has not exist yet");
  }

  const path =
    startYear == CURRENT_CATALOG_YEAR
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
      const url = new URL(join(BASE_URL, path));

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
