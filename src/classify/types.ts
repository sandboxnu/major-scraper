import { College } from "../urls";

export enum CatalogEntryType {
  Major = "Major",
  Minor = "Minor",
  Concentration = "Concentration",
  Unknown = "Unknown",
}

export type TypedCatalogEntry = { url: URL; type: CatalogEntryType };

export type TypedCatalogEntry2 = {
  url: URL;
  degreeType: CatalogEntryType;
  yearVersion: number;
  college: College;
  majorName: string;
  savePath: string;
  html: CheerioStatic;
};

export class FilterError {
  actual;
  allowed;

  constructor(actual: CatalogEntryType, allowed: CatalogEntryType[]) {
    this.actual = actual;
    this.allowed = allowed;
  }
}
