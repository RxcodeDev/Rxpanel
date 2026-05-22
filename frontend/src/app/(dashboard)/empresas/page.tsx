"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete, apiPut, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Company, InviteToken, Site } from "@/types/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/store/AuthContext";
import { useRouter } from "next/navigation";

function CompanySitesModal({
  company,
  open,
  onClose,
  onSaved,
}: {
  company: Company | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const toast = useToast();
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !company) return;
    setLoading(true);
    apiGet<Site[]>("/sites/")
      .then((sites) => {
        setAllSites(sites);
        setSelected(new Set(sites.filter((s) => s.company_id === company.id).map((s) => s.id)));
      })
      .catch(() => toast.error("No se pudieron cargar los sitios."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, company?.id]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    if (!company) return;
    setSaving(true);
    try {
      await apiPut(`/companies/${company.id}/sites`, { site_ids: Array.from(selected) });
      toast.success("Sitios actualizados.");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  const STATUS_LABEL: Record<string, string> = {
    active: "Activo",
    inactive: "Inactivo",
    maintenance: "Mantenim.",
    error: "Error",
  };

  return (
    <Modal open={open} onClose={onClose} title={`Sitios — ${company?.name ?? ""}`} wide>
      <div className="flex flex-col px-6 pb-6">
        {/* Subheader */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--c-line)]">
          <p className="text-sm text-[var(--c-text-sub)]">
            Selecciona los sitios visibles para los usuarios de esta empresa.
          </p>
          {!loading && allSites.length > 0 && (
            <span
              className="ml-4 shrink-0 text-[0.75rem] font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: "var(--c-section-border)", color: "var(--c-section-text)" }}
            >
              {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size={24} /></div>
        ) : allSites.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-[var(--c-muted)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <p className="text-sm">No hay sitios registrados.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-4 max-h-[22rem] overflow-y-auto pr-1 -mr-1">
            {allSites.map((s) => {
              const isSelected = selected.has(s.id);
              const isOtherCompany = s.company_id !== null && s.company_id !== company?.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer bg-transparent"
                  style={isSelected
                    ? { borderColor: "var(--c-section-border)", background: "var(--c-section-bg)" }
                    : { borderColor: "var(--c-border)" }
                  }
                >
                  {/* Indicador circular */}
                  <div
                    className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                    style={isSelected
                      ? { borderColor: "var(--c-section-text)", background: "var(--c-section-text)" }
                      : { borderColor: "var(--c-border)" }
                    }
                  >
                    {isSelected && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                        stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>

                  {/* Info del sitio */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--c-text)] truncate">{s.name}</span>
                      {isOtherCompany && (
                        <span
                          className="shrink-0 text-[0.65rem] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(245,158,11,0.12)", color: "#b45309" }}
                        >
                          Otra empresa
                        </span>
                      )}
                    </div>
                    <span className="text-[0.75rem] text-[var(--c-muted)] truncate block mt-0.5">{s.url}</span>
                  </div>

                  {/* Badge de estado */}
                  <span
                    className="shrink-0 text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: s.status === "active" ? "var(--c-st-active)"
                        : s.status === "error" ? "var(--c-st-error)"
                        : s.status === "maintenance" ? "var(--c-st-maint)"
                        : "var(--c-st-inactive)",
                      background: s.status === "active" ? "var(--c-st-active-bg)"
                        : s.status === "error" ? "var(--c-st-error-bg)"
                        : s.status === "maintenance" ? "var(--c-st-maint-bg)"
                        : "var(--c-st-inactive-bg)",
                    }}
                  >
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-[var(--c-line)]">
          <Button type="button" variant="ghost" onClick={onClose} className="!w-auto">
            Cancelar
          </Button>
          <Button onClick={save} loading={saving} disabled={loading} className="!w-auto">
            Guardar cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
}



function CompanyFormModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setName(""); setDescription(""); }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost("/companies/", { name, description: description || null });
      toast.success("Empresa creada.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear la empresa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva empresa">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre de la empresa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--c-text)]">Descripción (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-input-bg)] px-3 py-2 text-sm text-[var(--c-text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--c-ring)]"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} className="!w-auto">
            Cancelar
          </Button>
          <Button type="submit" loading={saving} className="!w-auto">
            Crear empresa
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function InviteLinkModal({
  company,
  open,
  onClose,
}: {
  company: Company | null;
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const [invites, setInvites] = useState<InviteToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const loadInvites = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      setInvites(await apiGet<InviteToken[]>(`/companies/${company.id}/invites`));
    } catch {
      // no bloqueante
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => {
    if (open) loadInvites();
  }, [open, loadInvites]);

  async function generate() {
    if (!company) return;
    setGenerating(true);
    try {
      const inv = await apiPost<InviteToken>(`/companies/${company.id}/invites`, {});
      setInvites((prev) => [inv, ...prev]);
      toast.success("Link de invitación generado.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo generar el link.");
    } finally {
      setGenerating(false);
    }
  }

  async function copyLink(token: string) {
    const link = `${baseUrl}/registro/${token}`;
    await navigator.clipboard.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  const activeInvites = invites.filter((i) => !i.is_used);

  return (
    <Modal open={open} onClose={onClose} title={`Invitaciones — ${company?.name ?? ""}`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--c-text-sub)]">
          Genera un link único para que el dueño de la empresa se registre como
          administrador de su cuenta.
        </p>

        <Button onClick={generate} loading={generating} className="!w-auto self-start">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Generar nuevo link
        </Button>

        {loading ? (
          <div className="flex justify-center py-4"><Spinner size={22} /></div>
        ) : activeInvites.length === 0 ? (
          <p className="text-sm text-[var(--c-muted)] text-center py-4">
            No hay links activos.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {activeInvites.map((inv) => {
              const link = `${baseUrl}/registro/${inv.token}`;
              const expires = new Date(inv.expires_at).toLocaleDateString("es-MX", {
                day: "numeric", month: "short", year: "numeric",
              });
              return (
                <div
                  key={inv.id}
                  className="flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-input-bg)] px-3 py-2"
                >
                  <span className="flex-1 text-xs text-[var(--c-text-sub)] truncate font-mono">
                    {link}
                  </span>
                  <span className="text-[0.65rem] text-[var(--c-muted)] shrink-0">
                    Vence {expires}
                  </span>
                  <button
                    onClick={() => copyLink(inv.token)}
                    className="shrink-0 rounded-lg p-1.5 hover:bg-[var(--c-hover)] transition-colors"
                    title="Copiar link"
                  >
                    {copied === inv.token ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Helpers visuales ─────────────────────────────────────────────────────────

const COMPANY_COLORS = [
  { bg: "rgba(79,70,229,0.12)",  text: "#4338ca" },
  { bg: "rgba(8,145,178,0.12)",  text: "#0891b2" },
  { bg: "rgba(5,150,105,0.12)",  text: "#047857" },
  { bg: "rgba(217,119,6,0.12)",  text: "#b45309" },
  { bg: "rgba(225,29,72,0.12)",  text: "#be123c" },
  { bg: "rgba(124,58,237,0.12)", text: "#7c3aed" },
  { bg: "rgba(13,148,136,0.12)", text: "#0f766e" },
  { bg: "rgba(234,88,12,0.12)",  text: "#c2410c" },
];

function companyColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return COMPANY_COLORS[hash % COMPANY_COLORS.length];
}

function companyInitials(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────

/** Avisa al sidebar (y a quien escuche) que los datos cambiaron. */
function notifyDataChanged() {
  window.dispatchEvent(new Event("rxpanel:data-changed"));
}

export default function EmpresasPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [inviteCompany, setInviteCompany] = useState<Company | null>(null);
  const [sitesCompany, setSitesCompany] = useState<Company | null>(null);
  const [toDelete, setToDelete] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAdmin) { router.replace("/sitios"); return; }
  }, [isAdmin, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [companiesData, sitesData] = await Promise.all([
        apiGet<Company[]>("/companies/"),
        apiGet<Site[]>("/sites/"),
      ]);
      setCompanies(companiesData);
      setAllSites(sitesData);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No se pudieron cargar las empresas.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load(); }, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiDelete(`/companies/${toDelete.id}`);
      toast.success("Empresa eliminada.");
      setToDelete(null);
      notifyDataChanged();
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 px-5 md:px-8 pt-6 pb-4 flex items-center justify-between gap-4 border-b border-[var(--c-line)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--c-text)]">Empresas</h1>
          <p className="text-sm text-[var(--c-text-sub)] mt-0.5">
            Clientes con acceso a su propio panel de sitios.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="!w-auto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva empresa
        </Button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-8 py-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Spinner size={28} />
          </div>
        ) : companies.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-[var(--c-muted)]">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <p className="text-sm">Aún no hay empresas registradas.</p>
            <Button onClick={() => setFormOpen(true)} className="!w-auto mt-1">
              Crear primera empresa
            </Button>
          </div>
        ) : (
          <div className="border border-[var(--c-border)] rounded-[1.25rem] overflow-hidden">
            {/* Tabla desktop */}
            <table className="hidden md:table w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[26%]" />
                <col className="w-[28%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="text-left text-[var(--c-muted)] border-b border-[var(--c-line)]">
                  <th className="font-semibold px-4 py-3">Empresa</th>
                  <th className="font-semibold px-4 py-3">Descripción</th>
                  <th className="font-semibold px-4 py-3">Sitios</th>
                  <th className="font-semibold px-4 py-3">Estado</th>
                  <th className="font-semibold px-4 py-3">Alta</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--c-line)] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[0.75rem] font-bold"
                          style={{ background: companyColor(c.name).bg, color: companyColor(c.name).text }}
                        >
                          {companyInitials(c.name)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-[var(--c-text)] truncate block">{c.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--c-text-sub)] truncate max-w-0">
                      <span className="truncate block">
                        {c.description ?? <span className="text-[var(--c-muted)]">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const n = allSites.filter((s) => s.company_id === c.id).length;
                        return n > 0 ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "var(--c-section-border)", color: "var(--c-section-text)" }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <path d="M3 9h18M9 21V9" />
                            </svg>
                            {n}
                          </span>
                        ) : (
                          <span className="text-[0.75rem] text-[var(--c-muted)]">—</span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[0.6875rem] font-semibold px-2 py-1 rounded-full"
                        style={{
                          color: c.is_active ? "var(--c-st-active)" : "var(--c-st-inactive)",
                          background: c.is_active ? "var(--c-st-active-bg)" : "var(--c-st-inactive-bg)",
                        }}
                      >
                        {c.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--c-text-sub)]">
                      {new Date(c.created_at).toLocaleDateString("es-MX", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSitesCompany(c)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
                          title="Gestionar sitios"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 9h18" />
                            <path d="M9 21V9" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInviteCompany(c)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
                          title="Generar link de invitación"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setToDelete(c)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--c-danger)] text-[var(--c-danger)] hover:bg-[var(--c-danger)] hover:text-white transition-colors cursor-pointer bg-transparent"
                          title="Eliminar empresa"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Cards móvil */}
            <div className="md:hidden divide-y divide-[var(--c-line)]">
              {companies.map((c) => (
                <div key={c.id} className="p-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[0.75rem] font-bold"
                      style={{ background: companyColor(c.name).bg, color: companyColor(c.name).text }}
                    >
                      {companyInitials(c.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-[var(--c-text)] block">{c.name}</span>
                      <span className="text-[0.7rem] text-[var(--c-muted)]">
                        {allSites.filter((s) => s.company_id === c.id).length} sitio{allSites.filter((s) => s.company_id === c.id).length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <span
                      className="text-[0.6875rem] font-semibold px-2 py-1 rounded-full"
                      style={{
                        color: c.is_active ? "var(--c-st-active)" : "var(--c-st-inactive)",
                        background: c.is_active ? "var(--c-st-active-bg)" : "var(--c-st-inactive-bg)",
                      }}
                    >
                      {c.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  {c.description && (
                    <p className="text-[0.8125rem] text-[var(--c-text-sub)] ml-12">{c.description}</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSitesCompany(c)}
                      className="flex-1 text-center text-[0.8125rem] px-3 py-2 rounded-lg border border-[var(--c-border)] text-[var(--c-text-sub)] cursor-pointer bg-transparent"
                    >
                      Sitios
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteCompany(c)}
                      className="flex-1 text-center text-[0.8125rem] px-3 py-2 rounded-lg border border-[var(--c-border)] text-[var(--c-text-sub)] cursor-pointer bg-transparent"
                    >
                      Invitaciones
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(c)}
                      className="flex-1 text-center text-[0.8125rem] px-3 py-2 rounded-lg border border-[var(--c-danger)] text-[var(--c-danger)] cursor-pointer bg-transparent"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CompanyFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => { notifyDataChanged(); load(); }}
      />

      <InviteLinkModal
        company={inviteCompany}
        open={!!inviteCompany}
        onClose={() => setInviteCompany(null)}
      />

      <CompanySitesModal
        company={sitesCompany}
        open={!!sitesCompany}
        onClose={() => setSitesCompany(null)}
        onSaved={load}
      />

      <ConfirmModal
        open={!!toDelete}
        title="Eliminar empresa"
        message={`¿Eliminar la empresa "${toDelete?.name}"? Los usuarios y sitios asociados quedarán inactivos.`}
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
