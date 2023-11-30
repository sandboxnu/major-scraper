import { IXofManyCourse } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { ListNode } from "../ListNode";
import { Dropdown } from "../core/Dropdown";
import { Editable } from "../core/Editable";

interface XomViewProps {
  xom: IXofManyCourse;
  onChange: MajorChangeHandler;
  index: number; 
}

export const XomView = ({ xom, onChange, index }: XomViewProps) => {
  return (
    <ListNode
      middleChild={
        <Editable 
          onChange={(val) => {
            onChange({
              type: "XOM",
              newXom: {...xom, numCreditsMin: Number(val)}
            }, 
            [index])
          }} 
          initialValue={`${xom.numCreditsMin} creadits`}
        />
      }
      leftChild={
        <Dropdown
          initialValue={"XOM"}
          onChange={(e) => onChange(
            { type: "type", newType: e, location: index, courses: xom.courses },
            []
          )}
        />} 
      requirements={xom.courses} 
      index={index} 
      onChange={onChange}
    />
  );
};
