import { IAndCourse2 } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { MajorNode } from "../MajorNode";
import { RequirementView } from "./RequirementView";

interface AndViewProps {
  and: IAndCourse2;
  onChange: MajorChangeHandler;
}

export const AndView = ({ and, onChange }: AndViewProps) => {
  return (
    <MajorNode title="AND">
      {" "}
      {and.courses.map((course, index) => (
        <RequirementView
          requirement={course}
          onChange={(change, location) => {
            location.unshift(index);
            onChange(change, location);
          }}
        />
      ))}
    </MajorNode>
  );
};
