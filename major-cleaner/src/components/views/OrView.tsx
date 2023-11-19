import { IOrCourse2 } from "../../../../src/graduate-types/major2";
import { CourseChange, MajorChangeHandler } from "../../types";
import { MajorNode } from "../MajorNode";
import { RequirementView } from "./RequirementView";

interface OrViewProps {
  or: IOrCourse2;
  onChange: MajorChangeHandler;
}

export const OrView = ({ or, onChange }: OrViewProps) => {
  return (
    <MajorNode title="OR">
      {or.courses.map((requirement, index) => (
        <RequirementView
          requirement={requirement}
          onChange={function (change: CourseChange, location: number[]): void {
            location.unshift(index);
            onChange(change, location);
          }}
        />
      ))}
    </MajorNode>
  );
};
