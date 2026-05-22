"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, ApiError } from "@/lib/api";
import type { Lead } from "@/types/api";
import { formatDate } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

/* ── Icons ──────────────────────────────────────────────────────────── */
function UserIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5L19 7" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 3h3.5l1.5 4-2 1.5a10 10 0 004.5 4.5L13 11l4 1.5V16a1 1 0 01-1 1C6.5 17 3 10.5 3 4a1 1 0 011-1z" />
    </svg>
  );
}

/* ── Copy button ────────────────────────────────────────────────────── */
function CopyButton({ value, label }: { value: string; label: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      toast.success(`${label} copiado`);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [value, label, toast]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copiar ${label}`}
      className="inline-flex items-center justify-center w-5 h-5 rounded transition-colors cursor-pointer"
      style={{
        color: copied ? "var(--c-section-text)" : "var(--c-muted)",
        background: copied ? "var(--c-section-bg)" : "transparent",
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */
export default function LeadsTab({ siteId }: { siteId: number }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    setErr(undefined);
    try {
      setLeads(await apiGet<Lead[]>(`/proxy/${siteId}/leads`));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "No se pudieron cargar los leads.");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  if (loading)
    return <div className="flex justify-center py-16"><Spinner size={24} /></div>;

  if (err)
    return <p className="text-sm text-[var(--c-danger)] py-8 text-center">{err}</p>;

  if (leads.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--c-muted)]">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "var(--c-section-bg)", color: "var(--c-section-text)", border: "1px solid var(--c-section-border)" }}
        >
          <UserIcon size={20} />
        </div>
        <p className="text-[0.8125rem]">Aún no hay leads registrados.</p>
      </div>
    );

  return (
    <div className="space-y-3 max-w-3xl">

      {/* Header bar */}
      <div className="flex items-center justify-between py-1 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: "var(--c-section-bg)", color: "var(--c-section-text)", border: "1px solid var(--c-section-border)" }}
          >
            <UserIcon size={14} />
          </span>
          <span className="text-[0.875rem] font-semibold text-[var(--c-text)]">
            {leads.length}
          </span>
          <span className="text-[0.8125rem] text-[var(--c-muted)]">
            {leads.length === 1 ? "lead" : "leads"}
          </span>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.8125rem] text-[var(--c-muted)] hover:text-[var(--c-text)] border border-[var(--c-border)] hover:border-[var(--c-text-sub)] transition-colors cursor-pointer bg-transparent"
        >
          <RefreshIcon />
          Actualizar
        </button>
      </div>

      {leads.map((lead) => (
        <div
          key={lead.id}
          className="rounded-xl border border-[var(--c-line)] bg-[var(--c-bg)] overflow-hidden"
          style={{ borderLeft: "3px solid var(--c-section-text)" }}
        >
          {/* Top section: avatar + identity + meta */}
          <div className="flex items-start gap-3 p-4">
            {/* Avatar */}
            <div
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
              style={{
                background: "var(--c-section-bg)",
                color: "var(--c-section-text)",
                border: "1.5px solid var(--c-section-border)",
              }}
            >
              <UserIcon size={18} />
            </div>

            {/* Name + contact rows */}
            <div className="flex-1 min-w-0">
              <p className="text-[0.9375rem] font-semibold text-[var(--c-text)] leading-snug mb-1">
                {lead.name}
              </p>
              <div className="flex flex-col gap-1">
                {/* Email row */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--c-muted)]"><MailIcon /></span>
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-[0.8125rem] text-[var(--c-section-text)] hover:underline transition-colors leading-none"
                  >
                    {lead.email}
                  </a>
                  <CopyButton value={lead.email} label="email" />
                </div>
                {/* Phone row */}
                {lead.phone && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--c-muted)]"><PhoneIcon /></span>
                    <span className="text-[0.8125rem] text-[var(--c-text-sub)] leading-none">
                      {lead.phone}
                    </span>
                    <CopyButton value={lead.phone} label="teléfono" />
                  </div>
                )}
              </div>
            </div>

            {/* Right meta */}
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <span className="text-[0.75rem] text-[var(--c-muted)] whitespace-nowrap">
                {formatDate(lead.createdAt)}
              </span>
              {lead.state && (
                <span
                  className="text-[0.6875rem] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    background: "var(--c-section-bg)",
                    color: "var(--c-section-text)",
                    border: "1px solid var(--c-section-border)",
                  }}
                >
                  {lead.state}
                </span>
              )}
            </div>
          </div>

          {/* Budget + services footer */}
          {(lead.budget || lead.services.length > 0) && (
            <div
              className="px-4 py-3 flex flex-col gap-2"
              style={{ borderTop: "1px solid var(--c-line)", background: "var(--c-hover)" }}
            >
              {lead.budget && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.75rem] font-semibold"
                    style={{
                      background: "var(--c-st-active-bg)",
                      color: "var(--c-st-active)",
                      border: "1px solid color-mix(in srgb, var(--c-st-active) 22%, transparent)",
                    }}
                  >
                    {lead.budget}
                  </span>
                  {lead.budgetOther && (
                    <span className="text-[0.75rem] text-[var(--c-muted)] italic">
                      — {lead.budgetOther}
                    </span>
                  )}
                </div>
              )}
              {lead.services.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {lead.services.map((s) => (
                    <span
                      key={s}
                      className="inline-block px-2 py-0.5 rounded-full text-[0.6875rem] bg-[var(--c-section-bg)] text-[var(--c-section-text)] border border-[var(--c-section-border)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

