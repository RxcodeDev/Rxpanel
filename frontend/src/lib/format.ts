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

const FIELD_HINTS: [RegExp, string][] = [
  [/eyebrow/i, "Texto pequeño sobre el titular principal"],
  [/headline/i, "Palabras del titular animado"],
  [/subtitle/i, "Párrafo descriptivo bajo el titular"],
  [/cta.*primary|primary.*cta/i, "Texto del botón principal"],
  [/cta.*secondary|secondary.*cta/i, "Texto del botón secundario"],
  [/cta/i, "Texto del botón de acción"],
  [/href|\blink\b/i, "URL de destino (https://... o /ruta)"],
  [/whatsapp.*(message|msg|text|texto|copy)/i, "Mensaje predeterminado al contactar por WhatsApp"],
  [/whatsapp/i, "Número con código de país, ej: 521234567890"],
  [/phone|telefono|telephone/i, "Número de teléfono"],
  [/email/i, "Dirección de correo electrónico"],
  [/address|ubicacion|location/i, "Dirección o ubicación física"],
  [/suffix/i, "Texto después del número, ej: + o %"],
  [/prefix/i, "Texto antes del número"],
  [/tagline/i, "Frase corta de identidad de marca"],
  [/\blabel\b/i, "Etiqueta o texto visible"],
];

export function fieldHint(key: string): string | undefined {
  for (const [pattern, hint] of FIELD_HINTS) {
    if (pattern.test(key)) return hint;
  }
  return undefined;
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
