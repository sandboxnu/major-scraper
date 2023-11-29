import { Requirement2 } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { AndView } from "./AndView";
import { CourseView } from "./CourseView";
import { OrView } from "./OrView";
import { RangeView } from "./RangeView";
import { SectionView } from "./SectionView";
import { XomView } from "./XomView";

interface RequirementViewProps {
  requirement: Requirement2;
  onChange: MajorChangeHandler;
  index: number
}

export const RequirementView = ({
  requirement,
  onChange,
  index
}: RequirementViewProps) => {
  switch (requirement.type) {
    case "SECTION":
      return <SectionView section={requirement} onChange={onChange} index={index}/>;
    case "COURSE":
      return <CourseView course={requirement} onChange={onChange} index={index}/>;
    case "AND":
      return <AndView and={requirement} onChange={onChange} index={index}/>;
    case "XOM":
      return <XomView xom={requirement} onChange={onChange} index={index}/>;
    case "OR":
      return <OrView or={requirement} onChange={onChange} index={index}/>;
    case "RANGE":
      return <RangeView range={requirement} onChange={onChange} index={index}/>;
    default:
      return JSON.stringify(requirement);
  }
};
