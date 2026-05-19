"use client";

import { useEffect, useRef, useState } from "react";
import { apiUpload, apiGetBlob, ApiError } from "@/lib/api";
import { useSiteId } from "@/store/SiteContext";
import { useToast } from "@/components/ui/Toast";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

/** ¿Es una URL absoluta usable directamente por el navegador? */
function isAbsolute(v: string): boolean {
  return /^(https?:|data:)/i.test(v);
}

export default function ImageField({ label, value, onChange }: Props) {
  const siteId = useSiteId();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>("");

  // El asset vive en el sitio gestionado. Para una ruta relativa lo traemos
  // por el proxy (con auth) como blob; absolutas se usan tal cual.
  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    if (!value) {
      setPreview("");
    } else if (isAbsolute(value)) {
      setPreview(value);
    } else {
      const path = `/proxy/${siteId}/asset?path=${encodeURIComponent(value)}`;
      apiGetBlob(path)
        .then((blob) => {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          revoked = url;
          setPreview(url);
        })
        .catch(() => !cancelled && setPreview(""));
    }

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [value, siteId]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await apiUpload(siteId, file);
      onChange(res.path);
      toast.success("Imagen subida al sitio.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-[0.375rem]">
      <label className="text-[0.75rem] font-semibold text-[var(--c-text-sub)] tracking-[0.02em]">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-lg border border-[var(--c-border)] bg-[var(--c-hover)] flex items-center justify-center overflow-hidden shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="w-full h-full object-contain"
              onError={(ev) => ((ev.target as HTMLImageElement).style.opacity = "0.2")}
            />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/ruta/o/https://…"
            className="w-full px-3 py-[0.5rem] border border-[var(--c-border)] rounded-[0.625rem] text-sm font-[inherit] text-[var(--c-text)] bg-[var(--c-bg)] outline-none focus:border-[var(--c-text-sub)] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] placeholder:text-[var(--c-muted)]"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="self-start inline-flex items-center gap-1.5 text-[0.75rem] font-medium px-2.5 py-1 rounded-md border border-[var(--c-border)] text-[var(--c-text-sub)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent disabled:opacity-50"
          >
            {uploading ? (
              <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            )}
            Subir archivo
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
