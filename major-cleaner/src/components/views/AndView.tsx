import { IAndCourse2 } from "../../../../src/graduate-types/major2";
import { MajorNode } from "../MajorNode";
import { RequirementView } from "./RequirementView";

export const AndView = ({ and }: { and?: IAndCourse2 }) => {
  if (and) {
    return (<MajorNode title="AND">          {and.courses.map((course) => (
      <RequirementView requirement={course} />
    ))}</MajorNode>
    );
  } else {
    return;
  }
};
