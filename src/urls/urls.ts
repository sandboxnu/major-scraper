import { loadHtmlWithUrl } from "../utils";
import { CatalogURLResult, College } from "./types";
import { ResultType } from "@graduate/common";
import { join } from "path";
import { BASE_URL, CURRENT_CATALOG_YEAR, EARLIEST_CATALOG_YEAR } from "../constants";

/**
 * Scrapes all catalog entries underneath the colleges for the specified catalog
 * year (given in the form of two numbers to avoid ambiguity: ex, 2021-2022).
 *
 * @param   start Starting year (must be end year - 1)
 * @param   end   Ending year
 * @returns       A hierarchy of catalog entry links
 */
export const scrapeMajorLinks = async (
  start: number
): Promise<CatalogURLResult> => {
  if (start < EARLIEST_CATALOG_YEAR) {
    // this is because there is no HTML version of those catalogs
    throw new Error("Scraping for years before 2016-2017 is not supported.");
  } else if (start > CURRENT_CATALOG_YEAR) {
    throw new Error(
      "Either you're scraping for a year in the future (which won't work unless time travel has been invented since this message was written), or you need to update CURRENT_CATALOG_YEAR in constants.ts."
    );
  }

  if (start === CURRENT_CATALOG_YEAR) {
    return scrapeMajorLinksForUrl(BASE_URL, "undergraduate");
  } else {
    return scrapeMajorLinksForUrl(
      BASE_URL,
      `archive/${start}-${start + 1}/undergraduate`
    );
  }
};

/**
 * Given a baseUrl and a path, attempts to scrape the major catalog based on the
 * sidebar hierarchy.
 *
 * Assumes that the provided baseURL + path have direct sub-entries for each of
 * the colleges.
 *
 * @param baseUrl The base url of the major catalog. should look something like
 *   "https://catalog.northeastern.edu"
 * @param path    The path of the major catalog. something like
 *   "/undergraduate/" or "/archive/2018-2019/undergraduate".
 */
export const scrapeMajorLinksForUrl = async (
  baseUrl: string,
  path: string
): Promise<CatalogURLResult> => {
  const initQueue = Object.values(College).map(
    (college) => new URL(join(baseUrl, path, college, "/"))
  );
  return await scrapeLinks(baseUrl, initQueue);
};

/**
 * Retrieves all sub-entries of the given initial queue in BFS fashion using the
 * catalog sidebar hierarchy.
 *
 * @param   baseUrl   The base catalog URL, i.e. https://catalog.northeastern.edu
 * @param   initQueue A queue of parent entries
 * @returns           A flat list of all the last level children catalog entries
 */
const scrapeLinks = async (
  baseUrl: string,
  initQueue: URL[]
): Promise<CatalogURLResult> => {
  const entries: URL[] = [];
  const unfinished = [];

  // there are multiple links in the sidebar to the same entry
  // keep a set to avoid visiting the same entry twice
  const seen = new Set(initQueue.map((url) => url.href));
  let queue = initQueue;
  while (queue.length > 0) {
    const { ok, errors } = await getUrlHtmls(queue);
    unfinished.push(...errors);
    const nextQueue: URL[] = [];
    for (const { $, url } of ok) {
      const children = getChildrenForPathId($, url).toArray().map($);
      for (const element of children) {
        const path = getLinkForEl(element);
        const url = new URL(join(baseUrl, path));
        if (
          !seen.has(url.href) &&
          Object.values(College).some((linkPart) => url.href.includes(linkPart))
        ) {
          const bucket = isParent(element) ? nextQueue : entries;
          bucket.push(url);
          seen.add(url.href);
        }
      }
    }
    queue = nextQueue;
  }

  return { entries, unfinished };
};

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

const getUrlHtmls = async (queue: URL[]) => {
  const fetchResults = await Promise.all(queue.map(loadHtmlWithUrl));

  const ok = [];
  const errors = [];
  for (const { url, result } of fetchResults) {
    if (result.type === ResultType.Ok) {
      ok.push({ $: result.ok, url });
      continue;
    }
    errors.push({ error: result.err, url });
  }
  return { ok, errors };
};