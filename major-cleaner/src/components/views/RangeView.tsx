import { ICourseRange2 } from "../../../../src/graduate-types/major2";
import { Box } from "../Box";
import { List } from "../List";
import { CourseView } from "./CourseView";

export const RangeView = ({ range }: { range?: ICourseRange2 }) => {
  if (range) {
    return (
      <Box>
        <p>
          Course {range.subject} {range.idRangeStart}-{range.idRangeEnd}
        </p>
        <p>Exceptions:</p>
        <List>
          {range.exceptions.map((course) => (
            <CourseView course={course} />
          ))}
        </List>
      </Box>
    );
  }
};
