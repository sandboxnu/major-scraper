import { IRequiredCourse } from "../../../src/graduate-types/major2";
import { Box } from "./Box";

export const CourseView = ({ course }: { course?: IRequiredCourse }) => {
  if (course) {
    return (
      <Box>
        <p className="underline text-cyan-500">
          COURSE {course.subject}
          {course.classId}
        </p>
      </Box>
    );
  }
};
