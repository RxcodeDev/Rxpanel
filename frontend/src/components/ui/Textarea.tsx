import { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({ label, error, id, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-[0.375rem]">
      {label && (
        <label
          htmlFor={id}
          className="text-[0.75rem] font-semibold text-[var(--c-text-sub)] tracking-[0.02em]"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`
          w-full px-3 py-[0.625rem] border rounded-[0.625rem] text-sm font-[inherit]
          text-[var(--c-text)] bg-[var(--c-bg)] outline-none resize-y min-h-[5rem]
          transition-[border-color,box-shadow] duration-[0.25s]
          placeholder:text-[var(--c-muted)]
          focus:border-[var(--c-text-sub)] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]
          ${error ? "border-[var(--c-danger)]" : "border-[var(--c-border)]"}
          ${className ?? ""}
        `}
        {...props}
      />
      {error && <p className="text-[0.75rem] text-[var(--c-danger)] mt-0.5">{error}</p>}
    </div>
  );
}
