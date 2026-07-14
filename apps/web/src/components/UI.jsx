import React from "react";
import { AlertTriangle, CheckCircle, Database, Info } from "lucide-react";

/* ─── Spinner ───────────────────────────────────────────────────────────────── */
export function Spinner() {
  return (
    <div className="spinner">
      <div className="spinner-ring" />
    </div>
  );
}

/* ─── Skeleton blocks ───────────────────────────────────────────────────────── */
export function SkeletonLine({ w = "w80" }) {
  return <div className={`skeleton skeleton-line ${w}`} />;
}
export function SkeletonCard({ lines = 4 }) {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-header">
        <div className="skeleton skeleton-heading" />
      </div>
      <div className="skeleton-card-body">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`skeleton skeleton-line ${i % 3 === 0 ? "w60" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}
export function SkeletonStatCard() {
  return (
    <div className="skeleton-stat">
      <div className="skeleton skeleton-circle" />
      <div className="skeleton skeleton-line w40" style={{ marginTop: 8 }} />
      <div className="skeleton skeleton-heading" style={{ width: "45%", marginBottom: 0 }} />
      <div className="skeleton skeleton-line w60" />
    </div>
  );
}
export function SkeletonChart({ height = 180 }) {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-header">
        <div className="skeleton skeleton-heading" />
      </div>
      <div className="skeleton-card-body">
        <div className="skeleton skeleton-rect" style={{ height }} />
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, color = "teal", accent }) {
  return (
    <div className={`stat-card ${accent ? `${accent}-accent` : `${color}-accent`}`}>
      <div className={`stat-icon ${color}`}>
        <Icon size={19} />
      </div>
      <div className="stat-body">
        <div className="stat-value">{value ?? "—"}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          {Icon && <Icon size={15} />}
          {title}
        </div>
        {action}
      </div>
      <div className="card-body no-pad">{children}</div>
    </div>
  );
}

export function DataTable({ rows, columns, maxRows = 50 }) {
  if (!rows?.length) return <div className="empty">No data available.</div>;
  const cols = columns ?? Object.keys(rows[0]);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{cols.map((c) => <th key={c}>{c.replace(/_/g, " ")}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0, maxRows).map((row, i) => (
            <tr key={i}>
              {cols.map((c) => <td key={c}>{String(row[c] ?? "").trim() || "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Badge({ children, variant = "teal" }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function ChartState({ loading, error, rows, empty = "No graphable records loaded.", children }) {
  if (loading) return <SkeletonChart />;
  if (error) {
    return (
      <div className="empty">
        <div className="empty-icon"><AlertTriangle size={22} /></div>
        <div className="empty-title">Could not load this figure</div>
        <div className="empty-desc">{error}</div>
      </div>
    );
  }
  if (!rows?.length) return (
    <div className="empty">
      <div className="empty-icon"><Database size={22} /></div>
      <div className="empty-title">No data available</div>
      <div className="empty-desc">{empty}</div>
    </div>
  );
  return children;
}

/* ─── Rich Empty State ──────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon = Database, title = "No data available", description, action }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon size={22} /></div>
      {title && <div className="empty-title">{title}</div>}
      {description && <div className="empty-desc">{description}</div>}
      {action}
    </div>
  );
}

export function MetricStrip({ items }) {
  return (
    <div className="metric-strip">
      {items.map((item) => (
        <div className="metric-item" key={item.label}>
          <div className="metric-value">{item.value ?? "—"}</div>
          <div className="metric-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function AlertBanner({ type = "info", title, message }) {
  const icons = { info: Info, warning: AlertTriangle, error: AlertTriangle };
  const Icon = icons[type] ?? Info;
  return (
    <div className={`alert-banner ${type}`}>
      <Icon size={15} />
      <div className="alert-banner-body">
        {title && <strong>{title}</strong>}
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export function ReadinessList({ items }) {
  if (!items?.length) return <div className="empty">No readiness data.</div>;
  return (
    <div className="readiness-list" style={{ padding: "14px" }}>
      {items.map((item, i) => {
        const ready = String(item.ready).toLowerCase() === "true";
        const partial = String(item.status ?? "").includes("preliminary") || String(item.status ?? "").includes("partial");
        const dotClass = ready ? "ready" : partial ? "partial" : "missing";
        return (
          <div className="readiness-item" key={i}>
            <div className={`readiness-dot ${dotClass}`} />
            <div className="readiness-item-label">{String(item.item ?? "").replace(/_/g, " ")}</div>
            <div className="readiness-item-status">{item.status ?? ""}</div>
            <Badge variant={ready ? "green" : partial ? "amber" : "red"}>
              {ready ? "Ready" : partial ? "Partial" : "Missing"}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Progress Bar ───────────────────────────────────────────────────────────── */
export function ProgressBar({ label, value, max = 100, color = "teal", showPct = true }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-label">
        <span>{label}</span>
        {showPct && <span>{pct}%</span>}
      </div>
      <div className="progress-bar-track">
        <div className={`progress-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── Risk Gauge (SVG ring) ──────────────────────────────────────────────────── */
export function RiskGauge({ label, value, max = 1, level = "low", sub }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const safeValue = value ?? 0;
  const safeMax = max || 1;
  const pct = Math.min(1, safeValue / safeMax);
  const offset = circ * (1 - pct);
  return (
    <div className="risk-gauge-card">
      <div className="risk-gauge-ring">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle className="risk-gauge-ring-track" cx="36" cy="36" r={r} />
          <circle
            className={`risk-gauge-ring-fill ${level}`}
            cx="36" cy="36" r={r}
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="risk-gauge-value">{Math.round(pct * 100)}</div>
      </div>
      <div className="risk-gauge-label">{label}</div>
      {sub && <div className="risk-gauge-sub">{sub}</div>}
    </div>
  );
}

/* ─── Phase Timeline ─────────────────────────────────────────────────────────── */
export function PhaseTimeline({ phases }) {
  return (
    <div className="phase-timeline">
      {phases.map((phase, i) => (
        <div className="phase-step" key={i}>
          <div className={`phase-dot ${phase.status}`}>{i + 1}</div>
          <div className="phase-step-label">{phase.label}</div>
          {phase.sub && <div className="phase-step-sub">{phase.sub}</div>}
        </div>
      ))}
    </div>
  );
}

/* ─── Pulse Indicator ────────────────────────────────────────────────────────── */
export function PulseIndicator({ label, active = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: active ? "var(--green-600)" : "var(--text-muted)" }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: active ? "var(--green-500)" : "var(--border)",
        animation: active ? "pulse-dot 2s ease-in-out infinite" : "none",
        flexShrink: 0,
      }} />
      {label}
    </div>
  );
}

