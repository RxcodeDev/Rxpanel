"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiDelete, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Site, SiteStatus } from "@/types/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import SearchSelect from "@/components/ui/SearchSelect";
import SiteRow from "@/components/features/sites/SiteRow";
import SiteFormModal from "@/components/features/sites/SiteFormModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

type StatusFilter = SiteStatus | "all";
type SortKey = "recent" | "name" | "status";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos" },
  { key: "inactive", label: "Inactivos" },
  { key: "maintenance", label: "Mantenimiento" },
  { key: "error", label: "Con error" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "name", label: "Nombre (A–Z)" },
  { value: "status", label: "Estado" },
];

// Orden de prioridad para ordenar por estado.
const STATUS_ORDER: Record<SiteStatus, number> = {
  active: 0,
  maintenance: 1,
  error: 2,
  inactive: 3,
};

/** Avisa al sidebar (y a quien escuche) que los datos cambiaron. */
function notifyDataChanged() {
  window.dispatchEvent(new Event("rxpanel:data-changed"));
}

export default function SitesPage() {
  const toast = useToast();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
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

  // Conteo por estado para las pestañas de filtro.
  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: sites.length,
      active: 0,
      inactive: 0,
      maintenance: 0,
      error: 0,
    };
    for (const s of sites) c[s.status] += 1;
    return c;
  }, [sites]);

  // Filtrado por búsqueda + estado, luego ordenado.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = sites.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false)
      );
    });
    result.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "es");
      if (sort === "status") return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      return b.updated_at.localeCompare(a.updated_at); // recent
    });
    return result;
  }, [sites, query, statusFilter, sort]);

  const isFiltering = query.trim() !== "" || statusFilter !== "all";

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiDelete(`/sites/${toDelete.id}`);
      toast.success("Sitio eliminado.");
      setToDelete(null);
      await load();
      notifyDataChanged();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 px-5 md:px-8 pt-6 pb-4 flex flex-col gap-4 border-b border-[var(--c-line)]">
        <div className="flex items-start justify-between gap-4">
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

        {/* Barra de herramientas: búsqueda · orden · filtro por estado */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[12rem] max-w-xs">
              <Input
                placeholder="Buscar por nombre, URL o descripción…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                }
              />
            </div>
            <SearchSelect
              options={SORT_OPTIONS}
              value={sort}
              onChange={(v) => setSort(v as SortKey)}
              searchable={false}
              className="w-[11.5rem] shrink-0"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-medium border transition-colors cursor-pointer ${
                    active
                      ? "bg-[var(--c-text)] text-[var(--c-bg)] border-transparent"
                      : "bg-transparent text-[var(--c-text-sub)] border-[var(--c-border)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)]"
                  }`}
                >
                  {f.label}
                  <span
                    className={`text-[0.6875rem] font-semibold ${
                      active ? "opacity-70" : "text-[var(--c-muted)]"
                    }`}
                  >
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-8 py-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Spinner size={28} />
          </div>
        ) : sites.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-[var(--c-muted)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
            <p className="text-sm">Aún no tienes sitios gestionados.</p>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="!w-auto"
            >
              Crear el primero
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-[var(--c-muted)]">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-sm">Ningún sitio coincide con los filtros.</p>
            <Button variant="ghost" onClick={clearFilters} className="!w-auto">
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <>
            <p className="text-[0.75rem] text-[var(--c-muted)] mb-3">
              {isFiltering
                ? `${filtered.length} de ${sites.length} ${sites.length === 1 ? "sitio" : "sitios"}`
                : `${sites.length} ${sites.length === 1 ? "sitio" : "sitios"}`}
            </p>

            <div className="flex flex-col gap-3 md:gap-0 md:border md:border-[var(--c-border)] md:rounded-[1rem] md:overflow-hidden">
              {/* Cabecera de tabla — solo escritorio */}
              <div className="hidden md:flex items-center gap-4 px-4 py-2.5 bg-[var(--c-hover)] text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[var(--c-muted)]">
                <span className="flex-1 min-w-0">Sitio</span>
                <span className="w-[8.5rem]">Estado</span>
                <span className="w-[6.5rem]">Seguridad</span>
                <span className="w-[6rem]">Actualizado</span>
                <span className="w-[11rem] text-right">Acciones</span>
              </div>

              {filtered.map((s) => (
                <SiteRow
                  key={s.id}
                  site={s}
                  onEdit={(site) => {
                    setEditing(site);
                    setFormOpen(true);
                  }}
                  onDelete={setToDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <SiteFormModal
        open={formOpen}
        site={editing}
        onClose={() => setFormOpen(false)}
        onSaved={async () => {
          await load();
          notifyDataChanged();
        }}
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
