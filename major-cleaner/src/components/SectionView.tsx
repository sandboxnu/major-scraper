import { Section } from "../../../src/graduate-types/major2";
import { RequirementView } from "./RequirementView";
import { style } from "./styles";

export const SectionView = ({ section }: { section?: Section }) => {
  return (
    <div style={style.box}>
      <p>{section?.title}</p>
      <div>
        {section?.requirements.map((req) => (
          <RequirementView requirement={req} />
        ))}
      </div>
    </div>
  );
};
