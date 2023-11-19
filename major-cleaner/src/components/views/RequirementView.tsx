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
}

export const RequirementView = ({
  requirement,
  onChange
}: RequirementViewProps) => {
  switch (requirement.type) {
    case "SECTION":
      return <SectionView section={requirement} onChange={onChange}/>;
    case "COURSE":
      return <CourseView course={requirement} onChange={onChange}/>;
    case "AND":
      return <AndView and={requirement} onChange={onChange}/>;
    case "XOM":
      return <XomView xom={requirement} onChange={onChange}/>;
    case "OR":
      return <OrView or={requirement} onChange={onChange}/>;
    case "RANGE":
      return <RangeView range={requirement} onChange={onChange} />;
    default:
      return JSON.stringify(requirement);
  }
};
