"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastCtx {
  toast: (message: string, kind?: ToastKind) => void;
  success: (m: string) => void;
  error: (m: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

const COLORS: Record<ToastKind, { fg: string; bg: string }> = {
  success: { fg: "var(--c-success)", bg: "var(--c-st-active-bg)" },
  error: { fg: "var(--c-danger)", bg: "var(--c-st-error-bg)" },
  info: { fg: "var(--c-accent)", bg: "var(--c-hover)" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = ++seq.current;
      setItems((xs) => [...xs, { id, kind, message }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const value: ToastCtx = {
    toast,
    success: (m) => toast(m, "success"),
    error: (m) => toast(m, "error"),
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            className="pointer-events-auto cursor-pointer max-w-sm flex items-start gap-2.5 px-4 py-3 rounded-[0.75rem] border border-[var(--c-border)] bg-[var(--c-bg)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            <span
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: COLORS[t.kind].bg, color: COLORS[t.kind].fg }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {t.kind === "success" ? (
                  <path d="M20 6L9 17l-5-5" />
                ) : t.kind === "error" ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M12 8v4M12 16h.01" />
                )}
              </svg>
            </span>
            <p className="text-[0.8125rem] text-[var(--c-text)] leading-snug">{t.message}</p>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
