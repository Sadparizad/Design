import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  /** primary: the black button (Save Changes). secondary: white with a border. */
  variant?: "primary" | "secondary";
}

export function Button({ variant = "primary", type = "button", children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={`${styles.button} ${styles[variant]}`} {...rest}>
      <span className={styles.text}>{children}</span>
    </button>
  );
}
