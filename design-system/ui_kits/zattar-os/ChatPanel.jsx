/* global React, Icon */

function ChatPanel() {
  const [threads] = useState([
    { id: 1, name: "Silva & Cia — Trabalhista", last: "Dra. Ana: Peça enviada ✓", when: "14:02", unread: 2, color: "oklch(0.60 0.22 281)", active: true },
    { id: 2, name: "Equipe Cível",              last: "Luís: Audiência confirmada", when: "11:40", unread: 0, color: "oklch(0.60 0.22 45)" },
    { id: 3, name: "Martins — Família",         last: "Cliente: Obrigado pela atualização", when: "ontem", unread: 0, color: "oklch(0.55 0.18 145)" },
    { id: 4, name: "Revisão de peças",          last: "Pedro: Revisar art. 59 parágrafo 2",  when: "qua", unread: 0, color: "oklch(0.55 0.18 250)" },
  ]);

  const messages = [
    { who: "them", name: "Dra. Ana Ribeiro", role: "Sênior", text: "Boa tarde, Luís. Acabei de enviar a peça de contestação para sua revisão.", when: "13:58" },
    { who: "them", name: "Dra. Ana Ribeiro", text: "Por favor, confira o item III — preciso saber se o argumento sobre prescrição bienal está bem colocado.", when: "13:58" },
    { who: "me",   name: "Você",             text: "Pode deixar. Vou revisar agora e devolvo ainda hoje.", when: "14:00" },
    { who: "me",   name: "Você",             text: "Ajustei prazo para 16h — precisa protocolar hoje?", when: "14:00" },
    { who: "them", name: "Dra. Ana Ribeiro", text: "Sim, protocolo até 18h. Obrigada!", when: "14:02" },
  ];

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "280px 1fr",
      height: "100%", minHeight: 560,
      background: "var(--card)",
      borderRadius: 16,
      border: "1px solid var(--border)",
      overflow: "hidden",
    }}>
      {/* Sidebar */}
      <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "oklch(0.97 0.005 281)" }}>
        <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px", borderRadius: 8,
            background: "var(--card)", border: "1px solid var(--border)",
            fontSize: 12, color: "var(--muted-foreground)",
          }}>
            <Icon name="search" size={13} />
            <span>Buscar conversas…</span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {threads.map(t => (
            <div key={t.id} style={{
              display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 10, alignItems: "center",
              padding: "11px 14px",
              background: t.active ? "oklch(0.95 0.04 281)" : "transparent",
              borderLeft: `3px solid ${t.active ? "var(--primary)" : "transparent"}`,
              cursor: "pointer",
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 999, background: t.color,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: 11, fontWeight: 600,
              }}>{t.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.last}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{t.when}</span>
                {t.unread > 0 && <span style={{
                  fontSize: 9, fontWeight: 700, background: "var(--primary)", color: "white",
                  padding: "1px 6px", borderRadius: 999, minWidth: 16, textAlign: "center",
                }}>{t.unread}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div style={{ display: "flex", flexDirection: "column", background: "oklch(0.97 0.005 281)" }}>
        <div style={{ padding: 14, borderBottom: "1px solid var(--border)", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 32, height: 32, borderRadius: 999, background: "oklch(0.60 0.22 281)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 11, fontWeight: 600,
            }}>SC</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Silva & Cia — Trabalhista</div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>3 participantes · processo 0001234-56.2024</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={chatIcon}><Icon name="phone" size={14} /></button>
            <button style={chatIcon}><Icon name="video" size={14} /></button>
            <button style={chatIcon}><Icon name="more-horizontal" size={14} /></button>
          </div>
        </div>
        <div style={{ flex: 1, padding: 16, overflow: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column", gap: 2,
              alignSelf: m.who === "me" ? "flex-end" : "flex-start",
              maxWidth: "68%",
            }}>
              {m.name && (i === 0 || messages[i-1].who !== m.who) && (
                <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 600, padding: m.who === "me" ? "0 8px 0 0" : "0 0 0 8px", textAlign: m.who === "me" ? "right" : "left" }}>
                  {m.who === "me" ? "" : m.name}
                </span>
              )}
              <div style={{
                padding: "8px 12px",
                borderRadius: m.who === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: m.who === "me" ? "var(--primary)" : "var(--card)",
                color: m.who === "me" ? "white" : "var(--foreground)",
                border: m.who === "me" ? "none" : "1px solid var(--border)",
                fontSize: 13, lineHeight: 1.45,
              }}>{m.text}</div>
              <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", padding: m.who === "me" ? "0 8px 0 0" : "0 0 0 8px", textAlign: m.who === "me" ? "right" : "left" }}>{m.when}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid var(--border)", background: "var(--card)", display: "flex", alignItems: "center", gap: 8 }}>
          <button style={chatIcon}><Icon name="paperclip" size={14} /></button>
          <input placeholder="Digite sua mensagem…" style={{
            flex: 1, padding: "8px 12px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--background)",
            fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--foreground)",
          }} />
          <button style={{ ...chatIcon, background: "var(--primary)", color: "white", border: "none" }}>
            <Icon name="send" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
const chatIcon = {
  width: 32, height: 32, borderRadius: 8,
  border: "1px solid var(--border)", background: "var(--card)",
  color: "var(--muted-foreground)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
};
Object.assign(window, { ChatPanel });
