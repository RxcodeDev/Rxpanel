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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setName(site?.name ?? "");
    setUrl(site?.url ?? "");
    setDescription(site?.description ?? "");
    setStatus(site?.status ?? "active");
    setIsSsl(site?.is_ssl ?? true);
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
