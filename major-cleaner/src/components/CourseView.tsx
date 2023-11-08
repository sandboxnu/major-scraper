import { IRequiredCourse } from "../../../src/graduate-types/major2";
import { style } from "./styles";

export const CourseView = ({course}: {course?: IRequiredCourse}) => {
    if(course) {
        return <div style={style.box}>
            <p className="underline text-cyan-500">COURSE {course.subject}{course.classId}</p>
        </div>
    }
}