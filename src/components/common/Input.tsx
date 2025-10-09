import { forwardRef, useId } from "react";
import type { Ref } from "react";
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  type?: string; // You can restrict this further to specific types if needed
  err?: { message: string };
}
// forwardRef is used to pass the reference of the data entered inside input tag
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { err, label, className = "", type = "text", ...props },
  ref: Ref<HTMLInputElement>
) {
  const id = useId();
  return (
    <div>
      {label && (
        <label
          className="inline-block mb-1 pl-1 font-light text-lg"
          htmlFor={id}
        >
          {label}
        </label>
      )}
      {
        <input
          type={type}
          className={`px-3 py-2 rounded-lg bg-inputBG text-black outline-none focus:bg-gray-50 duration-200 border border-gray-200 w-full ${className}`}
          ref={ref}
          {...props}
          id={id}
        />
      }
      {err?.message && err?.message.length > 0 && (
        <p className="text-red-500">{err.message}</p>
      )}
    </div>
  );
});

export default Input;
