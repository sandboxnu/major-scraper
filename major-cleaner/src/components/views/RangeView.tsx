import { ICourseRange2 } from "../../../../src/graduate-types/major2";
import { CourseChange, MajorChangeHandler } from "../../types";
import { Box } from "../Box";
import { List } from "../List";
import { CourseView } from "./CourseView";

interface RangeViewProps {
  range: ICourseRange2;
  onChange: MajorChangeHandler;
}

export const RangeView = ({ range, onChange }: RangeViewProps) => {
    return (
      <Box>
        <p>
          Course {range.subject} {range.idRangeStart}-{range.idRangeEnd}
        </p>
        <p>Exceptions:</p>
        <List>
          {range.exceptions.map((course, index) => (
            <CourseView course={course} onChange={function (change: CourseChange, location: number[]): void {
              location.unshift(index)
              onChange(change, location);
            } } />
          ))}
        </List>
      </Box>
    );
};
