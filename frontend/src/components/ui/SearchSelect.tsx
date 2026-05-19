"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface Props {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  className?: string;
}

export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Selecciona...",
  label,
  searchable = true,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        wrapRef.current && !wrapRef.current.contains(t) &&
        !(dropRef.current && dropRef.current.contains(t))
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen((o) => !o);
  }

  return (
    <div ref={wrapRef} className={`flex flex-col gap-[0.375rem] ${className}`}>
      {label && (
        <span className="text-[0.75rem] font-semibold text-[var(--c-text-sub)] tracking-[0.02em]">
          {label}
        </span>
      )}
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`w-full flex items-center gap-2 px-3 py-[0.55rem] border rounded-[0.625rem] text-sm font-[inherit] bg-[var(--c-bg)] cursor-pointer transition-[border-color,box-shadow] duration-[0.25s] hover:border-[var(--c-text-sub)] ${
          open
            ? "border-[var(--c-text-sub)] shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
            : "border-[var(--c-border)]"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
        <span
          className={`flex-1 text-left truncate ${
            selected ? "text-[var(--c-text)] font-medium" : "text-[var(--c-muted)]"
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className="shrink-0 transition-transform text-[var(--c-muted)]"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
          width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
          strokeWidth="1.5" aria-hidden="true"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && pos && (
        <div
          ref={dropRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, minWidth: pos.width, zIndex: 9999 }}
          className="bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden"
          role="listbox"
        >
          {searchable && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--c-line)]">
              <svg className="shrink-0 text-[var(--c-muted)]" width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="flex-1 text-sm font-[inherit] text-[var(--c-text)] bg-transparent outline-none placeholder:text-[var(--c-muted)]"
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-[var(--c-muted)]">Sin resultados</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-[var(--c-hover)] transition-colors ${
                    o.value === value ? "bg-[var(--c-active-pill)]" : ""
                  }`}
                  role="option"
                  aria-selected={o.value === value}
                >
                  {o.icon && <span className="shrink-0">{o.icon}</span>}
                  <span className="text-[var(--c-text)] font-medium truncate">{o.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
