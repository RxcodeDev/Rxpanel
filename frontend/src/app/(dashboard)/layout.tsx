"use client";

import Sidebar from "@/components/layouts/Sidebar";
import { useAuth } from "@/store/AuthContext";
import Spinner from "@/components/ui/Spinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { initialized, isAuthenticated } = useAuth();

  if (!initialized) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  // El middleware ya redirige; esto cubre el lapso de hidratación.
  if (!isAuthenticated) {
    return (
      <div className="h-dvh flex items-center justify-center text-sm text-[var(--c-muted)]">
        Redirigiendo…
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-dvh bg-[var(--c-bg)] overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">{children}</main>
    </div>
  );
}
