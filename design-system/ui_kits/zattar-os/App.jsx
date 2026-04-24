/* global React, Sidebar, Topbar, KpiCard, ProcessCard, CalendarWidget, PulseStrip, ChatPanel, Icon, GlassPanel, Chip, Button, IconContainer */

const DATA = {
  user: { name: "Ana Ribeiro", role: "Advogada Sênior", initials: "AR" },
  kpis: [
    { label: "Processos ativos",    value: "128", delta: "+4", deltaDir: "up",   sub: "vs. semana anterior", icon: "folder-open" },
    { label: "Prazos em 7 dias",    value: "7",   tone: "destructive", sub: "2 vencendo em 48h", icon: "clock" },
    { label: "Audiências este mês", value: "12",  delta: "+3", deltaDir: "up",   sub: "5 presenciais", icon: "gavel" },
    { label: "Valor em disputa",    value: "R$ 2,4M", delta: "−1.2%", deltaDir: "down", sub: "28 processos", icon: "coins" },
  ],
  processes: [
    {
      id: "p1",
      number: "0001234-56.2024.5.01.0001",
      title: "Silva & Cia Ltda vs. Banco Nacional S/A",
      status: "ATIVO", statusTone: "primary",
      meta: [
        { k: "Tribunal", v: "TRT1" },
        { k: "Responsável", v: "Dra. Ana Ribeiro" },
        { k: "Próx. prazo", v: "18/05/2026", mono: true },
        { k: "Valor", v: "R$ 248.500", mono: true },
      ],
      parties: [
        { initials: "SC", color: "oklch(0.60 0.22 281)" },
        { initials: "BN", color: "oklch(0.60 0.22 45)" },
        { initials: "LP", color: "oklch(0.55 0.18 145)" },
      ],
      extraParties: 2,
      updated: "há 2 dias",
    },
    {
      id: "p2",
      number: "5009876-43.2023.8.19.0001",
      title: "Martins Advogados — Inventário Extrajudicial",
      status: "EM ANDAMENTO", statusTone: "info",
      meta: [
        { k: "Tribunal", v: "TJ-RJ" },
        { k: "Responsável", v: "Dr. Luís Pereira" },
        { k: "Próx. prazo", v: "05/05/2026", mono: true },
        { k: "Valor", v: "R$ 1.450.000", mono: true },
      ],
      parties: [
        { initials: "MA", color: "oklch(0.55 0.18 250)" },
        { initials: "FH", color: "oklch(0.60 0.22 45)" },
      ],
      extraParties: 0,
      updated: "há 6h",
    },
    {
      id: "p3",
      number: "0004455-12.2025.5.02.0010",
      title: "Rodrigues & Associados — Ação Trabalhista Coletiva",
      status: "PRAZO VENCIDO", statusTone: "destructive",
      meta: [
        { k: "Tribunal", v: "TRT2" },
        { k: "Responsável", v: "Dra. Ana Ribeiro" },
        { k: "Próx. prazo", v: "HOJE · 18h", mono: true },
        { k: "Valor", v: "R$ 890.200", mono: true },
      ],
      parties: [
        { initials: "RA", color: "oklch(0.55 0.22 25)" },
        { initials: "IC", color: "oklch(0.60 0.22 281)" },
      ],
      extraParties: 4,
      updated: "há 1h",
    },
    {
      id: "p4",
      number: "2001122-34.2024.8.26.0100",
      title: "Oliveira Holding vs. Fiscalia Municipal",
      status: "SUSPENSO", statusTone: "warning",
      meta: [
        { k: "Tribunal", v: "TJ-SP" },
        { k: "Responsável", v: "Dra. Carla Mendes" },
        { k: "Próx. prazo", v: "—", mono: true },
        { k: "Valor", v: "R$ 3.200.000", mono: true },
      ],
      parties: [
        { initials: "OH", color: "oklch(0.60 0.18 75)" },
        { initials: "FM", color: "oklch(0.55 0.18 250)" },
      ],
      extraParties: 1,
      updated: "há 3 dias",
    },
  ],
  events: [
    { day: 25, month: "ABR", time: "09:30", title: "Audiência de Instrução", kind: "Audiência", where: "TRT1 · 1ª Vara",        color: "var(--event-audiencia)" },
    { day: 25, month: "ABR", time: "14:00", title: "Protocolar contestação · 0001234-56", kind: "Prazo", where: "TRT1", color: "var(--event-prazo)" },
    { day: 26, month: "ABR", time: "10:00", title: "Perícia técnica — Oliveira Holding",  kind: "Perícia", where: "Local",     color: "var(--event-pericia)" },
    { day: 28, month: "ABR", time: "—",     title: "Responder expediente 5009876-43",     kind: "Expediente", where: "TJ-RJ", color: "var(--event-expediente)" },
    { day: 30, month: "ABR", time: "15:30", title: "Reunião com cliente — Silva & Cia",   kind: "Agenda", where: "Escritório", color: "var(--event-agenda)" },
  ],
  pulse: [
    { icon: "file-text", tone: "info",     actor: "TRT1",                     verb: "publicou movimentação em", target: "0001234-56.2024", note: "Despacho · sentença a ser proferida", when: "14:02" },
    { icon: "check",     tone: "success",  actor: "Dra. Ana",                 verb: "protocolou peça em",       target: "5009876-43.2023", note: "Contestação · 14 páginas", when: "11:40" },
    { icon: "user-plus", tone: "primary",  actor: "Luís Pereira",             verb: "adicionou parte em",       target: "2001122-34.2024", note: "Sílvia Oliveira · Representante",      when: "10:15" },
    { icon: "alert-circle", tone: "destructive", actor: "Sistema",           verb: "sinalizou prazo em",       target: "0004455-12.2025", note: "Vence hoje às 18h",                     when: "08:30" },
    { icon: "calendar",  tone: "warning",  actor: "TJ-SP",                    verb: "marcou audiência em",      target: "2001122-34.2024", note: "12/05/2026 · 09h00",                    when: "ontem" },
  ],
};

