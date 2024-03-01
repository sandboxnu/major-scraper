import type { Major2 } from "@/major2";
import { CatalogEntryType } from "../classify";

export type ParsedCatalogEntry = {
  url: URL;
  degreeType: CatalogEntryType;
  parsed: Major2;
};
