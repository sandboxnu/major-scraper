import { Section } from "../../../src/graduate-types/major2";
import { MajorNode } from "./MajorNode";
import { RequirementView } from "./RequirementView";

export const SectionView = ({ section }: { section?: Section }) => {
  return (
    <MajorNode title={section?.title} detail="SECTION">        {section?.requirements.map((req) => (
      <RequirementView requirement={req} />
    ))}</MajorNode>
  );
};
