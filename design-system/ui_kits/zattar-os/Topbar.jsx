/* global React, Icon, Avatar */

function Topbar({ page, onSearch }) {
  const titles = {
    dashboard: { t: "Dashboard", s: "Visão geral do escritório" },
    processos: { t: "Processos", s: "128 processos · 14 ativos esta semana" },
    agenda:    { t: "Agenda",    s: "Próximos 30 dias" },
    chat:      { t: "Chat",      s: "Time interno · 3 conversas ativas" },
    financeiro:{ t: "Financeiro",s: "Abril 2026" },
    clientes:  { t: "Clientes",  s: "Base ativa" },
    ai:        { t: "Magistrate AI", s: "Assistente jurídico" },
    config:    { t: "Configurações", s: "" },
  };
  const p = titles[page] || titles.dashboard;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 24px",
      borderBottom: "1px solid var(--border)",
      background: "var(--background)",
      position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontWeight: 700,
          fontSize: 22, letterSpacing: "-0.02em", color: "var(--foreground)",
          margin: 0, lineHeight: 1.2,
        }}>{p.t}</h1>
        {p.s && <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{p.s}</span>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 12px 7px 10px", borderRadius: 10,
          background: "var(--card)", border: "1px solid var(--border)",
          minWidth: 280, color: "var(--muted-foreground)", fontSize: 13,
        }}>
          <Icon name="search" size={14} />
          <span style={{ flex: 1 }}>Buscar processos, partes, peças…</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "var(--muted)" }}>⌘K</span>
        </div>

        <button style={iconBtn}><Icon name="plus" size={16} /></button>
        <button style={{ ...iconBtn, position: "relative" }}>
          <Icon name="bell" size={16} />
          <span style={{
            position: "absolute", top: 6, right: 6, width: 8, height: 8,
            borderRadius: 999, background: "var(--destructive)",
            border: "2px solid var(--background)",
          }} />
        </button>
        <span style={{
          width: 34, height: 34, borderRadius: 999,
          background: "linear-gradient(135deg, oklch(0.60 0.22 281), oklch(0.48 0.26 281))",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: 12, fontWeight: 600, marginLeft: 4,
        }}>AR</span>
      </div>
    </div>
  );
}

const iconBtn = {
  width: 36, height: 36, borderRadius: 10,
  border: "1px solid var(--border)", background: "var(--card)",
  color: "var(--muted-foreground)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", transition: "all 150ms",
};

Object.assign(window, { Topbar });
