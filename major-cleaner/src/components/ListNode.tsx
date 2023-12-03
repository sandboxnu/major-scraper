import { PropsWithChildren } from "react"
import { Box } from "./Box"
import { Requirement2 } from "../../../src/graduate-types/major2"
import { RequirementView } from "./views/RequirementView"
import { MajorChangeHandler } from "../types"

export interface MajorNodeProps extends PropsWithChildren{
    rightTitle?: string,
    middleChild?: JSX.Element,
    detail?: string,
    leftChild: JSX.Element,
    requirements: Requirement2[],
    index: number,
    onChange: MajorChangeHandler
}
export const ListNode = ({leftChild, middleChild, rightTitle, index, onChange, requirements}: MajorNodeProps) => {
    return (<Box>
    <div className="flex">
      <div className="flex flex-1 gap-2">
        {leftChild}
        {middleChild}
      {rightTitle && <p className="flex-1 text-right">{rightTitle}</p>}
      </div>
      <button onClick={() => {
        onChange({
          type: "DELETE",
          location: index
        }, [])
      }}> 🗑 </button>
    </div>
    {requirements.map((req, childIndex) => (
      <RequirementView
      requirement={req}
      onChange={(change, location) => {
        location.unshift(index);
        onChange(change, location);
      }}
      index={childIndex}
      />
      ))}
      <div>
        <button>+</button>
      </div>
  </Box>)
}