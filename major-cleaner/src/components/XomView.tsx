import { IXofManyCourse } from "../../../src/graduate-types/major2";
import { MajorNode } from "./MajorNode";
import { RequirementView } from "./RequirementView";

export const XomView = ({ xom }: { xom?: IXofManyCourse }) => {
  if (xom) {
    return (<MajorNode title="XOM" subtitle={`${xom.numCreditsMin.toString()} credits`}>          {xom.courses.map((requirement) => (
      <RequirementView requirement={requirement} />
    ))}</MajorNode>
    );
  }
};
