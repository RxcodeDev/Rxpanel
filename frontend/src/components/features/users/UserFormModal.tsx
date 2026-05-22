"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";
import SearchSelect from "@/components/ui/SearchSelect";
import { apiGet, apiPost, apiPatch, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/store/AuthContext";
import type { User, UserRole, Company } from "@/types/api";

// Permisos para usuarios de empresa (admin rxcode asignando a una empresa)
const COMPANY_PERMS = [
  { value: "company_admin",  label: "Admin" },
  { value: "company_editor", label: "Editor" },
  { value: "company_viewer", label: "Viewer" },
];

// Permisos que puede asignar un company_admin a sus miembros
const MEMBER_PERMS = [
  { value: "company_editor", label: "Editor" },
  { value: "company_viewer", label: "Viewer" },
];

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function UserFormModal({ open, user, onClose, onSaved }: Props) {
  const toast = useToast();
  const { isAdmin, isCompanyAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("company_viewer");
  const [companyId, setCompanyId] = useState<string>("");
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  // Para rxcode admin: si tiene empresa seleccionada, son permisos de empresa; si no, es admin rxcode
  const permOptions = isAdmin
    ? (companyId ? COMPANY_PERMS : null)  // null = no mostrar selector, rol fijo = admin
    : MEMBER_PERMS;                        // company_admin puede asignar editor/viewer

  useEffect(() => {
    if (!open) return;
    const fakeEmail = user?.email?.includes("@invite.rxpanel");
    setEmail(fakeEmail ? "" : (user?.email ?? ""));
    setUsername(user?.username ?? "");
    setPassword("");
    setIsActive(user?.is_active ?? true);
    setError(undefined);
    // Inicializar empresa y permisos
    const cid = user?.company_id ? String(user.company_id) : "";
    setCompanyId(cid);
    if (user) {
      setRole(user.role);
    } else {
      setRole(isAdmin ? "company_viewer" : "company_viewer");
    }
    // Carga empresas para admin rxcode
    if (isAdmin) {
      apiGet<Company[]>("/companies/")
        .then((data) => setCompanies(data.map((c) => ({ value: String(c.id), label: c.name }))))
        .catch(() => {});
    }
  }, [open, user, isAdmin]);

  // Cuando se cambia la empresa, resetear permisos al default correspondiente
  function handleCompanyChange(cid: string) {
    setCompanyId(cid);
    if (!cid) {
      setRole("admin" as UserRole); // sin empresa = admin rxcode
    } else if (!["company_admin", "company_editor", "company_viewer"].includes(role)) {
      setRole("company_viewer"); // reset a viewer si el rol actual no es de empresa
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      if (user) {
        // Edición
        const patch: Record<string, unknown> = { email, username, is_active: isActive };
        if (isAdmin) {
          patch.role = companyId ? role : "admin";
          if (companyId) patch.company_id = Number(companyId);
        }
        if (password.trim()) patch.password = password.trim();
        await apiPatch(`/users/${user.id}`, patch);
        toast.success("Usuario actualizado.");
      } else if (isAdmin) {
        // Admin rxcode: sin empresa = rol admin; con empresa = permisos de empresa
        const finalRole: UserRole = companyId ? role : "admin";
        const payload: Record<string, unknown> = { email, username, password, role: finalRole };
        if (companyId) payload.company_id = Number(companyId);
        const created = await apiPost<User>("/users/", payload);
        if (!isActive) {
          await apiPatch(`/users/${created.id}`, { is_active: false });
        }
        toast.success("Usuario creado.");
      } else if (isCompanyAdmin) {
        // Company admin: crea member en su empresa con permisos editor/viewer
        await apiPost("/users/company", { email, username, password, role });
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
          autoComplete="off"
        />
        <Input
          label="Correo"
          type="email"
          required={!isCompanyAdmin || !!user}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@correo.com"
          autoComplete="off"
        />
        <Input
          label={user ? "Contraseña (vacío = sin cambios)" : "Contraseña"}
          type="password"
          required={!user}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        {/* Empresa — solo visible para admin rxcode */}
        {isAdmin && (
          <SearchSelect
            label="Empresa"
            options={companies}
            value={companyId}
            onChange={handleCompanyChange}
            placeholder="Sin empresa (usuario Rxcode)"
            searchable
          />
        )}
        {/* Permisos: solo si hay empresa seleccionada (admin) o siempre para company_admin */}
        {permOptions && (
          <SearchSelect
            label="Permisos"
            options={permOptions}
            value={role}
            onChange={(v) => setRole(v as UserRole)}
            searchable={false}
          />
        )}
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
