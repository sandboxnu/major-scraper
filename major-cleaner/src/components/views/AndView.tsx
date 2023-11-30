import { IAndCourse2 } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { ListNode } from "../ListNode";
import { Dropdown } from "../core/Dropdown";

interface AndViewProps {
  and: IAndCourse2;
  index: number;
  onChange: MajorChangeHandler;
}

export const AndView = ({ index, and, onChange }: AndViewProps) => {
  return (
    <ListNode
      leftChild={
        <Dropdown
          initialValue={"AND"}
          onChange={(e) => onChange(
            { type: "type", newType: e, location: index, courses: and.courses },
            []
          )}
        />} 
      requirements={and.courses} 
      index={index} 
      onChange={onChange}
    />
  );
};
