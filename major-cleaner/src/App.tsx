import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import { statSync } from "fs";
import { BaseDirectory, readTextFile } from "@tauri-apps/api/fs";
import { Token } from "./components/tokens";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [major, setMajor] = useState();
  const [tokens, setTokens] = useState("")

  useEffect(() => {
    readTextFile('bscs-tokens-v1.json', { dir: BaseDirectory.Desktop }).then(val => setTokens(val))
  }, [])

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div>
      <div style={style.dropdownContainer}>
        <select name="major" id="major" onChange={v => console.log(v.target.value)}>
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
          <Token section={JSON.parse(tokens)["tokenized"]["sections"][0]}></Token>

        </div>
        <div style={style.column}>
          <p>Parse</p>
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
    textAlign: "center",
  },
  dropdownContainer: {

  }
  
} satisfies Record<string, React.CSSProperties>;
export default App;
