"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { SiteLogos } from "@/types/api";
import Spinner from "@/components/ui/Spinner";
import ImageField from "@/components/features/editor/ImageField";

export default function LogosTab({
  siteId,
  saveNonce,
  onSaveInfo,
}: {
  siteId: number;
  saveNonce: number;
  onSaveInfo: (info: { saving: boolean; dirty: boolean }) => void;
}) {
  const toast = useToast();
  const [logos, setLogos] = useState<SiteLogos>({});
  // JSON de la última versión cargada/guardada — para detectar cambios sin guardar.
  const [savedJson, setSavedJson] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    setErr(undefined);
    try {
      const res = await apiGet<SiteLogos>(`/proxy/${siteId}/logos`);
      setLogos(res);
      setSavedJson(JSON.stringify(res));
    } catch (e) {
      setErr(e instanceof ApiError ? `${e.status} — ${e.message}` : "No se pudieron cargar los logos.");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  // Guardado coordinado desde el header de la página.
  const saveRef = useRef<() => void>(() => {});
  const handledNonce = useRef(saveNonce);
  useEffect(() => {
    if (saveNonce !== handledNonce.current) {
      handledNonce.current = saveNonce;
      saveRef.current();
    }
  }, [saveNonce]);
  const dirty = !loading && !err && JSON.stringify(logos) !== savedJson;
  useEffect(() => {
    onSaveInfo({ saving, dirty });
  }, [saving, dirty, onSaveInfo]);

  async function save() {
    setSaving(true);
    try {
      await apiPut(`/proxy/${siteId}/logos`, logos);
      setSavedJson(JSON.stringify(logos));
      toast.success("Logos guardados.");
    } catch (e) {
      toast.error(e instanceof ApiError ? `${e.status} — ${e.message}` : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }
  saveRef.current = save;

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
    </div>
  );
}
