import { Major2 } from "../../../../src/graduate-types/major2";
import { List } from "../List";
import { SectionView } from "./SectionView";

export const MajorView = ({ major }: { major?: Major2 }) => {
  if (major) {
    return <List>{major.requirementSections.map((section) => (
      <SectionView section={section} />))}</List>;
  } else {
    return;
  }
};
