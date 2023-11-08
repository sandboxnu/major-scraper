import { IXofManyCourse } from "../../../src/graduate-types/major2";
import { Box } from "./Box";
import { List } from "./List";
import { RequirementView } from "./RequirementView";

export const XomView = ({ xom }: { xom?: IXofManyCourse }) => {
  if (xom) {
    return (
      <Box>
        <p>XOM, min creds: {xom.numCreditsMin}</p>
        <List>
          {xom.courses.map((requirement) => (
            <RequirementView requirement={requirement} />
          ))}
        </List>
      </Box>
    );
  }
};
