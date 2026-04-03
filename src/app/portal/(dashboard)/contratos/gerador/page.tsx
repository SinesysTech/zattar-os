"use client";

import { Card } from "@/components/ui/card";
import { Briefcase, ShieldCheck, Building2, ShoppingCart, Sparkles, Printer, Download } from "lucide-react";

export default function GeradorContratosPage() {
  return (
    <>
      {/* Editorial Header Section */}
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <span className="text-primary font-bold text-xs uppercase tracking-[0.2em] block mb-2">
          Redação Jurídica Automatizada
        </span>
        <h2 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tight mb-4 text-foreground">
          Gerador de <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-dim">Contratos.</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
          Gere documentos legais blindados em segundos utilizando a inteligência jurisdicional exclusiva Zattar. Precisão de elite, entrega instantânea.
        </p>
      </header>

      {/* Main Interactive Area: Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* Left Column: Form & Selection */}
        <div className="col-span-12 xl:col-span-7 space-y-8">

          {/* Step 1: Contract Type Selection */}
          <Card className="rounded-2xl p-8 border-l-4 border-l-primary/50 shadow-lg">
            <h3 className="font-headline text-xl font-bold mb-6 flex items-center gap-3 text-foreground">
              <span className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-black ring-2 ring-primary/20">01</span>
              Selecionar Instrumento Jurídico
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted border border-primary/50 text-primary shadow-sm transition-all">
                <Briefcase className="w-8 h-8 mb-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Trabalhista</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/50 hover:bg-muted border border-border hover:border-border/80 text-muted-foreground hover:text-foreground transition-all">
                <ShieldCheck className="w-8 h-8 mb-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">A.C. / NDA</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/50 hover:bg-muted border border-border hover:border-border/80 text-muted-foreground hover:text-foreground transition-all">
                <Building2 className="w-8 h-8 mb-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Aluguel / Imóvel</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/50 hover:bg-muted border border-border hover:border-border/80 text-muted-foreground hover:text-foreground transition-all">
                <ShoppingCart className="w-8 h-8 mb-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Vendas / B2B</span>
              </button>
            </div>
          </Card>

          {/* Step 2: Contract Details Form */}
          <Card className="rounded-2xl p-8 shadow-lg">
            <h3 className="font-headline text-xl font-bold mb-6 flex items-center gap-3 text-foreground">
              <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black">02</span>
              Configurar Parâmetros
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Nome da Contratante/Cliente</label>
                <input
                  className="w-full bg-muted border-none rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                  placeholder="Nome Completo da Pessoa Jurídica"
                  type="text"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Valor do Contrato (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">R$</span>
                  <input
                    className="w-full bg-muted border-none rounded-xl p-4 pl-12 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                    placeholder="0,00"
                    type="number"
                  />
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Duração (Meses)</label>
                <select className="w-full bg-muted border-none rounded-xl p-4 text-foreground focus:ring-1 focus:ring-primary/50 transition-all outline-none appearance-none">
                  <option value="indeterminado">Prazo Indeterminado</option>
                  <option value="12">12 Meses</option>
                  <option value="24">24 Meses</option>
                  <option value="custom">Personalizado...</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Data de Início/Eficácia</label>
                <input
                  className="w-full bg-muted border-none rounded-xl p-4 text-foreground focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                  type="date"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Cláusulas ou Exigências Específicas</label>
                <textarea
                  className="w-full bg-muted border-none rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/50 transition-all outline-none resize-none"
                  placeholder="Insira estipulações personalizadas, termos de não-concorrência, obrigações de EPI ou responsabilizações específicas..."
                  rows={4}
                ></textarea>
              </div>
            </div>
          </Card>

          {/* CTA Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-primary/5 p-6 rounded-2xl border border-primary/20 gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground mb-1">Verificação de IA Ativa</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mapeamento dinâmico CLT/Código Civil.</p>
              </div>
            </div>
            <button className="w-full sm:w-auto bg-linear-to-r from-primary to-primary-dim text-primary-foreground px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all text-xs">
              Sintetizar Minuta
            </button>
          </div>

        </div>

        {/* Right Column: Live Preview */}
        <div className="col-span-12 xl:col-span-5 relative">
          <div className="lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Visualização em Tempo Real</span>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all">
                  <Printer className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Canvas */}
            <Card className="rounded-2xl p-10 shadow-2xl relative overflow-hidden min-h-175">
              <div className="absolute inset-0 bg-linear-to-br from-white to-muted z-0"></div>

              {/* Document Content */}
              <div className="relative z-10 space-y-6 flex flex-col h-full text-black">
                <div className="flex justify-between items-start border-b border-black/10 pb-6">
                  <div>
                    <h4 className="font-serif font-bold text-2xl uppercase tracking-wider mb-1">Contrato de Trabalho</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Ref: ZAT-2024-089-T</p>
                  </div>
                  <div className="w-12 h-12 bg-black rounded flex items-center justify-center">
                    <span className="text-white font-serif font-bold text-xs">ZAT</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-black/5 rounded-lg border-l-2 border-black">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-bold">Parte A (Contratante)</p>
                    <p className="text-sm font-bold font-serif">ZATTAR ADVOGADOS ASSOCIADOS</p>
                  </div>
                  <div className="p-3 bg-black/5 rounded-lg border-l-2 border-primary/60">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-bold">Parte B (Empregado/Contratado)</p>
                    <p className="text-sm font-medium font-serif border-b border-black/20 pb-0.5 inline-block w-full">Nome completo pendente geração...</p>
                  </div>
                </div>

                <div className="space-y-5 pt-4 flex-1 font-serif text-muted-foreground">
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-bold uppercase tracking-widest text-black mb-2">Cláusula Primeira: Do Objeto</h5>
                    <p className="text-[11px] leading-relaxed text-muted-foreground text-justify">
                      A Contratante, neste ato, admite o Contratado para exercer a função supracitada, de acordo com as normas diretivas da corporação, submetendo-se a legislação vigente e orientações de compliance.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-bold uppercase tracking-widest text-black mb-2">Cláusula Segunda: Da Remuneração</h5>
                    <p className="text-[11px] leading-relaxed text-muted-foreground text-justify">
                      O Contratado perceberá o salário ajustado em formulário principal, pago mensalmente, até o 5º dia útil do mês subsequente, mediante depósito em conta bancária de sua titularidade, já computados os repousos semanais.
                    </p>
                  </div>
                  <div className="space-y-1 opacity-40">
                    <h5 className="text-[11px] font-bold uppercase tracking-widest text-black mb-2 flex items-center gap-2"><Sparkles className="w-3 h-3 text-primary" /> Cláusulas Opcionais / Específicas</h5>
                    <div className="h-2 w-full bg-black/5 mt-2 rounded"></div>
                    <div className="h-2 w-3/4 bg-black/5 mt-2 rounded"></div>
                    <div className="h-2 w-5/6 bg-black/5 mt-2 rounded"></div>
                  </div>
                </div>

                {/* Signature Lines */}
                <div className="grid grid-cols-2 gap-8 pt-12">
                  <div className="border-t border-black/30 pt-2 text-center">
                    <p className="text-[8px] uppercase font-bold text-muted-foreground">Representante Legal (Zattar)</p>
                  </div>
                  <div className="border-t border-black/30 pt-2 text-center">
                    <p className="text-[8px] uppercase font-bold text-muted-foreground">Assinatura do Contratado</p>
                  </div>
                </div>
              </div>

              {/* Ghost Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-20 mix-blend-overlay opacity-10">
                <span className="text-[80px] font-black uppercase rotate-[-35deg] tracking-tighter text-black">MINUTA ZATTAR</span>
              </div>
            </Card>
          </div>
        </div>

      </div>

    </>
  );
}
