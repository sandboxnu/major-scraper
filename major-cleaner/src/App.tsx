import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { useEffect, useState } from "react";
import { Major2 } from "../../src/graduate-types/major2";
import "./App.css";
import { handleSection } from "./change";
import { Token } from "./components/tokens";
import { MajorView } from "./components/views/MajorView";
import { MajorChangeHandler } from "./types";

const parseTokens = (tokens: string) => {
  try {
    return JSON.parse(tokens)["tokenized"]["sections"][0];
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

function App() {
  const [major, setMajor] = useState<Major2>();
  const [tokens, setTokens] = useState("{}");

  useEffect(() => {
    readTextFile("bscs-tokens-v3.json", { dir: BaseDirectory.Desktop }).then(
      (val) => setTokens(val),
    );
    readTextFile("bscs-parse.json", { dir: BaseDirectory.Desktop }).then(
      (val) => setMajor(JSON.parse(val)),
    );
  }, []);

  useEffect(() => {
    writeTextFile("bscs-new-lmao.json", JSON.stringify(major), {dir: BaseDirectory.Desktop})
  }, [major])

  const handleChange: MajorChangeHandler = (change, location) => {
    if(major) {
      const majorClone = {...major};
      if(location.length > 0){
        const locationIndex = location.shift();
        if(locationIndex === undefined) {
          throw new Error(majorClone.requirementSections.toString());
        }
        handleSection(majorClone.requirementSections[locationIndex], change, location);
        setMajor(majorClone);
      }
    }
  }



  return (
    <div>
      <div style={style.dropdownContainer}>
        <select
          name="major"
          id="major"
          onChange={(v) => console.log(v.target.value)}
        >
          <option value="CS">CS</option>
          {/* <option value="saab">Saab</option>
          <option value="mercedes">Mercedes</option>
          <option value="audi">Audi</option> */}
        </select>
      </div>
      <div style={style.container}>
        <div style={style.column}>
          <p>HTML</p>
        </div>
        <div style={style.column}>
          <p>Tokens</p>
          <Token section={parseTokens(tokens)}></Token>
        </div>
        <div className="border-gray-600 p-2 border-2">
          <p>Parse</p>
          {major && <MajorView major={major} onChange={handleChange} />}
        </div>
      </div>
    </div>
  );
}

const style = {
  column: {
    border: "solid gray",
    flex: 1,
  },
  container: {
    margin: 0,
    paddingTop: "10vh",
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  dropdownContainer: {},
} satisfies Record<string, React.CSSProperties>;
export default App;

