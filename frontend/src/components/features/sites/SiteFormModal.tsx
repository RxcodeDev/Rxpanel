"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";
import SearchSelect from "@/components/ui/SearchSelect";
import { STATUS_OPTIONS } from "./StatusBadge";
import { apiPost, apiPatch, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Site, SiteInput, SiteStatus } from "@/types/api";
import { SITE_ICONS, ICON_COLORS, SiteIcon, DEFAULT_ICON_COLOR } from "@/lib/siteIcons";

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
  }, [open, site]);

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
    <Modal open={open} onClose={onClose} title={site ? "Editar sitio" : "Nuevo sitio"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Icono y color */}
        <div className="flex flex-col gap-2">
          <label className="text-[0.75rem] font-semibold text-[var(--c-text-sub)] tracking-[0.02em]">
            Icono y color
          </label>
          <div className="flex items-stretch gap-3">
            {/* Preview */}
            <div
              className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ border: "1px solid var(--c-border)", background: "var(--c-bg)" }}
            >
              {icon ? (
                <SiteIcon iconKey={icon} color={iconColor} size={22} />
              ) : (
                <span className="text-[0.65rem] text-[var(--c-muted)]">—</span>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              {/* Icon grid */}
              <div
                className="flex flex-wrap gap-1 p-2 rounded-lg max-h-[7.5rem] overflow-y-auto"
                style={{ border: "1px solid var(--c-border)" }}
              >
                {SITE_ICONS.map((d) => {
                  const active = icon === d.key;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      title={d.label}
                      onClick={() => setIcon(active ? null : d.key)}
                      className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer transition-colors"
                      style={{
                        background: active ? "var(--c-hover)" : "transparent",
                        outline: active ? `1.5px solid ${iconColor}` : "none",
                      }}
                    >
                      <SiteIcon iconKey={d.key} color={active ? iconColor : "var(--c-text-sub)"} size={16} />
                    </button>
                  );
                })}
              </div>
              {/* Color swatches */}
              <div className="flex flex-wrap gap-1.5">
                {ICON_COLORS.map((c) => {
                  const active = iconColor.toLowerCase() === c.value.toLowerCase();
                  return (
                    <button
                      key={c.key}
                      type="button"
                      title={c.key}
                      onClick={() => setIconColor(c.value)}
                      className="w-5 h-5 rounded-full cursor-pointer transition-transform"
                      style={{
                        background: c.value,
                        outline: active ? "2px solid var(--c-text)" : "1px solid var(--c-border)",
                        outlineOffset: active ? 2 : 0,
                        transform: active ? "scale(1.1)" : "none",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <Input
          label="Nombre"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mi sitio"
        />
        <Input
          label="URL base"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://misitio.com"
          hint="Raíz de la API del sitio gestionado (se le añaden /content, /colors, /logos)."
        />
        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional"
        />
        <SearchSelect
          label="Estado"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => setStatus(v as SiteStatus)}
          searchable={false}
        />
        <Toggle
          checked={isSsl}
          onChange={setIsSsl}
          label="SSL habilitado"
          description="El sitio se sirve sobre HTTPS."
        />
        <Input
          label={site ? "API token (dejar vacío para conservar)" : "API token"}
          type="password"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          placeholder="Token Bearer del sitio gestionado"
          hint="Se almacena cifrado en el backend y nunca se vuelve a mostrar."
        />
        {error && <p className="text-[0.8125rem] text-[var(--c-danger)]">{error}</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {site ? "Guardar cambios" : "Crear sitio"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
