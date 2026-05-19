"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { SiteLogos } from "@/types/api";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import ImageField from "@/components/features/editor/ImageField";

export default function LogosTab({ siteId }: { siteId: number }) {
  const toast = useToast();
  const [logos, setLogos] = useState<SiteLogos>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    setErr(undefined);
    try {
      setLogos(await apiGet<SiteLogos>(`/proxy/${siteId}/logos`));
    } catch (e) {
      setErr(e instanceof ApiError ? `${e.status} — ${e.message}` : "No se pudieron cargar los logos.");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    try {
      await apiPut(`/proxy/${siteId}/logos`, logos);
      toast.success("Logos guardados.");
    } catch (e) {
      toast.error(e instanceof ApiError ? `${e.status} — ${e.message}` : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size={26} />
      </div>
    );

  if (err)
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-[var(--c-muted)]">
        <p className="text-sm text-[var(--c-danger)]">{err}</p>
        <button type="button" onClick={load} className="text-[0.8125rem] underline cursor-pointer hover:text-[var(--c-text)]">
          Reintentar
        </button>
      </div>
    );

  return (
    <div className="max-w-lg flex flex-col gap-5">
      <ImageField
        label="Logo"
        value={logos.logo_url ?? ""}
        onChange={(v) => setLogos((l) => ({ ...l, logo_url: v }))}
      />
      <ImageField
        label="Favicon"
        value={logos.favicon_url ?? ""}
        onChange={(v) => setLogos((l) => ({ ...l, favicon_url: v }))}
      />
      <div>
        <Button onClick={save} loading={saving} className="!w-auto">
          Guardar logos
        </Button>
      </div>
    </div>
  );
}
