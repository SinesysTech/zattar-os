/* global React, Icon */
// CalendarWidget — upcoming events (audiências, prazos, expedientes)

function CalendarWidget({ events }) {
  return (
    <div className="glass-widget" style={{
      borderRadius: 16, padding: 16,
      border: "1px solid oklch(0.87 0.01 281 / 0.4)",
      display: "flex", flexDirection: "column", gap: 12, minHeight: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, color: "var(--foreground)" }}>Próximos eventos</span>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 8px", borderRadius: 6, background: "transparent",
          border: "1px solid var(--border)", cursor: "pointer",
          fontSize: 11, color: "var(--muted-foreground)",
        }}>
          <span>Próx. 7 dias</span>
          <Icon name="chevron-down" size={11} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {events.map((e, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "48px 4px 1fr auto",
            alignItems: "center", gap: 12,
            padding: "8px 10px",
            borderRadius: 10,
            transition: "background 150ms",
            cursor: "pointer",
          }}
            onMouseEnter={(ev) => ev.currentTarget.style.background = "oklch(0.92 0.01 281 / 0.5)"}
            onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--muted-foreground)" }}>{e.month}</span>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, lineHeight: 1, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{e.day}</span>
            </div>
            <span style={{ width: 4, height: 36, borderRadius: 4, background: e.color, alignSelf: "center" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</span>
              <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{e.time}</span>
                <span style={{ width: 2, height: 2, borderRadius: 999, background: "var(--muted-foreground)", opacity: 0.5 }} />
                <span>{e.kind}</span>
                <span style={{ width: 2, height: 2, borderRadius: 999, background: "var(--muted-foreground)", opacity: 0.5 }} />
                <span>{e.where}</span>
              </span>
            </div>
            <button style={{
              border: "none", background: "transparent", cursor: "pointer",
              color: "var(--muted-foreground)", padding: 4,
            }}><Icon name="chevron-right" size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { CalendarWidget });
