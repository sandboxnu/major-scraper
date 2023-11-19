import { IXofManyCourse } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { MajorNode } from "../MajorNode";
import { RequirementView } from "./RequirementView";

interface XomViewProps {
  xom: IXofManyCourse;
  onChange: MajorChangeHandler;
}

export const XomView = ({ xom, onChange }: XomViewProps) => {
  return (
    <MajorNode title="XOM" subtitle={`${xom.numCreditsMin.toString()} credits`}>
      {" "}
      {xom.courses.map((requirement, index) => (
        <RequirementView
          requirement={requirement}
          onChange={(change, location) => {
            location.unshift(index);
            onChange(change, location);
          }}
        />
      ))}
    </MajorNode>
  );
};
