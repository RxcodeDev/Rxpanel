// Almacenamiento de sesión. El token también se escribe como cookie
// para que el middleware (server-side) pueda proteger rutas.

export const TOKEN_KEY = "rxpanel_token";
export const REFRESH_KEY = "rxpanel_refresh";
export const USER_KEY = "rxpanel_user";
export const COOKIE_NAME = "rxpanel_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setSession(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  const maxAge = 60 * 60 * 24 * 7; // 7 días
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(accessToken)}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

export function saveUser(user: object): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict`;
}
