"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";
import SearchSelect from "@/components/ui/SearchSelect";
import { STATUS_OPTIONS } from "./StatusBadge";
import { apiPost, apiPatch, ApiError, BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import type { Site, SiteInput, SiteStatus } from "@/types/api";
import { SITE_ICONS, ICON_COLORS, SiteIcon, getSiteIcon, DEFAULT_ICON_COLOR } from "@/lib/siteIcons";

interface Props {
  open: boolean;
  site: Site | null; // null = crear
  onClose: () => void;
  onSaved: () => void;
}

export default function SiteFormModal({ open, site, onClose, onSaved }: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<SiteStatus>("active");
  const [isSsl, setIsSsl] = useState(true);
  const [apiToken, setApiToken] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [iconColor, setIconColor] = useState<string>(DEFAULT_ICON_COLOR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  // Auto-detección de compatibilidad Rxpanel
  const [urlCheck, setUrlCheck] = useState<"idle" | "checking" | "compatible" | "incompatible">("idle");
  const [sitePassword, setSitePassword] = useState("");
  const [tokenFetch, setTokenFetch] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [tokenFetchError, setTokenFetchError] = useState<string>();
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [iconPanelRect, setIconPanelRect] = useState<DOMRect | null>(null);
  const [colorPanelRect, setColorPanelRect] = useState<DOMRect | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const colorBtnRef = useRef<HTMLButtonElement>(null);
  // Evita re-verificar cuando el URL es auto-completado por la detección
  const autoUrlUpdate = useRef(false);

  useEffect(() => {
    if (!open) return;
    setName(site?.name ?? "");
    setUrl(site?.url ?? "");
    setDescription(site?.description ?? "");
    setStatus(site?.status ?? "active");
    setIsSsl(site?.is_ssl ?? true);
    setIcon(site?.icon ?? null);
    setIconColor(site?.icon_color ?? DEFAULT_ICON_COLOR);
    setApiToken("");
    setError(undefined);
    setIconPickerOpen(false);
    setColorPickerOpen(false);
    setIconPanelRect(null);
    setColorPanelRect(null);
    setUrlCheck("idle");
    setSitePassword("");
    setTokenFetch("idle");
    setTokenFetchError(undefined);
  }, [open, site]);

  // Detecta automáticamente si el URL apunta a un sitio con rxpanel instalado
  useEffect(() => {
    // El URL fue auto-completado por la detección — no re-verificar
    if (autoUrlUpdate.current) {
      autoUrlUpdate.current = false;
      return;
    }
    setSitePassword("");
    setTokenFetch("idle");
    setTokenFetchError(undefined);
    if (!url.trim()) { setUrlCheck("idle"); return; }
    setUrlCheck("checking");
    const timer = setTimeout(async () => {
      try {
        const normalized = url.replace(/\/+$/, "");
        // Si el usuario ingresó solo el dominio, buscar la ruta estándar del adaptador
        const authUrl = normalized.endsWith("/api/rxpanel")
          ? `${normalized}/auth`
          : `${normalized}/api/rxpanel/auth`;
        const res = await fetch(`${BASE_URL}/sites/probe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ url: authUrl }),
          signal: AbortSignal.timeout(9000),
        });
        if (res.status === 400) {
          const data: { error?: string } = await res.json().catch(() => ({}));
          if (typeof data.error === "string") {
            // Auto-completa la URL con /api/rxpanel si el usuario puso solo el dominio
            if (!normalized.endsWith("/api/rxpanel")) {
              autoUrlUpdate.current = true;
              setUrl(`${normalized}/api/rxpanel`);
            }
            setUrlCheck("compatible");
            return;
          }
        }
        setUrlCheck("incompatible");
      } catch {
        setUrlCheck("incompatible");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [url]);

  function openIconPicker() {
    setIconPanelRect(rowRef.current?.getBoundingClientRect() ?? null);
    setIconPickerOpen(true);
    setColorPickerOpen(false);
  }

  function openColorPicker() {
    setColorPanelRect(colorBtnRef.current?.getBoundingClientRect() ?? null);
    setColorPickerOpen(true);
    setIconPickerOpen(false);
  }

  // Genera el token automáticamente usando la contraseña del sitio gestionado
  async function handleConnectSite() {
    if (!sitePassword.trim() || !url.trim()) return;
    setTokenFetch("loading");
    setTokenFetchError(undefined);
    try {
      const normalized = url.replace(/\/+$/, "");
      const res = await fetch(`${BASE_URL}/sites/probe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ url: `${normalized}/auth`, password: sitePassword }),
        signal: AbortSignal.timeout(10000),
      });
      const data: { token?: string; error?: string } = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        setApiToken(data.token);
        setTokenFetch("success");
      } else {
        setTokenFetchError(data.error ?? "No se pudo obtener el token.");
        setTokenFetch("error");
      }
    } catch {
      setTokenFetchError("No se pudo conectar al sitio.");
      setTokenFetch("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      if (site) {
        const patch: Partial<SiteInput> = {
          name,
          url,
          description: description || null,
          status,
          is_ssl: isSsl,
          icon,
          icon_color: iconColor,
        };
        if (apiToken.trim()) patch.api_token = apiToken.trim();
        await apiPatch(`/sites/${site.id}`, patch);
        toast.success("Sitio actualizado.");
      } else {
        const body: SiteInput = {
          name,
          url,
          description: description || null,
          status,
          is_ssl: isSsl,
          icon,
          icon_color: iconColor,
          api_token: apiToken.trim() || null,
        };
        await apiPost("/sites/", body);
        toast.success("Sitio creado.");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el sitio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={site ? "Editar sitio" : "Nuevo sitio"} wide>
      <form onSubmit={handleSubmit} className="flex flex-col gap-0" autoComplete="off">

        {/* Grid 2 columnas */}
        <div className="grid grid-cols-2 gap-x-8 pb-5 mb-5 border-b border-[var(--c-line)]">

          {/* Columna izquierda: identidad + información */}
          <div className="flex flex-col gap-5">

            {/* Identidad visual */}
            <div className="flex flex-col gap-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--c-muted)]">
                Identidad visual
              </span>
              <div ref={rowRef} className="flex items-center gap-2">
                {/* Preview */}
                <div
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: `${iconColor}18`, border: `1.5px solid ${iconColor}44` }}
                >
                  {icon ? (
                    <SiteIcon iconKey={icon} color={iconColor} size={18} />
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="var(--c-border)" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                  )}
                </div>
                {/* Selector de icono */}
                <button
                  type="button"
                  onClick={() => iconPickerOpen ? setIconPickerOpen(false) : openIconPicker()}
                  className="flex-1 flex items-center justify-between gap-2 px-3 h-9 rounded-[0.625rem] border text-[0.8125rem] cursor-pointer transition-colors"
                  style={{ borderColor: iconPickerOpen ? "var(--c-text-sub)" : "var(--c-border)", background: "var(--c-bg)" }}
                >
                  {icon
                    ? <span className="text-[var(--c-text)]">{getSiteIcon(icon)?.label}</span>
                    : <span className="text-[var(--c-muted)]">Sin icono</span>
                  }
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
                    style={{ color: "var(--c-muted)", transform: iconPickerOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {/* Punto de color */}
                <button
                  ref={colorBtnRef}
                  type="button"
                  onClick={() => colorPickerOpen ? setColorPickerOpen(false) : openColorPicker()}
                  className="shrink-0 w-9 h-9 rounded-xl cursor-pointer transition-all hover:scale-105"
                  style={{
                    background: iconColor,
                    outline: colorPickerOpen ? `2.5px solid ${iconColor}` : "none",
                    outlineOffset: colorPickerOpen ? "2px" : "0",
                  }}
                />
              </div>
            </div>

            {/* Información */}
            <div className="flex flex-col gap-3">
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--c-muted)]">
                Información
              </span>
              <Input
                label="Nombre"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mi sitio"
                autoFocus={!site}
              />
              <Input
                label="URL base"
                type="url"
                required
                autoComplete="off"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://misitio.com"
                hint="URL del sitio o raíz de la API. Si tiene rxpanel instalado se detecta automáticamente."
              />
              <Textarea
                label="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional"
                rows={3}
              />
            </div>

          </div>

          {/* Columna derecha: configuración + seguridad */}
          <div className="flex flex-col gap-5">

            {/* Configuración */}
            <div className="flex flex-col gap-3">
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--c-muted)]">
                Configuración
              </span>
              <SearchSelect
                label="Estado"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(v) => setStatus(v as SiteStatus)}
                searchable={false}
              />
              <div
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border"
                style={{ borderColor: "var(--c-border)" }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-[var(--c-text)]">SSL habilitado</span>
                  <span className="text-[0.75rem] text-[var(--c-muted)]">
                    El sitio se sirve sobre HTTPS.
                  </span>
                </div>
                <Toggle checked={isSsl} onChange={setIsSsl} />
              </div>
            </div>

            {/* Seguridad */}
            <div className="flex flex-col gap-3">
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--c-muted)]">
                Seguridad
              </span>
              <div
                className="flex flex-col gap-3 p-4 rounded-xl"
                style={{ background: "var(--c-hover)", border: "1px solid var(--c-line)" }}
              >
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="var(--c-muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-[0.75rem] font-semibold text-[var(--c-text-sub)]">
                    API token
                  </span>
                  {urlCheck === "compatible" && (
                    <span
                      className="ml-auto flex items-center gap-1 text-[0.65rem] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                      Rxpanel detectado
                    </span>
                  )}
                  {urlCheck === "checking" && (
                    <span className="ml-auto text-[0.65rem] text-[var(--c-muted)] animate-pulse">
                      Verificando sitio…
                    </span>
                  )}
                </div>

                {urlCheck === "compatible" ? (
                  <>
                    {tokenFetch === "success" ? (
                      <div className="flex items-center gap-2">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                        <span className="text-[0.75rem] font-medium" style={{ color: "#16a34a" }}>
                          Token generado y listo para guardar.
                        </span>
                        <button
                          type="button"
                          className="ml-auto text-[0.65rem] text-[var(--c-muted)] underline cursor-pointer"
                          onClick={() => setTokenFetch("idle")}
                        >
                          Regenerar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Input
                            type="password"
                            autoComplete="new-password"
                            value={sitePassword}
                            onChange={(e) => setSitePassword(e.target.value)}
                            placeholder={site ? "Contraseña para actualizar token" : "Contraseña del sitio"}
                          />
                        </div>
                        <Button
                          type="button"
                          loading={tokenFetch === "loading"}
                          onClick={handleConnectSite}
                        >
                          Conectar
                        </Button>
                      </div>
                    )}
                    {tokenFetch === "error" && tokenFetchError && (
                      <p className="text-[0.7rem] text-[var(--c-danger)]">{tokenFetchError}</p>
                    )}
                  </>
                ) : (
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder={site ? "Dejar vacío para conservar el actual" : "Token Bearer del sitio gestionado"}
                  />
                )}
                <p className="text-[0.7rem] text-[var(--c-muted)] leading-relaxed">
                  Se almacena cifrado en el backend. Una vez guardado no se vuelve a mostrar.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Error + botones */}
        {error && (
          <p className="text-[0.8125rem] text-[var(--c-danger)] pb-3">{error}</p>
        )}
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {site ? "Guardar cambios" : "Crear sitio"}
          </Button>
        </div>
      </form>
    </Modal>

    {/* Portal: selector de iconos */}
    {iconPickerOpen && iconPanelRect && createPortal(
      <>
        <div className="fixed inset-0 z-[200]" onClick={() => setIconPickerOpen(false)} />
        <div
          className="fixed z-[201] bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl p-2 shadow-xl"
          style={{ top: iconPanelRect.bottom + 4, left: iconPanelRect.left, width: iconPanelRect.width }}
        >
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(1.75rem, 1fr))" }}
          >
            {SITE_ICONS.map((d) => {
              const active = icon === d.key;
              return (
                <button
                  key={d.key}
                  type="button"
                  title={d.label}
                  onClick={() => { setIcon(active ? null : d.key); setIconPickerOpen(false); }}
                  className="h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all"
                  style={{
                    background: active ? `${iconColor}18` : "transparent",
                    outline: active ? `1.5px solid ${iconColor}` : "none",
                  }}
                >
                  <SiteIcon iconKey={d.key} color={active ? iconColor : "var(--c-text-sub)"} size={14} />
                </button>
              );
            })}
          </div>
        </div>
      </>,
      document.body
    )}

    {/* Portal: selector de colores */}
    {colorPickerOpen && colorPanelRect && createPortal(
      <>
        <div className="fixed inset-0 z-[200]" onClick={() => setColorPickerOpen(false)} />
        <div
          className="fixed z-[201] bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl p-3 shadow-xl"
          style={{
            top: colorPanelRect.bottom + 4,
            right: window.innerWidth - colorPanelRect.right,
            width: "11rem",
          }}
        >
          <div className="flex flex-wrap gap-2">
            {ICON_COLORS.map((c) => {
              const active = iconColor.toLowerCase() === c.value.toLowerCase();
              return (
                <button
                  key={c.key}
                  type="button"
                  title={c.key}
                  onClick={() => { setIconColor(c.value); setColorPickerOpen(false); }}
                  className="w-6 h-6 rounded-full cursor-pointer transition-all hover:scale-110"
                  style={{
                    background: c.value,
                    outline: active ? `2px solid ${c.value}` : "none",
                    outlineOffset: active ? "2px" : "0",
                    transform: active ? "scale(1.15)" : "none",
                  }}
                />
              );
            })}
          </div>
        </div>
      </>,
      document.body
    )}
  </>);
}
