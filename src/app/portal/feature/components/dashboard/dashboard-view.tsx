"use client";

import { Calendar, PenTool, PlusSquare, UploadCloud, Headset } from "lucide-react";

export function DashboardView() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 w-full pb-20">

      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <span className="text-primary text-xs font-bold tracking-wider uppercase">
            BEM-VINDO AO MAGISTRATE AI
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
            Dashboard do Cliente
          </h2>
        </div>
        <div className="flex items-center gap-4 bg-card p-1 rounded-full border border-border/50">
          <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold">Hoje</button>
          <button className="px-6 py-2 rounded-full text-muted-foreground text-xs font-bold hover:text-foreground">Semana</button>
          <button className="px-6 py-2 rounded-full text-muted-foreground text-xs font-bold hover:text-foreground">Mês</button>
        </div>
      </section>

      {/* Quick Action Tiles */}
      <section>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <QuickAction icon={Calendar} label="Próximo Compromisso" />
          <QuickAction icon={PenTool} label="Assinar Contrato" badge />
          <QuickAction icon={PlusSquare} label="Iniciar Novo Caso" />
          <QuickAction icon={UploadCloud} label="Enviar Documento" />
          <QuickAction icon={Headset} label="Suporte Direto" className="col-span-2 md:col-span-1" />
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Progress Visualization */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 p-8 relative shadow-sm">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">Progresso de Processos</h3>
              <p className="text-sm text-muted-foreground">Volume de movimentações vs. Prazos concluídos</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase">Movimentações</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-muted" />
                <span className="text-xs font-bold text-muted-foreground uppercase">Prazos</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-6 px-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
              <div className="w-full border-t border-border/30" />
              <div className="w-full border-t border-border/30" />
              <div className="w-full border-t border-border/30" />
              <div className="w-full border-t border-border/30" />
            </div>
            {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].map((month, i) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-3 group z-10">
                <div className="w-full flex items-end gap-1 h-48">
                  <div className={`flex-1 bg-muted rounded-t-lg transition-colors group-hover:bg-muted/80 h-[${40 + i * 10}%]`} style={{height: `${40 + i * 5}%`}} />
                  <div className={`flex-1 bg-linear-to-t from-primary/70 to-primary rounded-t-lg shadow-md`} style={{height: `${i === 2 ? 95 : 60 - i * 5}%`}} />
                </div>
                <span className={`text-xs ${i === 2 ? "text-primary" : "text-muted-foreground"} font-bold uppercase tracking-wider`}>
                  {month}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-around border-t border-border/50 pt-6 z-10 relative">
            <Stat label="Taxa de Sucesso" value="92%" valueClass="text-portal-success" />
            <Stat label="Média Tempo/Ação" value="14 Dias" />
            <Stat label="Audiências Ganhas" value="12/13" valueClass="text-primary" />
          </div>
        </div>

        {/* Featured Case */}
        <div className="space-y-6">
          <div className="bg-linear-to-br from-primary/10 to-transparent rounded-xl border border-border/50 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded">PRIORITÁRIO</span>
              <span className="text-xs font-bold text-muted-foreground">PROCESSO #4829</span>
            </div>
            <h4 className="text-lg font-bold mb-2 leading-tight text-foreground">Revisão de Propriedade Intelectual vs. Nexos Systems</h4>
            <div className="space-y-4 mt-6">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-muted-foreground uppercase">Fase Atual: Sentença</span>
                  <span className="text-primary">85%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[85%]" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">&quot;Aguardando publicação do acórdão em diário oficial previsto para 3 dias.&quot;</p>
            </div>
            <button className="w-full mt-6 py-3 bg-muted hover:bg-muted/80 border border-border rounded-xl text-xs font-bold transition-colors text-foreground">
              Detalhes do Caso
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Próxima Consulta</h4>
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex flex-col items-center justify-center border border-primary/30 shrink-0">
                <span className="text-xs font-bold text-primary">OUT</span>
                <span className="text-lg font-bold text-foreground leading-none">24</span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Audiência Trabalhista</p>
                <p className="text-xs text-muted-foreground uppercase">09:30 • Tribunal Regional</p>
              </div>
            </div>
            <button className="w-full mt-6 py-3 border border-dashed border-border hover:border-primary/50 rounded-xl text-xs font-bold text-muted-foreground hover:text-primary transition-all">
              Reagendar Consulta
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function QuickAction({ icon: Icon, label, badge, className = "" }: { icon: React.ElementType, label: string, badge?: boolean, className?: string }) {
  return (
    <button className={`bg-card p-5 rounded-xl border border-border/50 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:bg-primary/10 hover:border-primary/20 relative ${className}`}>
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-bold text-center text-foreground">{label}</span>
      {badge && <div className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full animate-pulse" />}
    </button>
  );
}

function Stat({ label, value, valueClass = "text-foreground" }: { label: string, value: string, valueClass?: string }) {
  return (
    <div className="text-center">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">{label}</p>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
