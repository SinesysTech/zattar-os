/* global React, Icon, BrandMark */
// Sidebar — always-dark premium, collapsible, nav + user

function Sidebar({ active, onNavigate, collapsed, onToggle, user }) {
  const nav = [
    { id: "dashboard", icon: "layout-dashboard", label: "Dashboard" },
    { id: "processos", icon: "folder-open", label: "Processos", count: 128 },
    { id: "agenda",    icon: "calendar", label: "Agenda", count: 7 },
    { id: "chat",      icon: "message-circle", label: "Chat" },
    { id: "financeiro",icon: "wallet", label: "Financeiro" },
    { id: "clientes",  icon: "users", label: "Clientes" },
  ];
  const sec = [
    { id: "ai",     icon: "sparkles", label: "Magistrate AI" },
    { id: "config", icon: "settings", label: "Configurações" },
  ];

  const width = collapsed ? 68 : 232;

  const NavItem = ({ item }) => {
    const isActive = active === item.id;
    return (
      <button onClick={() => onNavigate(item.id)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", gap: 12,
          padding: collapsed ? "9px 0" : "9px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 10,
          background: isActive ? "oklch(0.48 0.26 281 / 0.22)" : "transparent",
          color: isActive ? "oklch(0.98 0 0)" : "oklch(0.75 0.01 281)",
          border: "none", cursor: "pointer",
          fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: isActive ? 600 : 500,
          transition: "background 150ms, color 150ms",
          position: "relative",
        }}
        onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "oklch(1 0 0 / 0.04)"; e.currentTarget.style.color = "oklch(0.92 0 0)"; } }}
        onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "oklch(0.75 0.01 281)"; } }}
      >
        <Icon name={item.icon} size={18} strokeWidth={isActive ? 2.2 : 1.8} />
        {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}
        {!collapsed && item.count != null && (
          <span style={{
            fontSize: 10, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums",
            padding: "1px 6px", borderRadius: 999,
            background: isActive ? "oklch(1 0 0 / 0.18)" : "oklch(1 0 0 / 0.08)",
            color: "oklch(0.9 0 0)",
          }}>{item.count}</span>
        )}
      </button>
    );
  };

  return (
    <aside style={{
      width, flexShrink: 0,
      height: "100%", background: "oklch(0.18 0.01 281)",
      borderRight: "1px solid oklch(1 0 0 / 0.06)",
      display: "flex", flexDirection: "column",
      transition: "width 200ms ease-in-out",
      padding: "16px 12px",
      gap: 18,
    }}>
      {/* Brand + toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", paddingLeft: collapsed ? 0 : 4 }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em", color: "oklch(0.98 0 0)", lineHeight: 1 }}>
          Z<span style={{ color: "var(--primary)" }}>.</span>
          {!collapsed && <span style={{ marginLeft: 8, fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.04em", opacity: 0.6 }}>OS</span>}
        </span>
        {!collapsed && (
          <button onClick={onToggle} style={{
            border: "none", background: "transparent", cursor: "pointer",
            color: "oklch(0.65 0.01 281)", padding: 4, borderRadius: 6,
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "oklch(1 0 0 / 0.08)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          ><Icon name="panel-left-close" size={16} /></button>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 10px", borderRadius: 8,
          background: "oklch(1 0 0 / 0.05)",
          border: "1px solid oklch(1 0 0 / 0.05)",
          color: "oklch(0.7 0.01 281)", fontSize: 12,
        }}>
          <Icon name="search" size={13} />
          <span style={{ flex: 1 }}>Buscar…</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "oklch(1 0 0 / 0.08)" }}>⌘K</span>
        </div>
      )}

      {/* Main nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {!collapsed && <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "oklch(0.55 0.01 281)", padding: "4px 12px 6px" }}>Menu</span>}
        {nav.map(item => <NavItem key={item.id} item={item} />)}
      </div>

      <div style={{ flex: 1 }} />

      {/* Secondary nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {sec.map(item => <NavItem key={item.id} item={item} />)}
      </div>

      {/* User */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: collapsed ? 0 : "10px 10px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: 10, borderTop: "1px solid oklch(1 0 0 / 0.06)", paddingTop: 14,
      }}>
        <span style={{
          width: 32, height: 32, borderRadius: 999,
          background: "linear-gradient(135deg, oklch(0.60 0.22 281), oklch(0.48 0.26 281))",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: 11, fontWeight: 600,
          flexShrink: 0,
        }}>{user.initials}</span>
        {!collapsed && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ color: "oklch(0.95 0 0)", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</span>
            <span style={{ color: "oklch(0.55 0.01 281)", fontSize: 10 }}>{user.role}</span>
          </div>
        )}
        {collapsed && (
          <button onClick={onToggle} style={{
            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
            border: "none", background: "oklch(1 0 0 / 0.08)", cursor: "pointer",
            color: "oklch(0.85 0 0)", padding: 4, borderRadius: 6,
            display: "none",
          }}><Icon name="panel-left-open" size={14} /></button>
        )}
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar });
