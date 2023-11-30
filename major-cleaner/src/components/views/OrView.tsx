import { IOrCourse2 } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { ListNode } from "../ListNode";
import { Dropdown } from "../core/Dropdown";

interface OrViewProps {
  or: IOrCourse2;
  onChange: MajorChangeHandler;
  index: number;
}

export const OrView = ({ index, or, onChange }: OrViewProps) => {
  return (
    <ListNode
      leftChild={
        <Dropdown
          initialValue={"OR"}
          onChange={(e) => onChange(
            { type: "type", newType: e, location: index, courses: or.courses },
            []
          )}
        />} 
      requirements={or.courses} 
      index={index} 
      onChange={onChange}
    />
  );
};
