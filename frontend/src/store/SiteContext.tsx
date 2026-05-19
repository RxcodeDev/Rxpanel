"use client";

import { createContext, useContext, type ReactNode } from "react";

// Disponibiliza el id del sitio activo a componentes profundos
// (ej. ImageField dentro del SchemaEditor recursivo) sin prop drilling.
const SiteIdCtx = createContext<number | null>(null);

export function SiteIdProvider({
  siteId,
  children,
}: {
  siteId: number;
  children: ReactNode;
}) {
  return <SiteIdCtx.Provider value={siteId}>{children}</SiteIdCtx.Provider>;
}

export function useSiteId(): number {
  const id = useContext(SiteIdCtx);
  if (id == null) throw new Error("useSiteId debe usarse dentro de <SiteIdProvider>");
  return id;
}
