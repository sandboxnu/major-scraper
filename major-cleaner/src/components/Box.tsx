import { PropsWithChildren } from "react"

export const Box = (props: PropsWithChildren) => {
    return <div className="border-gray-600 border-2 rounded p-2 hover:border-cyan-500">
        {props.children}
    </div>
}