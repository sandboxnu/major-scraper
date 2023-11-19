import { Requirement2 } from "../../../../src/graduate-types/major2";
import { AndView } from "./AndView";
import { CourseView } from "./CourseView";
import { OrView } from "./OrView";
import { RangeView } from "./RangeView";
import { SectionView } from "./SectionView";
import { XomView } from "./XomView";

export const RequirementView = ({
  requirement,
}: {
  requirement?: Requirement2;
}) => {
  switch (requirement?.type) {
    case "SECTION":
      return <SectionView section={requirement} />;
    case "COURSE":
      return <CourseView course={requirement} />;
    case "AND":
      return <AndView and={requirement} />;
    case "XOM":
      return <XomView xom={requirement} />;
    case "OR":
      return <OrView or={requirement} />;
    case "RANGE":
      return <RangeView range={requirement} />;
    default:
      return JSON.stringify(requirement);
  }
};
