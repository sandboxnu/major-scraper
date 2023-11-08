import { IAndCourse2 } from "../../../src/graduate-types/major2";
import { Box } from "./Box";
import { List } from "./List";
import { RequirementView } from "./RequirementView";

export const AndView = ({ and }: { and?: IAndCourse2 }) => {
  if (and) {
    return (
      <Box>
        <p>AND</p>
        <List>
          {and.courses.map((course) => (
            <RequirementView requirement={course} />
          ))}
        </List>

      </Box>
    );
  } else {
    return;
  }
};
