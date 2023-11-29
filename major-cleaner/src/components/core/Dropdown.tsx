import { useState } from "react";

export const Dropdown = (props: {
  onChange: (val: string) => void;
  initialValue: string;
}): React.ReactNode => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(props.initialValue);

  const exitEditing = () => {
    setEditing(false);
    props.onChange(value);
  };

  const enterEditing = () => {
    setEditing(true);
  };
  return (
    <div onClick={enterEditing}>
      {editing ? (
        <select
          name="dropdown"
          autoFocus
          defaultValue={props.initialValue}
          className="dark:bg-slate-700 font-bold"
          onChange={(e) => {
            setValue(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              exitEditing();
            }
          }}
          onBlur={exitEditing}
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
          <option value="XOR">XOR</option>
        </select>
      ) : props.initialValue ? (
        <p className="font-bold">{props.initialValue}</p>
      ) : (
        <p className="text-gray-400">(none)</p>
      )}
    </div>
  );
};
