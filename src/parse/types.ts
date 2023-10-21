import { TypedCatalogEntry } from "../classify";
import { Major2 } from "../graduate-types";

export type ParsedCatalogEntry = TypedCatalogEntry & { parsed: Major2 };
