"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiDelete, apiPatch, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/store/AuthContext";
import type { User, Company } from "@/types/api";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ConfirmModal from "@/components/ui/ConfirmModal";
import UserFormModal from "@/components/features/users/UserFormModal";

export default function UsersPage() {
  const toast = useToast();
  const { user: me, isAdmin, isCompanyAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [myCompanyName, setMyCompanyName] = useState<string>("Mi empresa");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = isAdmin || isCompanyAdmin;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, companiesData] = await Promise.all([
        apiGet<User[]>("/users/"),
        isAdmin ? apiGet<Company[]>("/companies/") : Promise.resolve([] as Company[]),
      ]);
      setUsers(usersData);
      setCompanies(companiesData);
      // Para company_admin: obtener el nombre de su empresa
      if (!isAdmin && isCompanyAdmin) {
        try {
          const myCompany = await apiGet<Company>("/companies/me");
          setMyCompanyName(myCompany.name);
        } catch {
          setMyCompanyName("Mi empresa");
        }
      }
      setForbidden(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) setForbidden(true);
      else toast.error(e instanceof ApiError ? e.message : "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isCompanyAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiDelete(`/users/${toDelete.id}`);
      // Quitar inmediatamente del estado local
      setUsers((prev) => prev.filter((u) => u.id !== toDelete.id));
      toast.success("Usuario eliminado.");
      setToDelete(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar.");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(u: User) {
    // Actualiza optimistamente para respuesta instantánea
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: !u.is_active } : x)));
    try {
      if (u.is_active) {
        // Desactivar — PATCH regular
        await apiPatch(`/users/${u.id}`, { is_active: false });
        toast.success("Cuenta desactivada.");
      } else {
        // Reactivar — endpoint dedicado
        await apiPatch(`/users/${u.id}/restore`, {});
        toast.success("Cuenta activada.");
      }
    } catch (e) {
      // Revertir si falla
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: u.is_active } : x)));
      toast.error(e instanceof ApiError ? e.message : "No se pudo actualizar el usuario.");
    }
  }

  const ROLE_LABEL: Record<string, string> = {
    admin: "Admin Rxcode",
    viewer: "Visor Rxcode",
    company_admin: "Admin",
    company_editor: "Editor",
    company_viewer: "Viewer",
  };

  function renderGroup(label: string, groupUsers: User[]) {
    if (groupUsers.length === 0) return null;
    return (
      <section key={label} className="flex flex-col gap-3">
        {/* Encabezado de sección */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{
            background: "var(--c-section-bg)",
            border: "1px solid var(--c-section-border)",
          }}
        >
          <span
            className="text-[0.7rem] font-bold uppercase tracking-widest"
            style={{ color: "var(--c-section-text)" }}
          >
            {label}
          </span>
          <div className="flex-1" />
          <span
            className="text-[0.6875rem] font-semibold px-2.5 py-0.5 rounded-full"
            style={{
              background: "var(--c-section-border)",
              color: "var(--c-section-text)",
            }}
          >
            {groupUsers.length} {groupUsers.length === 1 ? "usuario" : "usuarios"}
          </span>
        </div>

        <div className="border border-[var(--c-border)] rounded-[1.25rem] overflow-hidden">
          {/* Tabla desktop */}
          <table className="hidden md:table w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[27%]" />
              <col className="w-[17%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className="text-left text-[var(--c-muted)] border-b border-[var(--c-line)]">
                <th className="font-semibold px-4 py-3">Usuario</th>
                <th className="font-semibold px-4 py-3">Correo</th>
                <th className="font-semibold px-4 py-3">Rol</th>
                <th className="font-semibold px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {groupUsers.map((u) => (
                <tr key={u.id} className="border-b border-[var(--c-line)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--c-text)] truncate max-w-0">
                    <span className="truncate">
                      {u.username}
                      {me?.id === u.id && (
                        <span className="ml-2 text-[0.6875rem] text-[var(--c-muted)]">(tú)</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--c-text-sub)] truncate max-w-0">
                    {u.email.includes("@invite.rxpanel") ? "—" : u.email}
                  </td>
                  <td className="px-4 py-3 text-[var(--c-text-sub)] truncate max-w-0">
                    {ROLE_LABEL[u.role] ?? u.role}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[0.6875rem] font-semibold px-2 py-1 rounded-full"
                      style={{
                        color: u.is_active ? "var(--c-st-active)" : "var(--c-st-inactive)",
                        background: u.is_active ? "var(--c-st-active-bg)" : "var(--c-st-inactive-bg)",
                      }}
                    >
                      {u.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {canManage && (
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => { setEditing(u); setFormOpen(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                          </svg>
                        </button>
                      )}
                      {me?.id !== u.id && canManage && (
                        <button
                          type="button"
                          title={u.is_active ? "Desactivar cuenta" : "Activar cuenta"}
                          onClick={() => toggleActive(u)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer bg-transparent"
                          style={u.is_active
                            ? { borderColor: "var(--c-warning, #f59e0b)", color: "var(--c-warning, #f59e0b)" }
                            : { borderColor: "var(--c-st-active)", color: "var(--c-st-active)" }
                          }
                        >
                          {u.is_active ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="6" y="4" width="4" height="16" rx="1" />
                              <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polygon points="5 3 19 12 5 21" />
                            </svg>
                          )}
                        </button>
                      )}
                      {me?.id !== u.id && canManage && (
                        <button
                          type="button"
                          title="Eliminar"
                          onClick={() => setToDelete(u)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--c-danger)] text-[var(--c-danger)] hover:bg-[var(--c-danger)] hover:text-white transition-colors cursor-pointer bg-transparent"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cards móvil */}
          <div className="md:hidden divide-y divide-[var(--c-line)]">
            {groupUsers.map((u) => (
              <div key={u.id} className="p-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--c-text)]">
                    {u.username}
                    {me?.id === u.id && (
                      <span className="ml-2 text-[0.6875rem] text-[var(--c-muted)]">(tú)</span>
                    )}
                  </span>
                  <span
                    className="text-[0.6875rem] font-semibold px-2 py-1 rounded-full"
                    style={{
                      color: u.is_active ? "var(--c-st-active)" : "var(--c-st-inactive)",
                      background: u.is_active ? "var(--c-st-active-bg)" : "var(--c-st-inactive-bg)",
                    }}
                  >
                    {u.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <span className="text-[0.8125rem] text-[var(--c-text-sub)]">
                  {u.email.includes("@invite.rxpanel") ? "—" : u.email}
                </span>
                <span className="text-[0.75rem] text-[var(--c-muted)]">
                  {ROLE_LABEL[u.role] ?? u.role}
                </span>
                {canManage && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setEditing(u); setFormOpen(true); }}
                      className="flex-1 text-center text-[0.8125rem] px-3 py-2 rounded-lg border border-[var(--c-border)] text-[var(--c-text-sub)] cursor-pointer bg-transparent"
                    >
                      Editar
                    </button>
                    {me?.id !== u.id && (
                      <button
                        type="button"
                        onClick={() => toggleActive(u)}
                        className="flex-1 text-center text-[0.8125rem] px-3 py-2 rounded-lg border cursor-pointer bg-transparent"
                        style={u.is_active
                          ? { borderColor: "var(--c-warning, #f59e0b)", color: "var(--c-warning, #f59e0b)" }
                          : { borderColor: "var(--c-st-active)", color: "var(--c-st-active)" }
                        }
                      >
                        {u.is_active ? "Desactivar" : "Activar"}
                      </button>
                    )}
                    {me?.id !== u.id && (
                      <button
                        type="button"
                        onClick={() => setToDelete(u)}
                        className="flex-1 text-center text-[0.8125rem] px-3 py-2 rounded-lg border border-[var(--c-danger)] text-[var(--c-danger)] cursor-pointer bg-transparent"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 px-5 md:px-8 pt-6 pb-4 flex items-center justify-between gap-4 border-b border-[var(--c-line)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--c-text)]">Usuarios</h1>
          <p className="text-sm text-[var(--c-text-sub)] mt-0.5">
            {isAdmin ? "Todas las cuentas del panel." : "Usuarios de tu empresa."}
          </p>
        </div>
        {!forbidden && canManage && (
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
            Nuevo usuario
          </Button>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-8 py-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Spinner size={28} />
          </div>
        ) : forbidden ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-[var(--c-muted)]">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-sm">Necesitas permisos de administrador para gestionar usuarios.</p>
          </div>
        ) : isAdmin ? (
          <div className="flex flex-col gap-6">
            {renderGroup("Equipo Rxcode", users.filter((u) => u.company_id === null))}
            {companies.map((company) =>
              renderGroup(company.name, users.filter((u) => u.company_id === company.id))
            )}
            {users.length === 0 && (
              <p className="text-sm text-[var(--c-muted)] text-center py-12">
                No hay usuarios registrados.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {renderGroup(myCompanyName, users)}
            {users.length === 0 && (
              <p className="text-sm text-[var(--c-muted)] text-center py-12">
                No hay usuarios en tu empresa.
              </p>
            )}
          </div>
        )}
      </div>

      <UserFormModal
        open={formOpen}
        user={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
      <ConfirmModal
        open={!!toDelete}
        title="Eliminar usuario"
        message={`¿Eliminar la cuenta de "${toDelete?.username}"? Esta acción no se puede deshacer.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
