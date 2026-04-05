"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalculatorShell,
  CurrencyInput,
  ToggleOption,
  ResultRow,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  formatBRL,
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ─── Calculation Logic ────────────────────────────────────────────────────────

function diffMeses(start: Date, end: Date): number {
  return Math.max(
    0,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  );
}

interface ResultadoCorrecao {
  valorOriginal: number;
  correcao: number;
  juros: number;
  totalCorrigido: number;
  meses: number;
  detalhes?: {
    mesesPreJudicial: number;
    mesesJudicial: number;
    correcaoIPCA: number;
    jurosPreJud: number;
    correcaoSelic: number;
  };
}

function calcularCorrecao(
  valorOriginal: number,
  dataVencimento: Date,
  dataCalculo: Date,
  possuiAcaoJudicial: boolean,
  dataAjuizamento?: Date
): ResultadoCorrecao {
  if (valorOriginal <= 0) {
    return { valorOriginal: 0, correcao: 0, juros: 0, totalCorrigido: 0, meses: 0 };
  }

  const mesesTotal = diffMeses(dataVencimento, dataCalculo);

  if (!possuiAcaoJudicial || !dataAjuizamento) {
    // Fase unica: IPCA-E + juros 1% a.m.
    const fator = Math.pow(1 + 0.00367, mesesTotal);
    const correcao = valorOriginal * (fator - 1);
    const juros = valorOriginal * 0.01 * mesesTotal;
    return {
      valorOriginal,
      correcao,
      juros,
      totalCorrigido: valorOriginal + correcao + juros,
      meses: mesesTotal,
    };
  }

  // Duas fases
  const mesesPreJudicial = diffMeses(dataVencimento, dataAjuizamento);
  const mesesJudicial = diffMeses(dataAjuizamento, dataCalculo);

  // Fase 1: IPCA-E
  const fatorIPCA = Math.pow(1 + 0.00367, mesesPreJudicial);
  const correcaoIPCA = valorOriginal * (fatorIPCA - 1);
  const jurosPreJud = valorOriginal * 0.01 * mesesPreJudicial;

  // Fase 2: Selic (inclui correcao + juros)
  const valorAposPreJud = valorOriginal + correcaoIPCA + jurosPreJud;
  const fatorSelic = Math.pow(1 + 0.00968, mesesJudicial);
  const correcaoSelic = valorAposPreJud * (fatorSelic - 1);

  return {
    valorOriginal,
    correcao: correcaoIPCA + correcaoSelic,
    juros: jurosPreJud,
    totalCorrigido: valorAposPreJud + correcaoSelic,
    meses: mesesTotal,
    detalhes: { mesesPreJudicial, mesesJudicial, correcaoIPCA, jurosPreJud, correcaoSelic },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CorrecaoMonetariaCalculatorPage() {
  // Currency input — dual state
  const [valorRaw, setValorRaw] = useState("");
  const [valorOriginal, setValorOriginal] = useState(0);

  // Dates
  const [dataVencimento, setDataVencimento] = useState("");
  const [dataCalculo, setDataCalculo] = useState(todayStr());

  // Toggle + conditional date
  const [possuiAcaoJudicial, setPossuiAcaoJudicial] = useState(false);
  const [dataAjuizamento, setDataAjuizamento] = useState("");

  // Reactive calculation
  const resultado: ResultadoCorrecao | null = useMemo(() => {
    if (valorOriginal <= 0 || !dataVencimento || !dataCalculo) return null;

    const vencimento = new Date(dataVencimento + "T00:00:00");
    const calculo = new Date(dataCalculo + "T00:00:00");

    if (isNaN(vencimento.getTime()) || isNaN(calculo.getTime())) return null;
    if (calculo <= vencimento) return null;

    let ajuizamento: Date | undefined;
    if (possuiAcaoJudicial && dataAjuizamento) {
      ajuizamento = new Date(dataAjuizamento + "T00:00:00");
      if (isNaN(ajuizamento.getTime())) ajuizamento = undefined;
    }

    return calcularCorrecao(valorOriginal, vencimento, calculo, possuiAcaoJudicial, ajuizamento);
  }, [valorOriginal, dataVencimento, dataCalculo, possuiAcaoJudicial, dataAjuizamento]);

  // PDF download
  const handleDownloadPDF = useCallback(async () => {
    if (!resultado) return;

    const sections: PDFSection[] = [];

    sections.push({ label: "Valor Original", value: formatBRL(resultado.valorOriginal), type: "row" });
    sections.push({ label: "Periodo", value: `${resultado.meses} meses`, type: "row" });

    if (resultado.detalhes) {
      const d = resultado.detalhes;
      sections.push({ label: "Fase Pre-Judicial (IPCA-E)", value: "", type: "header" });
      sections.push({ label: `Correcao IPCA-E (${d.mesesPreJudicial} meses)`, value: formatBRL(d.correcaoIPCA), type: "row" });
      sections.push({ label: "Juros (1% a.m.)", value: formatBRL(d.jurosPreJud), type: "row" });
      sections.push({ label: "Fase Judicial (Selic)", value: "", type: "header" });
      sections.push({ label: `Correcao Selic (${d.mesesJudicial} meses)`, value: formatBRL(d.correcaoSelic), type: "row" });
    } else {
      sections.push({ label: "Correcao Monetaria (IPCA-E)", value: formatBRL(resultado.correcao), type: "row" });
      sections.push({ label: "Juros (1% a.m.)", value: formatBRL(resultado.juros), type: "row" });
    }

    sections.push({
      label: "Total Corrigido",
      value: formatBRL(resultado.totalCorrigido),
      type: "total",
    });

    const disclaimer =
      "Valores calculados com indices simplificados (IPCA-E 4,5% a.a., Selic 12,25% a.a.). Para valores exatos, consulte os indices oficiais do Banco Central do Brasil (SGS/BCB). Recomendamos consulta com advogado para calculos judiciais.";

    const pdfBytes = await generateServicePDF({
      title: "Calculo de Correcao Monetaria (ADC 58/STF)",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calculo-correcao-monetaria.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado]);

  // Share
  const handleShare = useCallback(async () => {
    if (!resultado) return;
    if (navigator.share) {
      await navigator.share({
        title: "Calculo de Correcao Monetaria",
        text: `Total corrigido estimado: ${formatBRL(resultado.totalCorrigido)}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [resultado]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <CalculatorShell
      inputPanel={
        <>
          {/* Valor Original */}
          <CurrencyInput
            label="Valor Original"
            value={valorRaw}
            onChange={(raw, parsed) => {
              setValorRaw(raw);
              setValorOriginal(parsed);
            }}
          />

          {/* Data de Vencimento */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Data de Vencimento
            </label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Data de Calculo */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Data de Calculo
            </label>
            <input
              type="date"
              value={dataCalculo}
              onChange={(e) => setDataCalculo(e.target.value)}
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Toggle acao judicial */}
          <ToggleOption
            label="Possui acao judicial em curso?"
            description="Aplica Selic na fase judicial (ADC 58/STF)"
            checked={possuiAcaoJudicial}
            onChange={setPossuiAcaoJudicial}
          />

          {/* Data do Ajuizamento (condicional) */}
          {possuiAcaoJudicial && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Data do Ajuizamento
              </label>
              <input
                type="date"
                value={dataAjuizamento}
                onChange={(e) => setDataAjuizamento(e.target.value)}
                className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
            </div>
          )}

          {/* Verified Badge */}
          <VerifiedBadge />
        </>
      }
      resultPanel={
        <>
          <Card>
            <CardContent className="p-6 relative overflow-hidden">

              <span className="text-xs font-bold tracking-wider text-primary uppercase block mb-6 relative z-10">
                Detalhamento do Calculo
              </span>

              <div className="space-y-0 relative z-10">
                {/* Valor Original */}
                <ResultRow
                  label="Valor Original"
                  value={resultado ? formatBRL(resultado.valorOriginal) : "--"}
                  dimmed={!resultado}
                />

                {/* Periodo */}
                <ResultRow
                  label="Periodo"
                  value={resultado ? `${resultado.meses} meses` : "--"}
                  dimmed={!resultado}
                />

                {/* Duas fases */}
                {resultado?.detalhes && (() => {
                  const d = resultado.detalhes;
                  return (
                    <>
                      {/* Fase Pre-Judicial */}
                      <div className="py-2 mt-2">
                        <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                          Fase Pre-Judicial (IPCA-E)
                        </span>
                      </div>
                      <ResultRow
                        label={`Correcao IPCA-E (${d.mesesPreJudicial} meses)`}
                        value={formatBRL(d.correcaoIPCA)}
                      />
                      <ResultRow
                        label="Juros (1% a.m.)"
                        value={formatBRL(d.jurosPreJud)}
                      />

                      {/* Fase Judicial */}
                      <div className="py-2 mt-2">
                        <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                          Fase Judicial (Selic)
                        </span>
                      </div>
                      <ResultRow
                        label={`Correcao Selic (${d.mesesJudicial} meses)`}
                        value={formatBRL(d.correcaoSelic)}
                      />
                    </>
                  );
                })()}

                {/* Fase unica */}
                {resultado && !resultado.detalhes && (
                  <>
                    <ResultRow
                      label="Correcao Monetaria (IPCA-E)"
                      value={formatBRL(resultado.correcao)}
                    />
                    <ResultRow
                      label="Juros (1% a.m.)"
                      value={formatBRL(resultado.juros)}
                    />
                  </>
                )}

                {/* Placeholder sem dados */}
                {!resultado && (
                  <>
                    <ResultRow label="Correcao Monetaria (IPCA-E)" value="--" dimmed />
                    <ResultRow label="Juros" value="--" dimmed />
                  </>
                )}

                {/* Separator */}
                <div className="border-t border-border mt-2" />
              </div>

              {/* Total Corrigido highlight */}
              <div className="mt-6 pt-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Total Corrigido
                  </span>
                  <span className="text-3xl font-bold text-primary font-headline tabular-nums">
                    {resultado ? formatBRL(resultado.totalCorrigido) : formatBRL(0)}
                  </span>
                </div>
              </div>

              {/* Disclaimer */}
              <Disclaimer
                text="*Valores calculados com indices simplificados (IPCA-E 4,5% a.a., Selic 12,25% a.a.). Para valores exatos, consulte os indices oficiais do Banco Central do Brasil (SGS/BCB). Recomendamos consulta com advogado para calculos judiciais."
              />
            </CardContent>
          </Card>

          {/* Action buttons */}
          <ActionButtons
            onDownloadPDF={handleDownloadPDF}
            onShare={handleShare}
          />
        </>
      }
    />
  );
}
