/** Represents the label for a stage in the scraper pipeline */
export enum PhaseLabel {
  ScrapeMajorLinks = "Scrape Major Links",
  ScrapeMajorPlans = "Scrape Major Plans",
  Classify = "Classify",
  Tokenize = "Tokenize",
  Parse = "Parse",
}

export type ErrorLog = {
  message: string;
  entryInfo: string;
};

// Represent the required field in an entry for logging
// Save path is a nice quality of life since you can
// navigate to the folder by cmd + click on the path in the terminal
export type MandatoryPipelineEntry = {
  url: URL;
  savePath?: string;
};
