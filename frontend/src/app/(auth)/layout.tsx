export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-[var(--c-bg)]">
      {children}
    </div>
  );
}