/* ─── Interpretation Panel ───────────────────────────────────────────────────── */
export function InterpretationPanel({ title, verdict, tone = "teal", confidence, items = [] }) {
  const borderColor = tone === "red" ? "var(--red-500)" : tone === "amber" ? "var(--amber-500)" : "var(--teal-500)";
  const bg = tone === "red" ? "#fef2f2" : tone === "amber" ? "#fffbeb" : "var(--teal-50)";
  return (
    <div style={{ border: `1px solid ${borderColor}`, borderLeft: `4px solid ${borderColor}`, borderRadius: "var(--radius)", background: bg, padding: "14px 16px", marginBottom: 16 }}>
      {title && <div style={{ fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: borderColor, marginBottom: 6 }}>{title}</div>}
      {verdict && <p style={{ fontSize: 13, lineHeight: 1.55, margin: "0 0 10px", color: "var(--text-primary)" }}>{verdict}</p>}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10, marginBottom: confidence ? 10 : 0 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,.7)", border: "1px solid rgba(0,0,0,.07)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-muted)", marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{item.value}</div>
              {item.note && <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3, lineHeight: 1.35 }}>{item.note}</div>}
            </div>
          ))}
        </div>
      )}
      {confidence && <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontStyle: "italic" }}>{confidence}</div>}
    </div>
  );
}

/* ─── Expandable Details ────────────────────────────────────────────────────── */
export function ExpandableDetails({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 6 }}>
      <button className="expandable-trigger" onClick={() => setOpen(!open)}>
        {open ? "▾" : "▸"} {label}
      </button>
      <div className={`expandable-content ${open ? "open" : ""}`}>
        <div style={{ padding: "8px 0", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Page Header (standard) ────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, badges, actions, children }) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <h2>{title}</h2>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
        {badges && <div className="page-header-badges">{badges}</div>}
      </div>
      <div className="page-header-actions">
        {actions}
      </div>
      {children}
    </div>
  );
}
