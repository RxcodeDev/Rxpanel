import type { SiteStatus } from "@/types/api";

const MAP: Record<SiteStatus, { label: string; fg: string; bg: string }> = {
  active: { label: "Activo", fg: "var(--c-st-active)", bg: "var(--c-st-active-bg)" },
  inactive: { label: "Inactivo", fg: "var(--c-st-inactive)", bg: "var(--c-st-inactive-bg)" },
  maintenance: { label: "Mantenimiento", fg: "var(--c-st-maint)", bg: "var(--c-st-maint-bg)" },
  error: { label: "Error", fg: "var(--c-st-error)", bg: "var(--c-st-error-bg)" },
};

export default function StatusBadge({ status }: { status: SiteStatus }) {
  const s = MAP[status] ?? MAP.inactive;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[0.6875rem] font-semibold px-2 py-1 rounded-full"
      style={{ color: s.fg, background: s.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fg }} />
      {s.label}
    </span>
  );
}

export const STATUS_OPTIONS = (Object.keys(MAP) as SiteStatus[]).map((value) => ({
  value,
  label: MAP[value].label,
}));
