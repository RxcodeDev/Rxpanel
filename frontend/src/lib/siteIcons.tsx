import type { ReactNode } from "react";

/* Modern stroke-only icons (feather/lucide style, no background, no fill). */
export interface SiteIconDef {
  key: string;
  label: string;
  paths: ReactNode;
}

export const SITE_ICONS: SiteIconDef[] = [
  { key: "globe",      label: "Globo",       paths: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></> },
  { key: "rocket",     label: "Cohete",      paths: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></> },
  { key: "briefcase",  label: "Negocio",     paths: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></> },
  { key: "shopping",   label: "Tienda",      paths: <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></> },
  { key: "camera",     label: "Cámara",      paths: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></> },
  { key: "code",       label: "Código",      paths: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></> },
  { key: "heart",      label: "Salud",       paths: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></> },
  { key: "star",       label: "Premium",     paths: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
  { key: "leaf",       label: "Natural",     paths: <><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 11-9 1 0 2 .1 2.7.3a7 7 0 0 1 .3 11.7C16 19 14 20 11 20z"/><path d="M2 22c4-3 6-6 6-10"/></> },
  { key: "zap",        label: "Energía",     paths: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></> },
  { key: "palette",    label: "Diseño",      paths: <><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2a10 10 0 0 0-9.95 11.04A10 10 0 0 0 12 22a2.5 2.5 0 0 0 2.5-2.5v-.4a2.1 2.1 0 0 1 .6-1.5 2.1 2.1 0 0 1 1.5-.6h2A4.4 4.4 0 0 0 22 13a10 10 0 0 0-10-11z"/></> },
  { key: "music",      label: "Música",      paths: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></> },
  { key: "film",       label: "Video",       paths: <><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></> },
  { key: "book",       label: "Libro",       paths: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></> },
  { key: "coffee",     label: "Café",        paths: <><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></> },
  { key: "tool",       label: "Herramienta", paths: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></> },
  { key: "chart",      label: "Métricas",    paths: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
  { key: "users",      label: "Equipo",      paths: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
  { key: "home",       label: "Hogar",       paths: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
  { key: "compass",    label: "Aventura",    paths: <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></> },
  { key: "feather",    label: "Editorial",   paths: <><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></> },
  { key: "anchor",     label: "Náutico",     paths: <><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></> },
  { key: "flame",      label: "Trending",    paths: <><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></> },
  { key: "shield",     label: "Seguridad",   paths: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></> },
];

/* Curated modern color palette */
export const ICON_COLORS: { key: string; value: string }[] = [
  { key: "indigo",   value: "#4F46E5" },
  { key: "blue",     value: "#2563EB" },
  { key: "sky",      value: "#0284C7" },
  { key: "teal",     value: "#0D9488" },
  { key: "emerald",  value: "#059669" },
  { key: "lime",     value: "#65A30D" },
  { key: "amber",    value: "#D97706" },
  { key: "orange",   value: "#EA580C" },
  { key: "rose",     value: "#E11D48" },
  { key: "pink",     value: "#DB2777" },
  { key: "fuchsia",  value: "#C026D3" },
  { key: "violet",   value: "#7C3AED" },
  { key: "slate",    value: "#475569" },
  { key: "black",    value: "#111111" },
];

export const DEFAULT_ICON_COLOR = "#475569";

export function getSiteIcon(key: string | null | undefined): SiteIconDef | null {
  if (!key) return null;
  return SITE_ICONS.find((i) => i.key === key) ?? null;
}

/* Renders a stroke SVG for a given icon key. */
export function SiteIcon({
  iconKey,
  color,
  size = 18,
  strokeWidth = 1.75,
}: {
  iconKey: string | null | undefined;
  color?: string | null;
  size?: number;
  strokeWidth?: number;
}) {
  const def = getSiteIcon(iconKey);
  if (!def) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || DEFAULT_ICON_COLOR}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {def.paths}
    </svg>
  );
}
