"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { InviteValidation } from "@/types/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function RegistroPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const toast = useToast();

  const [invite, setInvite] = useState<InviteValidation | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<{ username?: string; password?: string }>({});

  // Validar el token al montar
  useEffect(() => {
    async function validate() {
      try {
        const data = await apiGet<InviteValidation>(`/auth/invite/${token}`);
        setInvite(data);
      } catch (e) {
        setInviteError(
          e instanceof ApiError
            ? e.message
            : "Este link de invitación no es válido o ha expirado."
        );
      } finally {
        setLoadingInvite(false);
      }
    }
    if (token) validate();
  }, [token]);

  function validate() {
    const errors: typeof fieldError = {};
    if (username.trim().length < 3) errors.username = "El nombre de usuario debe tener al menos 3 caracteres.";
    if (password.length < 8) errors.password = "La contraseña debe tener al menos 8 caracteres.";
    setFieldError(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await apiPost("/auth/register/invite", {
        token,
        username: username.trim(),
        password,
      });
      toast.success("¡Cuenta creada! Ahora puedes iniciar sesión.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo completar el registro.");
    } finally {
      setSaving(false);
    }
  }

  // Loading
  if (loadingInvite) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--c-hover)]">
        <Spinner size={28} />
      </div>
    );
  }

  // Token inválido / expirado / ya usado
  if (inviteError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--c-hover)] px-4 py-10">
        <div className="w-full max-w-[22rem] rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg)] p-8 shadow-lg">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.94a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
            </span>
            <div>
              <h1 className="text-lg font-bold text-[var(--c-text)]">Invitación inválida</h1>
              <p className="mt-1 text-sm text-[var(--c-text-sub)]">{inviteError}</p>
            </div>
            <a
              href="/login"
              className="text-sm text-[var(--c-text-sub)] underline hover:text-[var(--c-text)]"
            >
              Ir al inicio de sesión
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de registro
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--c-hover)] px-4 py-10">
      <div className="w-full max-w-[22rem] rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg)] p-8 shadow-lg flex flex-col gap-6">
        {/* Encabezado */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--c-text)] text-[var(--c-bg)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
              <path d="M3 10h18M10 10v10" />
            </svg>
          </span>
          <div>
            <h1 className="text-xl font-bold text-[var(--c-text)]">Crear tu cuenta</h1>
            <p className="mt-1 text-sm text-[var(--c-text-sub)]">
              Fuiste invitado a administrar{" "}
              <strong className="text-[var(--c-text)]">{invite?.company_name}</strong>
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nombre de usuario"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setFieldError((p) => ({ ...p, username: undefined })); }}
            error={fieldError.username}
            autoFocus
            autoComplete="username"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldError((p) => ({ ...p, password: undefined })); }}
            error={fieldError.password}
            autoComplete="new-password"
          />
          <Button type="submit" loading={saving} className="mt-1">
            Crear cuenta
          </Button>
        </form>

        <p className="text-center text-xs text-[var(--c-muted)]">
          Al registrarte aceptas los términos de uso de Rxpanel.
        </p>
      </div>
    </div>
  );
}
