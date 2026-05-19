"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import {
  setSession,
  saveUser,
  clearAuth,
  getToken,
  getRefreshToken,
  getStoredUser,
} from "@/lib/auth";
import type { User, LoginResponse } from "@/types/api";

interface AuthState {
  user: User | null;
  initialized: boolean;
}

type Action =
  | { type: "init"; user: User | null }
  | { type: "login"; user: User }
  | { type: "logout" };

function reducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case "init":
      return { user: action.user, initialized: true };
    case "login":
      return { ...state, user: action.user };
    case "logout":
      return { ...state, user: null };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { user: null, initialized: false });
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser<User>();
    if (token && stored) {
      dispatch({ type: "init", user: stored });
      // Revalida en segundo plano.
      apiGet<User>("/users/me")
        .then((u) => {
          saveUser(u);
          dispatch({ type: "login", user: u });
        })
        .catch(() => {});
    } else {
      dispatch({ type: "init", user: null });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiPost<LoginResponse>("/auth/login", { email, password });
    setSession(res.access_token, res.refresh_token);
    const me = await apiGet<User>("/users/me");
    saveUser(me);
    dispatch({ type: "login", user: me });
    router.push("/sitios");
  }, [router]);

  const logout = useCallback(async () => {
    const refresh = getRefreshToken();
    if (refresh) {
      await apiPost("/auth/logout", { refresh_token: refresh }).catch(() => {});
    }
    clearAuth();
    dispatch({ type: "logout" });
    router.push("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    const me = await apiGet<User>("/users/me");
    saveUser(me);
    dispatch({ type: "login", user: me });
  }, []);

  return (
    <Ctx.Provider
      value={{
        ...state,
        isAuthenticated: !!state.user,
        isAdmin: state.user?.role === "admin",
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
