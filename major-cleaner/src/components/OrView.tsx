import { IOrCourse2 } from "../../../src/graduate-types/major2";
import { RequirementView } from "./RequirementView";
import { style } from "./styles";

export const OrView = ({or}: {or?: IOrCourse2}) => {
    if(or) {
        return <div style={style.box}>
            <p>OR</p>
            <div>
                {or.courses.map(requirement => <RequirementView requirement={requirement}/>)}
            </div>
        </div>
    }
}