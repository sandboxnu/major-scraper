import { convertFileSrc } from "@tauri-apps/api/tauri";
import { IRequiredCourse } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { Box } from "../Box";
import { Editable } from "../core/Editable";

interface CourseViewProps {
  index: number;
  course: IRequiredCourse;
  onChange: MajorChangeHandler;
}

export const CourseView = ({ index, course, onChange }: CourseViewProps) => {
  return (
    <Box>
      <div className="flex">
        <div className="flex flex-1 gap-2">
          <Editable
            initialValue={course.subject}
            onChange={(e) =>
              onChange(
                { type: "COURSE", newCourse: { ...course, subject: e } },
                [index],
              )
            }
          />
          <Editable
            initialValue={course.classId.toString()}
            onChange={(e) =>
              onChange(
                { type: "COURSE", newCourse: { ...course, classId: parseInt(e) } },
                [index],
              )}
          />
        </div>
        <p className="flex-1 text-right">COURSE</p>
        <button onClick={() => {
          onChange({
            type: "DELETE",
            location: index
          }, [])
        }}> 🗑 </button>
      </div>
    </Box>
  );
};
