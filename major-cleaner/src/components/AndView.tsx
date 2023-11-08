import { IAndCourse2 } from "../../../src/graduate-types/major2";
import { Box } from "./Box";
import { RequirementView } from "./RequirementView";

export const AndView = ({ and }: { and?: IAndCourse2 }) => {
  if (and) {
    return (
      <Box>
        <p>AND</p>
        <div>
          {and.courses.map((course) => (
            <RequirementView requirement={course} />
          ))}
        </div>

      </Box>
    );
  } else {
    return;
  }
};
