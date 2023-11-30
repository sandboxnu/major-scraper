import { Section } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { ListNode } from "../ListNode";
import { Editable } from "../core/Editable";

interface SectionViewProps {
  index: number
  section: Section;
  onChange: MajorChangeHandler;
}

export const SectionView = ({ section, onChange, index }: SectionViewProps) => {
  return (
    <ListNode 
      leftChild={
        <Editable
        initialValue={section.title}
        onChange={(e) =>
          onChange(
            { type: "SECTION", newSection: { ...section, title: e } },
            [index],
          )
        }
      />
      } 
      rightTitle="SECTION"
      requirements={section.requirements} 
      index={index} 
      onChange={onChange}    
    />
  );
};
