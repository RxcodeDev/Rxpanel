"use client";

import React, { useRef, useState } from "react";
import type { JsonValue } from "@/types/api";
import { humanize, looksLikeImage, resolveAsset, fieldHint } from "@/lib/format";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Toggle from "@/components/ui/Toggle";
import ImageField from "./ImageField";

/* ── Helpers ────────────────────────────────────────────────── */

function isPlainObject(v: JsonValue): v is { [k: string]: JsonValue } {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

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

/** Primera cadena corta y legible de un item para mostrar como etiqueta. */
function itemPreviewLabel(item: JsonValue): string {
  if (typeof item === "string") return item.slice(0, 50);
  if (isPlainObject(item)) {
    for (const [k, v] of Object.entries(item)) {
      if (
        typeof v === "string" &&
        v.length > 0 &&
        v.length < 70 &&
        !v.startsWith("/") &&
        !v.startsWith("http") &&
        !looksLikeImage(k, v)
      ) {
        return v.slice(0, 50);
      }
    }
  }
  return "";
}

/** Primera URL de imagen encontrada en el objeto. */
function itemThumbnail(item: JsonValue): string | null {
  if (!isPlainObject(item)) return null;
  for (const [k, v] of Object.entries(item)) {
    if (typeof v === "string" && v.length > 0 && looksLikeImage(k, v)) return v;
  }
  return null;
}

/* ── Icono contextual por clave de campo ────────────────────── */

const FIELD_ICON_PATTERNS =
  /email|whatsapp(?!.*(message|msg|text|texto))|phone|telefono|href|\blink\b|address|ubicacion|location|tag|category|^title$|\btitle$|description|descripcion|canonical|robots|twitter|name$|keyword|author|copyright|brand|slogan|tagline/i;

/** Keys that should always render as a single-line Input regardless of value length. */
const INLINE_INPUT_KEYS = /^title$|\btitle$|canonical|robots|twitter|^name$|author|brand/i;

/** Keys that belong in the sidebar alongside images (secondary / technical metadata). */
const SIDEBAR_FIELD_KEYS = /canonical|robots|twitter/i;

/** Textarea fields that should share their row instead of spanning full width. */
const TEXTAREA_SHARE_ROW_KEYS = /description|descripcion|subtitle|excerpt|summary|resumen/i;

/** Keys that should always render as a Textarea (multi-line) regardless of value length. */
const FORCE_TEXTAREA_KEYS = /description|descripcion|excerpt|summary|resumen/i;

export function hasFieldIcon(key: string): boolean {
  return FIELD_ICON_PATTERNS.test(key);
}

export function shouldStayInline(key: string): boolean {
  return INLINE_INPUT_KEYS.test(key);
}

function FieldIcon({ fieldKey }: { fieldKey: string }) {
  const k = fieldKey.toLowerCase();

  const props = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (/email/.test(k))
    return (
      <svg {...props}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <path d="M22 6l-10 7L2 6" />
      </svg>
    );

  if (/whatsapp|phone|telefono/.test(k))
    return (
      <svg {...props}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-5.99-5.99 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 4h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 11a16 16 0 0 0 6.93 6.93l.75-.75a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 20.18z" />
      </svg>
    );

  if (/canonical/.test(k))
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    );

  if (/href|\blink\b/.test(k))
    return (
      <svg {...props}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );

  if (/address|ubicacion|location/.test(k))
    return (
      <svg {...props}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );

  if (/twitter/.test(k))
    return (
      <svg {...props}>
        <path d="M4 4l7.5 9L4 20h2l6-7 5.5 7H22l-8-10 7-10h-2l-5.5 7L8 4z" />
      </svg>
    );

  if (/robots/.test(k))
    return (
      <svg {...props}>
        <rect x="4" y="7" width="16" height="12" rx="2" />
        <path d="M12 7V3M9 3h6" />
        <circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" />
      </svg>
    );

  if (/keyword|tag|category/.test(k))
    return (
      <svg {...props}>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <path d="M7 7h.01" />
      </svg>
    );

  if (/description|descripcion|tagline|slogan/.test(k))
    return (
      <svg {...props}>
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="14" y2="18" />
      </svg>
    );

  if (/title|name|author|brand|copyright/.test(k))
    return (
      <svg {...props}>
        <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    );

  return null;
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
  const hint = fieldHint(fieldKey);

  if (typeof value === "boolean") {
    return (
      <div className="py-1">
        <Toggle checked={value} onChange={onChange} label={label} description={hint} />
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <Input
        label={label}
        hint={hint}
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

  // WhatsApp message values are stored URL-encoded (used raw in href). Decode for editing.
  const isWaMsg = /whatsapp.*(message|msg|text|texto|copy)/i.test(fieldKey);
  const displayStr = isWaMsg
    ? (() => { try { return decodeURIComponent(str); } catch { return str; } })()
    : str;
  const handleWaChange = (raw: string) => onChange(encodeURIComponent(raw));

  const stayInline = shouldStayInline(fieldKey);

  const fieldIcon = hasFieldIcon(fieldKey) ? <FieldIcon fieldKey={fieldKey} /> : undefined;
  const forceTextarea = FORCE_TEXTAREA_KEYS.test(fieldKey);

  if (!stayInline && (forceTextarea || displayStr.length > 80 || displayStr.includes("\n"))) {
    return (
      <Textarea
        label={label}
        labelIcon={fieldIcon}
        hint={hint}
        rows={3}
        value={displayStr}
        onChange={(e) => isWaMsg ? handleWaChange(e.target.value) : onChange(e.target.value)}
      />
    );
  }

  return (
    <Input
      label={label}
      labelIcon={fieldIcon}
      hint={hint}
      value={displayStr}
      onChange={(e) => isWaMsg ? handleWaChange(e.target.value) : onChange(e.target.value)}
    />
  );
}

/* ── Pill Array (simple string lists) ──────────────────────── */

const PILL_PALETTES: React.CSSProperties[] = [
  { background: "#EEF2FF", border: "1px solid #C7D2FE", color: "#4338CA" }, // indigo
  { background: "#ECFDF5", border: "1px solid #6EE7B7", color: "#059669" }, // emerald
  { background: "#FFF1F2", border: "1px solid #FECDD3", color: "#E11D48" }, // rose
  { background: "#FFFBEB", border: "1px solid #FDE68A", color: "#D97706" }, // amber
  { background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0284C7" }, // sky
  { background: "#FAF5FF", border: "1px solid #E9D5FF", color: "#7C3AED" }, // violet
  { background: "#F0FDFA", border: "1px solid #99F6E4", color: "#0D9488" }, // teal
  { background: "#FFF7ED", border: "1px solid #FED7AA", color: "#EA580C" }, // orange
];

function PillArrayEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: JsonValue[];
  onChange: (v: JsonValue) => void;
}) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function add() {
    const text = draft.trim();
    if (!text) return;
    onChange([...value, text]);
    setDraft("");
    inputRef.current?.focus();
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function openPopover() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }
  function closePopover() {
    setOpen(false);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[0.75rem] font-semibold text-[var(--c-text-sub)] tracking-[0.02em]">
          {label}{" "}
          <span className="text-[var(--c-muted)] font-normal">({value.length})</span>
        </span>

        {/* Add button + floating popover */}
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={openPopover}
            className="inline-flex items-center gap-1 text-[0.72rem] font-medium px-1.5 py-0.5 rounded text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] transition-colors cursor-pointer bg-transparent border-none"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Añadir
          </button>

          {open && (
            <>
              {/* backdrop */}
              <div className="fixed inset-0" onClick={closePopover} style={{ zIndex: 9998 }} />
              {/* popover */}
              <div
                className="absolute right-0 top-full mt-1.5 rounded-[0.75rem] p-3 flex gap-2"
                style={{ zIndex: 9999, background: "var(--c-bg)", border: "1px solid var(--c-border)", minWidth: 220, boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); add(); if (!draft.trim()) closePopover(); }
                    if (e.key === "Escape") closePopover();
                  }}
                  placeholder="Nueva etiqueta…"
                  className="flex-1 min-w-0 text-[0.8125rem] outline-none bg-transparent text-[var(--c-text)] placeholder:text-[var(--c-muted)]"
                />
                <button
                  type="button"
                  onClick={() => { add(); closePopover(); }}
                  disabled={!draft.trim()}
                  className="shrink-0 px-2.5 py-1 rounded-md text-[0.75rem] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "var(--c-active-pill)", color: "var(--c-text)" }}
                >
                  OK
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pill list */}
      {value.length === 0 ? (
        <p className="text-[0.8125rem] text-[var(--c-muted)] italic">Sin elementos</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[0.78rem] font-medium leading-none select-none"
              style={PILL_PALETTES[i % PILL_PALETTES.length]}
            >
              {String(item)}
              <button
                type="button"
                onClick={() => remove(i)}
                className="w-3 h-3 flex items-center justify-center rounded-full cursor-pointer opacity-40 hover:opacity-90 transition-opacity shrink-0"
                aria-label="Eliminar"
              >
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
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
  const isPrimitiveArray = value.length === 0 || value.every(
    (v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean"
  );
  if (isPrimitiveArray) {
    return <PillArrayEditor label={label} value={value} onChange={onChange} />;
  }

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
    <div className="flex flex-col gap-3">
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
        <p className="text-[0.8125rem] text-[var(--c-muted)] py-3 text-center border border-dashed border-[var(--c-border)] rounded-[0.75rem]">
          Lista vacía — pulsa «Añadir» para crear el primer elemento.
        </p>
      )}

      {/* Card grid — multiple cards per row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem", alignItems: "start" }}>
        {value.map((item, i) => {
          const complex = Array.isArray(item) || isPlainObject(item);
          const isCollapsed = collapsed[i];
          const preview = itemPreviewLabel(item);

          const itemObj = isPlainObject(item) ? item as { [k: string]: JsonValue } : null;
          const imageKeys = itemObj
            ? Object.keys(itemObj).filter(k => typeof itemObj[k] === "string" && looksLikeImage(k, itemObj[k] as string))
            : [];
          const otherKeys = itemObj ? Object.keys(itemObj).filter(k => !imageKeys.includes(k)) : [];
          const hasImages = imageKeys.length > 0;

          return (
            <div
              key={i}
              className="rounded-xl overflow-hidden flex flex-col"
              style={{ border: "1px solid var(--c-border)", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
            >
              {/* Card header */}
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ background: "var(--c-hover)", borderBottom: "1px solid var(--c-border)" }}
              >
                <span
                  className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-[0.65rem] font-bold tabular-nums"
                  style={{ background: "var(--c-active-pill)", color: "var(--c-muted)" }}
                >
                  {i + 1}
                </span>
                <span className="text-[0.8125rem] font-medium text-[var(--c-text)] truncate flex-1 min-w-0">
                  {preview || <span className="text-[var(--c-muted)] font-normal italic">Elemento {i + 1}</span>}
                </span>
                <div className="flex items-center gap-0.5 shrink-0">
                  {complex && (
                    <button
                      type="button"
                      onClick={() => setCollapsed((c) => ({ ...c, [i]: !c[i] }))}
                      className="w-6 h-6 flex items-center justify-center rounded text-[var(--c-muted)] hover:text-[var(--c-text)] cursor-pointer transition-all"
                      style={{ transform: isCollapsed ? "rotate(-90deg)" : "none" }}
                      aria-label={isCollapsed ? "Expandir" : "Plegar"}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                        <path d="M2 4l4 4 4-4" />
                      </svg>
                    </button>
                  )}
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                    className="w-6 h-6 flex items-center justify-center rounded text-[var(--c-muted)] hover:text-[var(--c-text)] disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    aria-label="Subir">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1}
                    className="w-6 h-6 flex items-center justify-center rounded text-[var(--c-muted)] hover:text-[var(--c-text)] disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    aria-label="Bajar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => remove(i)}
                    className="w-6 h-6 flex items-center justify-center rounded text-[var(--c-danger)] hover:bg-[var(--c-st-error-bg)] cursor-pointer transition-colors"
                    aria-label="Eliminar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Card body — single column: image(s) stacked on top, fields below */}
              {!isCollapsed && (
                itemObj && hasImages ? (
                  <div className="flex flex-col flex-1">
                    {/* Image area */}
                    <div className="flex flex-col" style={{ borderBottom: "1px solid var(--c-border)" }}>
                      {imageKeys.map(k => (
                        <ImageField
                          key={k}
                          label={humanize(k)}
                          value={itemObj[k] as string}
                          layout="card"
                          onChange={v => update(i, { ...itemObj, [k]: v })}
                        />
                      ))}
                    </div>
                    {/* Fields below */}
                    <div className="p-4 flex flex-col gap-3">
                      {otherKeys.map(k => (
                        <SchemaEditor
                          key={k}
                          fieldKey={k}
                          value={itemObj[k]}
                          onChange={v => update(i, { ...itemObj, [k]: v })}
                          depth={depth + 1}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <SchemaEditor
                      fieldKey={label}
                      label=""
                      value={item}
                      onChange={(v) => update(i, v)}
                      depth={depth + 1}
                    />
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
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

    /* Render a single child by key, applying the inline/full-width grid rules. */
    const renderChild = (k: string) => {
      const childVal = value[k];
      const inline = typeof childVal === "string" && shouldStayInline(k);
      const shareRow = TEXTAREA_SHARE_ROW_KEYS.test(k);
      const isFullWidth =
        Array.isArray(childVal) ||
        isPlainObject(childVal) ||
        (typeof childVal === "string" && looksLikeImage(k, childVal)) ||
        (!inline && !shareRow && typeof childVal === "string" && (childVal.length > 80 || childVal.includes("\n")));
      return (
        <div key={k} style={isFullWidth ? { gridColumn: "1 / -1" } : undefined}>
          <SchemaEditor
            fieldKey={k}
            value={childVal}
            onChange={(v) => onChange({ ...value, [k]: v })}
            depth={depth + 1}
          />
        </div>
      );
    };

    /* Depth-0 sidebar layout: image + secondary fields on the left, main content on the right. */
    if (depth === 0) {
      const imageKeys = keys.filter(
        (k) => typeof value[k] === "string" && looksLikeImage(k, value[k] as string)
      );
      const secondaryKeys = keys.filter(
        (k) =>
          !imageKeys.includes(k) &&
          SIDEBAR_FIELD_KEYS.test(k) &&
          (typeof value[k] === "string" || typeof value[k] === "number" || typeof value[k] === "boolean")
      );
      const mainKeys = keys.filter((k) => !imageKeys.includes(k) && !secondaryKeys.includes(k));

      if (imageKeys.length > 0 && mainKeys.length > 0) {
        return (
          <div className="flex flex-col gap-4">
            {/* Top: image sidebar + main content side by side */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)",
                gap: "1.25rem",
                alignItems: "start",
              }}
            >
              {/* Sidebar: image(s) */}
              <div className="flex flex-col gap-3">
                {imageKeys.map((k) => (
                  <SchemaEditor
                    key={k}
                    fieldKey={k}
                    value={value[k]}
                    onChange={(v) => onChange({ ...value, [k]: v })}
                    depth={depth + 1}
                  />
                ))}
              </div>

              {/* Main column (text fields, arrays, nested objects) — fixed 2-col so pairs stay together */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "1rem",
                  alignItems: "start",
                }}
              >
                {mainKeys.map(renderChild)}
              </div>
            </div>

            {/* Full-width "Avanzado" panel */}
            {secondaryKeys.length > 0 && (
              <div
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ border: "1px solid var(--c-border)", background: "var(--c-hover)" }}
              >
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
                  Avanzado
                </span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "1rem",
                    alignItems: "start",
                  }}
                >
                  {secondaryKeys.map((k) => (
                    <SchemaEditor
                      key={k}
                      fieldKey={k}
                      value={value[k]}
                      onChange={(v) => onChange({ ...value, [k]: v })}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: depth === 0
            ? "repeat(auto-fill, minmax(220px, 1fr))"
            : "repeat(auto-fill, minmax(180px, 1fr))",
          gap: depth > 0 ? "0.875rem" : "1rem",
          alignItems: "start",
        }}
      >
        {displayLabel && depth > 0 && (
          <span className="text-[0.8125rem] font-semibold text-[var(--c-text)]" style={{ gridColumn: "1 / -1" }}>
            {displayLabel}
          </span>
        )}
        {keys.map(renderChild)}
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
