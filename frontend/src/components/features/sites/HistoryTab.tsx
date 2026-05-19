"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, ApiError } from "@/lib/api";
import type { ChangeLog } from "@/types/api";
import { formatDate } from "@/lib/format";
import { sectionLabel } from "@/lib/sections";
import Spinner from "@/components/ui/Spinner";

export default function HistoryTab({ siteId }: { siteId: number }) {
  const [logs, setLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();
  const [expanded, setExpanded] = useState<string | null>(null);

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
    <div className="flex flex-col gap-2 max-w-2xl">
      {logs.map((l) => {
        const open = expanded === l.id;
        return (
          <div key={l.id} className="border border-[var(--c-border)] rounded-[0.875rem] overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(open ? null : l.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--c-hover)] transition-colors cursor-pointer"
            >
              <span className="text-[0.6875rem] font-semibold px-2 py-1 rounded-full bg-[var(--c-active-pill)] text-[var(--c-text-sub)] shrink-0">
                {sectionLabel(l.section)}
              </span>
              <span className="text-[0.8125rem] text-[var(--c-text)] flex-1 truncate">
                {l.change_type}
              </span>
              <span className="text-[0.75rem] text-[var(--c-muted)] shrink-0 hidden sm:block">
                {formatDate(l.created_at)}
              </span>
              <svg className="shrink-0 text-[var(--c-muted)] transition-transform"
                style={{ transform: open ? "rotate(180deg)" : "none" }}
                width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor"
                strokeWidth="1.75" aria-hidden="true">
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>
            {open && (
              <pre className="px-4 py-3 border-t border-[var(--c-line)] bg-[var(--c-hover)] text-[0.75rem] font-mono text-[var(--c-text-sub)] overflow-x-auto">
                {JSON.stringify(l.payload_snapshot, null, 2)}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
