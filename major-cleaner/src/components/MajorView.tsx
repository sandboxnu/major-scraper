import { Major2 } from "../../../src/graduate-types/major2";
import { SectionView } from "./SectionView";

export const MajorView = ({major}: {major?: Major2}) => {
    if(major) {
        return major.requirementSections.map(section => <SectionView section={section}/>)
    } else {
        return;
    }
}