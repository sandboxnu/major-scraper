import { HRow, HRowType, HSection } from "../../../src/tokenize/types";

export const Tokens = (props: { section: HSection }) => {
  if (props.section === undefined) {
    return;
  }

  return (
    <>
      {props.section.entries.map((entry) => {
        return <div className="tokensList">{renderToken(entry)}</div>;
      })}
    </>
  );
};

function renderToken(token: HRow): JSX.Element {
  switch (token.type) {
    case HRowType.HEADER:
      return (
        <div className="tokenRow header">
          <p className="icon">#</p>
          <p style={{ fontWeight: "bold" }}>{token.description}</p>
        </div>
      );
    case HRowType.PLAIN_COURSE:
      return (
        <div className="tokenRow">
          <p>
            {token.subject}
            {token.classId}
          </p>
          <p>{token.description}</p>
        </div>
      );
    case HRowType.AND_COURSE:
      return (
        <>
          {token.courses.map((course, index) => (
            <div className="tokenRow">
              {index === 0 ? (
                <p className="icon">&</p>
              ) : (
                <p className="blankIcon"></p>
              )}
              <p>
                {course.subject}
                {course.classId} - {course.description}
              </p>
            </div>
          ))}
        </>
      );
      {
        /* <p>{token.description}</p> */
      }

    case HRowType.OR_COURSE:
      return (
        <div className="tokenRow">
          <p className="icon">||</p>
          <p>
            {token.subject}
            {token.classId}
          </p>
          <p>{token.description}</p>
        </div>
      );
    case HRowType.COMMENT:
      return (
        <div className="tokenRow comment">
          <p className="icon">?</p>
          <p>{token.description}</p>
        </div>
      );
    case HRowType.SECTION_INFO:
      return (
        <div className="tokenRow">
          <p className="icon">i</p>
          <p>{token.description}</p>
          <p>Count: {token.parsedCount}</p>
        </div>
      );
    case HRowType.SUBHEADER:
      return (
        <div className="tokenRow">
          <p className="icon">#</p>
          <p style={{ fontWeight: "bold" }}>{token.description}</p>
        </div>
      );
    case HRowType.X_OF_MANY:
      return (
        <div className="tokenRow">
          <p className="icon">X</p>
          <p>{token.description}</p>
          <p>Hours: {token.hour}</p>
        </div>
      );
    case HRowType.RANGE_LOWER_BOUNDED_WITH_EXCEPTIONS:
      return (
        <div className="tokenRow">
          <p className="icon">R</p>
          <p>
            {token.subject}
            {token.classIdStart}+
          </p>
          <p>
            Except:{" "}
            {token.exceptions
              .map((exception) => `${exception.subject}${exception.classId}`)
              .join(", ")}
          </p>
        </div>
      );
    case HRowType.COMMENT_COUNT:
    case HRowType.OR_OF_AND_COURSE:
    case HRowType.RANGE_LOWER_BOUNDED:
    case HRowType.RANGE_BOUNDED:
    case HRowType.RANGE_BOUNDED_WITH_EXCEPTIONS:
    case HRowType.RANGE_UNBOUNDED:
      return <p className="missing">{`{{{{WIP!}}}} (${token.type})`}</p>;
  }
}
