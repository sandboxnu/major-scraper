import { ICourseRange2 } from "../../../src/graduate-types/major2";
import { CourseView } from "./CourseView";
import { style } from "./styles";

export const RangeView = ({ range }: { range?: ICourseRange2 }) => {
  if (range) {
    return (
      <div style={style.box}>
        <p>
          Course {range.subject} {range.idRangeStart}-{range.idRangeEnd}
        </p>
        <p>Exceptions:</p>
        <div>
          {range.exceptions.map((course) => (
            <CourseView course={course} />
          ))}
        </div>
      </div>
    );
  }
};
