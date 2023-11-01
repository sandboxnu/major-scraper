import { CatalogEntryType } from "../classify";
import { type Major2 } from "../graduate-types";

export type ParsedCatalogEntry = {
  url: URL;
  degreeType: CatalogEntryType;
  parsed: Major2;
};
