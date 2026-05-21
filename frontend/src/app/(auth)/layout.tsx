import ThemeToggle from "@/components/layouts/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-[var(--c-bg)]">
      {/* Cambiar tema desde la propia pantalla de acceso */}
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
