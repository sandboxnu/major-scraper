import { useState } from "react";
import { IRequiredCourse } from "../../../src/graduate-types/major2";
import { Box } from "./Box";

export const CourseView = ({ course, onChange }: { course: IRequiredCourse, onChange?: (val: string, loc: string) => void }) => {
  const [value, setValue] = useState(course)
  return (
    <Box>
      <div className="flex">
        <div className="flex flex-1 gap-2">
          <Editable
            initialValue={value.subject}
            onChange={(e) => {setValue({
              ...value,
              subject: e
            })}}
          />
          <Editable
            initialValue={value.classId.toString()}
            onChange={(e) => {setValue({
              ...value,
              classId: parseInt(e)
            })}}
          />
        </div>
        <p className="flex-1 text-right">COURSE</p>
      </div>
    </Box>
  );
};

const Editable = (props: {
  onChange: (val: string) => void;
  initialValue: string;
}): React.ReactNode => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("")
  return (
    <div onClick={() => setEditing(true)}>
      {editing ? (
        <input
          defaultValue={props.initialValue}
          className="font-bold"
          onChange={(e) => {
            setValue(e.target.value)
          }}
          onKeyDown={(e) => {
            if(e.key === 'Enter') {
              setEditing(!editing)
              props.onChange(value)
            }
          }}
        ></input>
      ) : (
        <p className="font-bold">{props.initialValue}</p>
      )}
    </div>
  );
};
