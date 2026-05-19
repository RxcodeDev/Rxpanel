"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { CONTENT_SECTIONS } from "@/lib/sections";
import type { JsonValue } from "@/types/api";
import Icon from "@/components/ui/Icon";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import SchemaEditor from "@/components/features/editor/SchemaEditor";

export default function ContentTab({ siteId }: { siteId: number }) {
  const toast = useToast();
  const [active, setActive] = useState(CONTENT_SECTIONS[0].key);
  const [data, setData] = useState<JsonValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>();
  const [raw, setRaw] = useState(false);
  const [rawText, setRawText] = useState("");

  const load = useCallback(
    async (section: string) => {
      setLoading(true);
      setErr(undefined);
      setData(null);
      try {
        const res = await apiGet<JsonValue>(`/proxy/${siteId}/content/${section}`);
        setData(res);
        setRawText(JSON.stringify(res, null, 2));
      } catch (e) {
        setErr(
          e instanceof ApiError
            ? `${e.status} — ${e.message}`
            : "No se pudo cargar la sección.",
        );
      } finally {
        setLoading(false);
      }
    },
    [siteId],
  );

  useEffect(() => {
    load(active);
  }, [active, load]);

  async function save() {
    let payload: JsonValue;
    if (raw) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        toast.error("El JSON no es válido.");
        return;
      }
    } else {
      payload = data as JsonValue;
    }
    setSaving(true);
    try {
      await apiPut(`/proxy/${siteId}/content/${active}`, payload);
      setData(payload);
      setRawText(JSON.stringify(payload, null, 2));
      toast.success("Sección guardada.");
    } catch (e) {
      toast.error(e instanceof ApiError ? `${e.status} — ${e.message}` : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-5 h-full">
      {/* Selector de sección */}
      <nav className="md:w-56 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
        {CONTENT_SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(s.key)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[0.625rem] text-sm font-medium whitespace-nowrap transition-colors text-left ${
              active === s.key
                ? "bg-[var(--c-active-pill)] text-[var(--c-text)]"
                : "text-[var(--c-text-sub)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text)]"
            }`}
          >
            <Icon paths={s.icon} size={16} />
            <span className="hidden sm:inline md:inline">{s.label}</span>
          </button>
        ))}
      </nav>

      {/* Editor */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--c-line)]">
          <div>
            <h3 className="font-semibold text-[var(--c-text)]">
              {CONTENT_SECTIONS.find((s) => s.key === active)?.label}
            </h3>
            <p className="text-[0.75rem] text-[var(--c-muted)]">
              {CONTENT_SECTIONS.find((s) => s.key === active)?.description}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (!raw && data !== null) setRawText(JSON.stringify(data, null, 2));
                setRaw((r) => !r);
              }}
              title={raw ? "Editor visual" : "Editar JSON"}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
              </svg>
            </button>
            <Button onClick={save} loading={saving} disabled={loading || !!err} className="!w-auto">
              Guardar
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pt-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size={26} />
            </div>
          ) : err ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-[var(--c-muted)]">
              <p className="text-sm text-[var(--c-danger)]">{err}</p>
              <button
                type="button"
                onClick={() => load(active)}
                className="text-[0.8125rem] underline cursor-pointer hover:text-[var(--c-text)]"
              >
                Reintentar
              </button>
            </div>
          ) : raw ? (
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              spellCheck={false}
              className="w-full h-full min-h-[24rem] font-mono text-[0.8125rem] p-3 border border-[var(--c-border)] rounded-[0.75rem] bg-[var(--c-bg)] text-[var(--c-text)] outline-none focus:border-[var(--c-text-sub)] resize-none"
            />
          ) : data !== null ? (
            <SchemaEditor value={data} onChange={setData} fieldKey={active} label="" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
