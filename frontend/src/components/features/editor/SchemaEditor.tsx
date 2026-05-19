"use client";

import { useState } from "react";
import type { JsonValue } from "@/types/api";
import { humanize, looksLikeImage } from "@/lib/format";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Toggle from "@/components/ui/Toggle";
import ImageField from "./ImageField";

/* ── Helpers ────────────────────────────────────────────────── */

function isPlainObject(v: JsonValue): v is { [k: string]: JsonValue } {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Plantilla vacía a partir de un elemento existente (para "añadir"). */
function emptyLike(sample: JsonValue): JsonValue {
  if (Array.isArray(sample)) return [];
  if (isPlainObject(sample)) {
    const out: { [k: string]: JsonValue } = {};
    for (const k of Object.keys(sample)) out[k] = emptyLike(sample[k]);
    return out;
  }
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  return "";
}

/* ── Primitivo ──────────────────────────────────────────────── */

function PrimitiveField({
  fieldKey,
  label,
  value,
  onChange,
}: {
  fieldKey: string;
  label: string;
  value: string | number | boolean | null;
  onChange: (v: JsonValue) => void;
}) {
  if (typeof value === "boolean") {
    return (
      <div className="py-1">
        <Toggle checked={value} onChange={onChange} label={label} />
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <Input
        label={label}
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      />
    );
  }

  const str = value ?? "";

  if (looksLikeImage(fieldKey, str)) {
    return <ImageField label={label} value={str} onChange={onChange} />;
  }

  if (str.length > 80 || str.includes("\n")) {
    return <Textarea label={label} value={str} onChange={(e) => onChange(e.target.value)} />;
  }

  return <Input label={label} value={str} onChange={(e) => onChange(e.target.value)} />;
}

/* ── Array ──────────────────────────────────────────────────── */

function ArrayEditor({
  label,
  value,
  onChange,
  depth,
}: {
  label: string;
  value: JsonValue[];
  onChange: (v: JsonValue) => void;
  depth: number;
}) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  function update(i: number, v: JsonValue) {
    const next = value.slice();
    next[i] = v;
    onChange(next);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function add() {
    const template = value.length ? emptyLike(value[value.length - 1]) : "";
    onChange([...value, template]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[0.75rem] font-semibold text-[var(--c-text-sub)] tracking-[0.02em]">
          {label}{" "}
          <span className="text-[var(--c-muted)] font-normal">({value.length})</span>
        </span>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-[0.75rem] font-medium px-2.5 py-1 rounded-md border border-[var(--c-border)] text-[var(--c-text-sub)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Añadir
        </button>
      </div>

      {value.length === 0 && (
        <p className="text-[0.8125rem] text-[var(--c-muted)] py-2">Lista vacía.</p>
      )}

      {value.map((item, i) => {
        const complex = Array.isArray(item) || isPlainObject(item);
        const isCollapsed = collapsed[i];
        return (
          <div
            key={i}
            className="border border-[var(--c-border)] rounded-[0.875rem] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--c-hover)]">
              {complex && (
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [i]: !c[i] }))}
                  className="text-[var(--c-muted)] hover:text-[var(--c-text)] cursor-pointer transition-transform"
                  style={{ transform: isCollapsed ? "rotate(-90deg)" : "none" }}
                  aria-label="Plegar"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
                    strokeWidth="1.75" aria-hidden="true">
                    <path d="M2 4l4 4 4-4" />
                  </svg>
                </button>
              )}
              <span className="text-[0.75rem] font-semibold text-[var(--c-text-sub)] flex-1">
                #{i + 1}
              </span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                className="w-6 h-6 flex items-center justify-center rounded text-[var(--c-muted)] hover:text-[var(--c-text)] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Subir">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1}
                className="w-6 h-6 flex items-center justify-center rounded text-[var(--c-muted)] hover:text-[var(--c-text)] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Bajar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <button type="button" onClick={() => remove(i)}
                className="w-6 h-6 flex items-center justify-center rounded text-[var(--c-danger)] hover:bg-[var(--c-st-error-bg)] cursor-pointer"
                aria-label="Eliminar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
              </button>
            </div>
            {!isCollapsed && (
              <div className="p-3">
                <SchemaEditor
                  fieldKey={label}
                  label=""
                  value={item}
                  onChange={(v) => update(i, v)}
                  depth={depth + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Componente recursivo ───────────────────────────────────── */

export default function SchemaEditor({
  value,
  onChange,
  fieldKey = "",
  label,
  depth = 0,
}: {
  value: JsonValue;
  onChange: (v: JsonValue) => void;
  fieldKey?: string;
  label?: string;
  depth?: number;
}) {
  const displayLabel = label ?? humanize(fieldKey);

  if (Array.isArray(value)) {
    return (
      <ArrayEditor label={displayLabel} value={value} onChange={onChange} depth={depth} />
    );
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    return (
      <div className={depth > 0 ? "flex flex-col gap-4" : "flex flex-col gap-5"}>
        {displayLabel && depth > 0 && (
          <span className="text-[0.8125rem] font-semibold text-[var(--c-text)]">
            {displayLabel}
          </span>
        )}
        {keys.map((k) => (
          <SchemaEditor
            key={k}
            fieldKey={k}
            value={value[k]}
            onChange={(v) => onChange({ ...value, [k]: v })}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  return (
    <PrimitiveField
      fieldKey={fieldKey}
      label={displayLabel}
      value={value}
      onChange={onChange}
    />
  );
}
