"use client";

import { useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { apiPost, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Mode = "login" | "recover" | "reset";

function msg(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return "Correo o contraseña incorrectos.";
    if (e.status === 0 || e.status >= 502) return "No se pudo conectar al servidor.";
    return e.message;
  }
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(msg(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      const res = await apiPost<{ message: string; reset_token?: string }>("/auth/recover", { email });
      if (res.reset_token) {
        setResetToken(res.reset_token);
        toast.success("Token de recuperación generado.");
        setMode("reset");
      } else {
        toast.success("Si el correo existe, recibirás instrucciones.");
        setMode("login");
      }
    } catch (err) {
      setError(msg(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      await apiPost("/auth/reset", { token: resetToken, new_password: newPassword });
      toast.success("Contraseña actualizada. Inicia sesión.");
      setPassword("");
      setMode("login");
    } catch (err) {
      setError(msg(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--c-text)] tracking-tight">Rxpanel</h1>
        <p className="text-sm text-[var(--c-text-sub)] mt-1">
          Panel de administración de sitios
        </p>
      </div>

      <div className="bg-[var(--c-bg)] border border-[var(--c-border)] rounded-[1.25rem] p-7">
        {mode === "login" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-[var(--c-text)]">Iniciar sesión</h2>
            <Input
              label="Correo"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {error && <p className="text-[0.8125rem] text-[var(--c-danger)]">{error}</p>}
            <Button type="submit" loading={loading} block>
              Entrar
            </Button>
            <button
              type="button"
              onClick={() => {
                setError(undefined);
                setMode("recover");
              }}
              className="text-[0.8125rem] text-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer mx-auto"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        )}

        {mode === "recover" && (
          <form onSubmit={handleRecover} className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-[var(--c-text)]">Recuperar contraseña</h2>
            <Input
              label="Correo"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
            {error && <p className="text-[0.8125rem] text-[var(--c-danger)]">{error}</p>}
            <Button type="submit" loading={loading} block>
              Generar token
            </Button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-[0.8125rem] text-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer mx-auto"
            >
              Volver a iniciar sesión
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-[var(--c-text)]">Nueva contraseña</h2>
            <Input
              label="Token de recuperación"
              required
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
            />
            <Input
              label="Nueva contraseña"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
            {error && <p className="text-[0.8125rem] text-[var(--c-danger)]">{error}</p>}
            <Button type="submit" loading={loading} block>
              Actualizar contraseña
            </Button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-[0.8125rem] text-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer mx-auto"
            >
              Volver a iniciar sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
