"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import {
  calcularHorasExtras,
  type ResultadoHorasExtras,
  CalculatorShell,
  CurrencyInput,
  NumberInput,
  SelectOption,
  ResultRow,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  formatBRL,
  generateServicePDF,
  type PDFSection,
  FGTS_PERCENTUAL,
  FGTS_MULTA_PERCENTUAL,
} from "@/app/portal/feature/servicos";

// ─── Options ─────────────────────────────────────────────────────────────────

const HORAS_MES_OPTIONS = [
  { value: "220", label: "220h" },
  { value: "200", label: "200h" },
  { value: "180", label: "180h" },
  { value: "150", label: "150h" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HorasExtrasCalculatorPage() {
  // Currency inputs
  const [salarioRaw, setSalarioRaw] = useState("");
  const [salarioBruto, setSalarioBruto] = useState(0);

  // Horas/Mês select
  const [horasMes, setHorasMes] = useState("220");

  // Number inputs
  const [heDiasUteisRaw, setHeDiasUteisRaw] = useState("");
  const [heDiasUteis, setHeDiasUteis] = useState(0);

  const [heFdsRaw, setHeFdsRaw] = useState("");
  const [heFds, setHeFds] = useState(0);

  const [periodoRaw, setPeriodoRaw] = useState("");
  const [periodo, setPeriodo] = useState(1);

  const [percentualConvencaoRaw, setPercentualConvencaoRaw] = useState("");
  const [percentualConvencao, setPercentualConvencao] = useState(0);

  // Reactive calculation
  const resultado: ResultadoHorasExtras | null = useMemo(() => {
    if (salarioBruto <= 0) return null;

    const percentualSemana =
      percentualConvencao > 0 ? percentualConvencao / 100 : 0.5;

    return calcularHorasExtras({
      salarioBruto,
      horasMensais: parseInt(horasMes, 10),
      horasExtrasSemana: heDiasUteis,
      horasExtrasFimDeSemana: heFds,
      percentualSemana,
      percentualFimDeSemana: 1.0,
    });
  }, [salarioBruto, horasMes, heDiasUteis, heFds, percentualConvencao]);

  const periodoFinal = Math.max(1, Math.floor(periodo) || 1);

  // Derived reflexos breakdown
  const baseReflexos = resultado
    ? resultado.totalHorasExtras + resultado.dsr
    : 0;
  const fgts8 = resultado
    ? Math.round((baseReflexos + resultado.reflexoFerias + resultado.reflexo13o) * FGTS_PERCENTUAL * 100) / 100
    : 0;
  const multa40 = resultado
    ? Math.round(fgts8 * FGTS_MULTA_PERCENTUAL * 100) / 100
    : 0;

  const totalMensal = resultado ? resultado.totalComReflexos : 0;
  const totalPeriodo = totalMensal * periodoFinal;

  // PDF download
  const handleDownloadPDF = useCallback(async () => {
    if (!resultado) return;

    const sections: PDFSection[] = [
      { label: "Valor Hora Normal", value: formatBRL(resultado.valorHoraNormal), type: "row" },
      { label: "Valor Hora Extra 50%", value: formatBRL(resultado.valorHoraExtraSemana), type: "row" },
      { label: "Valor Hora Extra 100%", value: formatBRL(resultado.valorHoraExtraFds), type: "row" },
      { label: "Total HE Dias Úteis", value: formatBRL(resultado.totalSemana), type: "row" },
      { label: "Total HE Fim de Semana", value: formatBRL(resultado.totalFds), type: "row" },
      { label: "Total Horas Extras", value: formatBRL(resultado.totalHorasExtras), type: "row" },
      { label: "DSR", value: formatBRL(resultado.dsr), type: "row" },
      { label: "Reflexos", value: "", type: "header" },
      { label: "Férias + 1/3", value: formatBRL(resultado.reflexoFerias), type: "row" },
      { label: "13º Salário", value: formatBRL(resultado.reflexo13o), type: "row" },
      { label: "FGTS 8%", value: formatBRL(fgts8), type: "row" },
      { label: "Multa FGTS 40%", value: formatBRL(multa40), type: "row" },
      { label: "Total Mensal", value: formatBRL(totalMensal), type: "total" },
    ];

    if (periodoFinal > 1) {
      sections.push({ label: `Total Período (${periodoFinal} meses)`, value: formatBRL(totalPeriodo), type: "total" });
    }

    const disclaimer =
      "Este cálculo tem caráter meramente informativo e estimativo. Os valores exatos podem variar conforme convenções coletivas, acordos individuais e interpretações jurídicas. Consulte um advogado trabalhista para análise detalhada do seu caso.";

    const pdfBytes = await generateServicePDF({
      title: "Cálculo de Horas Extras",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calculo-horas-extras.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado, fgts8, multa40, totalMensal, totalPeriodo, periodoFinal]);

  // Share
  const handleShare = useCallback(async () => {
    if (!resultado) return;
    if (navigator.share) {
      await navigator.share({
        title: "Cálculo de Horas Extras",
        text: `Total mensal estimado com reflexos: ${formatBRL(totalMensal)}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [resultado, totalMensal]);

  const hasData = resultado !== null;
  const hasHours = heDiasUteis > 0 || heFds > 0;

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

          {/* Horas / Mês */}
          <SelectOption
            label="Horas / Mês"
            options={HORAS_MES_OPTIONS}
            value={horasMes}
            onChange={(v) => setHorasMes(v)}
            variant="buttons"
          />

          {/* Horas Extras Dias Úteis */}
          <NumberInput
            label="Horas Extras Dias Úteis"
            value={heDiasUteisRaw}
            onChange={(raw, parsed) => {
              setHeDiasUteisRaw(raw);
              setHeDiasUteis(Math.max(0, parsed));
            }}
            placeholder="0"
            suffix="hrs"
          />

          {/* Horas Extras Fim de Semana / Feriados */}
          <NumberInput
            label="Horas Extras Fim de Semana / Feriados"
            value={heFdsRaw}
            onChange={(raw, parsed) => {
              setHeFdsRaw(raw);
              setHeFds(Math.max(0, parsed));
            }}
            placeholder="0"
            suffix="hrs"
          />

          {/* Período em Meses */}
          <NumberInput
            label="Período em Meses"
            value={periodoRaw}
            onChange={(raw, parsed) => {
              setPeriodoRaw(raw);
              setPeriodo(Math.max(1, Math.floor(parsed) || 1));
            }}
            placeholder="1"
            suffix="meses"
          />

          {/* Percentual Convenção Coletiva (opcional) */}
          <NumberInput
            label="Percentual Convenção Coletiva (opcional)"
            value={percentualConvencaoRaw}
            onChange={(raw, parsed) => {
              setPercentualConvencaoRaw(raw);
              setPercentualConvencao(Math.max(0, parsed));
            }}
            placeholder="50"
            suffix="%"
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
                {/* Valores hora */}
                <ResultRow
                  label="Valor Hora Normal"
                  value={hasData ? formatBRL(resultado.valorHoraNormal) : "--"}
                  dimmed={!hasData}
                />
                <ResultRow
                  label="Valor Hora Extra 50%"
                  value={hasData ? formatBRL(resultado.valorHoraExtraSemana) : "--"}
                  dimmed={!hasData}
                />
                <ResultRow
                  label="Valor Hora Extra 100%"
                  value={hasData ? formatBRL(resultado.valorHoraExtraFds) : "--"}
                  dimmed={!hasData}
                />

                {/* Totais HE */}
                <ResultRow
                  label="Total HE Dias Úteis"
                  value={hasData && hasHours ? formatBRL(resultado.totalSemana) : "--"}
                  dimmed={!hasData || !hasHours}
                />
                <ResultRow
                  label="Total HE Fim de Semana"
                  value={hasData && heFds > 0 ? formatBRL(resultado.totalFds) : "--"}
                  dimmed={!hasData || heFds <= 0}
                />
                <ResultRow
                  label="Total Horas Extras"
                  value={hasData && hasHours ? formatBRL(resultado.totalHorasExtras) : "--"}
                  dimmed={!hasData || !hasHours}
                />
                <ResultRow
                  label="DSR (Descanso Semanal Remunerado)"
                  value={hasData && hasHours ? formatBRL(resultado.dsr) : "--"}
                  dimmed={!hasData || !hasHours}
                />

                {/* Separator */}
                <div className="border-t border-border my-2" />

                {/* Reflexos */}
                <div className="py-2">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Reflexos
                  </span>
                </div>
                <ResultRow
                  label="Férias + 1/3"
                  value={hasData && hasHours ? formatBRL(resultado.reflexoFerias) : "--"}
                  dimmed={!hasData || !hasHours}
                />
                <ResultRow
                  label="13º Salário"
                  value={hasData && hasHours ? formatBRL(resultado.reflexo13o) : "--"}
                  dimmed={!hasData || !hasHours}
                />
                <ResultRow
                  label="FGTS 8%"
                  value={hasData && hasHours ? formatBRL(fgts8) : "--"}
                  dimmed={!hasData || !hasHours}
                />
                <ResultRow
                  label="Multa FGTS 40%"
                  value={hasData && hasHours ? formatBRL(multa40) : "--"}
                  dimmed={!hasData || !hasHours}
                />
              </div>

              {/* Total Mensal highlight */}
              <div className="mt-6 pt-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Total Mensal
                  </span>
                  <span className="text-3xl font-black text-primary font-headline tabular-nums">
                    {formatBRL(totalMensal)}
                  </span>
                </div>
              </div>

              {/* Total Período highlight (only when periodo > 1) */}
              {periodoFinal > 1 && (
                <div className="mt-4 pt-4 border-t border-border relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Total Período ({periodoFinal} meses)
                    </span>
                    <span className="text-2xl font-black text-primary/80 font-headline tabular-nums">
                      {formatBRL(totalPeriodo)}
                    </span>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <Disclaimer
                text="*Estimativa baseada na legislação CLT vigente. Reflexos calculados conforme Súmula 264 do TST. Valores exatos podem variar conforme convenções coletivas e acordos individuais. Consulte um advogado trabalhista para análise do seu caso."
              />
            </CardContent>
          </Card>

          {/* Fórmula card */}
          <Card>
            <CardContent className="p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Fórmula Aplicada
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono text-muted-foreground/70">
                <p>Hora Normal = Salário ÷ Horas/Mês</p>
                <p>Hora Extra 50% = Hora Normal × 1,50</p>
                <p>Hora Extra 100% = Hora Normal × 2,00</p>
                <p>DSR = Total HE ÷ 6 (Art. 7º, Lei 605/49)</p>
                <p>Férias + 1/3 = (Total + DSR) ÷ 12 × 1,333</p>
                <p>13º = (Total + DSR) ÷ 12</p>
                <p>FGTS = Base × 8% | Multa = FGTS × 40%</p>
              </div>
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
