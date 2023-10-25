import { CatalogEntryType, TypedCatalogEntry } from "../classify";
import { Major2 } from "../graduate-types";

export type ParsedCatalogEntry = {
  url: URL;
  degreeType: CatalogEntryType;
  parsed: Major2;
};
