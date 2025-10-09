import type { ReactElement } from "react";

export interface ButtonProps {
  type?: string;
  children?: ReactElement;
  className?: string;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
