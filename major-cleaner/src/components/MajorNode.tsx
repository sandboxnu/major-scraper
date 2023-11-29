import { PropsWithChildren } from "react"
import { Box } from "./Box"

export interface MajorNodeProps extends PropsWithChildren{
    title?: string,
    subtitle?: string,
    detail?: string,
}
export const MajorNode = (props: MajorNodeProps) => {
    return <Box>
        <div className="flex">
            <div className="flex flex-1 gap-2">
            {props.title && <p className="font-bold">{props.title}</p>}
            {props.subtitle && <p>{props.subtitle}</p>}
            </div>
            {props.detail && <p className="flex-1 text-right">{props.detail}</p>}
        </div>
        {props.children && <div className="flex flex-col gap-2 mt-2">{props.children}</div>}
    </Box>

{/* <Box>
<div className="flex">
  <div className="flex flex-1 gap-2">
    <Editable
      initialValue={section.title}
      onChange={(e) =>
        onChange(
          { type: "SECTION", newSection: { ...section, title: e } },
          [],
        )
      }
    />
  </div>
  <p className="flex-1 text-right">SECTION</p>
</div>
{section?.requirements.map((req, index) => (
  <RequirementView
    requirement={req}
    onChange={(change, location) => {
      location.unshift(index);
      onChange(change, location);
    }}
  />
))}
</Box> */}
}