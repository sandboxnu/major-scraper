import { Section } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { Box } from "../Box";
import { Editable } from "../core/Editable";
import { RequirementView } from "./RequirementView";

interface SectionViewProps {
  index: number
  section: Section;
  onChange: MajorChangeHandler;
}

export const SectionView = ({ section, onChange, index }: SectionViewProps) => {
  return (
    <Box>
      <div className="flex">
        <div className="flex flex-1 gap-2">
          <Editable
            initialValue={section.title}
            onChange={(e) =>
              onChange(
                { type: "SECTION", newSection: { ...section, title: e } },
                [],
              )
            }
          />
        </div>
        <p className="flex-1 text-right">SECTION</p>
      </div>
      {section?.requirements.map((req, childIndex) => (
        <RequirementView
          requirement={req}
          onChange={(change, location) => {
            location.unshift(index);
            onChange(change, location);
          }}
          index={childIndex}
        />
      ))}
    </Box>
  );
};
