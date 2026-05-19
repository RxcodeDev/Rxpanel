"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiDelete, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/store/AuthContext";
import type { User } from "@/types/api";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ConfirmModal from "@/components/ui/ConfirmModal";
import UserFormModal from "@/components/features/users/UserFormModal";

export default function UsersPage() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await apiGet<User[]>("/users/"));
      setForbidden(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) setForbidden(true);
      else toast.error(e instanceof ApiError ? e.message : "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiDelete(`/users/${toDelete.id}`);
      toast.success("Usuario eliminado.");
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
      <header className="flex-shrink-0 px-5 md:px-8 pt-6 pb-4 flex items-center justify-between gap-4 border-b border-[var(--c-line)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--c-text)]">Usuarios</h1>
          <p className="text-sm text-[var(--c-text-sub)] mt-0.5">
            Cuentas con acceso al panel.
          </p>
        </div>
        {!forbidden && (
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
        ) : (
          <div className="border border-[var(--c-border)] rounded-[1.25rem] overflow-hidden max-w-3xl">
            {/* Tabla desktop */}
            <table className="hidden md:table w-full text-sm">
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
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--c-line)] last:border-0">
                    <td className="px-4 py-3 font-medium text-[var(--c-text)]">
                      {u.username}
                      {me?.id === u.id && (
                        <span className="ml-2 text-[0.6875rem] text-[var(--c-muted)]">(tú)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--c-text-sub)]">{u.email}</td>
                    <td className="px-4 py-3 capitalize text-[var(--c-text-sub)]">
                      {u.role === "admin" ? "Administrador" : "Lector"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[0.6875rem] font-semibold px-2 py-1 rounded-full"
                        style={{
                          color: u.is_active ? "var(--c-st-active)" : "var(--c-st-inactive)",
                          background: u.is_active
                            ? "var(--c-st-active-bg)"
                            : "var(--c-st-inactive-bg)",
                        }}
                      >
                        {u.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => {
                            setEditing(u);
                            setFormOpen(true);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                          </svg>
                        </button>
                        {me?.id !== u.id && (
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
              {users.map((u) => (
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
                        background: u.is_active
                          ? "var(--c-st-active-bg)"
                          : "var(--c-st-inactive-bg)",
                      }}
                    >
                      {u.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <span className="text-[0.8125rem] text-[var(--c-text-sub)]">{u.email}</span>
                  <span className="text-[0.75rem] text-[var(--c-muted)] capitalize">
                    {u.role === "admin" ? "Administrador" : "Lector"}
                  </span>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(u);
                        setFormOpen(true);
                      }}
                      className="flex-1 text-center text-[0.8125rem] px-3 py-2 rounded-lg border border-[var(--c-border)] text-[var(--c-text-sub)] cursor-pointer bg-transparent"
                    >
                      Editar
                    </button>
                    {me?.id !== u.id && (
                      <button
                        type="button"
                        onClick={() => setToDelete(u)}
                        className="px-3 py-2 rounded-lg border border-[var(--c-danger)] text-[var(--c-danger)] text-[0.8125rem] cursor-pointer bg-transparent"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
        message={`Se desactivará la cuenta de "${toDelete?.username}".`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
