import React from "react";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

export function Spinner() {
  return (
    <div className="spinner">
      <div className="spinner-ring" />
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, color = "teal" }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={20} />
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
          {Icon && <Icon size={16} />}
          {title}
        </div>
        {action}
      </div>
      <div className="card-body no-pad">{children}</div>
    </div>
  );
}

export function DataTable({ rows, columns, maxRows = 50 }) {
  if (!rows?.length) {
    return <div className="empty">No data available.</div>;
  }
  const cols = columns ?? Object.keys(rows[0]);
  const cellValue = (value) => {
    const text = String(value ?? "").trim();
    return text || "—";
  };
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{cols.map((c) => <th key={c}>{c.replace(/_/g, " ")}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0, maxRows).map((row, i) => (
            <tr key={i}>
              {cols.map((c) => <td key={c}>{cellValue(row[c])}</td>)}
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
  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="empty">
        <AlertTriangle size={18} />
        <div>Could not load this figure.</div>
        <small>{error}</small>
      </div>
    );
  }
  if (!rows?.length) return <div className="empty">{empty}</div>;
  return children;
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
      <Icon size={16} />
      <div className="alert-banner-body">
        {title && <strong>{title}</strong>}
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export function InterpretationPanel({ title, verdict, confidence = "context", items = [], tone = "teal" }) {
  return (
    <section className={`interpretation-panel tone-${tone}`}>
      <div className="interpretation-head">
        <span>{title}</span>
        <strong>{verdict}</strong>
      </div>
      <div className="interpretation-grid">
        {items.map((item) => (
          <div className="interpretation-item" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.note && <small>{item.note}</small>}
          </div>
        ))}
      </div>
      <div className="interpretation-foot">
        <CheckCircle size={14} />
        <span>{confidence}</span>
      </div>
    </section>
  );
}

export function ReadinessList({ items }) {
  if (!items?.length) return <div className="empty">No readiness data.</div>;
  return (
    <div className="readiness-list" style={{ padding: "16px" }}>
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
