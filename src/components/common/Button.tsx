import type { ButtonProps } from "../../interfaces/IButton.ts";

export default function Button(props: ButtonProps) {
  return (
    <button
      disabled={props.disabled}
      onClick={props.onClick}
      className={`${props.className} hover:bg-darker transition duration-200 `}
    >
      {props.children}
    </button>
  );
}
