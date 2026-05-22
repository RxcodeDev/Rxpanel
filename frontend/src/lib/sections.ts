// Secciones de contenido compatibles con RecTrack (y sitios con el mismo
// contrato). Cada una se edita vía GET/PUT /proxy/{siteId}/content/{key}.
// El editor es genérico por esquema: si un sitio devuelve otra forma de
// JSON, igual se renderiza — esto es solo metadata de presentación/orden.

export interface SectionMeta {
  key: string;
  label: string;
  description: string;
  /** Paths de un icono Feather (viewBox 0 0 24 24, stroke-based). */
  icon: string[];
  /** Fragmento (#id) para anclar la vista previa en el sitio. */
  anchor: string;
  /** Ruta completa opcional (e.g. "/portafolio") — si se provee, reemplaza #anchor en el preview. */
  path?: string;
}

export const CONTENT_SECTIONS: SectionMeta[] = [
  {
    key: "meta",
    label: "Metadatos",
    description: "Título, descripción y Open Graph del sitio.",
    icon: ["M4 7V4h16v3", "M9 20h6", "M12 4v16"],
    anchor: "meta",
  },
  {
    key: "navbar",
    label: "Barra de navegación",
    description: "WhatsApp y mensajes de la barra superior.",
    icon: ["M3 6h18", "M3 12h18", "M3 18h18"],
    anchor: "navbar",
  },
  {
    key: "hero",
    label: "Hero",
    description: "Titular principal, subtítulo, CTAs y métricas.",
    icon: ["M3 3h18v18H3z", "M3 9h18", "M9 21V9"],
    anchor: "hero",
  },
  {
    key: "clients",
    label: "Clientes",
    description: "Logos y nombres de clientes destacados.",
    icon: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 0 .01", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
    anchor: "clients",
  },
  {
    key: "services",
    label: "Servicios",
    description: "Listado de servicios con imagen y detalle.",
    icon: ["M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"],
    anchor: "services",
  },
  {
    key: "stats",
    label: "Estadísticas",
    description: "Métricas numéricas animadas.",
    icon: ["M18 20V10", "M12 20V4", "M6 20v-6"],
    anchor: "stats",
  },
  {
    key: "portfolio",
    label: "Portafolio",
    description: "Fotos y videos de trabajos realizados.",
    icon: ["M21 15V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14", "M3 19l6-6 4 4 8-8"],
    anchor: "portfolio",
  },
  {
    key: "portfolioPage",
    label: "Portafolio Completo",
    description: "Sitios web, fotos y videos de la página /portafolio.",
    icon: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h7v7h-7z"],
    anchor: "portfolio",
    path: "/portafolio",
  },
  {
    key: "testimonials",
    label: "Testimonios",
    description: "Videos y reseñas de Google.",
    icon: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
    anchor: "testimonials",
  },
  {
    key: "contact",
    label: "Contacto",
    description: "Email, teléfono y ubicación.",
    icon: ["M4 4h16v16H4z", "M22 6l-10 7L2 6"],
    anchor: "contact",
  },
  {
    key: "footer",
    label: "Pie de página",
    description: "Tagline, redes sociales y enlaces legales.",
    icon: ["M3 3h18v18H3z", "M3 15h18"],
    anchor: "footer",
  },
];

export function sectionLabel(key: string): string {
  return CONTENT_SECTIONS.find((s) => s.key === key)?.label ?? key;
}
