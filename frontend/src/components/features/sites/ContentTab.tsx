"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPut, apiGetBlob, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useSiteId } from "@/store/SiteContext";
import { CONTENT_SECTIONS } from "@/lib/sections";
import type { JsonValue } from "@/types/api";
import Icon from "@/components/ui/Icon";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import SchemaEditor from "@/components/features/editor/SchemaEditor";

function derivePublicUrl(url: string): string {
  return url
    .replace(/\/api\/(admin|v\d+)\/?$/, "")
    .replace(/\/admin\/?$/, "")
    .replace(/\/$/, "")
    .replace(/host\.docker\.internal/g, "localhost");
}

const DESKTOP_W = 1280;
const PHONE_W = 390;
const PHONE_H = 844;
const PHONE_SIDE = 12;
const PHONE_TOP = 44;
const PHONE_BOTTOM = 24;
const FRAME_W = PHONE_W + PHONE_SIDE * 2;
const FRAME_H = PHONE_H + PHONE_TOP + PHONE_BOTTOM;

const IFRAME_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups";

/* ── Vista escritorio ───────────────────────────────────────── */

function DesktopPreview({
  url,
  sectionKey,
}: {
  url: string;
  sectionKey: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setDims({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scale = dims.w > 0 ? dims.w / DESKTOP_W : 1;
  const iframeH = scale > 0 ? Math.round(dims.h / scale) : 800;

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden h-full"
      style={{ border: "1px solid rgba(0,0,0,0.12)", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}
    >
      {/* Chrome bar */}
      <div
        className="shrink-0 flex items-center gap-2 px-3 py-1.5"
        style={{
          background: "#1e1e20",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57", display: "inline-block" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e", display: "inline-block" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840", display: "inline-block" }} />
        </div>
        <div
          className="flex-1 flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[0.68rem] font-mono"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", color: "#d0d0d0", minWidth: 0 }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7ec87e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="truncate flex-1">{url}</span>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((n) => n + 1)}
          title="Recargar"
          className="w-5 h-5 flex items-center justify-center rounded cursor-pointer transition-colors"
          style={{ color: "#aaa" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "#aaa")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          title="Abrir en nueva pestaña"
          className="w-5 h-5 flex items-center justify-center rounded transition-colors"
          style={{ color: "#aaa" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "#aaa")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" /><path d="M10 14L21 3" />
          </svg>
        </a>
      </div>

      {/* Viewport escalado */}
      <div ref={wrapperRef} className="flex-1 min-h-0 overflow-hidden relative" style={{ background: "#fff" }}>
        {dims.w > 0 && (
          <iframe
            key={`${sectionKey}-desktop-${reloadKey}`}
            src={url}
            title="Vista escritorio"
            style={{
              width: `${DESKTOP_W}px`,
              height: `${iframeH}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
              border: "none",
            }}
            sandbox={IFRAME_SANDBOX}
          />
        )}
      </div>

      <div
        className="shrink-0 px-3 py-1 text-center text-[0.65rem]"
        style={{ background: "#1e1e20", color: "#777", borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        Si no carga usa «abrir en nueva pestaña» ↗
      </div>
    </div>
  );
}

/* ── Vista móvil ────────────────────────────────────────────── */

function MobilePreview({
  url,
  sectionKey,
}: {
  url: string;
  sectionKey: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setDims({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const INFO_H = 40;
  const scale =
    dims.w > 0 && dims.h > 0
      ? Math.min((dims.w - 24) / FRAME_W, (dims.h - INFO_H - 20) / FRAME_H) * 0.97
      : 0.4;

  const phoneVisualW = Math.round(FRAME_W * scale);
  const phoneVisualH = Math.round(FRAME_H * scale);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-end justify-center gap-3 h-full min-h-0"
    >
      {dims.w > 0 && (
        <>
          {/* Teléfono — wrapper del tamaño visual exacto para que el layout respete la escala */}
          <div style={{ width: phoneVisualW, height: phoneVisualH, position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: FRAME_W,
                height: FRAME_H,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
                background: "#1c1c1e",
                borderRadius: "52px",
                boxShadow: "0 0 0 1.5px #3a3a3c, 0 20px 48px rgba(0,0,0,0.35)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: `${PHONE_TOP}px ${PHONE_SIDE}px ${PHONE_BOTTOM}px`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 126,
                  height: 34,
                  background: "#000",
                  borderRadius: 20,
                  zIndex: 10,
                }}
              />
              <div
                style={{
                  width: PHONE_W,
                  height: PHONE_H,
                  overflow: "hidden",
                  borderRadius: 40,
                  background: "#fff",
                  flexShrink: 0,
                }}
              >
                <iframe
                  key={`${sectionKey}-mobile-${reloadKey}`}
                  src={url}
                  title="Vista móvil"
                  style={{ width: PHONE_W, height: PHONE_H, border: "none", display: "block" }}
                  sandbox={IFRAME_SANDBOX}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 134,
                  height: 5,
                  background: "rgba(255,255,255,0.25)",
                  borderRadius: 3,
                }}
              />
            </div>
          </div>

          {/* Pill de acciones */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: "var(--c-hover)", border: "1px solid var(--c-border)" }}
          >
            <span className="text-[0.65rem] text-[var(--c-muted)] font-mono truncate" style={{ maxWidth: 220 }}>
              {url}
            </span>
            <button
              type="button"
              onClick={() => setReloadKey((n) => n + 1)}
              title="Recargar"
              className="w-5 h-5 flex items-center justify-center text-[var(--c-muted)] hover:text-[var(--c-text)] cursor-pointer transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              title="Abrir en nueva pestaña"
              className="w-5 h-5 flex items-center justify-center text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <path d="M15 3h6v6" /><path d="M10 14L21 3" />
              </svg>
            </a>
          </div>
        </>
      )}
    </div>
  );
}

/* ── SEO / Meta Preview ─────────────────────────────────────── */

function ResolvedImage({
  src, alt, className, style, fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallback: React.ReactNode;
}) {
  const siteId = useSiteId();
  const [resolved, setResolved] = useState<string>("");

  useEffect(() => {
    let stale = false;
    let objectUrl: string | null = null;
    if (!src) { setResolved(""); return; }
    if (/^(https?:|data:|blob:)/i.test(src)) { setResolved(src); return; }
    apiGetBlob(`/proxy/${siteId}/asset?path=${encodeURIComponent(src)}`)
      .then((blob) => {
        if (stale) return;
        if (!blob.type.startsWith("image/")) { setResolved(""); return; }
        objectUrl = URL.createObjectURL(blob);
        setResolved(objectUrl);
      })
      .catch(() => { if (!stale) setResolved(""); });
    return () => {
      stale = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, siteId]);

  if (!resolved) return <>{fallback}</>;
  return <img src={resolved} alt={alt} className={className} style={style} />;
}

/* Pill palette (mirrors SchemaEditor's keyword pills) */
const KEYWORD_PILL_PALETTES: React.CSSProperties[] = [
  { background: "#EEF2FF", border: "1px solid #C7D2FE", color: "#4338CA" },
  { background: "#ECFDF5", border: "1px solid #6EE7B7", color: "#059669" },
  { background: "#FFF1F2", border: "1px solid #FECDD3", color: "#E11D48" },
  { background: "#FFFBEB", border: "1px solid #FDE68A", color: "#D97706" },
  { background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0284C7" },
  { background: "#FAF5FF", border: "1px solid #E9D5FF", color: "#7C3AED" },
  { background: "#F0FDFA", border: "1px solid #99F6E4", color: "#0D9488" },
  { background: "#FFF7ED", border: "1px solid #FED7AA", color: "#EA580C" },
];

/* Brand logos (used in MetaPreview section headers) */
function GoogleG({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
function GoogleLogo() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium" style={{ color: "var(--c-text-sub)" }}>
      <GoogleG size={13} />
      Google
    </span>
  );
}
function FacebookLogo() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium" style={{ color: "var(--c-text-sub)" }}>
      <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#1877F2" d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.469H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
      </svg>
      Facebook
    </span>
  );
}
function XLogo() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium" style={{ color: "var(--c-text-sub)" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      X
    </span>
  );
}

function MetaPreview({ data, siteUrl }: { data: JsonValue; siteUrl?: string }) {
  const meta =
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  const title = String(meta.title ?? "Sin título");
  const description = String(meta.description ?? "");
  const ogTitle = String(meta.ogTitle ?? title);
  const ogDescription = String(meta.ogDescription ?? description);
  const ogImage = typeof meta.ogImage === "string" ? meta.ogImage : "";
  const robots = typeof meta.robots === "string" ? meta.robots : "index, follow";
  const canonical = typeof meta.canonicalUrl === "string" ? meta.canonicalUrl : "";
  const twitterSite = typeof meta.twitterSite === "string" ? meta.twitterSite : "";
  const twitterCard = typeof meta.twitterCard === "string" ? meta.twitterCard : "summary_large_image";
  const keywords: string[] = Array.isArray(meta.keywords)
    ? (meta.keywords as string[]).map(String)
    : typeof meta.keywords === "string"
    ? [meta.keywords]
    : [];

  const siteLabel = siteUrl
    ? siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "yoursite.com";

  return (
    <div className="overflow-y-auto h-full flex flex-col gap-6 pr-1" style={{ paddingBottom: 24 }}>
      {/* ── Google SERP ── */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <GoogleLogo />
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
            Resultado en Google
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{
            background: "#fff",
            border: "1px solid #dadce0",
            fontFamily: "arial, sans-serif",
            boxShadow: "0 1px 6px rgba(32,33,36,0.08)",
          }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#fff", border: "1px solid #dadce0" }}
            >
              <GoogleG size={16} />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-[0.78rem] leading-tight" style={{ color: "#202124" }}>{siteLabel}</span>
              <span className="text-[0.68rem] leading-tight" style={{ color: "#5f6368" }}>
                https://{siteLabel} &rsaquo; ...
              </span>
            </div>
          </div>
          <p
            className="text-[1.125rem] leading-snug mb-0.5 line-clamp-1"
            style={{ color: "#1a0dab", fontFamily: "arial, sans-serif" }}
          >
            {title || <span style={{ color: "#9aa0a6" }}>Sin título</span>}
          </p>
          <p className="text-[0.8125rem] leading-snug line-clamp-2" style={{ color: "#4d5156" }}>
            {description || <span style={{ color: "#9aa0a6", fontStyle: "italic" }}>Sin descripción</span>}
          </p>
        </div>
      </section>

      {/* ── Open Graph / Facebook ── */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <FacebookLogo />
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
            Open Graph &middot; Facebook / LinkedIn
          </p>
        </div>
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: "#fff",
            border: "1px solid #dddfe2",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, sans-serif",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        >
          <ResolvedImage
            src={ogImage}
            alt="OG preview"
            className="w-full object-cover"
            style={{ aspectRatio: "1.91/1", display: "block" }}
            fallback={
              <div
                className="w-full flex flex-col items-center justify-center gap-1 text-xs"
                style={{ aspectRatio: "1.91/1", background: "#f0f2f5", color: "#65676b" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                </svg>
                <span>Imagen OG (1200 × 630)</span>
              </div>
            }
          />

          <div style={{ background: "#f0f2f5", padding: "10px 14px" }}>
            <p className="text-[0.68rem] uppercase" style={{ color: "#65676b", letterSpacing: "0.05em" }}>{siteLabel}</p>
            <p className="font-semibold text-[0.95rem] leading-snug mt-1 line-clamp-1" style={{ color: "#050505" }}>{ogTitle}</p>
            <p className="text-[0.8125rem] mt-0.5 leading-snug line-clamp-2" style={{ color: "#65676b" }}>
              {ogDescription}
            </p>
          </div>
        </div>
      </section>

      {/* ── X (Twitter) Card ── */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <XLogo />
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
            X (Twitter) <span style={{ textTransform: "none", fontWeight: 400, opacity: 0.7 }}>· {twitterCard}</span>
          </p>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#000",
            border: "1px solid #2f3336",
            fontFamily: "'TwitterChirp', system-ui, -apple-system, 'Segoe UI', sans-serif",
          }}
        >
          {twitterCard === "summary_large_image" && (
            <div className="relative">
              <ResolvedImage
                src={ogImage}
                alt="Twitter card"
                className="w-full object-cover"
                style={{ aspectRatio: "2/1", display: "block" }}
                fallback={
                  <div className="w-full flex items-center justify-center text-xs" style={{ aspectRatio: "2/1", background: "#16181c", color: "#71767b" }}>
                    Sin imagen
                  </div>
                }
              />
              <div
                className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[0.65rem]"
                style={{ background: "rgba(0,0,0,0.77)", color: "#fff" }}
              >
                {ogTitle}
              </div>
            </div>
          )}
          <div style={{ padding: "10px 14px", borderTop: twitterCard === "summary_large_image" ? "1px solid #2f3336" : "none" }}>
            <p className="text-[0.78rem]" style={{ color: "#71767b" }}>
              {siteLabel.replace(/^https?:\/\//, "")}
            </p>
            {twitterCard !== "summary_large_image" && (
              <p className="text-[0.95rem] font-semibold leading-snug mt-0.5 line-clamp-1" style={{ color: "#e7e9ea" }}>{ogTitle}</p>
            )}
            <p className="text-[0.8125rem] mt-0.5 leading-snug line-clamp-2" style={{ color: "#71767b" }}>
              {ogDescription}
            </p>
            {twitterSite && (
              <p className="text-[0.72rem] mt-1.5" style={{ color: "#1d9bf0" }}>{twitterSite}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Keywords ── */}
      {keywords.length > 0 && (
        <section>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--c-muted)" }}>
            Palabras clave ({keywords.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-[3px] rounded-full text-[0.78rem] font-medium leading-none select-none"
                style={KEYWORD_PILL_PALETTES[i % KEYWORD_PILL_PALETTES.length]}
              >
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Technical ── */}
      <section>
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--c-muted)" }}>
          Técnico
        </p>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
          {[
            { label: "robots", value: robots },
            { label: "canonical", value: canonical || <span style={{ opacity: 0.4, fontStyle: "italic" }}>No definida</span> },
          ].map(({ label, value }, i, arr) => (
            <div
              key={label}
              className="flex items-center gap-3 px-3 py-2 text-xs"
              style={{
                background: i % 2 === 0 ? "var(--c-hover)" : "transparent",
                borderBottom: i < arr.length - 1 ? "1px solid var(--c-border)" : undefined,
              }}
            >
              <span className="font-mono shrink-0" style={{ color: "var(--c-muted)", minWidth: 80 }}>{label}</span>
              <span style={{ color: "var(--c-text)" }}>{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── ContentTab ─────────────────────────────────────────────── */

export default function ContentTab({
  siteId,
  siteUrl,
}: {
  siteId: number;
  siteUrl?: string;
}) {
  const toast = useToast();
  const [active, setActive] = useState(CONTENT_SECTIONS[0].key);
  const [data, setData] = useState<JsonValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>();
  const [raw, setRaw] = useState(false);
  const [rawText, setRawText] = useState("");
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  const activeSection = CONTENT_SECTIONS.find((s) => s.key === active)!;
  const isMeta = active === "meta";
  const publicBase = siteUrl ? derivePublicUrl(siteUrl) : undefined;
  const previewUrl = publicBase ? `${publicBase}#${activeSection.anchor}` : undefined;
  const showPreview = preview && (isMeta || !!previewUrl);

  const load = useCallback(
    async (section: string) => {
      setLoading(true);
      setErr(undefined);
      setData(null);
      try {
        const res = await apiGet<JsonValue>(`/proxy/${siteId}/content/${section}`);
        setData(res);
        setRawText(JSON.stringify(res, null, 2));
      } catch (e) {
        setErr(e instanceof ApiError ? `${e.status} — ${e.message}` : "No se pudo cargar la sección.");
      } finally {
        setLoading(false);
      }
    },
    [siteId],
  );

  useEffect(() => { load(active); }, [active, load]);

  async function save() {
    let payload: JsonValue;
    if (raw) {
      try { payload = JSON.parse(rawText); }
      catch { toast.error("El JSON no es válido."); return; }
    } else {
      payload = data as JsonValue;
    }
    setSaving(true);
    try {
      await apiPut(`/proxy/${siteId}/content/${active}`, payload);
      setData(payload);
      setRawText(JSON.stringify(payload, null, 2));
      toast.success("Sección guardada.");
    } catch (e) {
      toast.error(e instanceof ApiError ? `${e.status} — ${e.message}` : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-5 h-full">
      {/* Selector de sección */}
      <nav className="md:w-52 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
        {CONTENT_SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(s.key)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[0.625rem] text-sm font-medium whitespace-nowrap transition-colors text-left ${
              active === s.key
                ? "bg-[var(--c-active-pill)] text-[var(--c-text)]"
                : "text-[var(--c-text-sub)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text)]"
            }`}
          >
            <Icon paths={s.icon} size={16} />
            <span className="hidden sm:inline md:inline">{s.label}</span>
          </button>
        ))}
      </nav>

      {/* Columna principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--c-line)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-[var(--c-hover)] border border-[var(--c-border)] flex items-center justify-center text-[var(--c-text-sub)]">
              <Icon paths={activeSection.icon} size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-[var(--c-text)] leading-tight">{activeSection.label}</h3>
              <p className="text-[0.75rem] text-[var(--c-muted)] leading-tight truncate">{activeSection.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botón ojo */}
            <button
              type="button"
              onClick={() => {
                if (!isMeta && !previewUrl) { toast.error("Este sitio no tiene URL configurada."); return; }
                setPreview((p) => !p);
              }}
              title={preview ? "Cerrar vista previa" : isMeta ? "Vista SEO" : "Ver en el sitio"}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer bg-transparent ${
                preview
                  ? "border-[var(--c-text-sub)] text-[var(--c-text)] bg-[var(--c-active-pill)]"
                  : "border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)]"
              }`}
            >
              {preview ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>

            {/* Selector de dispositivo — solo visible con preview abierto, no aplica para meta */}
            {preview && previewUrl && !isMeta && (
              <>
                {/* Desktop */}
                <button
                  type="button"
                  onClick={() => setDevice("desktop")}
                  title="Vista escritorio"
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer bg-transparent ${
                    device === "desktop"
                      ? "border-[var(--c-text-sub)] text-[var(--c-text)] bg-[var(--c-active-pill)]"
                      : "border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)]"
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                </button>
                {/* Móvil */}
                <button
                  type="button"
                  onClick={() => setDevice("mobile")}
                  title="Vista móvil"
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer bg-transparent ${
                    device === "mobile"
                      ? "border-[var(--c-text-sub)] text-[var(--c-text)] bg-[var(--c-active-pill)]"
                      : "border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)]"
                  }`}
                >
                  <svg width="13" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <path d="M12 18h.01" />
                  </svg>
                </button>
              </>
            )}

            {/* JSON raw */}
            <button
              type="button"
              onClick={() => {
                if (!raw && data !== null) setRawText(JSON.stringify(data, null, 2));
                setRaw((r) => !r);
              }}
              title={raw ? "Editor visual" : "Editar JSON"}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
              </svg>
            </button>

            <Button onClick={save} loading={saving} disabled={loading || !!err} className="!w-auto">
              Guardar
            </Button>
          </div>
        </div>

        {/* Cuerpo */}
        <div
          className={`flex-1 min-h-0 pt-4 ${showPreview ? "grid gap-5" : ""}`}
          style={
            showPreview
              ? { gridTemplateColumns: isMeta ? "1fr 380px" : device === "mobile" ? "1fr 280px" : "360px 1fr" }
              : undefined
          }
        >
          {/* Editor */}
          <div className={`min-h-0 overflow-y-auto ${showPreview ? "pr-4 pb-4" : ""}`}>
            {loading ? (
              <div className="h-full flex items-center justify-center"><Spinner size={26} /></div>
            ) : err ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm text-[var(--c-danger)]">{err}</p>
                <button type="button" onClick={() => load(active)} className="text-[0.8125rem] underline cursor-pointer hover:text-[var(--c-text)] text-[var(--c-muted)]">Reintentar</button>
              </div>
            ) : raw ? (
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                spellCheck={false}
                className="w-full h-full min-h-[24rem] font-mono text-[0.8125rem] p-3 border border-[var(--c-border)] rounded-[0.75rem] bg-[var(--c-bg)] text-[var(--c-text)] outline-none focus:border-[var(--c-text-sub)] resize-none"
              />
            ) : data !== null ? (
              <SchemaEditor value={data} onChange={setData} fieldKey={active} label="" />
            ) : null}
          </div>

          {/* Vista previa */}
          {showPreview && (
            isMeta
              ? <MetaPreview data={data} siteUrl={publicBase} />
              : previewUrl && (
                  device === "desktop"
                    ? <DesktopPreview url={previewUrl} sectionKey={active} />
                    : <MobilePreview url={previewUrl} sectionKey={active} />
                )
          )}
        </div>
      </div>
    </div>
  );
}
