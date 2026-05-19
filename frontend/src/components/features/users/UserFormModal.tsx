"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";
import SearchSelect from "@/components/ui/SearchSelect";
import { apiPost, apiPatch, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { User, UserRole } from "@/types/api";

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "viewer", label: "Lector" },
];

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function UserFormModal({ open, user, onClose, onSaved }: Props) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setEmail(user?.email ?? "");
    setUsername(user?.username ?? "");
    setPassword("");
    setRole(user?.role ?? "viewer");
    setIsActive(user?.is_active ?? true);
    setError(undefined);
  }, [open, user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      if (user) {
        const patch: Record<string, unknown> = { email, username, role, is_active: isActive };
        if (password.trim()) patch.password = password.trim();
        await apiPatch(`/users/${user.id}`, patch);
        toast.success("Usuario actualizado.");
      } else {
        // El backend asigna rol/estado por defecto; se ajustan tras crear.
        const created = await apiPost<User>("/users/", { email, username, password });
        if (role !== created.role || !isActive) {
          await apiPatch(`/users/${created.id}`, { role, is_active: isActive });
        }
        toast.success("Usuario creado.");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el usuario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={user ? "Editar usuario" : "Nuevo usuario"}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Usuario"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="nombre.usuario"
        />
        <Input
          label="Correo"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@correo.com"
        />
        <Input
          label={user ? "Contraseña (vacío = sin cambios)" : "Contraseña"}
          type="password"
          required={!user}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <SearchSelect
          label="Rol"
          options={ROLES}
          value={role}
          onChange={(v) => setRole(v as UserRole)}
          searchable={false}
        />
        <Toggle
          checked={isActive}
          onChange={setIsActive}
          label="Activo"
          description="Un usuario inactivo no puede iniciar sesión."
        />
        {error && <p className="text-[0.8125rem] text-[var(--c-danger)]">{error}</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {user ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
