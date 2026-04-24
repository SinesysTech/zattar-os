/* global React, Icon, Avatar, Chip */

function ProcessCard({ proc, onSelect, selected }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={() => onSelect?.(proc.id)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: "var(--card)",
        border: `1px solid ${selected ? "var(--primary)" : "var(--border)"}`,
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 10,
        boxShadow: hover
          ? "0 4px 10px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"
          : "0 1px 2px rgba(0,0,0,0.04)",
        transform: hover ? "translateY(-1px)" : "none",
        transition: "all 200ms",
        cursor: "pointer",
        outline: selected ? "3px solid oklch(0.48 0.26 281 / 0.14)" : "none",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
            {proc.number}
          </span>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, lineHeight: 1.3, color: "var(--foreground)" }}>
            {proc.title}
          </span>
        </div>
        <Chip tone={proc.statusTone}>{proc.status}</Chip>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px" }}>
        {proc.meta.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--muted-foreground)" }}>{m.k}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)", fontFamily: m.mono ? "var(--font-mono)" : "var(--font-sans)" }}>{m.v}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: "1px dashed var(--border)" }}>
        <div style={{ display: "flex" }}>
          {proc.parties.map((p, i) => (
            <span key={i} style={{
              width: 24, height: 24, borderRadius: 999,
              background: p.color, color: "white",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 600,
              border: "2px solid var(--card)",
              marginLeft: i === 0 ? 0 : -6,
            }}>{p.initials}</span>
          ))}
          {proc.extraParties > 0 && (
            <span style={{
              width: 24, height: 24, borderRadius: 999,
              background: "var(--muted)", color: "var(--muted-foreground)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 600,
              border: "2px solid var(--card)", marginLeft: -6,
            }}>+{proc.extraParties}</span>
          )}
        </div>
        <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontSize: 11, color: "var(--muted-foreground)" }}>
          <Icon name="clock" size={11} />
          {proc.updated}
        </span>
      </div>
    </div>
  );
}

Object.assign(window, { ProcessCard });
