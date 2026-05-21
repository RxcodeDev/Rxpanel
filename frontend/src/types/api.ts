// Contratos espejo del backend FastAPI de Rxpanel.

export type UserRole = "admin" | "viewer";

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type SiteStatus = "active" | "inactive" | "maintenance" | "error";

export interface Site {
  id: number;
  name: string;
  url: string;
  description: string | null;
  status: SiteStatus;
  is_ssl: boolean;
  icon: string | null;
  icon_color: string | null;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteInput {
  name: string;
  url: string;
  description?: string | null;
  status: SiteStatus;
  is_ssl: boolean;
  icon?: string | null;
  icon_color?: string | null;
  api_token?: string | null;
}

export interface ChangeLog {
  id: string;
  site_id: number;
  user_id: string;
  section: string;
  change_type: string;
  payload_snapshot: Record<string, unknown>;
  created_at: string;
}

// El sitio gestionado define qué tokens expone; el editor es genérico.
export type SiteColors = Record<string, string>;

export interface SiteLogos {
  logo_url?: string | null;
  favicon_url?: string | null;
}

/** Contenido de una sección: JSON arbitrario que edita el SchemaEditor. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
