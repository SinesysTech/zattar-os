"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  calcularSeguroDesemprego,
  type ResultadoSeguroDesemprego,
  CalculatorShell,
  CurrencyInput,
  RangeInput,
  SelectOption,
  ResultRow,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  CtaZattar,
  formatBRL,
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ─── Options ─────────────────────────────────────────────────────────────────

const VEZES_OPTIONS = [
  { value: "1a", label: "1a Vez" },
  { value: "2a", label: "2a Vez" },
  { value: "3a_ou_mais", label: "3a+ Vez" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SeguroDesempregoCalculatorPage() {
  // Salary inputs — dual state (raw string + parsed number)
  const [sal1Raw, setSal1Raw] = useState("");
  const [sal1, setSal1] = useState(0);

  const [sal2Raw, setSal2Raw] = useState("");
  const [sal2, setSal2] = useState(0);

  const [sal3Raw, setSal3Raw] = useState("");
  const [sal3, setSal3] = useState(0);

  // Range input
  const [mesesTrabalhados, setMesesTrabalhados] = useState(12);

  // Select
  const [vezesSolicitado, setVezesSolicitado] = useState<"1a" | "2a" | "3a_ou_mais">("1a");

  // Computed media salarial
  const mediaSalarial = useMemo(() => {
    const salarios = [sal1, sal2, sal3].filter((s) => s > 0);
    if (salarios.length === 0) return 0;
    return salarios.reduce((acc, s) => acc + s, 0) / salarios.length;
  }, [sal1, sal2, sal3]);

  // Reactive calculation
  const resultado: ResultadoSeguroDesemprego | null = useMemo(() => {
    if (mediaSalarial <= 0) return null;

    return calcularSeguroDesemprego({
      salarioMedio: mediaSalarial,
      mesesTrabalhados,
      solicitacao: vezesSolicitado,
    });
  }, [mediaSalarial, mesesTrabalhados, vezesSolicitado]);

  // PDF download
  const handleDownloadPDF = useCallback(async () => {
    if (!resultado || !resultado.elegivel) return;

    const sections: PDFSection[] = [
      { label: "Media Salarial", value: formatBRL(mediaSalarial), type: "row" },
      { label: "Valor da Parcela", value: formatBRL(resultado.valorParcela), type: "row" },
      { label: "Quantidade de Parcelas", value: `${resultado.quantidadeParcelas}x`, type: "row" },
      { label: "Total Estimado", value: formatBRL(resultado.totalEstimado), type: "total" },
    ];

    const disclaimer =
      "Este calculo tem carater meramente informativo e estimativo. Os valores exatos podem variar conforme legislacao vigente e analise do SINE/MTE. Consulte um advogado trabalhista para analise detalhada do seu caso.";

    const pdfBytes = await generateServicePDF({
      title: "Calculo de Seguro-Desemprego",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calculo-seguro-desemprego.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado, mediaSalarial]);

  // Share
  const handleShare = useCallback(async () => {
    if (!resultado || !resultado.elegivel) return;
    if (navigator.share) {
      await navigator.share({
        title: "Calculo de Seguro-Desemprego",
        text: `Total Estimado: ${formatBRL(resultado.totalEstimado)} (${resultado.quantidadeParcelas}x ${formatBRL(resultado.valorParcela)})`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [resultado]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <CalculatorShell
      inputPanel={
        <>
          {/* Ultimo Salario */}
          <CurrencyInput
            label="Ultimo Salario (Mes 1)"
            value={sal1Raw}
            onChange={(raw, parsed) => {
              setSal1Raw(raw);
              setSal1(parsed);
            }}
          />

          {/* Penultimo Salario */}
          <CurrencyInput
            label="Penultimo Salario (Mes 2)"
            value={sal2Raw}
            onChange={(raw, parsed) => {
              setSal2Raw(raw);
              setSal2(parsed);
            }}
          />

          {/* Antepenultimo Salario */}
          <CurrencyInput
            label="Antepenultimo Salario (Mes 3)"
            value={sal3Raw}
            onChange={(raw, parsed) => {
              setSal3Raw(raw);
              setSal3(parsed);
            }}
          />

          {/* Meses Trabalhados */}
          <RangeInput
            label="Meses Trabalhados nos ultimos 36 meses"
            value={mesesTrabalhados}
            min={1}
            max={36}
            onChange={setMesesTrabalhados}
            labels={["6 Meses", "18 Meses", "36 Meses"] as [string, string, string]}
          />

          {/* Vezes que ja recebeu */}
          <SelectOption
            label="Vezes que ja recebeu"
            options={VEZES_OPTIONS}
            value={vezesSolicitado}
            onChange={(v) => setVezesSolicitado(v as "1a" | "2a" | "3a_ou_mais")}
            variant="buttons"
          />

          {/* Verified Badge */}
          <VerifiedBadge />
        </>
      }
      resultPanel={
        <>
          {resultado && !resultado.elegivel ? (
            /* ── Inelegivel state ── */
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Badge inelegivel */}
                <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5">
                  <span className="text-xs font-bold tracking-wider text-destructive uppercase">
                    NAO ELEGIVEL
                  </span>
                </div>

                {/* Motivo */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {resultado.motivoInelegibilidade}
                </p>

                {/* CTA */}
                <CtaZattar title="Ficou com duvida?" description="Fale com um advogado da Zattar e entenda seus direitos ao Seguro-Desemprego." />
              </CardContent>
            </Card>
          ) : (
            /* ── Elegivel / empty state ── */
            <Card>
              <CardContent className="p-6 relative overflow-hidden">

                <span className="text-xs font-bold tracking-wider text-primary uppercase block mb-4 relative z-10">
                  Resultado do Calculo
                </span>

                {/* Elegivel badge */}
                {resultado?.elegivel && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-portal-success-soft px-4 py-1.5 mb-6 relative z-10">
                    <svg
                      className="w-3.5 h-3.5 text-portal-success"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-bold tracking-wider text-portal-success uppercase">
                      ELEGIVEL
                    </span>
                  </div>
                )}

                <div className="space-y-0 relative z-10">
                  <ResultRow
                    label="Media Salarial"
                    value={resultado ? formatBRL(mediaSalarial) : "--"}
                    dimmed={!resultado}
                  />
                  <ResultRow
                    label="Valor da Parcela"
                    value={resultado ? formatBRL(resultado.valorParcela) : "--"}
                    dimmed={!resultado}
                  />
                  <ResultRow
                    label="Quantidade de Parcelas"
                    value={resultado ? `${resultado.quantidadeParcelas}x` : "--"}
                    dimmed={!resultado}
                  />
                </div>

                {/* Total Estimado highlight */}
                <div className="mt-6 pt-4 border-t border-border relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Total Estimado
                    </span>
                    <span className="text-3xl font-bold text-primary font-headline tabular-nums">
                      {resultado ? formatBRL(resultado.totalEstimado) : formatBRL(0)}
                    </span>
                  </div>
                </div>

                {/* Piso / Teto note */}
                {resultado?.elegivel && (
                  <p className="mt-3 text-[11px] text-muted-foreground/70 relative z-10">
                    Piso: R$ 1.621,00 &bull; Teto: R$ 2.518,65
                  </p>
                )}

                {/* Disclaimer */}
                <Disclaimer
                  text="*Estimativa baseada na legislacao vigente (2026). Os valores exatos podem variar conforme analise do SINE/MTE. Consulte um advogado trabalhista para analise do seu caso."
                />
              </CardContent>
            </Card>
          )}

          {/* Action buttons — only when elegivel */}
          {resultado?.elegivel && (
            <ActionButtons
              onDownloadPDF={handleDownloadPDF}
              onShare={handleShare}
            />
          )}
        </>
      }
    />
  );
}
