import { ReactNode } from "react";

export function PageHeader({
  kicker, title, subtitle,
}: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      {kicker && (
        <div className="text-xs font-semibold tracking-widest text-teal uppercase mb-2">
          {kicker}
        </div>
      )}
      <h1 className="font-serif text-3xl font-bold text-ink">{title}</h1>
      {subtitle && <p className="text-mute mt-2 max-w-3xl">{subtitle}</p>}
    </div>
  );
}

export function Card({
  children, className = "", padding = "p-5",
}: { children: ReactNode; className?: string; padding?: string }) {
  return (
    <div className={`bg-white border border-[#E3EBEB] rounded-xl ${padding} ${className}`}>
      {children}
    </div>
  );
}

export function Stat({
  label, value, hint, tone = "default",
}: { label: string; value: ReactNode; hint?: string; tone?: "default" | "mint" | "amber" | "danger" }) {
  const toneClass =
    tone === "mint"   ? "text-mint" :
    tone === "amber"  ? "text-amber" :
    tone === "danger" ? "text-danger" : "text-ink";
  return (
    <Card>
      <div className="text-xs text-mute uppercase tracking-wide">{label}</div>
      <div className={`font-serif text-3xl font-bold mt-1 ${toneClass}`}>{value}</div>
      {hint && <div className="text-xs text-mute mt-1">{hint}</div>}
    </Card>
  );
}

export function Badge({
  children, tone = "neutral",
}: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "danger" }) {
  const map = {
    neutral: "bg-panel text-ink border-[#D8E4E4]",
    ok:      "bg-mint/15 text-[#016F55] border-mint/30",
    warn:    "bg-amber/15 text-[#8A5A00] border-amber/30",
    danger:  "bg-danger/10 text-[#8A1F27] border-danger/30",
  }[tone];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${map}`}>
      {children}
    </span>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return <div className="text-mute text-sm py-8 text-center">{label}</div>;
}

export function EmptyBlock({ label = "No data yet." }: { label?: string }) {
  return <div className="text-mute text-sm py-8 text-center italic">{label}</div>;
}

export function ErrorBlock({ error }: { error: string }) {
  return (
    <div className="bg-danger/10 border border-danger/30 text-[#8A1F27] text-sm px-4 py-3 rounded-lg">
      <strong>Error:</strong> {error}
    </div>
  );
}
