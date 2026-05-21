"use client";

import { useEffect, useRef, useState } from "react";
import { apiUpload, apiGetBlob, ApiError } from "@/lib/api";
import { useSiteId } from "@/store/SiteContext";
import { useToast } from "@/components/ui/Toast";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  layout?: "default" | "card";
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp", "image/gif"];
const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");

function isAbsolute(v: string) {
  return /^(https?:|data:)/i.test(v);
}
function checkDragValid(e: React.DragEvent): boolean {
  const items = Array.from(e.dataTransfer.items);
  if (!items.length) return true;
  return items.some((i) => i.kind === "file" && ACCEPTED_TYPES.includes(i.type));
}

/* Icons (small, consistent stroke 1.75) */
const IconUpload = (p: { size?: number }) => (
  <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const IconLink = (p: { size?: number }) => (
  <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const IconTrash = (p: { size?: number }) => (
  <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IconSwap = (p: { size?: number }) => (
  <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" /><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
  </svg>
);

export default function ImageField({ label, value, onChange, layout = "default" }: Props) {
  const siteId = useSiteId();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCount = useRef(0);

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [drag, setDrag] = useState<"idle" | "valid" | "invalid">("idle");
  const [urlMode, setUrlMode] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  /* ── Resolve preview ── */
  useEffect(() => {
    let objectUrl: string | null = null;
    let stale = false;
    if (!value) {
      setPreview("");
    } else if (isAbsolute(value)) {
      setPreview(value);
    } else {
      apiGetBlob(`/proxy/${siteId}/asset?path=${encodeURIComponent(value)}`)
        .then((blob) => {
          if (stale) return;
          if (!blob.type.startsWith("image/")) { setPreview(""); return; }
          objectUrl = URL.createObjectURL(blob);
          setPreview(objectUrl);
        })
        .catch(() => { if (!stale) setPreview(""); });
    }
    return () => {
      stale = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [value, siteId]);

  /* ── Upload ── */
  async function processFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato no admitido. Usa PNG, JPG, WebP, SVG o GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo supera los 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const res = await apiUpload(siteId, file);
      onChange(res.path);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo subir.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }

  function applyUrl() {
    const url = urlDraft.trim();
    if (url) { onChange(url); setUrlMode(false); setUrlDraft(""); }
  }

  /* ── Drag ── */
  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCount.current++;
    setDrag(checkDragValid(e) ? "valid" : "invalid");
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCount.current = Math.max(0, dragCount.current - 1);
    if (dragCount.current === 0) setDrag("idle");
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCount.current = 0;
    setDrag("idle");
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  }

  /* ── Container styles driven by drag state ── */
  const hasImageEarly = !!preview;
  const emptyBorderStyle = hasImageEarly ? "solid" : "dashed";
  const accentBorder =
    drag === "valid"   ? `1.5px solid #22c55e` :
    drag === "invalid" ? `1.5px solid #ef4444` :
    `1px ${emptyBorderStyle} var(--c-border)`;
  const accentShadow =
    drag === "valid"   ? "0 0 0 3px rgba(34,197,94,0.18), 0 1px 2px rgba(0,0,0,0.04)" :
    drag === "invalid" ? "0 0 0 3px rgba(239,68,68,0.18), 0 1px 2px rgba(0,0,0,0.04)" :
    "0 1px 2px rgba(0,0,0,0.04)";

  /* ════════════════════════════════════════════════════
     CARD LAYOUT — compact, for use inside array item cards
  ════════════════════════════════════════════════════ */
  if (layout === "card") {
    return (
      <div className="flex flex-col h-full" style={{ borderRadius: "inherit" }}>
        <div
          className="relative flex-1 overflow-hidden group"
          style={{
            minHeight: 160,
            background: preview ? "transparent" : "var(--c-bg)",
            cursor: "pointer",
          }}
          onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          {preview && (
            <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }} />
          )}
          {drag !== "idle" && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: drag === "valid" ? "rgba(34,197,94,0.55)" : "rgba(239,68,68,0.55)", backdropFilter: "blur(2px)" }}>
              <span className="text-white text-xs font-semibold">
                {drag === "valid" ? "Suelta aquí" : "Formato inválido"}
              </span>
            </div>
          )}
          {!preview && drag === "idle" && !uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "var(--c-hover)", color: "var(--c-text-sub)" }}>
                <IconUpload size={16} />
              </div>
              <span className="text-[0.72rem] text-[var(--c-muted)]">Arrastra o haz clic</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.75)" }}>
              <span className="w-6 h-6 rounded-full border-2 border-[var(--c-accent)] border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        <div className="px-3 py-2 flex items-center justify-between gap-2" style={{ borderTop: "1px solid var(--c-border)" }}>
          <span className="text-[0.72rem] font-semibold text-[var(--c-text-sub)] tracking-[0.02em] truncate">{label}</span>
          {value && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(""); }} title="Quitar"
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded cursor-pointer text-[var(--c-muted)] hover:text-[var(--c-danger)] transition-colors bg-transparent border-none">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <input ref={fileRef} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={handleFileInput} />
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     DEFAULT LAYOUT — modern self-contained card
  ════════════════════════════════════════════════════ */
  const hasImage = !!preview;

  return (
    <div className="flex flex-col gap-[0.375rem]">
      {/* Label outside the card, matches Input.tsx style */}
      <label className="text-[0.75rem] font-semibold text-[var(--c-text-sub)] tracking-[0.02em]">
        {label}
      </label>

      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: "100%",
          maxWidth: 360,
          borderRadius: "0.75rem",
          border: accentBorder,
          boxShadow: accentShadow,
          background: "var(--c-bg)",
          transition: "border-color .15s, box-shadow .15s",
        }}
      >
        {/* ── Header (only when image loaded) ── */}
        {hasImage && (
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-hover)" }}
          >
            <span
              className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", color: "var(--c-text-sub)" }}
            >
              {isAbsolute(value) ? <IconLink size={12} /> : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </span>
            <span className="flex-1 min-w-0 text-[0.75rem] font-medium text-[var(--c-text)] truncate" title={value}>
              {(() => {
                const seg = value.split("/").pop() || value;
                try { return decodeURIComponent(seg); } catch { return seg; }
              })()}
            </span>
            <span
              className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", color: "var(--c-text-sub)" }}
            >
              {isAbsolute(value) ? "URL" : "Archivo"}
            </span>
          </div>
        )}

        {/* ── Media area ── */}
        <div
          className="relative overflow-hidden"
          style={{
            height: 180,
            background: hasImage
              ? "transparent"
              : "linear-gradient(180deg, var(--c-bg) 0%, var(--c-hover) 100%)",
            cursor: urlMode || hasImage ? "default" : "pointer",
          }}
          onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => { if (!urlMode && !uploading && !hasImage) fileRef.current?.click(); }}
        >
          {/* Preview */}
          {hasImage && (
            <img src={preview} alt="" className="absolute inset-0 w-full h-full object-contain"
              style={{ background: "var(--c-hover)" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }} />
          )}

          {/* Drag overlay (priority over preview) */}
          {drag !== "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ background: drag === "valid" ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)", backdropFilter: "blur(1px)" }}>
              {drag === "valid" ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" opacity=".25" /><path d="M8 12l3 3 5-5" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" opacity=".25" /><path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              )}
              <span className="text-sm font-semibold" style={{ color: drag === "valid" ? "#16a34a" : "#dc2626" }}>
                {drag === "valid" ? "Suelta para subir" : "Formato no válido"}
              </span>
            </div>
          )}

          {/* URL mode (panel inside the media area) */}
          {urlMode && drag === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center px-4"
              style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)" }}>
              <div className="w-full max-w-[300px] flex flex-col gap-2">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[var(--c-muted)] pointer-events-none">
                    <IconLink />
                  </span>
                  <input
                    autoFocus
                    type="url"
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); applyUrl(); }
                      if (e.key === "Escape") { setUrlMode(false); setUrlDraft(""); }
                    }}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3 py-2 rounded-[0.625rem] text-sm bg-[var(--c-bg)] text-[var(--c-text)] outline-none border transition-[border-color,box-shadow] focus:border-[var(--c-text-sub)] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                    style={{ borderColor: "var(--c-border)" }}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => { setUrlMode(false); setUrlDraft(""); }}
                    className="px-3 py-1.5 rounded-[0.5rem] text-[0.75rem] font-medium text-[var(--c-text-sub)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] transition-colors cursor-pointer bg-transparent border-none">
                    Cancelar
                  </button>
                  <button type="button" onClick={applyUrl} disabled={!urlDraft.trim()}
                    className="px-3 py-1.5 rounded-[0.5rem] text-[0.75rem] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-white"
                    style={{ background: "var(--c-accent)" }}>
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasImage && !urlMode && drag === "idle" && !uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-4 text-center">
              <div className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: "var(--c-bg)", border: "1px dashed var(--c-border)", color: "var(--c-text-sub)" }}>
                <IconUpload size={18} />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[0.8125rem] font-semibold text-[var(--c-text)]">Arrastra una imagen</span>
                <span className="text-[0.72rem] text-[var(--c-muted)]">o haz clic para examinar</span>
              </div>
              <span className="text-[0.65rem] text-[var(--c-muted)] tracking-wide">PNG · JPG · WebP · SVG · GIF · 5 MB máx</span>
            </div>
          )}

          {/* Uploading */}
          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(2px)" }}>
              <span className="w-7 h-7 rounded-full border-[2.5px] animate-spin"
                style={{ borderColor: "var(--c-accent)", borderTopColor: "transparent" }} />
              <span className="text-[0.8125rem] text-[var(--c-text-sub)] font-medium">Subiendo…</span>
            </div>
          )}
        </div>

        {/* ── Action toolbar (always visible) ── */}
        <div
          className="flex items-center gap-1 px-2 py-1.5"
          style={{ borderTop: "1px solid var(--c-border)" }}
        >
          {hasImage ? (
            <>
              <ToolbarButton
                onClick={() => fileRef.current?.click()}
                icon={<IconSwap />}
                label="Cambiar"
              />
              <ToolbarButton
                onClick={() => { setUrlDraft(isAbsolute(value) ? value : ""); setUrlMode(true); }}
                icon={<IconLink />}
                label="URL"
              />
              <div className="flex-1" />
              <ToolbarButton
                onClick={() => onChange("")}
                icon={<IconTrash />}
                label="Quitar"
                danger
              />
            </>
          ) : !urlMode ? (
            <>
              <ToolbarButton
                onClick={() => fileRef.current?.click()}
                icon={<IconUpload />}
                label="Subir archivo"
                primary
              />
              <div className="flex-1" />
              <ToolbarButton
                onClick={() => setUrlMode(true)}
                icon={<IconLink />}
                label="Insertar URL"
              />
            </>
          ) : (
            <span className="text-[0.7rem] text-[var(--c-muted)] px-2 py-1">
              Escribe la URL y pulsa Enter
            </span>
          )}
        </div>

        <input ref={fileRef} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={handleFileInput} />
      </div>
    </div>
  );
}

/* Reusable inline toolbar button */
function ToolbarButton({
  onClick, icon, label, primary, danger,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  danger?: boolean;
}) {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[0.5rem] text-[0.72rem] font-medium transition-all cursor-pointer bg-transparent border-none";
  const palette = primary
    ? { color: "#fff", background: "var(--c-accent)" }
    : danger
    ? { color: "var(--c-muted)" }
    : { color: "var(--c-text-sub)" };

  const hoverClass = primary
    ? "hover:brightness-110"
    : danger
    ? "hover:text-[var(--c-danger)] hover:bg-[var(--c-hover)]"
    : "hover:text-[var(--c-text)] hover:bg-[var(--c-hover)]";

  return (
    <button type="button" onClick={onClick} className={`${base} ${hoverClass}`} style={palette}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
