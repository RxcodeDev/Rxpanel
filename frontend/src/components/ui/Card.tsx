import { HTMLAttributes } from "react";

export default function Card({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-[var(--c-bg)] border border-[var(--c-border)] rounded-[1.25rem] ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
