import { appendPath, loadHTML } from "../utils";
import { CatalogHierarchy, College, CatalogPath } from "./types";

/**
 * Scrapes all catalog entries underneath the colleges.
 *
 * @param start starting year (must be end year - 1)
 * @param end   ending year
 * @returns     a hierarchy of catalog entry links
 */
export const scrapeMajorLinks = async (
  start: number,
  end: number
): Promise<CatalogHierarchy> => {
  if (start !== end - 1) {
    throw new Error("start should == end-1");
  }

  if (start < 2016) {
    // this is because there is no HTML version of those catalogs
    throw new Error("scraping for years before 2016-2017 are not supported");
  }

  if (start !== 2021) {
    // todo: implement generic scraping from overall archive
    // https://registrar.northeastern.edu/group/academic-catalogs/
    throw new Error("only current year is supported");
  }

  return scrapeMajorLinksForUrl(
    "https://catalog.northeastern.edu",
    "undergraduate"
  );
};

/**
 * Given a baseUrl and a path, attempts to scrape the major catalog based on the sidebar
 * hierarchy.
 * @param baseUrl the base url of the major catalog. should look something
 *                like "https://catalog.northeastern.edu"
 * @param path    the path of the major catalog. something like "/undergraduate"
 *                or "archive/2018-2019/undergraduate/". trailing or leading slashes are ok.
 */
export const scrapeMajorLinksForUrl = async (
  baseUrl: string,
  path: string
): Promise<CatalogHierarchy> => {
  const paths = getPathParts(path);
  try {
    const initStack = Object.values(College).map((college) => ({
      path: [...paths, college],
    }));
    const catalogPaths = await scrapeLinks(baseUrl, initStack);
    return convertToHierarchy(baseUrl, catalogPaths);
  } catch (e) {
    throw e;
  }
};

/**
 *
 * Retrieves all sub-entries of the given initial queue in BFS fashion using the catalog sidebar hierarchy.
 *
 * @param baseUrl   the base catalog URL, i.e. https://catalog.northeastern.edu
 * @param initQueue a queue of parent entries
 * @returns         a flat list of all the last level children catalog entries
 */
const scrapeLinks = async (
  baseUrl: string,
  initQueue: CatalogPath[]
): Promise<CatalogPath[]> => {
  const results: CatalogPath[] = [];

  let queue = initQueue;
  while (queue.length > 0) {
    const pages = await Promise.all(getUrlHtmls(queue, baseUrl));
    const nextQueue: CatalogPath[] = [];
    for (const { $, url } of pages) {
      const children = getChildrenForPathId($, url).toArray().map($);
      for (const element of children) {
        const path = getLinkForEl(element);
        const bucket = isParent(element) ? nextQueue : results;
        bucket.push({ path });
      }
    }
    queue = nextQueue;
  }

  return results;
};

/**
 * Converts a flat list of entries to catalog hierarchy.
 *
 * @param base         the base catalog URL, i.e. https://catalog.northeastern.edu
 * @param catalogPaths a flat list of paths
 * @returns            catalog hierarchy
 */
const convertToHierarchy = (
  base: string,
  catalogPaths: CatalogPath[]
): CatalogHierarchy => {
  const hierarchy: CatalogHierarchy = {};
  for (const { path } of catalogPaths) {
    let obj: CatalogHierarchy = hierarchy;

    // For each part of the path, add it to the hierarchy
    for (let i = 0; i < path.length - 1; i += 1) {
      const part = path[i];
      if (!(part in obj)) {
        obj[part] = {};
      }
      const child = obj[part];
      if (typeof child === "string") {
        throw new Error(
          "Hierarchy was inconsistent: found a leaf, where a parent was expected"
        );
      }
      obj = child;
    }

    const last = path[path.length - 1];
    // Obj should equal the parent of the entry
    obj[last] = joinParts(base, path).toString();
  }
  return hierarchy;
};

const isParent = (el: Cheerio) => {
  return el.hasClass("isparent");
};

const getPathParts = (url: string) => {
  return url.split("/").filter((s) => s !== "");
};

const getLinkForEl = (element: Cheerio): string[] => {
  const aTag = element.find("a");
  if (aTag.length === 0) {
    const msg = "Catalog is missing a link for a parent element.";
    throw new Error(msg);
  }

  return getPathParts(aTag.attr("href"));
};

const getChildrenForPathId = ($: CheerioStatic, url: URL) => {
  // for getElementById, forward slashes need to be escaped
  const id = url.pathname.split("/").join("\\/");
  const current = $(`#${id}\\/`);
  return current.children();
};

const fetchUrlHtml = (url: URL) =>
  new Promise<{ $: CheerioStatic; url: URL }>((res) => {
    loadHTML(url.href).then((r) => res({ $: r, url }));
  });

const joinParts = (base: string, parts: string[]) => {
  return appendPath(base, parts.join("/"));
};

const getUrlHtmls = (queue: CatalogPath[], base: string) => {
  return queue.map(({ path }) => joinParts(base, path)).map(fetchUrlHtml);
};