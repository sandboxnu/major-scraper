/** The catalog's base url */
export const BASE_URL = "https://catalog.northeastern.edu";

/** The catalog does not have any HTML before this year */
export const EARLIEST_CATALOG_YEAR = 2016;

/** represent the position of the collge in an archived catalog url
 * for example, in https://catalog.northeastern.edu/archive/2022-2023/undergraduate/computer-information-science/computer-science/bscs/
 *  computer-information-science is in 6th place when using string.split("/")
 */
export const ARCHIVE_PLACEMENT = 6;

/** represent the position of the collge in an archived catalog url
 * for example, in https://catalog.northeastern.edu/undergraduate/computer-information-science/computer-science/bscs/
 *  computer-information-science is in 4th place when using string.split("/")
 */
export const CURRENT_PLACEMENT = 4;

// TODO: Move to Config
export const CURRENT_CATALOG_YEAR = 2023;

// TODO: Move to Config
export const STORE_TOKENS_AND_HTML = true;
