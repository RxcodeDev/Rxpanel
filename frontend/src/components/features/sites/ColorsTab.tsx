"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { SiteColors } from "@/types/api";
import Spinner from "@/components/ui/Spinner";
import { humanize } from "@/lib/format";

/* ── Helpers de color ──────────────────────────────────────────── */

function isHex(v: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());
}

/** hex → HSL (h en grados). */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
  }
  return { h: hue, s: s * 100, l: l * 100 };
}

/** Nombre de matiz aproximado en español. */
function hueName(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return "Personalizada";
  if (hsl.s < 12) return hsl.l < 25 ? "Neutra oscura" : hsl.l > 80 ? "Neutra clara" : "Neutra";
  const h = hsl.h;
  if (h < 15 || h >= 345) return "Roja";
  if (h < 45) return "Naranja";
  if (h < 70) return "Ámbar";
  if (h < 160) return "Verde";
  if (h < 200) return "Cian";
  if (h < 255) return "Azul";
  if (h < 290) return "Violeta";
  if (h < 345) return "Magenta";
  return "Personalizada";
}

/* ── Grupos (iconos Feather) ───────────────────────────────────── */

interface Group {
  id: string;
  label: string;
  icon: string[];
  test: (k: string) => boolean;
}

const GROUPS: Group[] = [
  {
    id: "brand",
    label: "Marca",
    icon: ["M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.8 5.7 21l2.3-7.2-6-4.4h7.6z"],
    test: (k) => k.startsWith("brand-") && !k.startsWith("brand-red"),
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: ["M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 1 1 21 11.5z"],
    test: (k) => k.startsWith("whatsapp"),
  },
  {
    id: "surface",
    label: "Superficies y texto",
    icon: ["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
    test: (k) => ["bg", "surface", "raised", "high", "text", "on-brand", "ink"].includes(k),
  },
  {
    id: "ui",
    label: "Interfaz / Transparencias",
    icon: ["M4 21v-7", "M4 10V3", "M12 21v-9", "M12 8V3", "M20 21v-5", "M20 12V3", "M1 14h6", "M9 8h6", "M17 16h6"],
    test: () => true, // resto
  },
];

function groupOf(key: string): string {
  return (GROUPS.find((g) => g.test(key)) ?? GROUPS[GROUPS.length - 1]).id;
}

/* ── Componente ────────────────────────────────────────────────── */

export default function ColorsTab({
  siteId,
  saveNonce,
  onSaveInfo,
}: {
  siteId: number;
  saveNonce: number;
  onSaveInfo: (info: { saving: boolean; dirty: boolean }) => void;
}) {
  const toast = useToast();
  const [colors, setColors] = useState<SiteColors>({});
  // JSON de la última versión cargada/guardada — para detectar cambios sin guardar.
  const [savedJson, setSavedJson] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>();
  const importRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(undefined);
    try {
      const res = await apiGet<SiteColors>(`/proxy/${siteId}/colors`);
      setColors(res);
      setSavedJson(JSON.stringify(res));
    } catch (e) {
      setErr(
        e instanceof ApiError
          ? `${e.status} — ${e.message}`
          : "No se pudieron cargar los colores.",
      );
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  // Guardado coordinado desde el header de la página.
  const saveRef = useRef<() => void>(() => {});
  const handledNonce = useRef(saveNonce);
  useEffect(() => {
    if (saveNonce !== handledNonce.current) {
      handledNonce.current = saveNonce;
      saveRef.current();
    }
  }, [saveNonce]);
  const dirty = !loading && !err && JSON.stringify(colors) !== savedJson;
  useEffect(() => {
    onSaveInfo({ saving, dirty });
  }, [saving, dirty, onSaveInfo]);

  const grouped = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const g of GROUPS) out[g.id] = [];
    for (const k of Object.keys(colors)) out[groupOf(k)].push(k);
    return out;
  }, [colors]);

  const primary = colors["brand-primary"] ?? "";
  const paletteName = primary ? hueName(primary) : "—";
  const heroSwatches = [
    "brand-primary",
    "brand-accent",
    "brand-light",
    "whatsapp",
    "bg",
    "text",
  ].filter((k) => colors[k]);

  async function save() {
    setSaving(true);
    try {
      await apiPut(`/proxy/${siteId}/colors`, colors);
      setSavedJson(JSON.stringify(colors));
      toast.success("Colores guardados.");
    } catch (e) {
      toast.error(
        e instanceof ApiError ? `${e.status} — ${e.message}` : "No se pudo guardar.",
      );
    } finally {
      setSaving(false);
    }
  }
  saveRef.current = save;

  function exportPalette() {
    const blob = new Blob([JSON.stringify(colors, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paleta-sitio-${siteId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Paleta exportada.");
  }

  async function restoreDefaults() {
    try {
      const base = await apiGet<SiteColors>(`/proxy/${siteId}/colors/defaults`);
      setColors((c) => ({ ...c, ...base }));
      toast.success("Tema base cargado — pulsa Guardar para aplicarlo.");
    } catch (e) {
      toast.error(
        e instanceof ApiError ? `${e.status} — ${e.message}` : "No se pudo cargar el tema base.",
      );
    }
  }

  function triggerImport() {
    importRef.current?.click();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (importRef.current) importRef.current.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error();
      }
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string") clean[k] = v;
      }
      if (Object.keys(clean).length === 0) throw new Error();
      setColors((c) => ({ ...c, ...clean }));
      toast.success(`Paleta importada (${Object.keys(clean).length} tokens).`);
    } catch {
      toast.error("Archivo de paleta inválido (se espera JSON {token: color}).");
    }
  }

  if (loading)
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size={26} />
      </div>
    );

  if (err)
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-[var(--c-muted)]">
        <p className="text-sm text-[var(--c-danger)]">{err}</p>
        <button
          type="button"
          onClick={load}
          className="text-[0.8125rem] underline cursor-pointer hover:text-[var(--c-text)]"
        >
          Reintentar
        </button>
      </div>
    );

  return (
    <div className="w-full flex flex-col gap-6 pb-4">
      {/* Cabecera: paleta detectada + acciones */}
      <div className="rounded-[1rem] border border-[var(--c-border)] p-5 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className="w-11 h-11 rounded-xl shrink-0 border border-[var(--c-border)]"
            style={{ background: primary || "var(--c-hover)" }}
          />
          <div className="min-w-0">
            <p className="text-[0.6875rem] font-semibold tracking-wide text-[var(--c-muted)] uppercase">
              Paleta detectada
            </p>
            <p className="text-base font-bold text-[var(--c-text)] truncate">
              {paletteName}
              <span className="ml-2 text-[0.75rem] font-normal text-[var(--c-muted)] font-mono">
                {primary || "sin primario"}
              </span>
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              {heroSwatches.map((k) => (
                <span
                  key={k}
                  title={`${humanize(k)} · ${colors[k]}`}
                  className="w-5 h-5 rounded-md border border-[var(--c-border)]"
                  style={{ background: colors[k] }}
                />
              ))}
              <span className="ml-2 text-[0.75rem] text-[var(--c-muted)]">
                {Object.keys(colors).length} tokens
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={restoreDefaults}
            title="Cargar la paleta base del sitio"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--c-border)] text-[0.8125rem] text-[var(--c-text-sub)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 2v6h6" />
              <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
            </svg>
            Tema base
          </button>
          <button
            type="button"
            onClick={triggerImport}
            title="Importar paleta (.json)"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--c-border)] text-[0.8125rem] text-[var(--c-text-sub)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Importar
          </button>
          <button
            type="button"
            onClick={exportPalette}
            title="Exportar paleta (.json)"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--c-border)] text-[0.8125rem] text-[var(--c-text-sub)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5-5 5 5M12 5v12" />
            </svg>
            Exportar
          </button>
        </div>
      </div>

      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImport}
      />

      {/* Grupos */}
      {GROUPS.filter((g) => grouped[g.id]?.length).map((g) => (
        <section key={g.id} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[var(--c-active-pill)] flex items-center justify-center text-[var(--c-text-sub)]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {g.icon.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </svg>
            </span>
            <h3 className="text-sm font-semibold text-[var(--c-text)]">{g.label}</h3>
            <span className="text-[0.75rem] text-[var(--c-muted)]">
              ({grouped[g.id].length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-5 gap-y-3 rounded-[1rem] border border-[var(--c-border)] p-4">
            {grouped[g.id].map((k) => {
              const val = colors[k] ?? "";
              const hex = isHex(val);
              return (
                <div key={k} className="flex flex-col gap-[0.3125rem]">
                  <label className="text-[0.75rem] font-semibold text-[var(--c-text-sub)] tracking-[0.02em]">
                    {humanize(k)}
                  </label>
                  <div className="flex items-center gap-2">
                    <label
                      className="relative w-9 h-9 rounded-lg border border-[var(--c-border)] shrink-0 overflow-hidden cursor-pointer"
                      title={hex ? "Elegir color" : "Valor no-hex: edítalo como texto"}
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
                        backgroundSize: "8px 8px",
                        backgroundPosition: "0 0,0 4px,4px -4px,-4px 0",
                      }}
                    >
                      <span
                        className="absolute inset-0"
                        style={{ background: val || "transparent" }}
                      />
                      {hex && (
                        <input
                          type="color"
                          value={val}
                          onChange={(e) =>
                            setColors((c) => ({ ...c, [k]: e.target.value }))
                          }
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      )}
                    </label>
                    <input
                      value={val}
                      onChange={(e) => setColors((c) => ({ ...c, [k]: e.target.value }))}
                      placeholder="#000000 / rgba()"
                      spellCheck={false}
                      className="flex-1 min-w-0 px-3 py-[0.5rem] border border-[var(--c-border)] rounded-[0.625rem] text-sm font-mono text-[var(--c-text)] bg-[var(--c-bg)] outline-none focus:border-[var(--c-text-sub)] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