function App() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState("p1");

  return (
    <div style={{
      display: "flex", height: "100vh", background: "var(--background)",
      color: "var(--foreground)",
    }}>
      <Sidebar active={page} onNavigate={setPage} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} user={DATA.user} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <Topbar page={page} />
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
            {page === "dashboard" && <DashboardView />}
            {page === "processos" && <ProcessosView selected={selected} onSelect={setSelected} />}
            {page === "agenda"    && <AgendaView />}
            {page === "chat"      && <div style={{ minHeight: 600 }}><ChatPanel /></div>}
            {(page === "financeiro" || page === "clientes" || page === "ai" || page === "config") && <EmptyView page={page} />}
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardView() {
  return (
    <>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {DATA.kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* Process spotlight + calendar */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
        <GlassPanel depth={1} padding={18}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15 }}>Processos em destaque</div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>Com movimentação nas últimas 72h</div>
            </div>
            <Button variant="outline" size="sm" icon="arrow-right">Ver todos</Button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {DATA.processes.slice(0, 4).map(p => <ProcessCard key={p.id} proc={p} />)}
          </div>
        </GlassPanel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <CalendarWidget events={DATA.events.slice(0, 4)} />
          <PulseStrip items={DATA.pulse.slice(0, 3)} />
        </div>
      </div>
    </>
  );
}

function ProcessosView({ selected, onSelect }) {
  const sel = DATA.processes.find(p => p.id === selected) || DATA.processes[0];
  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Button variant="primary" size="md" icon="plus">Adicionar processo</Button>
        <Button variant="outline" size="md" icon="filter">Filtrar</Button>
        <Button variant="outline" size="md" icon="arrow-down-up">Ordenar</Button>
        <div style={{ flex: 1 }} />
        <Chip tone="primary" dot={false}>128 ativos</Chip>
        <Chip tone="warning" dot={false}>3 suspensos</Chip>
        <Chip tone="destructive" dot={false}>1 prazo hoje</Chip>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {DATA.processes.map(p => <ProcessCard key={p.id} proc={p} selected={p.id === selected} onSelect={onSelect} />)}
        </div>
        <DetailPanel proc={sel} />
      </div>
    </>
  );
}

function DetailPanel({ proc }) {
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 16, padding: 18,
      display: "flex", flexDirection: "column", gap: 14,
      position: "sticky", top: 84, alignSelf: "flex-start",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--muted-foreground)" }}>Detalhes do processo</span>
        <button style={{ border: "none", background: "transparent", color: "var(--muted-foreground)", cursor: "pointer", padding: 2 }}><Icon name="x" size={14} /></button>
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted-foreground)" }}>{proc.number}</div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, lineHeight: 1.25, marginTop: 4 }}>{proc.title}</div>
      </div>
      <Chip tone={proc.statusTone}>{proc.status}</Chip>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
        {proc.meta.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--muted-foreground)" }}>{m.k}</span>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: m.mono ? "var(--font-mono)" : "var(--font-sans)" }}>{m.v}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--muted-foreground)" }}>Partes</span>
        {proc.parties.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ width: 28, height: 28, borderRadius: 999, background: p.color, color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600 }}>{p.initials}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>Parte {i + 1}</span>
              <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{i === 0 ? "Polo ativo" : "Polo passivo"}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <Button variant="primary" size="sm" icon="file-text">Abrir autos</Button>
        <Button variant="outline" size="sm" icon="message-circle">Chat</Button>
      </div>
    </div>
  );
}

