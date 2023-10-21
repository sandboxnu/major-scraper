import { HRowType, TokenizedCatalogEntry } from "../tokenize";

export const saveComment = (
  major: TokenizedCatalogEntry,
  comments: Map<string, string[]>,
): TokenizedCatalogEntry => {
  major.tokenized.sections.forEach(section => {
    section.entries.forEach(entry => {
      if (entry.type === HRowType.COMMENT) {
        if (!comments.has(entry.description)) {
          comments.set(entry.description, []);
        }
        comments.get(entry.description)?.push(major.tokenized.majorName);
      }
    });
  });

  return major;
};
