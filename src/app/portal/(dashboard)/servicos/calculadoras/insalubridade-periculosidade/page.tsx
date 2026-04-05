"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  calcularInsalubridadePericulosidade,
  type GrauInsalubridade,
  type ResultadoInsalubridadePericulosidade,
  CalculatorShell,
  CurrencyInput,
  SelectOption,
  ResultRow,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  formatBRL,
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ─── Options ─────────────────────────────────────────────────────────────────

const TIPOS_ADICIONAL: { value: "insalubridade" | "periculosidade"; label: string }[] = [
  { value: "insalubridade", label: "Insalubridade" },
  { value: "periculosidade", label: "Periculosidade" },
];

const GRAUS_INSALUBRIDADE: { value: GrauInsalubridade; label: string }[] = [
  { value: "minimo", label: "Mínimo (10%)" },
  { value: "medio", label: "Médio (20%)" },
  { value: "maximo", label: "Máximo (40%)" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InsalubridadePericulosidadeCalculatorPage() {
  const [salarioRaw, setSalarioRaw] = useState("");
  const [salarioBruto, setSalarioBruto] = useState(0);

  const [tipo, setTipo] = useState<"insalubridade" | "periculosidade">("insalubridade");
  const [grau, setGrau] = useState<GrauInsalubridade>("medio");

  const resultado: ResultadoInsalubridadePericulosidade | null = useMemo(() => {
    if (salarioBruto <= 0) return null;

    return calcularInsalubridadePericulosidade({
      salarioBruto,
      insalubridade: tipo === "insalubridade" ? grau : undefined,
      periculosidade: tipo === "periculosidade",
    });
  }, [salarioBruto, tipo, grau]);

  // PDF download
  const handleDownloadPDF = useCallback(async () => {
    if (!resultado) return;

    const sections: PDFSection[] = [];

    const tipoLabel = resultado.tipoMaiorValor === "insalubridade" ? "Insalubridade" : "Periculosidade";
    const baseCalculo =
      resultado.tipoMaiorValor === "insalubridade"
        ? resultado.insalubridade.baseCalculo
        : resultado.periculosidade.baseCalculo;
    const percentual =
      resultado.tipoMaiorValor === "insalubridade"
        ? resultado.insalubridade.percentual
        : resultado.periculosidade.percentual;

    sections.push({ label: "Tipo de Adicional", value: tipoLabel, type: "row" });
    sections.push({ label: "Base de Cálculo", value: formatBRL(baseCalculo), type: "row" });
    sections.push({ label: "Percentual Aplicado", value: `${(percentual * 100).toFixed(0)}%`, type: "row" });
    sections.push({ label: "Valor do Adicional", value: formatBRL(resultado.maiorValor), type: "total" });

    const disclaimer =
      "Este cálculo tem caráter meramente informativo e estimativo. A insalubridade é calculada sobre o salário mínimo vigente (R$ 1.621,00). A periculosidade corresponde a 30% do salário contratual. O trabalhador não pode acumular ambos os adicionais simultaneamente. Consulte um advogado trabalhista para análise detalhada do seu caso.";

    const pdfBytes = await generateServicePDF({
      title: "Cálculo de Insalubridade / Periculosidade",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calculo-insalubridade-periculosidade.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado]);

  // Share
  const handleShare = useCallback(async () => {
    if (!resultado) return;
    if (navigator.share) {
      await navigator.share({
        title: "Cálculo de Insalubridade / Periculosidade",
        text: `Valor do Adicional estimado: ${formatBRL(resultado.maiorValor)}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [resultado]);

  // ─── Derived display values ──────────────────────────────────────────────

  const tipoLabel =
    resultado?.tipoMaiorValor === "insalubridade"
      ? "Insalubridade"
      : resultado?.tipoMaiorValor === "periculosidade"
        ? "Periculosidade"
        : "--";

  const baseCalculoLabel =
    tipo === "insalubridade" ? "Salário Mínimo (base insalubridade)" : "Salário Bruto (base periculosidade)";

  const baseCalculoValor =
    resultado
      ? tipo === "insalubridade"
        ? formatBRL(resultado.insalubridade.baseCalculo)
        : formatBRL(resultado.periculosidade.baseCalculo)
      : "--";

  const percentualValor =
    resultado
      ? tipo === "insalubridade"
        ? `${(resultado.insalubridade.percentual * 100).toFixed(0)}%`
        : `${(resultado.periculosidade.percentual * 100).toFixed(0)}%`
      : "--";

  // ─── Render ──────────────────────────────────────────────────────────────

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

          {/* Tipo de Adicional */}
          <SelectOption
            label="Tipo de Adicional"
            options={TIPOS_ADICIONAL}
            value={tipo}
            onChange={(v) => setTipo(v as "insalubridade" | "periculosidade")}
          />

          {/* Grau de Insalubridade — somente quando tipo = insalubridade */}
          {tipo === "insalubridade" && (
            <SelectOption
              label="Grau de Insalubridade"
              options={GRAUS_INSALUBRIDADE}
              value={grau}
              onChange={(v) => setGrau(v as GrauInsalubridade)}
            />
          )}

          {/* Nota sobre não cumulação */}
          <div className="rounded-lg border border-portal-warning/20 bg-portal-warning-soft p-4">
            <p className="text-xs text-portal-warning leading-relaxed">
              O trabalhador não pode acumular insalubridade e periculosidade simultaneamente. Deve optar pelo adicional mais vantajoso.
            </p>
          </div>

          {/* Verified Badge */}
          <VerifiedBadge />
        </>
      }
      resultPanel={
        <>
          <Card>
            <CardContent className="p-6 relative overflow-hidden">

              <span className="text-xs font-bold tracking-wider text-primary uppercase block mb-6 relative z-10">
                Detalhamento do Cálculo
              </span>

              <div className="space-y-0 relative z-10">
                {/* Tipo de Adicional */}
                <ResultRow
                  label="Tipo de Adicional"
                  value={resultado ? tipoLabel : "--"}
                  dimmed={!resultado}
                />

                {/* Base de Cálculo */}
                <ResultRow
                  label={baseCalculoLabel}
                  value={baseCalculoValor}
                  dimmed={!resultado}
                />

                {/* Percentual Aplicado */}
                <ResultRow
                  label="Percentual Aplicado"
                  value={percentualValor}
                  dimmed={!resultado}
                />

                <div className="border-t border-border mt-2" />
              </div>

              {/* Valor do Adicional highlight */}
              <div className="mt-6 pt-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Valor do Adicional
                  </span>
                  <span className="text-3xl font-bold text-primary font-headline tabular-nums">
                    {resultado ? formatBRL(resultado.maiorValor) : formatBRL(0)}
                  </span>
                </div>
              </div>

              {/* Info card */}
              <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4 relative z-10">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Insalubridade:</strong> calculada como percentual sobre o salário mínimo nacional (R$&nbsp;1.621,00) — mínimo 10%, médio 20%, máximo 40%.
                  <br />
                  <strong className="text-foreground">Periculosidade:</strong> corresponde a 30% sobre o salário contratual do trabalhador, independentemente do salário mínimo.
                </p>
              </div>

              {/* Disclaimer */}
              <Disclaimer
                text="*Estimativa baseada na legislação CLT vigente (Súmula 364 TST / Art. 193 §2 CLT). Valores exatos podem variar conforme convenções coletivas, acordos individuais e laudos periciais. Consulte um advogado trabalhista para análise do seu caso."
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