function AgendaView() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
      <GlassPanel depth={1} padding={0}>
        <MiniCalendar />
      </GlassPanel>
      <CalendarWidget events={DATA.events} />
    </div>
  );
}

function MiniCalendar() {
  // April 2026 — 1st is Wednesday
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const offset = 3; // Mon=0..Sun=6, April 1 2026 is Wednesday (index 2)
  const weekdays = ["S", "T", "Q", "Q", "S", "S", "D"]; // Mon-Sun? keep Brazilian
  const eventsByDay = { 25: "var(--event-audiencia)", 26: "var(--event-pericia)", 28: "var(--event-expediente)", 30: "var(--event-agenda)" };
  const today = 24;
  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15 }}>Abril 2026</div>
        <div style={{ display: "flex", gap: 4 }}>
          <button style={{ border: "1px solid var(--border)", background: "var(--card)", width: 28, height: 28, borderRadius: 6, cursor: "pointer", color: "var(--muted-foreground)" }}><Icon name="chevron-left" size={13} /></button>
          <button style={{ border: "1px solid var(--border)", background: "var(--card)", width: 28, height: 28, borderRadius: 6, cursor: "pointer", color: "var(--muted-foreground)" }}><Icon name="chevron-right" size={13} /></button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {weekdays.map((d, i) => <div key={i} style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--muted-foreground)", textAlign: "center", padding: 4 }}>{d}</div>)}
        {Array.from({ length: offset }, (_, i) => <div key={"e" + i} />)}
        {days.map(d => {
          const isToday = d === today;
          const hasEvent = eventsByDay[d];
          return (
            <div key={d} style={{
              aspectRatio: 1,
              borderRadius: 8,
              background: isToday ? "var(--primary)" : "transparent",
              color: isToday ? "white" : "var(--foreground)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
              fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums",
              fontSize: 13, fontWeight: isToday ? 700 : 500,
              border: isToday ? "none" : "1px solid transparent",
              cursor: "pointer", position: "relative",
            }}
              onMouseEnter={(e) => { if (!isToday) e.currentTarget.style.background = "oklch(0.92 0.01 281 / 0.5)"; }}
              onMouseLeave={(e) => { if (!isToday) e.currentTarget.style.background = "transparent"; }}
            >
              {d}
              {hasEvent && <span style={{ width: 4, height: 4, borderRadius: 999, background: isToday ? "white" : hasEvent }} />}
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          ["Audiência", "var(--event-audiencia)"],
          ["Prazo", "var(--event-prazo)"],
          ["Perícia", "var(--event-pericia)"],
          ["Expediente", "var(--event-expediente)"],
          ["Agenda", "var(--event-agenda)"],
        ].map(([n, c]) => (
          <div key={n} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11, color: "var(--muted-foreground)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: c }} />
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyView({ page }) {
  const copy = {
    financeiro: { icon: "wallet",   title: "Financeiro",     desc: "Parcelas, repasses e relatórios mensais." },
    clientes:   { icon: "users",    title: "Clientes",       desc: "Base de clientes ativos e histórico de casos." },
    ai:         { icon: "sparkles", title: "Magistrate AI",  desc: "Assistente jurídico com análise de peças, geração de minutas e busca semântica." },
    config:     { icon: "settings", title: "Configurações", desc: "Preferências do escritório." },
  }[page];
  return (
    <GlassPanel depth={1} padding={60} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <IconContainer name={copy.icon} size="lg" tone="primary" />
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20 }}>{copy.title}</div>
      <div style={{ fontSize: 13, color: "var(--muted-foreground)", maxWidth: 420 }}>{copy.desc}</div>
      <div style={{ fontSize: 11, color: "var(--muted-foreground)", opacity: 0.7, marginTop: 6 }}>Não mockado neste kit — ver README.md</div>
    </GlassPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
