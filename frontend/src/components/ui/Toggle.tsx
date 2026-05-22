"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  /** Versión más pequeña y discreta, para usar dentro de formularios densos. */
  compact?: boolean;
}

export default function Toggle({ checked, onChange, label, description, disabled, compact }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-center ${compact ? "gap-2" : "gap-3"} w-full text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group`}
    >
      <span
        className={`relative ${compact ? "w-7 h-4" : "w-9 h-5"} rounded-full shrink-0 transition-colors duration-[0.25s]`}
        style={{ background: checked ? "var(--c-text)" : "var(--c-border)" }}
      >
        <span
          className={`absolute top-0.5 left-0.5 ${compact ? "w-3 h-3" : "w-4 h-4"} rounded-full bg-[var(--c-bg)] transition-transform duration-[0.25s]`}
          style={{ transform: checked ? (compact ? "translateX(0.75rem)" : "translateX(1rem)") : "translateX(0)" }}
        />
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && (
            <span className={`${compact ? "text-[0.78rem]" : "text-sm"} font-medium text-[var(--c-text)]`}>{label}</span>
          )}
          {description && (
            <span className="text-[0.7rem] text-[var(--c-muted)]">{description}</span>
          )}
        </span>
      )}
    </button>
  );
}
