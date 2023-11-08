import { HRow, HRowType, HSection } from "../../../src/tokenize/types";

export const Token = (props: { section: HSection }) => {
  if (props.section === undefined) {
    return;
  }
  const renderEntry = (entry: HRow) => {
    const courseNumber =
      (entry as any).subject && (entry as any).classId
        ? (entry as any).subject + (entry as any).classId
        : "";
    return courseNumber + " " + ((entry as any).description ?? "");
  };
  return (
    <>
      {props.section.entries.map((entry) => {
        return (
          <div>
            <p>
              {entry.type} {renderEntry(entry)}
            </p>
          </div>
        );
      })}
    </>
  );
};
