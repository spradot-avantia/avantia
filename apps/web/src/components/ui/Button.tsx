import type { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        background: "var(--color-primary)",
        color: "#fff",
        border: "none",
        borderRadius: "var(--radius)",
        padding: "0.5rem 1rem",
        fontSize: "0.9rem",
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
        ...props.style,
      }}
    />
  );
}
