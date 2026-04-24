/* global React, Icon */

function KpiCard({ label, value, delta, deltaDir = "up", sub, tone = "default", icon }) {
  const deltaColor =
    deltaDir === "up"   ? "oklch(0.45 0.18 145)" :
    deltaDir === "down" ? "oklch(0.50 0.22 25)"  : "var(--muted-foreground)";
  const valueColor =
    tone === "destructive" ? "oklch(0.50 0.22 25)" :
    tone === "warning"     ? "oklch(0.45 0.17 75)"  :
    tone === "primary"     ? "var(--primary)"        : "var(--foreground)";

  return (
    <div className="glass-kpi" style={{
      borderRadius: 14,
      padding: "14px 16px",
      border: "1px solid oklch(0.87 0.01 281 / 0.5)",
      display: "flex", flexDirection: "column", gap: 6,
      minHeight: 112,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 10, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.14em", color: "var(--muted-foreground)",
          fontFamily: "var(--font-sans)",
        }}>{label}</span>
        {icon && (
          <span style={{
            width: 26, height: 26, borderRadius: 8,
            background: "oklch(0.48 0.26 281 / 0.08)", color: "var(--primary)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}><Icon name={icon} size={13} /></span>
        )}
      </div>
      <span style={{
        fontFamily: "var(--font-heading)", fontWeight: 700,
        fontSize: 30, letterSpacing: "-0.02em",
        fontVariantNumeric: "tabular-nums",
        color: valueColor, lineHeight: 1.1,
      }}>{value}</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11, color: "var(--muted-foreground)" }}>
        {delta != null && (
          <span style={{ color: deltaColor, fontWeight: 600, fontFamily: "var(--font-sans)", display: "inline-flex", alignItems: "center", gap: 2 }}>
            <Icon name={deltaDir === "up" ? "trending-up" : "trending-down"} size={11} />
            {delta}
          </span>
        )}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

Object.assign(window, { KpiCard });
