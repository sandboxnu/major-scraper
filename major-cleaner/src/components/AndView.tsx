import { IAndCourse2 } from "../../../src/graduate-types/major2";
import { RequirementView } from "./RequirementView";
import { style } from "./styles";

export const AndView = ({and}: {and?: IAndCourse2}) => {
    if(and) {
        return <div style={style.box}>
            <p>AND</p>
            <div>
                {and.courses.map(course => <RequirementView requirement={course}/>)}
            </div>
        </div>
    } else {
        return;
    }
}