import major2021 from "../degrees/majors/2021/arts_media_design/Game_Art_and_Animation_BFA/tokens.json";
import major2022 from "../degrees/majors/2022/arts_media_design/Game_Art_and_Animation_BFA/tokens.json";
import { parseEntry } from "../src/parse";
import { TokenizedCatalogEntry } from "../src/tokenize";
import { CatalogEntryType } from "../src/classify/types";
import { writeFile } from "fs/promises";

const tokens2021: TokenizedCatalogEntry = {
  url: new URL("https://example.com"),
  type: CatalogEntryType.Major,
  tokenized: major2021 as any,
};

const tokens2022: TokenizedCatalogEntry = {
  url: new URL("https://example.com"),
  type: CatalogEntryType.Major,
  tokenized: major2022 as any,
};

parseEntry(tokens2021).then(entry => {
  writeFile(
    "./Game_Art_and_Animation_BFA-2021.json",
    JSON.stringify(entry.parsed, null, 2),
  );
});

parseEntry(tokens2022).then(entry => {
  writeFile(
    "./Game_Art_and_Animation_BFA-2022.json",
    JSON.stringify(entry.parsed, null, 2),
  );
});
