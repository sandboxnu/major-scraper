import { College } from "../urls";

export enum CatalogEntryType {
  Major = "major",
  Minor = "minor",
  Concentration = "concentration",
  Unknown = "unknown",
}

export type TypedCatalogEntry = {
  url: URL;
  degreeType: CatalogEntryType;
  yearVersion: number;
  college: College;
  majorName: string;
  savePath: string;
  saveStage: SaveStage;
  html: CheerioStatic;
};

export enum SaveStage {
  INITIAL = "initial",
  STAGING = "staging",
  COMMIT = "commit",
}

export enum FileName {
  RAW = "raw",
  TOKENS = "tokens",
  PARSED = "parsed",
}

export class FilterError {
  actual;
  allowed;

  constructor(actual: CatalogEntryType, allowed: CatalogEntryType[]) {
    this.actual = actual;
    this.allowed = allowed;
  }
}
