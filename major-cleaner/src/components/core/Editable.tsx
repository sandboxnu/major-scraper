import { useState } from "react";

export const Editable = (props: {
    onChange: (val: string) => void;
    initialValue: string;
  }): React.ReactNode => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(props.initialValue)


    const exitEditing = () => {
        setEditing(false)
        props.onChange(value);
    }

    const enterEditing = () => {
        setEditing(true);
    }
    return (
      <div onClick={enterEditing}>
        {editing ? (
          <input
          autoFocus
            defaultValue={props.initialValue}
            className="font-bold"
            onChange={(e) => {
              setValue(e.target.value)
            }}
            onKeyDown={(e) => {
              if(e.key === 'Enter') {
                exitEditing();
              }
            }}
            onBlur={exitEditing}
          ></input>
        ) : (
          
            props.initialValue ? 
              <p className="font-bold">{props.initialValue}</p> : 
              <p className="text-gray-400">(none)</p>
          
        )}
      </div>
    );
  };