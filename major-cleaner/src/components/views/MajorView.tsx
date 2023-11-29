import { Major2 } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { List } from "../List";
import { SectionView } from "./SectionView";

export interface MajorViewProps {
  major: Major2;
  onChange: MajorChangeHandler;
}

export const MajorView = (props: MajorViewProps) => {
  return (
    <List>
      {props.major.requirementSections.map((section, index) => (
        <SectionView
          section={section}
          onChange={(change, location) => {
            props.onChange(change, location);
          }}
          index={index}
        />
      ))}
    </List>
  );
};
