import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  /** Acción opcional a la derecha del campo (ej. mostrar/ocultar contraseña). */
  trailing?: ReactNode;
  labelIcon?: ReactNode;
  error?: string;
  hint?: string;
}

export default function Input({ label, icon, trailing, labelIcon, error, hint, id, className, ...props }: InputProps) {
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
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 flex items-center text-[var(--c-muted)] pointer-events-none [&_svg]:w-4 [&_svg]:h-4">
            {icon}
          </span>
        )}
        <input
          id={id}
          className={`
            w-full ${icon ? "pl-[2.375rem]" : "pl-3"} ${trailing ? "pr-[2.375rem]" : "pr-3"} py-[0.625rem]
            border rounded-[0.625rem] text-sm font-[inherit]
            text-[var(--c-text)] bg-[var(--c-bg)] outline-none
            transition-[border-color,box-shadow] duration-[0.25s]
            placeholder:text-[var(--c-muted)]
            focus:border-[var(--c-text-sub)] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]
            ${error ? "border-[var(--c-danger)]" : "border-[var(--c-border)]"}
            ${className ?? ""}
          `}
          {...props}
        />
        {trailing && (
          <span className="absolute right-1.5 flex items-center">{trailing}</span>
        )}
      </div>
      {hint && !error && (
        <p className="text-[0.6875rem] text-[var(--c-muted)]">{hint}</p>
      )}
      {error && <p className="text-[0.75rem] text-[var(--c-danger)] mt-0.5">{error}</p>}
    </div>
  );
}
