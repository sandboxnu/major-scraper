import { PropsWithChildren } from "react"

export const List = (props: PropsWithChildren) => {
    return <div className="flex flex-col gap-2">{props.children}</div>
}