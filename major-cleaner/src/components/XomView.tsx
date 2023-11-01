import { IXofManyCourse } from "../../../src/graduate-types/major2";
import { RequirementView } from "./RequirementView";
import { style } from "./styles";

export const XomView = ({xom}: {xom?: IXofManyCourse}) => {
    if(xom) {
        return <div style={style.box}>
            <p>XOM, min creds: {xom.numCreditsMin}</p>
            <div>
            {xom.courses.map(requirement => <RequirementView requirement={requirement}/>)}
                </div>
        </div>
    }
}