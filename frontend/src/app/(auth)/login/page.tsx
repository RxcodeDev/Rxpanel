"use client";

import { useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { apiPost, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

type Mode = "login" | "recover" | "reset";

/** Errores de validación por campo (cliente). */
type FieldErrors = {
  email?: string;
  password?: string;
  resetToken?: string;
  newPassword?: string;
};

/* Paths de iconos Feather usados en esta pantalla. */
const ICON = {
  mail: [
    "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
    "M3.4 6.5l8.6 6 8.6-6",
  ],
  lock: [
    "M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z",
    "M8 11V7a4 4 0 0 1 8 0v4",
  ],
  hash: ["M4 9h16", "M4 15h16", "M10 3 8 21", "M16 3l-2 18"],
  eye: [
    "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z",
    "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  ],
  eyeOff: [
    "M9.88 9.88a3 3 0 1 0 4.24 4.24",
    "M10.73 5.08A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.16 3.19",
    "M6.61 6.61A17.6 17.6 0 0 0 2 12s3.5 7 10 7a10.4 10.4 0 0 0 5.4-1.6",
    "M2 2l20 20",
  ],
  alert: [
    "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.94a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
    "M12 9v4",
    "M12 17h.01",
  ],
  panel: [
    "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z",
    "M3 10h18",
    "M10 10v10",
  ],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/** Traduce cualquier error a un mensaje legible para el usuario. */
function msg(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return "Correo o contraseña incorrectos.";
    if (e.status === 0 || e.status >= 502) return "No se pudo conectar al servidor.";
    return e.message;
  }
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

/** Marca de la app: cuadro con el icono de panel. */
function BrandMark({ onDark = false, size = "md" }: { onDark?: boolean; size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-11 w-11 rounded-xl" : "h-9 w-9 rounded-[0.625rem]";
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${box} ${
        onDark
          ? "bg-[var(--c-bg)] text-[var(--c-text)]"
          : "bg-[var(--c-text)] text-[var(--c-bg)]"
      }`}
    >
      <Icon paths={ICON.panel} size={size === "lg" ? 24 : 20} />
    </span>
  );
}

const COPY: Record<Mode, { title: string; subtitle: string }> = {
  login: {
    title: "Iniciar sesión",
    subtitle: "Ingresa tus credenciales para acceder al panel.",
  },
  recover: {
    title: "Recuperar contraseña",
    subtitle: "Te generaremos un token para restablecer tu acceso.",
  },
  reset: {
    title: "Nueva contraseña",
    subtitle: "Ingresa el token recibido y define tu nueva contraseña.",
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  /** Limpia el error de un campo al editarlo. */
  function clearFieldError(key: keyof FieldErrors) {
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  /** Cambia de vista reseteando errores y estado sensible. */
  function switchMode(next: Mode) {
    setMode(next);
    setError(undefined);
    setFieldErrors({});
    setShowPassword(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const errs: FieldErrors = {};
    if (!email.trim()) errs.email = "Ingresa tu correo.";
    else if (!EMAIL_RE.test(email.trim())) errs.email = "El correo no es válido.";
    if (!password) errs.password = "Ingresa tu contraseña.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setError(undefined);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(msg(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    const errs: FieldErrors = {};
    if (!email.trim()) errs.email = "Ingresa tu correo.";
    else if (!EMAIL_RE.test(email.trim())) errs.email = "El correo no es válido.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setError(undefined);
    setLoading(true);
    try {
      const res = await apiPost<{ message: string; reset_token?: string }>("/auth/recover", {
        email: email.trim(),
      });
      if (res.reset_token) {
        setResetToken(res.reset_token);
        toast.success("Token de recuperación generado.");
        switchMode("reset");
      } else {
        toast.success("Si el correo existe, recibirás instrucciones.");
        switchMode("login");
      }
    } catch (err) {
      setError(msg(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const errs: FieldErrors = {};
    if (!resetToken.trim()) errs.resetToken = "Ingresa el token de recuperación.";
    if (!newPassword) errs.newPassword = "Ingresa una nueva contraseña.";
    else if (newPassword.length < MIN_PASSWORD)
      errs.newPassword = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setError(undefined);
    setLoading(true);
    try {
      await apiPost("/auth/reset", { token: resetToken.trim(), new_password: newPassword });
      toast.success("Contraseña actualizada. Inicia sesión.");
      setPassword("");
      setNewPassword("");
      switchMode("login");
    } catch (err) {
      setError(msg(err));
    } finally {
      setLoading(false);
    }
  }

  /** Botón para mostrar/ocultar la contraseña dentro del campo. */
  const passwordToggle = (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[var(--c-muted)] transition-colors hover:bg-[var(--c-hover)] hover:text-[var(--c-text)]"
    >
      <Icon paths={showPassword ? ICON.eyeOff : ICON.eye} size={16} />
    </button>
  );

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* ── Panel de marca + vista previa del producto (escritorio) ── */}
      <aside className="relative hidden flex-col overflow-hidden bg-[var(--c-text)] p-12 text-[var(--c-bg)] lg:flex xl:p-14">
        {/* Retícula decorativa sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in srgb, var(--c-bg) 4%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--c-bg) 4%, transparent) 1px, transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <BrandMark onDark />
          <span className="text-lg font-bold tracking-tight">Rxpanel</span>
        </div>

        {/* Texto + vista previa: un solo bloque centrado verticalmente */}
        <div className="relative z-10 flex flex-1 flex-col justify-center py-10">
          <div className="max-w-[24rem]">
            <h2 className="text-[1.9rem] font-bold leading-[1.14] tracking-tight xl:text-[2.2rem]">
              Un panel.
              <br />
              Todos tus sitios.
            </h2>
            <p className="mt-3.5 text-[0.9rem] leading-relaxed opacity-65">
              Gestiona usuarios, edita contenido, colores y logos, y publica
              cambios — todo desde un mismo lugar, sin tocar código.
            </p>
          </div>

          <div aria-hidden className="pointer-events-none mt-9 select-none">
            <AppPreview />
          </div>
        </div>
      </aside>

      {/* ── Panel del formulario ───────────────────────────── */}
      <main className="flex flex-col bg-[var(--c-hover)] px-6 py-10 sm:px-10">
        {/* Marca compacta (solo móvil) */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <BrandMark />
          <span className="text-lg font-bold tracking-tight text-[var(--c-text)]">
            Rxpanel
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[26rem]">
            <div className="rounded-[1.25rem] border border-[var(--c-border)] bg-[var(--c-bg)] p-7 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.22)] sm:p-9">
              <header className="mb-7">
                <BrandMark size="lg" />
                <h1 className="mt-5 text-[1.55rem] font-bold leading-tight tracking-tight text-[var(--c-text)]">
                  {COPY[mode].title}
                </h1>
                <p className="mt-1.5 text-sm text-[var(--c-text-sub)]">
                  {COPY[mode].subtitle}
                </p>
              </header>

              {mode === "login" && (
                <form onSubmit={handleLogin} noValidate className="flex flex-col gap-4">
                  <Input
                    label="Correo"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    icon={<Icon paths={ICON.mail} />}
                    value={email}
                    error={fieldErrors.email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError("email");
                    }}
                    placeholder="tu@correo.com"
                  />
                  <div>
                    <Input
                      label="Contraseña"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      icon={<Icon paths={ICON.lock} />}
                      trailing={passwordToggle}
                      value={password}
                      error={fieldErrors.password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError("password");
                      }}
                      placeholder="••••••••"
                    />
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => switchMode("recover")}
                        className="cursor-pointer text-[0.8125rem] font-medium text-[var(--c-text-sub)] transition-colors hover:text-[var(--c-text)]"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </div>

                  {error && <ErrorBanner message={error} />}

                  <Button type="submit" loading={loading} block>
                    Entrar
                  </Button>
                </form>
              )}

              {mode === "recover" && (
                <form onSubmit={handleRecover} noValidate className="flex flex-col gap-4">
                  <Input
                    label="Correo"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    icon={<Icon paths={ICON.mail} />}
                    value={email}
                    error={fieldErrors.email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError("email");
                    }}
                    placeholder="tu@correo.com"
                  />

                  {error && <ErrorBanner message={error} />}

                  <Button type="submit" loading={loading} block>
                    Generar token
                  </Button>
                  <BackLink onClick={() => switchMode("login")} />
                </form>
              )}

              {mode === "reset" && (
                <form onSubmit={handleReset} noValidate className="flex flex-col gap-4">
                  <Input
                    label="Token de recuperación"
                    autoComplete="off"
                    autoFocus
                    icon={<Icon paths={ICON.hash} />}
                    value={resetToken}
                    error={fieldErrors.resetToken}
                    onChange={(e) => {
                      setResetToken(e.target.value);
                      clearFieldError("resetToken");
                    }}
                    placeholder="Pega aquí el token"
                  />
                  <Input
                    label="Nueva contraseña"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    icon={<Icon paths={ICON.lock} />}
                    trailing={passwordToggle}
                    value={newPassword}
                    error={fieldErrors.newPassword}
                    hint={`Mínimo ${MIN_PASSWORD} caracteres.`}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      clearFieldError("newPassword");
                    }}
                    placeholder="••••••••"
                  />

                  {error && <ErrorBanner message={error} />}

                  <Button type="submit" loading={loading} block>
                    Actualizar contraseña
                  </Button>
                  <BackLink onClick={() => switchMode("login")} />
                </form>
              )}
            </div>

            <p className="mt-6 text-center text-[0.8125rem] text-[var(--c-muted)]">
              ¿Problemas para acceder? Contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Vista previa del panel ─────────────────────────────────
   Maqueta monocroma del dashboard real (sidebar + tarjetas de
   sitio). Aporta profundidad y muestra el producto. */
function AppPreview() {
  const STATUS = ["--c-st-active", "--c-st-maint", "--c-st-active", "--c-st-inactive", "--c-st-active", "--c-st-maint"];
  return (
    <div className="w-full max-w-[31rem] overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.6)]">
      {/* Barra de título */}
      <div className="flex items-center gap-1.5 border-b border-[var(--c-line)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--c-border)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--c-border)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--c-border)]" />
        <span className="ml-3 h-4 w-40 rounded-full bg-[var(--c-hover)]" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="flex w-[7.5rem] flex-col gap-1.5 border-r border-[var(--c-line)] p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-5 w-5 rounded-md bg-[var(--c-text)]" />
            <span className="h-2 w-12 rounded-full bg-[var(--c-muted)]" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                i === 0 ? "bg-[var(--c-active-pill)]" : ""
              }`}
            >
              <span
                className={`h-3 w-3 rounded ${i === 0 ? "bg-[var(--c-text)]" : "bg-[var(--c-border)]"}`}
              />
              <span
                className={`h-1.5 flex-1 rounded-full ${
                  i === 0 ? "bg-[var(--c-muted)]" : "bg-[var(--c-border)]"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-2.5 w-24 rounded-full bg-[var(--c-text)]" />
              <div className="h-1.5 w-16 rounded-full bg-[var(--c-border)]" />
            </div>
            <div className="h-7 w-20 rounded-lg bg-[var(--c-text)]" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {STATUS.map((token, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--c-border)] p-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-md bg-[var(--c-hover)]" />
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 w-[80%] rounded-full bg-[var(--c-muted)]" />
                    <div className="h-1 w-[55%] rounded-full bg-[var(--c-border)]" />
                  </div>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: `var(${token})` }}
                  />
                </div>
                <div className="mt-2.5 space-y-1">
                  <div className="h-1 w-full rounded-full bg-[var(--c-line)]" />
                  <div className="h-1 w-[70%] rounded-full bg-[var(--c-line)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Aviso de error general (fallos de API o de conexión). */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-[0.625rem] border border-[var(--c-danger)] px-3 py-2.5 text-[0.8125rem] text-[var(--c-danger)]"
      style={{ background: "color-mix(in srgb, var(--c-danger) 8%, transparent)" }}
    >
      <span className="mt-px shrink-0">
        <Icon paths={ICON.alert} size={16} />
      </span>
      <span>{message}</span>
    </div>
  );
}

/** Enlace para volver a la pantalla de inicio de sesión. */
function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto cursor-pointer text-[0.8125rem] font-medium text-[var(--c-text-sub)] transition-colors hover:text-[var(--c-text)]"
    >
      Volver a iniciar sesión
    </button>
  );
}
