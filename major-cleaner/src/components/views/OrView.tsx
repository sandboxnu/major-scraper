import { IOrCourse2 } from "../../../../src/graduate-types/major2";
import { MajorNode } from "../MajorNode";
import { RequirementView } from "./RequirementView";

export const OrView = ({ or }: { or?: IOrCourse2 }) => {
  if (or) {
    return (<MajorNode title="OR">
                {or.courses.map((requirement) => (
            <RequirementView requirement={requirement} />
          ))}
    </MajorNode>
    );
  }
};
