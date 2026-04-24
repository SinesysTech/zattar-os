/* global React */
// Atomic: Button, Chip, IconContainer, GlassPanel

function Button({ variant = "primary", size = "md", icon, children, onClick, style = {} }) {
  const baseStyles = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "var(--font-sans)", fontWeight: 500, lineHeight: 1,
    border: "1px solid transparent", cursor: "pointer",
    transition: "all 150ms ease-in-out",
  };
  const sizes = {
    sm: { padding: "6px 10px", fontSize: 12, borderRadius: 8 },
    md: { padding: "8px 14px", fontSize: 13, borderRadius: 10 },
    lg: { padding: "10px 18px", fontSize: 14, borderRadius: 12 },
  };
  const variants = {
    primary:     { background: "var(--primary)",   color: "var(--primary-foreground)" },
    secondary:   { background: "var(--secondary)", color: "var(--secondary-foreground)", borderColor: "var(--border)" },
    outline:     { background: "transparent",      color: "var(--foreground)", borderColor: "var(--border)" },
    ghost:       { background: "transparent",      color: "var(--foreground)" },
    destructive: { background: "var(--destructive)", color: "white" },
  };
  const [hover, setHover] = useState(false);
  const hoverStyle = hover ? (
    variant === "primary"   ? { background: "var(--primary-dim)" } :
    variant === "secondary" ? { background: "oklch(0.93 0.04 281)" } :
    variant === "outline"   ? { background: "var(--muted)" } :
    variant === "ghost"     ? { background: "oklch(0.92 0.01 281 / 0.5)" } : {}
  ) : {};
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ ...baseStyles, ...sizes[size], ...variants[variant], ...hoverStyle, ...style }}>
      {icon && <Icon name={icon} size={size === "sm" ? 12 : 14} />}
      {children}
    </button>
  );
}

function Chip({ tone = "primary", children, solid = false, dot = true }) {
  const tones = {
    primary:     { bg: "oklch(0.48 0.26 281 / 0.12)",  fg: "var(--primary)" },
    success:     { bg: "oklch(0.55 0.18 145 / 0.12)",  fg: "oklch(0.35 0.16 145)" },
    warning:     { bg: "oklch(0.60 0.18 75 / 0.14)",   fg: "oklch(0.40 0.17 75)" },
    info:        { bg: "oklch(0.55 0.18 250 / 0.12)",  fg: "oklch(0.42 0.18 250)" },
    destructive: { bg: "oklch(0.55 0.22 25 / 0.14)",   fg: "oklch(0.45 0.22 25)" },
    muted:       { bg: "oklch(0.92 0.01 281)",         fg: "oklch(0.42 0.01 281)" },
  };
  const t = tones[tone] || tones.primary;
  const s = solid
    ? { background: t.fg, color: "white" }
    : { background: t.bg, color: t.fg };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 999,
      fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
      fontFamily: "var(--font-sans)", whiteSpace: "nowrap", ...s,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor" }} />}
      {children}
    </span>
  );
}

function IconContainer({ name, size = "md", tone = "primary", strokeWidth = 2 }) {
  const sizes = { xs: 20, sm: 24, md: 32, lg: 40 };
  const radii = { xs: 4, sm: 6, md: 8, lg: 12 };
  const tones = {
    primary:     { bg: "oklch(0.48 0.26 281 / 0.10)", fg: "var(--primary)" },
    success:     { bg: "oklch(0.55 0.18 145 / 0.10)", fg: "oklch(0.45 0.16 145)" },
    warning:     { bg: "oklch(0.60 0.18 75 / 0.12)",  fg: "oklch(0.45 0.17 75)" },
    info:        { bg: "oklch(0.55 0.18 250 / 0.10)", fg: "oklch(0.45 0.18 250)" },
    destructive: { bg: "oklch(0.55 0.22 25 / 0.10)",  fg: "oklch(0.50 0.22 25)" },
    muted:       { bg: "var(--muted)",                 fg: "var(--muted-foreground)" },
  };
  const t = tones[tone] || tones.primary;
  const px = sizes[size];
  return (
    <span style={{
      width: px, height: px, borderRadius: radii[size],
      background: t.bg, color: t.fg,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <Icon name={name} size={Math.round(px * 0.5)} strokeWidth={strokeWidth} />
    </span>
  );
}

function GlassPanel({ depth = 1, children, style = {}, padding = 16, radius = 16 }) {
  const depths = {
    1: { cls: "glass-widget", border: "1px solid oklch(0.87 0.01 281 / 0.4)" },
    2: { cls: "glass-kpi",    border: "1px solid oklch(0.87 0.01 281 / 0.55)" },
    3: { cls: "",             bg: "oklch(0.48 0.26 281 / 0.04)", border: "1px solid oklch(0.48 0.26 281 / 0.14)", blur: 20 },
  };
  const d = depths[depth];
  return (
    <div className={d.cls} style={{
      borderRadius: radius,
      padding,
      border: d.border,
      ...(d.bg ? { background: d.bg, backdropFilter: `blur(${d.blur}px)` } : {}),
      ...style,
    }}>{children}</div>
  );
}

Object.assign(window, { Button, Chip, IconContainer, GlassPanel });
