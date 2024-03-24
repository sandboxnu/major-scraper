import { useEffect, useState } from "react";
import { Major2 } from "../../src/graduate-types/major2";
import "./App.css";
import { handleSection } from "./change";
import { Tokens } from "./components/tokens";
import { MajorView } from "./components/views/MajorView";
import { MajorChangeHandler } from "./types";
import { invoke } from "@tauri-apps/api";
import { HSection } from "../../src/tokenize/types";
import React from "react";
import resetStyle from "../../src/css/reset.css?inline";
import actualStyle from "../../src/css/styles.css?inline";

const parseTokens = (tokens: string) => {
  try {
    console.log(JSON.parse(tokens))
    const token = JSON.parse(tokens)["sections"];
    console.log(token)
    return token
  } catch (e) {
    console.log(tokens)
    console.error(e);
    return undefined;
  }
};

type Year = "2023" | "2022" | "2021" | "2020" | "2019"
type College = "computer-information-science" | "arts-media-design"
type Form = "raw.initial.html" | "parsed.initial.json" | "tokens.initial.json"

const read_major_file = async (year: Year, college: College, name: string, form: Form) => {
  return await invoke<string>("read_major_file", {
    year,
    college, 
    name, 
    form
  })
}

function prepareHTML(html: string): string {
  console.log("reset style", resetStyle)
  console.log("SDFLKSDJFLKSDJFLKSDJLKFJSLDKJFLKSDJFLKSDJLKFJSDLK")
  const styleReplaced = html
    .replace(`href="/src/css/reset.css"`, `href="data:text/css;base64,${btoa(resetStyle)}"`)
    .replace(`href="/src/css/styles.css"`, `href="data:text/css;base64,${btoa(actualStyle)}"`)

  return "data:text/html;base64," + btoa(styleReplaced)
}

function App() {
  const [major, setMajor] = useState<Major2>();
  const [html, setHtml] = useState<string>("");
  const [tokenSections, setTokenSections] = useState<HSection[]>();

  useEffect(() => {
    read_major_file("2023", "computer-information-science", "Computer_Science_BSCS", "raw.initial.html")
      .then(setHtml);
    read_major_file("2023", "computer-information-science", "Computer_Science_BSCS", "tokens.initial.json")
      .then(parseTokens)
      .then(tokens => setTokenSections(tokens));
    read_major_file("2023", "computer-information-science", "Computer_Science_BSCS", "parsed.initial.json")
      .then((val) => {
        try {
          setMajor(JSON.parse(val))
        }
        catch (e) {
          console.error(val, e)
        }
      });
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
            <iframe src={prepareHTML(html)} style={styles.iframe} width="100%"/>
          </div>
        </div>
        <div style={styles.column}>
          <p style={styles.columnHeader}>Tokens</p>
          <div style={styles.content}>
            {
              tokenSections && tokenSections.map(section => (
                <React.Fragment>
                  <h1>{section.description}</h1>
                  <Tokens section={section} />
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
    overflowY: 'hidden',
    display: "flex",
    flexDirection: "column"
  },
  columnHeader: {
    fontWeight: "bold",
    background: '#111',
    padding: "6px 10px",
  },
  content: {
    overflowY: 'auto',
    padding: "10px",
    height: "100%",
  },
  pre: {
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    // width: '100%',
    // height: '100%',
    overflowY: 'auto'
  },
  iframe: {
    height: "100%",
  },
  dropdownContainer: {},
} satisfies Record<string, React.CSSProperties>;
export default App;

