import { ICourseRange2 } from "../../../../src/graduate-types/major2";
import { MajorChange, MajorChangeHandler } from "../../types";
import { Box } from "../Box";
import { List } from "../List";
import { CourseView } from "./CourseView";

interface RangeViewProps {
  range: ICourseRange2;
  onChange: MajorChangeHandler;
  index: number;
}

export const RangeView = ({ index, range, onChange }: RangeViewProps) => {
  return (
    <Box>
      <p>
        Course {range.subject} {range.idRangeStart}-{range.idRangeEnd}
      </p>
      <p>Exceptions:</p>
      <List>
        {range.exceptions.map((course, childIndex) => (
          <CourseView
            course={course}
            onChange={function (
              change: MajorChange,
              location: number[],
            ): void {
              location.unshift(index);
              onChange(change, location);
            }}
            index={childIndex}
          />
        ))}
      </List>
    </Box>
  );
};
