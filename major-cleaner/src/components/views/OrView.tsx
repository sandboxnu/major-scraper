import { IOrCourse2 } from "../../../../src/graduate-types/major2";
import { MajorChange, MajorChangeHandler } from "../../types";
import { MajorNode } from "../MajorNode";
import { RequirementView } from "./RequirementView";

interface OrViewProps {
  or: IOrCourse2;
  onChange: MajorChangeHandler;
  index: number;
}

export const OrView = ({ index, or, onChange }: OrViewProps) => {
  return (
    <MajorNode title="OR">
      {or.courses.map((requirement, childIndex) => (
        <RequirementView
          requirement={requirement}
          onChange={function (change: MajorChange, location: number[]): void {
            location.unshift(index);
            onChange(change, location);
          }}
          index={childIndex}
        />
      ))}
    </MajorNode>
  );
};
