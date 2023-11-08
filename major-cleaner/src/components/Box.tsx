import { PropsWithChildren } from "react"

export const Box = (props: PropsWithChildren) => {
    return <div className="border-gray-600 border-4 rounded p-2">
        {props.children}
    </div>
}