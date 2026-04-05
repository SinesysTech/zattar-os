"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  calcularFGTSAcumulado,
  type ResultadoFGTSAcumulado,
  CalculatorShell,
  CurrencyInput,
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

export default function FGTSAcumuladoCalculatorPage() {
  // Currency input — dual state (raw string + parsed number)
  const [salarioRaw, setSalarioRaw] = useState("");
  const [salarioBruto, setSalarioBruto] = useState(0);

  // Range input
  const [mesesTrabalhados, setMesesTrabalhados] = useState(24);

  // Reactive calculation
  const resultado: ResultadoFGTSAcumulado | null = useMemo(() => {
    if (salarioBruto <= 0) return null;

    return calcularFGTSAcumulado({
      salarioBruto,
      mesesTrabalhados,
      incluir13o: true,
      incluirFerias: true,
    });
  }, [salarioBruto, mesesTrabalhados]);

  // PDF download
  const handleDownloadPDF = useCallback(async () => {
    if (!resultado) return;

    const sections: PDFSection[] = [
      { label: "Deposito Mensal (8% do salario)", value: formatBRL(resultado.depositoMensal), type: "row" },
      { label: "Depositos 13o Salario", value: formatBRL(resultado.deposito13o * Math.floor(mesesTrabalhados / 12)), type: "row" },
      { label: "Depositos Ferias + 1/3", value: formatBRL(resultado.depositoFerias * Math.floor(mesesTrabalhados / 12)), type: "row" },
      { label: "Total Depositos", value: formatBRL(resultado.totalDepositos), type: "row" },
      { label: "Rendimento Estimado (3% a.a.)", value: formatBRL(resultado.totalRendimentos), type: "row" },
      { label: "Saldo Estimado", value: formatBRL(resultado.saldoEstimado), type: "total" },
    ];

    const disclaimer =
      "Valor estimado com rendimento simplificado de 3% a.a. (TR + juros). O saldo real pode variar conforme distribuicao de lucros do FGTS e indices oficiais.";

    const pdfBytes = await generateServicePDF({
      title: "Calculadora FGTS Acumulado",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calculo-fgts-acumulado.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado, mesesTrabalhados]);

  // Share
  const handleShare = useCallback(async () => {
    if (!resultado) return;
    if (navigator.share) {
      await navigator.share({
        title: "Calculadora FGTS Acumulado",
        text: `Saldo estimado de FGTS: ${formatBRL(resultado.saldoEstimado)}`,
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
            max={360}
            unit="meses"
            labels={["1 Mes", "15 Anos", "30 Anos"]}
          />

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
                <ResultRow
                  label="Deposito Mensal (8% do salario)"
                  value={resultado ? formatBRL(resultado.depositoMensal) : "--"}
                  dimmed={!resultado}
                />
                <ResultRow
                  label="Depositos 13o Salario"
                  value={
                    resultado
                      ? formatBRL(resultado.deposito13o * Math.floor(mesesTrabalhados / 12))
                      : "--"
                  }
                  dimmed={!resultado}
                />
                <ResultRow
                  label="Depositos Ferias + 1/3"
                  value={
                    resultado
                      ? formatBRL(resultado.depositoFerias * Math.floor(mesesTrabalhados / 12))
                      : "--"
                  }
                  dimmed={!resultado}
                />

                {/* Separator + Total Depositos */}
                <div className="border-t border-border mt-2" />
                <ResultRow
                  label="Total Depositos"
                  value={resultado ? formatBRL(resultado.totalDepositos) : "--"}
                  dimmed={!resultado}
                />
                <ResultRow
                  label="Rendimento Estimado (3% a.a.)"
                  value={resultado ? formatBRL(resultado.totalRendimentos) : "--"}
                  dimmed={!resultado}
                />
              </div>

              {/* Saldo Estimado highlight */}
              <div className="mt-6 pt-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Saldo Estimado
                  </span>
                  <span className="text-3xl font-bold text-primary font-headline tabular-nums">
                    {resultado ? formatBRL(resultado.saldoEstimado) : formatBRL(0)}
                  </span>
                </div>
              </div>

              {/* Disclaimer */}
              <Disclaimer
                text="Valor estimado com rendimento simplificado de 3% a.a. (TR + juros). O saldo real pode variar conforme distribuicao de lucros do FGTS e indices oficiais."
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
