"use client";

import Link from "next/link";
import type { Site } from "@/types/api";
import { SiteIcon } from "@/lib/siteIcons";
import { formatDateShort } from "@/lib/format";
import StatusBadge from "./StatusBadge";

interface Props {
  site: Site;
  onEdit: (site: Site) => void;
  onDelete: (site: Site) => void;
}

const EDIT_PATHS = [
  "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
  "M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
];

/**
 * Una fila de la tabla de sitios en escritorio; una tarjeta en móvil.
 * Ambas variantes se renderizan y CSS decide cuál se muestra.
 */
export default function SiteRow({ site, onEdit, onDelete }: Props) {
  // Chip del icono del sitio (o inicial del nombre como respaldo).
  const iconChip = (
    <div className="shrink-0 w-9 h-9 rounded-[0.625rem] flex items-center justify-center border border-[var(--c-border)] bg-[var(--c-bg)]">
      {site.icon ? (
        <SiteIcon iconKey={site.icon} color={site.icon_color} size={18} />
      ) : (
        <span className="text-[0.8125rem] font-semibold text-[var(--c-muted)]">
          {site.name.charAt(0).toUpperCase() || "?"}
        </span>
      )}
    </div>
  );

  const sslPill = (
    <span
      className={`inline-flex items-center gap-1 text-[0.6875rem] font-medium px-2 py-0.5 rounded-full border border-[var(--c-line)] ${
        site.is_ssl ? "text-[var(--c-text-sub)]" : "text-[var(--c-muted)]"
      }`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d={site.is_ssl ? "M7 11V7a5 5 0 0 1 10 0v4" : "M7 11V7a5 5 0 0 1 9.9-1"} />
      </svg>
      {site.is_ssl ? "SSL" : "Sin SSL"}
    </span>
  );

  const editBtn = (
    <button
      type="button"
      title="Editar sitio"
      onClick={() => onEdit(site)}
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent shrink-0"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {EDIT_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </button>
  );

  const deleteBtn = (
    <button
      type="button"
      title="Eliminar sitio"
      onClick={() => onDelete(site)}
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-danger)] hover:text-[var(--c-danger)] transition-colors cursor-pointer bg-transparent shrink-0"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      </svg>
    </button>
  );

  return (
    <>
      {/* ── Fila — escritorio ───────────────────────────── */}
      <div className="hidden md:flex items-center gap-4 px-4 py-2.5 border-t border-[var(--c-line)] hover:bg-[var(--c-hover)] transition-colors">
        <Link
          href={`/sitios/${site.id}`}
          className="flex items-center gap-3 flex-1 min-w-0 group"
        >
          {iconChip}
          <span className="min-w-0">
            <span className="block font-semibold text-sm text-[var(--c-text)] truncate group-hover:underline">
              {site.name}
            </span>
            <span className="block text-[0.75rem] text-[var(--c-muted)] truncate">{site.url}</span>
          </span>
        </Link>
        <div className="w-[8.5rem] shrink-0">
          <StatusBadge status={site.status} />
        </div>
        <div className="w-[6.5rem] shrink-0">{sslPill}</div>
        <div className="w-[6rem] shrink-0 text-[0.75rem] text-[var(--c-text-sub)]">
          {formatDateShort(site.updated_at)}
        </div>
        <div className="w-[11rem] shrink-0 flex items-center justify-end gap-1.5">
          <Link
            href={`/sitios/${site.id}`}
            className="text-[0.75rem] font-medium px-3 h-9 inline-flex items-center rounded-lg bg-[var(--c-active-pill)] text-[var(--c-text)] hover:opacity-80 transition-opacity"
          >
            Gestionar
          </Link>
          {editBtn}
          {deleteBtn}
        </div>
      </div>

      {/* ── Tarjeta — móvil ─────────────────────────────── */}
      <div className="md:hidden flex flex-col gap-3 p-4 rounded-[1rem] border border-[var(--c-border)]">
        <div className="flex items-start gap-3">
          {iconChip}
          <Link href={`/sitios/${site.id}`} className="min-w-0 flex-1">
            <span className="block font-semibold text-sm text-[var(--c-text)] truncate">
              {site.name}
            </span>
            <span className="block text-[0.75rem] text-[var(--c-muted)] truncate">{site.url}</span>
          </Link>
          <StatusBadge status={site.status} />
        </div>
        {site.description && (
          <p className="text-[0.8125rem] text-[var(--c-text-sub)] line-clamp-2">
            {site.description}
          </p>
        )}
        <div className="flex items-center gap-2.5 flex-wrap text-[0.6875rem] text-[var(--c-muted)]">
          {sslPill}
          <span className="inline-flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatDateShort(site.updated_at)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/sitios/${site.id}`}
            className="flex-1 text-center text-[0.8125rem] font-medium px-3 h-9 inline-flex items-center justify-center rounded-lg bg-[var(--c-active-pill)] text-[var(--c-text)] hover:opacity-80 transition-opacity"
          >
            Gestionar
          </Link>
          {editBtn}
          {deleteBtn}
        </div>
      </div>
    </>
  );
}
