import { Section } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { MajorNode } from "../MajorNode";
import { RequirementView } from "./RequirementView";

interface SectionViewProps {
  section: Section;
  onChange: MajorChangeHandler;
}

export const SectionView = ({ section, onChange }: SectionViewProps) => {
  return (
    <MajorNode title={section?.title} detail="SECTION">
      {" "}
      {section?.requirements.map((req, index) => (
        <RequirementView
          requirement={req}
          onChange={(change, location) => {
            location.unshift(index);
            onChange(change, location);
          }}
        />
      ))}
    </MajorNode>
  );
};
