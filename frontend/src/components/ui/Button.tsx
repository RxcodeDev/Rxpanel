"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
  block?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  loading,
  block = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 cursor-pointer font-semibold text-sm " +
    "rounded-[0.625rem] px-4 py-[0.6875rem] border font-[inherit] " +
    "transition-[opacity,border-color,color,background-color] duration-[0.25s] " +
    "disabled:opacity-50 disabled:cursor-not-allowed " +
    (block ? "w-full " : "");

  const variants: Record<string, string> = {
    primary:
      "border-transparent bg-[var(--c-text)] text-[var(--c-bg)] hover:opacity-85 active:opacity-75",
    ghost:
      "bg-transparent text-[var(--c-text-sub)] border-[var(--c-border)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)]",
    danger:
      "bg-transparent text-[var(--c-danger)] border-[var(--c-danger)] hover:bg-[var(--c-danger)] hover:text-white",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className ?? ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
