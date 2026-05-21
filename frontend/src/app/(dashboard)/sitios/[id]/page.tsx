"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";
import type { Site } from "@/types/api";
import Spinner from "@/components/ui/Spinner";
import StatusBadge from "@/components/features/sites/StatusBadge";
import SiteFormModal from "@/components/features/sites/SiteFormModal";
import { SiteIdProvider } from "@/store/SiteContext";
import ContentTab from "@/components/features/sites/ContentTab";
import ColorsTab from "@/components/features/sites/ColorsTab";
import LogosTab from "@/components/features/sites/LogosTab";
import HistoryTab from "@/components/features/sites/HistoryTab";
import { SiteIcon } from "@/lib/siteIcons";

const TABS = ["contenido", "colores", "logos", "historial"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  contenido: "Contenido",
  colores: "Colores",
  logos: "Logos",
  historial: "Historial",
};

export default function SiteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const siteId = Number(params.id);

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();
  const [tab, setTab] = useState<Tab>("contenido");
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(undefined);
    try {
      setSite(await apiGet<Site>(`/sites/${siteId}`));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "No se pudo cargar el sitio.");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <div className="h-dvh flex items-center justify-center">
        <Spinner size={28} />
      </div>
    );

  if (err || !site)
    return (
      <div className="h-dvh flex flex-col items-center justify-center gap-3 text-center text-[var(--c-muted)]">
        <p className="text-sm text-[var(--c-danger)]">{err ?? "Sitio no encontrado."}</p>
        <Link href="/sitios" className="text-[0.8125rem] underline hover:text-[var(--c-text)]">
          Volver a sitios
        </Link>
      </div>
    );

  return (
    <div className="flex flex-col h-dvh">
      <header className="flex-shrink-0 px-5 md:px-8 pt-6 pb-3 border-b border-[var(--c-line)]">
        <button
          type="button"
          onClick={() => router.push("/sitios")}
          className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors cursor-pointer mb-3"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Sitios
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              {site.icon && (
                <span
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                  style={{
                    background: "var(--c-bg)",
                    border: "1px solid var(--c-border)",
                  }}
                >
                  <SiteIcon iconKey={site.icon} color={site.icon_color} size={20} />
                </span>
              )}
              <h1 className="text-xl font-bold text-[var(--c-text)] truncate">{site.name}</h1>
              <StatusBadge status={site.status} />
            </div>
            <a
              href={site.url}
              target="_blank"
              rel="noreferrer"
              className="text-[0.8125rem] text-[var(--c-muted)] hover:text-[var(--c-text-sub)] transition-colors break-all"
            >
              {site.url}
            </a>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--c-border)] text-[0.8125rem] text-[var(--c-text-sub)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
            </svg>
            Ajustes
          </button>
        </div>

        <nav className="flex gap-1 mt-4 -mb-3">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`relative px-3 py-2 text-[0.8125rem] font-medium transition-colors cursor-pointer ${
                tab === t
                  ? "text-[var(--c-text)]"
                  : "text-[var(--c-muted)] hover:text-[var(--c-text-sub)]"
              }`}
            >
              {TAB_LABEL[t]}
              {tab === t && (
                <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-[var(--c-text)] rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-8 py-6">
        <SiteIdProvider siteId={siteId}>
          {tab === "contenido" && <ContentTab siteId={siteId} siteUrl={site.url} />}
          {tab === "colores" && <ColorsTab siteId={siteId} />}
          {tab === "logos" && <LogosTab siteId={siteId} />}
          {tab === "historial" && <HistoryTab siteId={siteId} />}
        </SiteIdProvider>
      </div>

      <SiteFormModal
        open={editOpen}
        site={site}
        onClose={() => setEditOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
