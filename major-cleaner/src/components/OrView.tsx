import { IOrCourse2 } from "../../../src/graduate-types/major2";
import { Box } from "./Box";
import { List } from "./List";
import { RequirementView } from "./RequirementView";

export const OrView = ({ or }: { or?: IOrCourse2 }) => {
  if (or) {
    return (
      <Box>
        <p>OR</p>
        <List>
          {or.courses.map((requirement) => (
            <RequirementView requirement={requirement} />
          ))}
        </List>
      </Box>
    );
  }
};
