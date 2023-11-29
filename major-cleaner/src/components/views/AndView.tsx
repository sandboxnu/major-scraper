import { IAndCourse2 } from "../../../../src/graduate-types/major2";
import { MajorChangeHandler } from "../../types";
import { Box } from "../Box";
import { Dropdown } from "../core/Dropdown";
import { RequirementView } from "./RequirementView";

interface AndViewProps {
  and: IAndCourse2;
  index: number;
  onChange: MajorChangeHandler;
}

export const AndView = ({ index, and, onChange }: AndViewProps) => {
  return (
    // <MajorNode title="AND">
    //   {" "}
    //   {and.courses.map((course, index) => (
    //     <RequirementView
    //       requirement={course}
    //       onChange={(change, location) => {
    //         location.unshift(index);
    //         onChange(change, location);
    //       }}
    //     />
    //   ))}
    // </MajorNode>

    <Box>
      <div className="flex">
        <div className="flex flex-1 gap-2">
          <Dropdown
            initialValue={"AND"}
            onChange={(e) =>
              onChange(
                { type: "type", newType: e, location: index, courses: and.courses},
                [],
              )
            }
          />
        </div>
        <p className="flex-1 text-right">SECTION</p>
      </div>
      {and?.courses.map((req, childIndex) => (
        <RequirementView
          requirement={req}
          onChange={(change, location) => {
            location.unshift(index);
            onChange(change, location);
          }}
          index={childIndex}
        />
      ))}
    </Box>
    
  );
};
