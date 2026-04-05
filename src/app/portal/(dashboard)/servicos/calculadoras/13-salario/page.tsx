"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  calcularDecimoTerceiro,
  type ResultadoDecimoTerceiro,
  CalculatorShell,
  CurrencyInput,
  NumberInput,
  RangeInput,
  ResultRow,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  formatBRL,
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DecimoTerceiroCalculatorPage() {
  // Currency inputs
  const [salarioRaw, setSalarioRaw] = useState("");
  const [salarioBruto, setSalarioBruto] = useState(0);

  const [mediaAdicionaisRaw, setMediaAdicionaisRaw] = useState("");
  const [mediaAdicionais, setMediaAdicionais] = useState(0);

  // Range input
  const [mesesTrabalhados, setMesesTrabalhados] = useState(12);

  // Number input
  const [dependentesRaw, setDependentesRaw] = useState("");
  const [dependentes, setDependentes] = useState(0);

  // Reactive calculation
  const resultado: ResultadoDecimoTerceiro | null = useMemo(() => {
    if (salarioBruto <= 0) return null;

    return calcularDecimoTerceiro({
      salarioBruto,
      mesesTrabalhados,
      dependentes,
      adicionaisHabituais: mediaAdicionais,
    });
  }, [salarioBruto, mesesTrabalhados, dependentes, mediaAdicionais]);

  // PDF download
  const handleDownloadPDF = useCallback(async () => {
    if (!resultado) return;

    const sections: PDFSection[] = [
      { label: "13o Proporcional (bruto)", value: formatBRL(resultado.valor13oBruto), type: "row" },
      { label: "1a Parcela", value: formatBRL(resultado.primeiraParcelaValor), type: "row" },
      { label: "(-) INSS", value: `- ${formatBRL(resultado.inss.total)}`, type: "deduction" },
    ];

    if (!resultado.irrf.isento) {
      sections.push({ label: "(-) IRRF", value: `- ${formatBRL(resultado.irrf.imposto)}`, type: "deduction" });
    }

    sections.push({ label: "2a Parcela Liquida", value: formatBRL(Math.max(0, resultado.segundaParcelaLiquido)), type: "row" });
    sections.push({ label: "Total Liquido", value: formatBRL(resultado.totalLiquido), type: "total" });

    const disclaimer =
      "Este calculo tem carater meramente informativo e estimativo. Os valores exatos podem variar conforme convencoes coletivas, acordos individuais e interpretacoes juridicas. Consulte um advogado trabalhista para analise detalhada do seu caso.";

    const pdfBytes = await generateServicePDF({
      title: "Calculo do 13o Salario",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calculo-13-salario.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado]);

  // Share
  const handleShare = useCallback(async () => {
    if (!resultado) return;
    if (navigator.share) {
      await navigator.share({
        title: "Calculo do 13o Salario",
        text: `Total Liquido estimado: ${formatBRL(resultado.totalLiquido)}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [resultado]);

  // ─── Render ──────────────────────────────────────────────────────────────

  const inssRate = resultado
    ? `${(resultado.inss.aliquotaEfetiva * 100).toFixed(1)}%`
    : null;

  return (
    <CalculatorShell
      inputPanel={
        <>
          {/* Salario Bruto */}
          <CurrencyInput
            label="Salario Bruto"
            value={salarioRaw}
            onChange={(raw, parsed) => {
              setSalarioRaw(raw);
              setSalarioBruto(parsed);
            }}
          />

          {/* Meses Trabalhados */}
          <RangeInput
            label="Meses Trabalhados"
            value={mesesTrabalhados}
            onChange={setMesesTrabalhados}
            min={1}
            max={12}
            unit="meses"
            labels={["1 Mes", "6 Meses", "Ano Completo"]}
          />

          {/* Dependentes para IR */}
          <NumberInput
            label="Dependentes para IR"
            value={dependentesRaw}
            onChange={(raw, parsed) => {
              setDependentesRaw(raw);
              setDependentes(Math.max(0, Math.floor(parsed)));
            }}
            placeholder="0"
            suffix="dep."
          />

          {/* Media Adicionais Habituais */}
          <CurrencyInput
            label="Media Adicionais Habituais"
            value={mediaAdicionaisRaw}
            onChange={(raw, parsed) => {
              setMediaAdicionaisRaw(raw);
              setMediaAdicionais(parsed);
            }}
          />

          {/* Info note */}
          <p className="text-xs text-muted-foreground/60 italic leading-relaxed border-t border-border pt-6">
            Fracoes iguais ou superiores a 15 dias no mes contam como mes integral (1/12), conforme regulamentacao trabalhista vigente.
          </p>

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

              {/* Parcelas highlight cards */}
              <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                <div className="bg-muted rounded-xl p-5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    1a Parcela
                  </span>
                  <span className="text-2xl font-bold text-foreground font-headline tabular-nums">
                    {resultado ? formatBRL(resultado.primeiraParcelaValor) : formatBRL(0)}
                  </span>
                  <span className="text-xs text-muted-foreground/50 font-bold uppercase tracking-wider mt-2 block">
                    S/ DESCONTOS
                  </span>
                </div>
                <div className="bg-muted rounded-xl p-5 border border-primary/20">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-2">
                    2a Parcela
                  </span>
                  <span className="text-2xl font-bold text-foreground font-headline tabular-nums">
                    {resultado ? formatBRL(Math.max(0, resultado.segundaParcelaLiquido)) : formatBRL(0)}
                  </span>
                  <span className="text-xs text-muted-foreground/50 font-bold uppercase tracking-wider mt-2 block">
                    C/ DESCONTOS
                  </span>
                </div>
              </div>

              <div className="space-y-0 relative z-10">
                <ResultRow
                  label="13o Proporcional (bruto)"
                  value={resultado ? formatBRL(resultado.valor13oBruto) : "--"}
                  dimmed={!resultado}
                />
                <ResultRow
                  label={inssRate ? `(-) INSS (aliq. ef. ${inssRate})` : "(-) INSS"}
                  value={resultado ? `- ${formatBRL(resultado.inss.total)}` : "--"}
                  negative={!!resultado}
                  dimmed={!resultado}
                />
                {resultado && !resultado.irrf.isento && (
                  <ResultRow
                    label={`(-) IRRF (aliq. ef. ${(resultado.irrf.aliquotaEfetiva * 100).toFixed(1)}%)`}
                    value={`- ${formatBRL(resultado.irrf.imposto)}`}
                    negative
                  />
                )}
                {resultado && resultado.irrf.isento && (
                  <ResultRow
                    label="(-) IRRF"
                    value="Isento"
                    dimmed
                  />
                )}
                {!resultado && (
                  <ResultRow label="(-) IRRF" value="--" dimmed />
                )}
              </div>

              {/* Total Liquido highlight */}
              <div className="mt-6 pt-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Total Liquido
                  </span>
                  <span className="text-3xl font-bold text-primary font-headline tabular-nums">
                    {resultado ? formatBRL(resultado.totalLiquido) : formatBRL(0)}
                  </span>
                </div>
              </div>

              {/* Disclaimer */}
              <Disclaimer
                text="*Estimativa baseada nas tabelas progressivas de INSS e IRRF vigentes em 2026. Valores exatos podem variar conforme convencoes coletivas e acordos individuais. Consulte um advogado trabalhista para analise do seu caso."
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
