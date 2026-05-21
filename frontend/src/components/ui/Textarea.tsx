import { TextareaHTMLAttributes, ReactNode } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelIcon?: ReactNode;
  error?: string;
  hint?: string;
}

export default function Textarea({ label, labelIcon, error, hint, id, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-[0.375rem]">
      {label && (
        <label
          htmlFor={id}
          className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-[var(--c-text-sub)] tracking-[0.02em]"
        >
          {labelIcon && (
            <span className="inline-flex items-center text-[var(--c-muted)] [&_svg]:w-3.5 [&_svg]:h-3.5">
              {labelIcon}
            </span>
          )}
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={props.rows ?? 3}
        className={`
          w-full px-3 py-[0.625rem] border rounded-[0.625rem] text-sm font-[inherit] leading-relaxed
          text-[var(--c-text)] bg-[var(--c-bg)] outline-none resize-y
          transition-[border-color,box-shadow] duration-[0.25s]
          placeholder:text-[var(--c-muted)]
          focus:border-[var(--c-text-sub)] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]
          ${error ? "border-[var(--c-danger)]" : "border-[var(--c-border)]"}
          ${className ?? ""}
        `}
        {...props}
      />
      {hint && !error && <p className="text-[0.6875rem] text-[var(--c-muted)]">{hint}</p>}
      {error && <p className="text-[0.75rem] text-[var(--c-danger)] mt-0.5">{error}</p>}
    </div>
  );
}
