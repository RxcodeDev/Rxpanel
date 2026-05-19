"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet, apiDelete, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Site } from "@/types/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import StatusBadge from "@/components/features/sites/StatusBadge";
import SiteFormModal from "@/components/features/sites/SiteFormModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function SitesPage() {
  const toast = useToast();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [toDelete, setToDelete] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSites(await apiGet<Site[]>("/sites/"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No se pudieron cargar los sitios.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter(
      (s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q),
    );
  }, [sites, query]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiDelete(`/sites/${toDelete.id}`);
      toast.success("Sitio eliminado.");
      setToDelete(null);
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 px-5 md:px-8 pt-6 pb-4 flex flex-col gap-4 border-b border-[var(--c-line)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--c-text)]">Sitios</h1>
            <p className="text-sm text-[var(--c-text-sub)] mt-0.5">
              Administra el contenido de tus sitios gestionados.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="!w-auto"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo sitio
          </Button>
        </div>
        <div className="max-w-sm">
          <Input
            placeholder="Buscar por nombre o URL…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-8 py-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Spinner size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-[var(--c-muted)]">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
            <p className="text-sm">
              {query ? "Sin resultados para tu búsqueda." : "Aún no hay sitios. Crea el primero."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="group relative bg-[var(--c-bg)] border border-[var(--c-border)] rounded-[1.25rem] p-5 flex flex-col gap-3 hover:border-[var(--c-text-sub)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/sitios/${s.id}`} className="min-w-0 flex-1">
                    <h2 className="font-semibold text-[var(--c-text)] truncate">{s.name}</h2>
                    <p className="text-[0.8125rem] text-[var(--c-muted)] truncate">{s.url}</p>
                  </Link>
                  <StatusBadge status={s.status} />
                </div>

                {s.description && (
                  <p className="text-[0.8125rem] text-[var(--c-text-sub)] line-clamp-2">
                    {s.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-[0.6875rem] text-[var(--c-muted)]">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[var(--c-line)]"
                  >
                    {s.is_ssl ? "🔒 SSL" : "Sin SSL"}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 mt-auto">
                  <Link
                    href={`/sitios/${s.id}`}
                    className="flex-1 text-center text-[0.8125rem] font-medium px-3 py-2 rounded-lg bg-[var(--c-active-pill)] text-[var(--c-text)] hover:opacity-80 transition-opacity"
                  >
                    Gestionar
                  </Link>
                  <button
                    type="button"
                    title="Editar"
                    onClick={() => {
                      setEditing(s);
                      setFormOpen(true);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={() => setToDelete(s)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--c-danger)] text-[var(--c-danger)] hover:bg-[var(--c-danger)] hover:text-white transition-colors cursor-pointer bg-transparent"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SiteFormModal
        open={formOpen}
        site={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
      <ConfirmModal
        open={!!toDelete}
        title="Eliminar sitio"
        message={`Se eliminará "${toDelete?.name}". El historial de cambios se conserva.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
