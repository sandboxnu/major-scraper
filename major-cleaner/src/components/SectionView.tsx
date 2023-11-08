import { Section } from "../../../src/graduate-types/major2";
import { Box } from "./Box";
import { List } from "./List";
import { RequirementView } from "./RequirementView";

export const SectionView = ({ section }: { section?: Section }) => {
  return (
    <Box>
      <p>{section?.title}</p>
      <List>
        {section?.requirements.map((req) => (
          <RequirementView requirement={req} />
        ))}
      </List>
    </Box>
  );
};
