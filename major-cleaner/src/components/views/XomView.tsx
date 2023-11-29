import { IXofManyCourse } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { MajorNode } from "../MajorNode";
import { RequirementView } from "./RequirementView";

interface XomViewProps {
  xom: IXofManyCourse;
  onChange: MajorChangeHandler;
  index: number; 
}

export const XomView = ({ xom, onChange, index }: XomViewProps) => {
  return (
    <MajorNode title="XOM" subtitle={`${xom.numCreditsMin.toString()} credits`}>
      {" "}
      {xom.courses.map((requirement, childIndex) => (
        <RequirementView
          requirement={requirement}
          onChange={(change, location) => {
            location.unshift(index);
            onChange(change, location);
          }}
          index={childIndex}
        />
      ))}
    </MajorNode>
  );
};
