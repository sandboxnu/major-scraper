import { IRequiredCourse } from "../../../src/graduate-types/major2";
import { MajorNode } from "./MajorNode";

export const CourseView = ({ course }: { course?: IRequiredCourse }) => {
  if (course) {
    return (<MajorNode title={`${course.subject} ${course.classId}`} detail="COURSE"/>
    );
  }
};
