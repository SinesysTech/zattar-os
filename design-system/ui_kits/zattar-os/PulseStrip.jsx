/* global React, Icon, IconContainer */

function PulseStrip({ items }) {
  return (
    <div className="glass-widget" style={{
      borderRadius: 16, padding: 16,
      border: "1px solid oklch(0.87 0.01 281 / 0.4)",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: 999,
            background: "oklch(0.55 0.18 145)",
            boxShadow: "0 0 0 4px oklch(0.55 0.18 145 / 0.2)",
            animation: "pulse-dot 2s infinite",
          }} />
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, color: "var(--foreground)" }}>Atividade recente</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Últimas 24h</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 12, alignItems: "flex-start",
            padding: "8px 2px",
            borderBottom: i === items.length - 1 ? "none" : "1px dashed var(--border)",
          }}>
            <IconContainer name={it.icon} size="sm" tone={it.tone} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.4 }}>
                <strong style={{ fontWeight: 600 }}>{it.actor}</strong>{" "}{it.verb}{" "}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{it.target}</span>
              </span>
              {it.note && <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{it.note}</span>}
            </div>
            <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{it.when}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 4px oklch(0.55 0.18 145 / 0.2); }
          50% { box-shadow: 0 0 0 8px oklch(0.55 0.18 145 / 0.05); }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, { PulseStrip });
