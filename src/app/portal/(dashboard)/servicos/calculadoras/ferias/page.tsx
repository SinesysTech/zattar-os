"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  calcularFerias,
  type ResultadoFerias,
  CalculatorShell,
  CurrencyInput,
  NumberInput,
  RangeInput,
  ToggleOption,
  ResultRow,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  formatBRL,
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FeriasCalculatorPage() {
  // Currency inputs
  const [salarioRaw, setSalarioRaw] = useState("");
  const [salarioBruto, setSalarioBruto] = useState(0);

  const [adicionaisRaw, setAdicionaisRaw] = useState("");
  const [adicionaisHabituais, setAdicionaisHabituais] = useState(0);

  // Range input
  const [diasFerias, setDiasFerias] = useState(30);

  // Toggle
  const [abonoPecuniario, setAbonoPecuniario] = useState(false);

  // Number inputs
  const [dependentesRaw, setDependentesRaw] = useState("");
  const [dependentes, setDependentes] = useState(0);

  const [faltasRaw, setFaltasRaw] = useState("");
  const [faltasInjustificadas, setFaltasInjustificadas] = useState(0);

  // Reactive calculation
  const resultado: ResultadoFerias | null = useMemo(() => {
    if (salarioBruto <= 0) return null;

    return calcularFerias({
      salarioBruto,
      faltasInjustificadas,
      abonoPecuniario,
      dependentes,
      adicionaisHabituais,
    });
  }, [salarioBruto, faltasInjustificadas, abonoPecuniario, dependentes, adicionaisHabituais]);

  // PDF download
  const handleDownloadPDF = useCallback(async () => {
    if (!resultado) return;

    const sections: PDFSection[] = [];

    // Proventos
    sections.push({ label: "Proventos", value: "", type: "header" });
    sections.push({
      label: `Salário Proporcional (${resultado.diasGozo} dias)`,
      value: formatBRL(resultado.valorBase),
      type: "row",
    });
    sections.push({
      label: "1/3 Constitucional",
      value: formatBRL(resultado.tercoConstitucional),
      type: "row",
    });
    if (abonoPecuniario && resultado.diasAbono > 0) {
      sections.push({
        label: `Abono Pecuniário (${resultado.diasAbono} dias)`,
        value: formatBRL(resultado.valorAbono),
        type: "row",
      });
      sections.push({
        label: "1/3 Abono",
        value: formatBRL(resultado.tercoAbono),
        type: "row",
      });
    }
    if (adicionaisHabituais > 0) {
      sections.push({
        label: "Média Adicionais Habituais",
        value: formatBRL(adicionaisHabituais),
        type: "row",
      });
    }

    // Totals
    sections.push({ label: "Total Bruto", value: formatBRL(resultado.totalBruto), type: "total" });

    // Descontos
    sections.push({ label: "Descontos", value: "", type: "header" });
    sections.push({
      label: `INSS (${(resultado.inss.aliquotaEfetiva * 100).toFixed(2)}% efetivo)`,
      value: `- ${formatBRL(resultado.inss.total)}`,
      type: "deduction",
    });
    if (!resultado.irrf.isento) {
      sections.push({
        label: `IRRF (${(resultado.irrf.aliquotaEfetiva * 100).toFixed(2)}% efetivo)`,
        value: `- ${formatBRL(resultado.irrf.imposto)}`,
        type: "deduction",
      });
    }

    sections.push({ label: "Total Líquido", value: formatBRL(resultado.totalLiquido), type: "total" });

    const disclaimer =
      "Este cálculo tem caráter meramente informativo e estimativo. INSS e IRRF calculados com tabelas progressivas vigentes em 2026. Os valores exatos podem variar conforme convenções coletivas, acordos individuais e interpretações jurídicas. Consulte um advogado trabalhista para análise detalhada do seu caso.";

    const pdfBytes = await generateServicePDF({
      title: "Cálculo de Férias Trabalhistas",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calculo-ferias-trabalhistas.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado, abonoPecuniario, adicionaisHabituais]);

  // Share
  const handleShare = useCallback(async () => {
    if (!resultado) return;
    if (navigator.share) {
      await navigator.share({
        title: "Cálculo de Férias Trabalhistas",
        text: `Total Líquido estimado: ${formatBRL(resultado.totalLiquido)}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [resultado]);

  // ─── Render ──────────────────────────────────────────────────────────────

  const diasDireitoReduzido =
    resultado && resultado.diasDireito !== 30;

  const inssRate = resultado
    ? `${(resultado.inss.aliquotaEfetiva * 100).toFixed(2)}%`
    : null;

  const irrfRate = resultado && !resultado.irrf.isento
    ? `${(resultado.irrf.aliquotaEfetiva * 100).toFixed(2)}%`
    : null;

  return (
    <CalculatorShell
      inputPanel={
        <>
          {/* Salário Bruto */}
          <CurrencyInput
            label="Salário Bruto"
            value={salarioRaw}
            onChange={(raw, parsed) => {
              setSalarioRaw(raw);
              setSalarioBruto(parsed);
            }}
          />

          {/* Dias de Férias */}
          <RangeInput
            label="Dias de Férias"
            value={diasFerias}
            onChange={setDiasFerias}
            min={1}
            max={30}
            labels={["01 Dia", "15 Dias", "30 Dias"]}
          />

          {/* Abono Pecuniário */}
          <ToggleOption
            label="Abono Pecuniário (Vender 1/3 das férias)"
            description="Converte 1/3 dos dias de férias em pagamento em dinheiro"
            checked={abonoPecuniario}
            onChange={setAbonoPecuniario}
          />

          {/* Média Adicionais Habituais */}
          <CurrencyInput
            label="Média Adicionais Habituais"
            value={adicionaisRaw}
            onChange={(raw, parsed) => {
              setAdicionaisRaw(raw);
              setAdicionaisHabituais(parsed);
            }}
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

          {/* Faltas Injustificadas */}
          <NumberInput
            label="Faltas Injustificadas"
            value={faltasRaw}
            onChange={(raw, parsed) => {
              setFaltasRaw(raw);
              setFaltasInjustificadas(Math.max(0, Math.floor(parsed)));
            }}
            placeholder="0"
            suffix="faltas"
          />

          {/* Verified Badge */}
          <VerifiedBadge />
        </>
      }
      resultPanel={
        <>
          <Card>
            <CardContent className="p-6 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/10 blur-[70px] rounded-full pointer-events-none" />

              <span className="text-xs font-bold tracking-widest text-primary uppercase block mb-6 relative z-10">
                Detalhamento do Cálculo
              </span>

              <div className="space-y-0 relative z-10">
                {/* Dias de direito reduzidos por faltas */}
                {diasDireitoReduzido && resultado && (
                  <ResultRow
                    label="Dias de Direito (após reduções)"
                    value={`${resultado.diasDireito} dias`}
                  />
                )}

                {/* Salário Proporcional */}
                <ResultRow
                  label={resultado ? `Salário Proporcional (${resultado.diasGozo} dias)` : "Salário Proporcional (30 dias)"}
                  value={resultado ? formatBRL(resultado.valorBase) : "--"}
                  dimmed={!resultado}
                />

                {/* 1/3 Constitucional */}
                <ResultRow
                  label="1/3 Constitucional"
                  value={resultado ? formatBRL(resultado.tercoConstitucional) : "--"}
                  dimmed={!resultado}
                />

                {/* Abono Pecuniário */}
                <ResultRow
                  label={resultado && resultado.diasAbono > 0 ? `Abono Pecuniário (${resultado.diasAbono} dias)` : "Abono Pecuniário"}
                  value={resultado && resultado.diasAbono > 0 ? formatBRL(resultado.valorAbono) : "--"}
                  dimmed={!resultado || resultado.diasAbono === 0}
                />

                {/* 1/3 Abono */}
                <ResultRow
                  label="1/3 Abono"
                  value={resultado && resultado.diasAbono > 0 ? formatBRL(resultado.tercoAbono) : "--"}
                  dimmed={!resultado || resultado.diasAbono === 0}
                />

                {/* Média Adicionais */}
                <ResultRow
                  label="Média Adicionais Habituais"
                  value={adicionaisHabituais > 0 ? formatBRL(adicionaisHabituais) : "--"}
                  dimmed={adicionaisHabituais <= 0}
                />

                {/* Separator + Total Bruto */}
                <div className="border-t border-border mt-2" />
                <div className="py-3 flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total Bruto</span>
                  <span className="font-mono font-bold tabular-nums text-foreground text-sm">
                    {resultado ? formatBRL(resultado.totalBruto) : formatBRL(0)}
                  </span>
                </div>

                {/* INSS */}
                <ResultRow
                  label={inssRate ? `(-) INSS — ${inssRate} efetivo` : "(-) INSS"}
                  value={resultado ? `- ${formatBRL(resultado.inss.total)}` : "--"}
                  negative={!!resultado}
                  dimmed={!resultado}
                />

                {/* IRRF */}
                <ResultRow
                  label={irrfRate ? `(-) IRRF — ${irrfRate} efetivo` : "(-) IRRF"}
                  value={
                    resultado
                      ? resultado.irrf.isento
                        ? "Isento"
                        : `- ${formatBRL(resultado.irrf.imposto)}`
                      : "--"
                  }
                  negative={!!(resultado && !resultado.irrf.isento)}
                  dimmed={!resultado || resultado.irrf.isento}
                />
              </div>

              {/* Total Líquido highlight */}
              <div className="mt-6 pt-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Total Líquido
                  </span>
                  <span className="text-3xl font-black text-primary font-headline tabular-nums">
                    {resultado ? formatBRL(resultado.totalLiquido) : formatBRL(0)}
                  </span>
                </div>
              </div>

              {/* Disclaimer progressive rates */}
              <Disclaimer
                text="*INSS e IRRF calculados com tabelas progressivas vigentes (2026). Abono pecuniário isento de tributos. Valores exatos podem variar conforme convenções coletivas, acordos individuais e interpretações jurídicas. Consulte um advogado trabalhista para análise do seu caso."
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
