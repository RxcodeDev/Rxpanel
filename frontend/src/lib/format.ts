import { BASE_URL } from "./api";

/** Origen del backend (sin el prefijo /api/v1) para servir /uploads. */
export const BACKEND_ORIGIN = BASE_URL.replace(/\/api\/v\d+\/?$/, "");

/** "ctaPrimary" / "cta_primary" → "Cta primary". */
export function humanize(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const IMG_KEYS =
  /(img|image|logo|favicon|icon|src|poster|avatar|photo|picture|background|cover)/i;
const IMG_EXT = /\.(png|jpe?g|svg|gif|webp|avif)(\?.*)?$/i;

export function looksLikeImage(key: string, value: string): boolean {
  if (IMG_EXT.test(value)) return true;
  if (IMG_KEYS.test(key) && (value.startsWith("/") || value.startsWith("http") || value === ""))
    return true;
  return false;
}

/** Resuelve una ruta a URL absoluta para previsualización. */
export function resolveAsset(value: string): string {
  if (!value) return "";
  if (/^(https?:|data:)/.test(value)) return value;
  return `${BACKEND_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
