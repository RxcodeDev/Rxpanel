"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import type { ChangeLog } from "@/types/api";
import { formatDate } from "@/lib/format";
import { CONTENT_SECTIONS, sectionLabel } from "@/lib/sections";
import Spinner from "@/components/ui/Spinner";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";

// Claves de las secciones de contenido reales. Un cambio "update_content" sobre
// otra sección (p. ej. "assets" de subidas de archivos) no es contenido editable
// y no se puede restaurar con PUT /content/{section}.
const CONTENT_KEYS = new Set(CONTENT_SECTIONS.map((s) => s.key));

type Confirm =
  | { kind: "reset" }
  | { kind: "restore"; log: ChangeLog }
  | null;

export default function HistoryTab({ siteId }: { siteId: number }) {
  const toast = useToast();
  const [logs, setLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(undefined);
    try {
      setLogs(await apiGet<ChangeLog[]>(`/history/${siteId}?limit=100`));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  // Endpoint + cuerpo para restaurar una entrada, o null si no es restaurable
  // (las subidas de archivos y los borrados no se revierten como contenido).
  function restoreTarget(log: ChangeLog): { path: string; body: unknown } | null {
    if (log.change_type === "update_content" && CONTENT_KEYS.has(log.section))
      return { path: `/proxy/${siteId}/content/${log.section}`, body: log.payload_snapshot };
    if (log.change_type === "update_colors")
      return { path: `/proxy/${siteId}/colors`, body: log.payload_snapshot };
    if (log.change_type === "update_logos")
      return { path: `/proxy/${siteId}/logos`, body: log.payload_snapshot };
    return null;
  }

  // Restaura una sola sección al snapshot de una entrada del historial.
  async function doRestore(log: ChangeLog) {
    const target = restoreTarget(log);
    if (!target) return;
    setBusy(true);
    try {
      await apiPut(target.path, target.body);
      toast.success(`«${sectionLabel(log.section)}» restaurada.`);
      setConfirm(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? `${e.status} — ${e.message}` : "No se pudo restaurar.");
    } finally {
      setBusy(false);
    }
  }

  // Restablece todo el sitio: cada sección a su snapshot más antiguo del historial.
  async function doReset() {
    setBusy(true);
    try {
      // logs vienen del más nuevo al más viejo → el último visto de cada sección
      // es el más antiguo. Solo se consideran entradas restaurables.
      const oldest = new Map<string, ChangeLog>();
      for (const l of logs) {
        if (restoreTarget(l)) oldest.set(l.section, l);
      }
      for (const l of oldest.values()) {
        const target = restoreTarget(l)!;
        await apiPut(target.path, target.body);
      }
      toast.success(
        `Sitio restablecido (${oldest.size} ${oldest.size === 1 ? "sección" : "secciones"}).`,
      );
      setConfirm(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? `${e.status} — ${e.message}` : "No se pudo restablecer.");
    } finally {
      setBusy(false);
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
        <button type="button" onClick={load} className="text-[0.8125rem] underline cursor-pointer hover:text-[var(--c-text)]">
          Reintentar
        </button>
      </div>
    );

  if (logs.length === 0)
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-[var(--c-muted)]">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <p className="text-sm">Sin cambios registrados todavía.</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold text-[var(--c-text)] leading-tight">Historial de cambios</h3>
          <p className="text-[0.75rem] text-[var(--c-muted)] leading-tight">
            {logs.length} {logs.length === 1 ? "registro" : "registros"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirm({ kind: "reset" })}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--c-danger)] text-[0.8125rem] text-[var(--c-danger)] hover:bg-[var(--c-st-error-bg)] transition-colors cursor-pointer bg-transparent"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 2v6h6" />
            <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
          </svg>
          Restablecer al original
        </button>
      </div>

      {/* Lista — ocupa todo el ancho disponible */}
      <div className="flex flex-col gap-2">
        {logs.map((l) => {
          const open = expanded === l.id;
          const canRestore = restoreTarget(l) !== null;
          return (
            <div key={l.id} className="border border-[var(--c-border)] rounded-[0.875rem] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-[0.6875rem] font-semibold px-2 py-1 rounded-full bg-[var(--c-active-pill)] text-[var(--c-text-sub)] shrink-0">
                  {sectionLabel(l.section)}
                </span>
                <span className="text-[0.8125rem] text-[var(--c-text)] flex-1 min-w-0 truncate">
                  {l.change_type}
                </span>
                {/* Usuario — visible en escritorio */}
                <span className="hidden md:flex items-center gap-1.5 text-[0.75rem] text-[var(--c-muted)] shrink-0 max-w-[10rem] truncate">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {l.user?.username ?? "—"}
                </span>
                {/* Fecha — visible en escritorio */}
                <span className="hidden sm:block text-[0.75rem] text-[var(--c-muted)] shrink-0">
                  {formatDate(l.created_at)}
                </span>
                {/* Restaurar — solo si la entrada es restaurable */}
                {canRestore && (
                  <button
                    type="button"
                    onClick={() => setConfirm({ kind: "restore", log: l })}
                    title="Restaurar esta versión"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--c-border)] text-[0.75rem] text-[var(--c-text-sub)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent shrink-0"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 2v6h6" />
                      <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
                    </svg>
                    <span className="hidden lg:inline">Restaurar</span>
                  </button>
                )}
                {/* Ver detalle */}
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : l.id)}
                  title={open ? "Ocultar detalle" : "Ver detalle"}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--c-muted)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text)] transition-colors cursor-pointer shrink-0"
                >
                  <svg className="transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }}
                    width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor"
                    strokeWidth="1.75" aria-hidden="true">
                    <path d="M2 4l4 4 4-4" />
                  </svg>
                </button>
              </div>
              {open && (
                <pre className="px-4 py-3 border-t border-[var(--c-line)] bg-[var(--c-hover)] text-[0.75rem] font-mono text-[var(--c-text-sub)] overflow-x-auto">
                  {JSON.stringify(l.payload_snapshot, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={confirm?.kind === "reset"}
        title="¿Restablecer el sitio al contenido original?"
        message="Cada sección volverá a su versión más antigua registrada en el historial. El contenido actual se sobrescribirá."
        confirmLabel="Restablecer"
        loading={busy}
        onConfirm={doReset}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm?.kind === "restore"}
        title="¿Restaurar esta versión?"
        message={
          confirm?.kind === "restore"
            ? `La sección «${sectionLabel(confirm.log.section)}» volverá al estado del ${formatDate(confirm.log.created_at)}. Su contenido actual se sobrescribirá.`
            : ""
        }
        confirmLabel="Restaurar"
        loading={busy}
        onConfirm={() => confirm?.kind === "restore" && doRestore(confirm.log)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
