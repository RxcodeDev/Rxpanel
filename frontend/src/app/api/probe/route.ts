// Proxy server-side para verificar compatibilidad Rxpanel y obtener tokens.
// El navegador no puede resolver hostnames internos de Docker (host.docker.internal),
// por lo que esta ruta actúa como intermediario desde el servidor Next.js (dentro del contenedor).
// POST { url, password? }
//   - Sin password: verifica compatibilidad (espera 400 con {error: "..."})
//   - Con password: intenta autenticar y devuelve el token

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let url: string;
  let password: string | undefined;

  try {
    const body = await req.json();
    url = body.url;
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL requerida." }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(password ? { password } : {}),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "No se pudo conectar.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
