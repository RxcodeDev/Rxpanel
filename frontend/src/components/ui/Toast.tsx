"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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

/* Sonido corto y agradable al mostrar un toast (Web Audio API, sin assets). */
let audioCtx: AudioContext | null = null;
function playToastSound(kind: ToastKind) {
  if (typeof window === "undefined") return;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    const ctx = audioCtx;
    if (ctx.state === "suspended") void ctx.resume();
    // success: dos notas ascendentes; error: dos descendentes; info: una nota.
    const notes =
      kind === "success" ? [587.33, 880] : kind === "error" ? [415.3, 311.13] : [659.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.1;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.3);
    });
  } catch {
    /* el audio es opcional — si falla, se ignora */
  }
}

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
      playToastSound(kind);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const success = useCallback((m: string) => toast(m, "success"), [toast]);
  const error = useCallback((m: string) => toast(m, "error"), [toast]);

  const value = useMemo<ToastCtx>(
    () => ({ toast, success, error }),
    [toast, success, error],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            className="pointer-events-auto cursor-pointer max-w-sm flex items-center gap-2.5 px-4 py-3 rounded-[0.75rem] border bg-[var(--c-bg)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            style={{ borderColor: COLORS[t.kind].fg }}
          >
            <span
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
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
