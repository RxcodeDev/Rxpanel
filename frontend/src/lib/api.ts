import { getToken, clearAuth } from "./auth";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** FastAPI devuelve `{ detail: string }` o `{ detail: [{ msg }] }` en errores. */
function extractDetail(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return (
      detail
        .map((d) =>
          d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : String(d),
        )
        .join(", ") || fallback
    );
  }
  return fallback;
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401 && getToken()) {
    clearAuth();
    if (typeof window !== "undefined") window.location.href = "/login";
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, extractDetail(body, res.statusText));
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { ...authHeaders() } });
  return handle<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handle<T>(res);
}

/**
 * Sube un archivo al sitio gestionado vía el proxy del panel.
 * El archivo aterriza en el sitio (RecTrack) y devuelve la ruta que ese
 * sitio sirve (ej. /uploads/123-foo.png).
 */
export async function apiUpload(
  siteId: number,
  file: File,
): Promise<{ path: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE_URL}/proxy/${siteId}/upload`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: fd,
  });
  return handle<{ path: string }>(res);
}

/** Descarga un asset (con auth) como Blob — para previsualización. */
export async function apiGetBlob(path: string): Promise<Blob> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return res.blob();
}
