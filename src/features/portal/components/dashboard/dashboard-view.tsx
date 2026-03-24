"use client";

import { Calendar, PenTool, PlusSquare, UploadCloud, Headset } from "lucide-react";

export function DashboardView() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 w-full pb-20">
      
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <span className="text-primary font-headline text-xs font-bold tracking-widest uppercase">
            BEM-VINDO AO MAGISTRATE AI
          </span>
          <h2 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-on-surface">
            Dashboard do Cliente
          </h2>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-high p-1 rounded-full border border-white/5">
          <button className="px-6 py-2 rounded-full bg-primary text-on-primary-fixed text-xs font-bold">Hoje</button>
          <button className="px-6 py-2 rounded-full text-zinc-500 text-xs font-bold hover:text-zinc-200">Semana</button>
          <button className="px-6 py-2 rounded-full text-zinc-500 text-xs font-bold hover:text-zinc-200">Mês</button>
        </div>
      </section>

      {/* Quick Action Tiles */}
      <section>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Ações Rápidas</h3>
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
        <div className="lg:col-span-2 bg-surface-container-high/60 backdrop-blur-xl rounded-2xl border border-white/5 p-8 relative shadow-xl">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-2xl font-black font-headline tracking-tight text-on-surface">Progresso de Processos</h3>
              <p className="text-sm text-on-surface-variant">Volume de movimentações vs. Prazos concluídos</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Movimentações</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white/10" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Prazos</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-6 px-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
              <div className="w-full border-t border-white/5" />
              <div className="w-full border-t border-white/5" />
              <div className="w-full border-t border-white/5" />
              <div className="w-full border-t border-white/5" />
            </div>
            {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].map((month, i) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-3 group z-10">
                <div className="w-full flex items-end gap-1 h-48">
                  <div className={`flex-1 bg-white/5 rounded-t-lg transition-colors group-hover:bg-white/10 h-[${40 + i * 10}%]`} style={{height: `${40 + i * 5}%`}} />
                  <div className={`flex-1 bg-gradient-to-t from-primary-dim to-primary rounded-t-lg shadow-[0_0_20px_rgba(168,85,247,0.3)]`} style={{height: `${i === 2 ? 95 : 60 - i * 5}%`}} />
                </div>
                <span className={`text-[10px] ${i === 2 ? "text-primary" : "text-zinc-500"} font-bold uppercase tracking-widest`}>
                  {month}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-around border-t border-white/5 pt-6 z-10 relative">
            <Stat label="Taxa de Sucesso" value="92%" valueClass="text-emerald-400" />
            <Stat label="Média Tempo/Ação" value="14 Dias" />
            <Stat label="Audiências Ganhas" value="12/13" valueClass="text-primary" />
          </div>
        </div>

        {/* Featured Case */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl rounded-2xl border border-white/5 p-6 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <span className="px-2 py-1 bg-primary text-on-primary-fixed text-[10px] font-black rounded">PRIORITÁRIO</span>
              <span className="text-[10px] font-bold text-zinc-500">PROCESSO #4829</span>
            </div>
            <h4 className="text-lg font-bold font-headline mb-2 leading-tight text-on-surface">Revisão de Propriedade Intelectual vs. Nexos Systems</h4>
            <div className="space-y-4 mt-6">
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-zinc-500 uppercase">Fase Atual: Sentença</span>
                  <span className="text-primary">85%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[85%]" />
                </div>
              </div>
              <p className="text-xs text-on-surface-variant italic">&quot;Aguardando publicação do acórdão em diário oficial previsto para 3 dias.&quot;</p>
            </div>
            <button className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-colors text-on-surface">
              Detalhes do Caso
            </button>
          </div>

          <div className="bg-surface-container-high/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6 shadow-xl">
            <h4 className="text-sm font-bold font-headline mb-4 uppercase tracking-widest text-zinc-500">Próxima Consulta</h4>
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex flex-col items-center justify-center border border-primary/30 shrink-0">
                <span className="text-[10px] font-bold text-primary">OUT</span>
                <span className="text-lg font-black text-on-surface leading-none">24</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Audiência Trabalhista</p>
                <p className="text-[10px] text-on-surface-variant uppercase">09:30 • Tribunal Regional</p>
              </div>
            </div>
            <button className="w-full mt-6 py-3 border border-dashed border-white/20 hover:border-primary/50 rounded-xl text-xs font-bold text-zinc-400 hover:text-primary transition-all">
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
    <button className={`bg-surface-container-high/60 backdrop-blur-[20px] p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/10 hover:border-primary/40 relative ${className}`}>
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-bold text-center text-on-surface">{label}</span>
      {badge && <div className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full animate-pulse" />}
    </button>
  );
}

function Stat({ label, value, valueClass = "text-on-surface" }: { label: string, value: string, valueClass?: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{label}</p>
      <p className={`text-xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}
