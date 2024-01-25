import { useEffect, useState } from "react";
import { Major2 } from "../../src/graduate-types/major2";
import "./App.css";
import { handleSection } from "./change";
import { Token } from "./components/tokens";
import { MajorView } from "./components/views/MajorView";
import { MajorChangeHandler } from "./types";
import { invoke } from "@tauri-apps/api";
import { HSection } from "../../src/tokenize/types";
import React from "react";

const parseTokens = (tokens: string) => {
  try {
    console.log(JSON.parse(tokens))
    const token = JSON.parse(tokens)["sections"];
    console.log(token)
    return token
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

type Year = "2023" | "2022" | "2021" | "2020" | "2019"
type College = "computer-information-science" | "arts-media-design"
type Form = "html.html" | "parsed.json" | "tokens.json"

const read_major_file = async (year: Year, college: College, name: string, form: Form) => {
  return await invoke<string>("read_major_file", {
    year,
    college, 
    name, 
    form
  })
}

function App() {
  const [major, setMajor] = useState<Major2>();
  const [html, setHtml] = useState<string>("");
  const [tokenSections, setTokenSections] = useState<HSection[]>();

  useEffect(() => {
    read_major_file("2023", "computer-information-science", "Computer_Science_BSCS", "html.html")
      .then(setHtml);
    read_major_file("2023", "computer-information-science", "Computer_Science_BSCS", "tokens.json")
      .then(parseTokens)
      .then(tokens => setTokenSections(tokens));
    read_major_file("2023", "computer-information-science", "Computer_Science_BSCS", "parsed.json")
      .then((val) => setMajor(JSON.parse(val)));
    // read_major_file("2023", "computer-information-science", "Computer_Science_and_Behavioral_Neuroscience_BS", "parsed.json")
    //   .then((val) => setMajor(JSON.parse(val)));
  }, []);

  const handleChange: MajorChangeHandler = (change, location) => {
    if(major) {
      const majorClone = {...major};
      if(location.length > 0){
        const locationIndex = location.shift();
        if(locationIndex === undefined) {
          throw new Error(majorClone.requirementSections.toString());
        }
        handleSection(majorClone.requirementSections[locationIndex], change, location);
      } else {
        if(change.type === "DELETE") {
          majorClone.requirementSections.splice(change.location, 1)
        }
      }
      setMajor(majorClone);
    }
  }



  return (
    <div style={styles.appContainer}>
      <div style={styles.dropdownContainer}>
        <select
          name="major"
          id="major"
          onChange={(v) => console.log(v.target.value)}
        >
          <option value="CS">CS</option>
          <option value="CAMD">CAMD</option>
        </select>
      </div>
      <div style={styles.container}>
        <div style={styles.column}>
          <p style={styles.columnHeader}>HTML</p>
          <div style={styles.content}>
            <pre>
              {html}
            </pre>
          </div>
        </div>
        <div style={styles.column}>
          <p style={styles.columnHeader}>Tokens</p>
          <div style={styles.content}>
            {
              tokenSections && tokenSections.map(section => (
                <React.Fragment>
                  <h1>{section.description}</h1>
                  <Token section={section} />
                </React.Fragment>
              ))
            }
          </div>
        </div>
        <div style={styles.column}>
          <p style={styles.columnHeader}>Parse</p>
          <div style={styles.content}>
            {major && <MajorView major={major} onChange={handleChange} />}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    overflow: "hidden",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "10px"
  },
  container: {
    margin: 0,
    paddingTop: "50px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    maxWidth: "100vw",
    gap: 5,
    overflow: "hidden"
  },
  column: {
    // border: "1px solid gray",
    background: "#222",
    flexGrow: 1,
    flexBasis: "100%",
    overflow: 'auto',
    borderRadius: 5,
    padding: 5,
    overflowY: 'hidden',
    display: "flex",
    flexDirection: "column"
  },
  columnHeader: {
    fontWeight: "bold",
    background: '#111',
    margin: "-5px -5px 5px -5px",
    padding: "5px",
  },
  content: {
    overflowY: 'auto'
  },
  dropdownContainer: {},
} satisfies Record<string, React.CSSProperties>;
export default App;

