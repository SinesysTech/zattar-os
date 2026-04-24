/* global React */
// Shared utils + icon primitives for ZattarOS UI kit
// Uses Lucide icons via the UMD build loaded in index.html.

const { useState, useEffect, useRef, useMemo } = React;

// Hand-curated Lucide-style SVG set — avoids Lucide UMD API fragility.
// All paths are stroked, round cap/join, viewBox 24.
const ICON_PATHS = {
  "layout-dashboard":  '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  "folder-open":       '<path d="M6 14l1.5-2.9A2 2 0 0 1 9.3 10H21a1 1 0 0 1 1 1.2l-1.7 6.4A2 2 0 0 1 18.4 19H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v2"/>',
  "calendar":          '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  "message-circle":    '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
  "wallet":            '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/><path d="M3 5a2 2 0 0 0 2 2h16v10H5a2 2 0 0 1-2-2z"/><path d="M18 12a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>',
  "users":             '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  "sparkles":          '<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z"/><path d="M5 17l.6 1.4L7 19l-1.4.6L5 21l-.6-1.4L3 19l1.4-.6z"/>',
  "settings":          '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  "search":            '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  "plus":              '<path d="M12 5v14M5 12h14"/>',
  "bell":              '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  "arrow-right":       '<path d="M5 12h14M12 5l7 7-7 7"/>',
  "arrow-down-up":     '<path d="M3 16l4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16"/>',
  "filter":            '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
  "x":                 '<path d="M18 6 6 18M6 6l12 12"/>',
  "clock":             '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  "gavel":             '<path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>',
  "coins":             '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/>',
  "trending-up":       '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  "trending-down":     '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  "chevron-left":      '<path d="m15 18-6-6 6-6"/>',
  "chevron-right":     '<path d="m9 18 6-6-6-6"/>',
  "chevron-down":      '<path d="m6 9 6 6 6-6"/>',
  "panel-left-close":  '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18M16 15l-3-3 3-3"/>',
  "panel-left-open":   '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18M14 9l3 3-3 3"/>',
  "file-text":         '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8M16 17H8M10 9H8"/>',
  "check":             '<path d="M20 6 9 17l-5-5"/>',
  "user-plus":         '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  "alert-circle":      '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  "phone":             '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/>',
  "video":             '<path d="m22 8-6 4 6 4z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  "more-horizontal":   '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  "paperclip":         '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  "send":              '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
};

function Icon({ name, size = 16, className = "", strokeWidth = 2, style = {} }) {
  const paths = ICON_PATHS[name];
  if (!paths) {
    return <span className={className} style={{ display: "inline-block", width: size, height: size, ...style }} aria-hidden="true" />;
  }
  return (
    <span
      className={className}
      style={{ display: "inline-flex", width: size, height: size, ...style }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`,
      }}
    />
  );
}

// Avatar with deterministic color from user palette
function Avatar({ initials, color, size = 28, ring = true }) {
  const bg = color || "var(--primary)";
  return (
    <span style={{
      width: size, height: size, borderRadius: 999, background: bg,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      color: "white", fontSize: size * 0.36, fontWeight: 600, fontFamily: "var(--font-sans)",
      border: ring ? "2px solid var(--card)" : "none", flexShrink: 0,
    }}>{initials}</span>
  );
}

// Brand mark (Z. wordmark)
function BrandMark({ variant = "dark", size = 22, collapsed = false }) {
  const color = variant === "light" ? "oklch(0.98 0 0)" : "oklch(0.15 0.01 281)";
  return (
    <span style={{
      fontFamily: "var(--font-heading)", fontWeight: 800,
      fontSize: size, letterSpacing: "-0.04em", color,
      display: "inline-flex", alignItems: "baseline", lineHeight: 1,
    }}>
      Z<span style={{ color: "var(--primary)" }}>.</span>
      {!collapsed && (
        <span style={{
          marginLeft: 8, fontFamily: "var(--font-sans)", fontWeight: 500,
          fontSize: size * 0.55, letterSpacing: "0.02em", opacity: 0.7,
        }}>OS</span>
      )}
    </span>
  );
}

Object.assign(window, { Icon, Avatar, BrandMark });
