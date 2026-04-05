"use client";

import { useState, useMemo, useCallback } from "react";
import { Check, X, AlertTriangle, Clock, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  calcularRescisao,
  type TipoRescisao,
  type TipoAvisoPrevio,
  type ResultadoRescisao,
  RangeInput,
  CurrencyInput,
  NumberInput,
  ResultRow,
  ActionButtons,
  CtaZattar,
  Disclaimer,
  formatBRL,
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  "Tipo de Rescisao",
  "Tempo de Servico",
  "Aviso Previo",
  "Verbas Recebidas",
  "Ferias",
  "Salario",
];

const TIPOS_RESCISAO: {
  value: TipoRescisao;
  label: string;
  description: string;
}[] = [
  {
    value: "sem_justa_causa",
    label: "Demissao sem Justa Causa",
    description: "A empresa encerrou o contrato sem motivo justificado",
  },
  {
    value: "pedido_demissao",
    label: "Pedido de Demissao",
    description: "Voce pediu para sair da empresa voluntariamente",
  },
  {
    value: "justa_causa",
    label: "Justa Causa",
    description: "Demissao por falta grave cometida pelo empregado",
  },
  {
    value: "consensual",
    label: "Rescisao Consensual",
    description: "Acordo mutuo entre empregado e empregador (reforma trabalhista)",
  },
  {
    value: "indireta",
    label: "Rescisao Indireta",
    description: "Falta grave do empregador reconhecida judicialmente",
  },
  {
    value: "termino_contrato",
    label: "Termino de Contrato",
    description: "Contrato por prazo determinado que chegou ao fim",
  },
];

const TIPOS_AVISO: {
  value: TipoAvisoPrevio;
  label: string;
  description: string;
}[] = [
  {
    value: "trabalhado",
    label: "Trabalhado",
    description: "Cumpriu o periodo de aviso previo trabalhando",
  },
  {
    value: "indenizado",
    label: "Indenizado",
    description: "Nao trabalhou, mas recebeu o valor correspondente",
  },
  {
    value: "dispensado",
    label: "Dispensado",
    description: "Nao trabalhou e nao recebeu o valor",
  },
];

interface VerbaRecebida {
  key: string;
  label: string;
}

const VERBAS_LIST: VerbaRecebida[] = [
  { key: "saldoSalario", label: "Saldo de Salario" },
  { key: "decimoTerceiro", label: "13o Proporcional" },
  { key: "ferias", label: "Ferias + 1/3" },
  { key: "multaFGTS", label: "Multa FGTS 40%" },
  { key: "avisoPrevio", label: "Aviso Previo" },
];

// ---------------------------------------------------------------------------
// Rights mapping per termination type
// ---------------------------------------------------------------------------

type DireitoKey =
  | "saldoSalario"
  | "avisoPrevio"
  | "decimoTerceiro"
  | "feriasProporcional"
  | "feriasVencidas"
  | "multaFGTS"
  | "seguroDesemprego";

interface Direito {
  key: DireitoKey;
  label: string;
}

const TODOS_DIREITOS: Direito[] = [
  { key: "saldoSalario", label: "Saldo de Salario" },
  { key: "avisoPrevio", label: "Aviso Previo Indenizado" },
  { key: "decimoTerceiro", label: "13o Proporcional" },
  { key: "feriasProporcional", label: "Ferias Proporcionais + 1/3" },
  { key: "feriasVencidas", label: "Ferias Vencidas + 1/3" },
  { key: "multaFGTS", label: "Multa FGTS 40%" },
  { key: "seguroDesemprego", label: "Seguro-Desemprego" },
];

const DIREITOS_POR_TIPO: Record<TipoRescisao, Set<DireitoKey>> = {
  sem_justa_causa: new Set([
    "saldoSalario",
    "avisoPrevio",
    "decimoTerceiro",
    "feriasProporcional",
    "feriasVencidas",
    "multaFGTS",
    "seguroDesemprego",
  ]),
  pedido_demissao: new Set([
    "saldoSalario",
    "decimoTerceiro",
    "feriasProporcional",
    "feriasVencidas",
  ]),
  justa_causa: new Set(["saldoSalario", "feriasVencidas"]),
  consensual: new Set([
    "saldoSalario",
    "decimoTerceiro",
    "feriasProporcional",
    "feriasVencidas",
    "multaFGTS",
  ]),
  indireta: new Set([
    "saldoSalario",
    "avisoPrevio",
    "decimoTerceiro",
    "feriasProporcional",
    "feriasVencidas",
    "multaFGTS",
    "seguroDesemprego",
  ]),
  termino_contrato: new Set([
    "saldoSalario",
    "decimoTerceiro",
    "feriasProporcional",
    "feriasVencidas",
    "multaFGTS",
  ]),
};

// Map verba keys received to direito keys for irregularity detection
const VERBA_TO_DIREITO: Record<string, DireitoKey> = {
  saldoSalario: "saldoSalario",
  decimoTerceiro: "decimoTerceiro",
  ferias: "feriasProporcional",
  multaFGTS: "multaFGTS",
  avisoPrevio: "avisoPrevio",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mesesParaLabel(meses: number): string {
  const anos = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  if (anos === 0) return `${mesesRestantes} ${mesesRestantes === 1 ? "mes" : "meses"}`;
  if (mesesRestantes === 0) return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  return `${anos} ${anos === 1 ? "ano" : "anos"} e ${mesesRestantes} ${mesesRestantes === 1 ? "mes" : "meses"}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DireitosDemissaoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Step 1
  const [tipoRescisao, setTipoRescisao] = useState<TipoRescisao | null>(null);
  // Step 2
  const [mesesServico, setMesesServico] = useState(12);
  // Step 3
  const [avisoPrevio, setAvisoPrevio] = useState<TipoAvisoPrevio | null>(null);
  // Step 4
  const [verbasRecebidas, setVerbasRecebidas] = useState<Set<string>>(new Set());
  // Step 5
  const [feriasVencidas, setFeriasVencidas] = useState<boolean | null>(null);
  // Step 6
  const [salarioRaw, setSalarioRaw] = useState("");
  const [salarioBruto, setSalarioBruto] = useState(0);
  const [dependentesRaw, setDependentesRaw] = useState("");
  const [dependentes, setDependentes] = useState(0);

  // ---------------------------------------------------------------------------
  // Validation per step
  // ---------------------------------------------------------------------------

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0:
        return tipoRescisao !== null;
      case 1:
        return mesesServico >= 1;
      case 2:
        return avisoPrevio !== null;
      case 3:
        return true; // can proceed with nothing selected
      case 4:
        return feriasVencidas !== null;
      case 5:
        return salarioBruto > 0;
      default:
        return false;
    }
  }, [currentStep, tipoRescisao, mesesServico, avisoPrevio, feriasVencidas, salarioBruto]);

  // ---------------------------------------------------------------------------
  // Calculation
  // ---------------------------------------------------------------------------

  const resultado: ResultadoRescisao | null = useMemo(() => {
    if (!showResult || !tipoRescisao || !avisoPrevio || salarioBruto <= 0) return null;

    const now = new Date();
    const admissao = new Date(now);
    admissao.setMonth(admissao.getMonth() - mesesServico);

    return calcularRescisao({
      salarioBruto,
      tipo: tipoRescisao,
      avisoPrevio,
      dataAdmissao: admissao,
      dataDemissao: now,
      diasTrabalhados: now.getDate(),
      saldoFGTS: 0,
      feriasVencidas: feriasVencidas === true,
      dependentes,
    });
  }, [showResult, tipoRescisao, avisoPrevio, salarioBruto, mesesServico, feriasVencidas, dependentes]);

  // ---------------------------------------------------------------------------
  // Irregularities
  // ---------------------------------------------------------------------------

  const irregularidades = useMemo(() => {
    if (!tipoRescisao) return [];
    const direitosDoTipo = DIREITOS_POR_TIPO[tipoRescisao];
    const issues: string[] = [];

    for (const verba of VERBAS_LIST) {
      const direitoKey = VERBA_TO_DIREITO[verba.key];
      if (direitoKey && direitosDoTipo.has(direitoKey) && !verbasRecebidas.has(verba.key)) {
        issues.push(verba.label);
      }
    }

    return issues;
  }, [tipoRescisao, verbasRecebidas]);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setShowResult(true);
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }

  function handleReset() {
    setCurrentStep(0);
    setShowResult(false);
    setTipoRescisao(null);
    setMesesServico(12);
    setAvisoPrevio(null);
    setVerbasRecebidas(new Set());
    setFeriasVencidas(null);
    setSalarioRaw("");
    setSalarioBruto(0);
    setDependentesRaw("");
    setDependentes(0);
  }

  // ---------------------------------------------------------------------------
  // PDF
  // ---------------------------------------------------------------------------

  const handleDownloadPDF = useCallback(async () => {
    if (!resultado || !tipoRescisao) return;

    const direitosDoTipo = DIREITOS_POR_TIPO[tipoRescisao];
    const sections: PDFSection[] = [];

    // Checklist
    sections.push({ label: "Checklist de Direitos", value: "", type: "header" });
    for (const direito of TODOS_DIREITOS) {
      const temDireito = direitosDoTipo.has(direito.key);
      sections.push({
        label: `${temDireito ? "[OK]" : "[X]"} ${direito.label}`,
        value: temDireito ? "Aplicavel" : "Nao aplicavel",
        type: "row",
      });
    }

    // Estimativa
    sections.push({ label: "Estimativa de Valores", value: "", type: "header" });
    for (const verba of resultado.verbas) {
      if (verba.tipo === "provento") {
        sections.push({ label: verba.label, value: formatBRL(verba.valor), type: "row" });
      }
    }
    sections.push({ label: "Total Liquido Estimado", value: formatBRL(resultado.totalLiquido), type: "total" });

    // Irregularidades
    if (irregularidades.length > 0) {
      sections.push({ label: "Irregularidades Detectadas", value: "", type: "header" });
      for (const item of irregularidades) {
        sections.push({ label: `Possivel irregularidade: ${item}`, value: "Nao recebido", type: "deduction" });
      }
    }

    // Prazos
    sections.push({ label: "Prazos Importantes", value: "", type: "header" });
    sections.push({ label: "Prazo para ajuizar acao", value: "2 anos apos a rescisao", type: "row" });
    sections.push({ label: "Periodo reclamavel", value: "Ultimos 5 anos", type: "row" });

    const disclaimer =
      "Este diagnostico tem carater meramente informativo e estimativo. Consulte um advogado trabalhista para analise detalhada do seu caso.";

    const pdfBytes = await generateServicePDF({
      title: "Diagnostico de Direitos na Demissao",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagnostico-direitos-demissao.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado, tipoRescisao, irregularidades]);

  // ---------------------------------------------------------------------------
  // Step Indicator
  // ---------------------------------------------------------------------------

  function StepIndicator() {
    return (
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                i < currentStep
                  ? "bg-primary text-primary-foreground"
                  : i === currentStep
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 transition-colors",
                  i < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Option Card
  // ---------------------------------------------------------------------------

  function OptionCard({
    selected,
    onClick,
    title,
    description,
  }: {
    selected: boolean;
    onClick: () => void;
    title: string;
    description?: string;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full text-left p-4 rounded-xl border-2 transition-all",
          selected
            ? "border-primary bg-primary/10"
            : "border-transparent bg-muted hover:bg-muted/80"
        )}
      >
        <span className="block font-bold text-foreground text-sm">{title}</span>
        {description && (
          <span className="block text-xs text-muted-foreground mt-1">
            {description}
          </span>
        )}
      </button>
    );
  }

  // ---------------------------------------------------------------------------
  // Step Content
  // ---------------------------------------------------------------------------

  function renderStepContent() {
    switch (currentStep) {
      // Step 1: Tipo de Rescisao
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Como foi o seu desligamento?
              </h2>
              <p className="text-sm text-muted-foreground">
                Selecione o tipo de rescisao do seu contrato de trabalho.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {TIPOS_RESCISAO.map((tipo) => (
                <OptionCard
                  key={tipo.value}
                  selected={tipoRescisao === tipo.value}
                  onClick={() => {
                    setTipoRescisao(tipo.value);
                    setTimeout(() => setCurrentStep(1), 300);
                  }}
                  title={tipo.label}
                  description={tipo.description}
                />
              ))}
            </div>
          </div>
        );

      // Step 2: Tempo de Servico
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Quanto tempo voce trabalhou nessa empresa?
              </h2>
              <p className="text-sm text-muted-foreground">
                Arraste o controle para informar o periodo trabalhado.
              </p>
            </div>
            <div className="space-y-4">
              <RangeInput
                label="Meses de servico"
                value={mesesServico}
                onChange={setMesesServico}
                min={1}
                max={360}
                unit="meses"
                labels={["1 mes", "15 anos", "30 anos"]}
              />
              <div className="text-center">
                <span className="text-lg font-bold text-primary">
                  {mesesParaLabel(mesesServico)}
                </span>
              </div>
            </div>
          </div>
        );

      // Step 3: Aviso Previo
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                O aviso previo foi cumprido?
              </h2>
              <p className="text-sm text-muted-foreground">
                Selecione como o aviso previo foi tratado na sua rescisao.
              </p>
            </div>
            <div className="grid gap-3">
              {TIPOS_AVISO.map((tipo) => (
                <OptionCard
                  key={tipo.value}
                  selected={avisoPrevio === tipo.value}
                  onClick={() => {
                    setAvisoPrevio(tipo.value);
                    setTimeout(() => setCurrentStep(3), 300);
                  }}
                  title={tipo.label}
                  description={tipo.description}
                />
              ))}
            </div>
          </div>
        );

      // Step 4: Verbas Recebidas
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Voce recebeu todas as verbas rescisorias?
              </h2>
              <p className="text-sm text-muted-foreground">
                Marque abaixo as verbas que voce efetivamente recebeu.
              </p>
            </div>
            <div className="space-y-3">
              {VERBAS_LIST.map((verba) => {
                const checked = verbasRecebidas.has(verba.key);
                return (
                  <label
                    key={verba.key}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2",
                      checked
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted hover:bg-muted/80"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                        checked
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {checked && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => {
                        setVerbasRecebidas((prev) => {
                          const next = new Set(prev);
                          if (next.has(verba.key)) {
                            next.delete(verba.key);
                          } else {
                            next.add(verba.key);
                          }
                          return next;
                        });
                      }}
                    />
                    <span className="font-bold text-foreground text-sm">
                      {verba.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      // Step 5: Ferias Vencidas
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Possui periodos de ferias vencidas (nao gozadas)?
              </h2>
              <p className="text-sm text-muted-foreground">
                Ferias vencidas sao aquelas cujo periodo aquisitivo ja completou mas
                voce nao usufruiu.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                selected={feriasVencidas === true}
                onClick={() => {
                  setFeriasVencidas(true);
                  setTimeout(() => setCurrentStep(5), 300);
                }}
                title="Sim"
                description="Tenho ferias vencidas que nao foram gozadas"
              />
              <OptionCard
                selected={feriasVencidas === false}
                onClick={() => {
                  setFeriasVencidas(false);
                  setTimeout(() => setCurrentStep(5), 300);
                }}
                title="Nao"
                description="Todas as minhas ferias foram gozadas normalmente"
              />
            </div>
          </div>
        );

      // Step 6: Salario
      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Qual era seu ultimo salario bruto?
              </h2>
              <p className="text-sm text-muted-foreground">
                Informe o salario bruto mensal e a quantidade de dependentes para IR.
              </p>
            </div>
            <div className="space-y-4">
              <CurrencyInput
                label="Salario Bruto Mensal"
                value={salarioRaw}
                onChange={(raw, parsed) => {
                  setSalarioRaw(raw);
                  setSalarioBruto(parsed);
                }}
              />
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
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Result
  // ---------------------------------------------------------------------------

  function renderResult() {
    if (!tipoRescisao || !resultado) return null;

    const direitosDoTipo = DIREITOS_POR_TIPO[tipoRescisao];
    const proventos = resultado.verbas.filter((v) => v.tipo === "provento");

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Diagnostico Completo
          </h2>
          <p className="text-sm text-muted-foreground">
            Baseado nas suas respostas, preparamos uma analise dos seus direitos
            trabalhistas.
          </p>
        </div>

        {/* 1. Checklist de Direitos */}
        <Card>
          <CardContent className="p-6">
            <span className="text-xs font-bold tracking-wider text-primary uppercase block mb-4">
              Checklist de Direitos
            </span>
            <div className="space-y-3">
              {TODOS_DIREITOS.map((direito) => {
                const temDireito = direitosDoTipo.has(direito.key);
                return (
                  <div
                    key={direito.key}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                        temDireito
                          ? "bg-portal-success-soft text-portal-success"
                          : "bg-destructive/20 text-destructive"
                      )}
                    >
                      {temDireito ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        temDireito
                          ? "text-foreground"
                          : "text-muted-foreground line-through"
                      )}
                    >
                      {direito.label}
                    </span>
                    {!temDireito && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        nao aplicavel
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 2. Estimativa de Valores */}
        <Card>
          <CardContent className="p-6 relative overflow-hidden">
            <span className="text-xs font-bold tracking-wider text-primary uppercase block mb-4 relative z-10">
              Estimativa de Valores
            </span>
            <div className="space-y-0 relative z-10">
              {proventos.map((v) => (
                <ResultRow
                  key={v.label}
                  label={v.label}
                  value={formatBRL(v.valor)}
                  dimmed={v.valor === 0}
                />
              ))}
              <div className="border-t border-border mt-2" />
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Total Liquido Estimado
                </span>
                <span className="text-3xl font-bold text-primary font-headline tabular-nums">
                  {formatBRL(resultado.totalLiquido)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Irregularidades Detectadas */}
        {irregularidades.length > 0 && (
          <Card className="border-destructive/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-xs font-bold tracking-wider text-destructive uppercase">
                  Irregularidades Detectadas
                </span>
              </div>
              <div className="space-y-3">
                {irregularidades.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg"
                  >
                    <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <span className="text-sm text-destructive font-medium">
                      POSSIVEL IRREGULARIDADE: Voce tem direito a{" "}
                      <strong>{item}</strong> mas nao recebeu.
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. Prazos */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold tracking-wider text-primary uppercase">
                Prazos Importantes
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <span className="text-sm text-foreground">
                  <strong>Prazo para ajuizar acao:</strong> 2 anos apos a rescisao
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <span className="text-sm text-foreground">
                  <strong>Periodo reclamavel:</strong> ultimos 5 anos
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. CTA Zattar (strong if irregularities) */}
        {irregularidades.length > 0 ? (
          <CtaZattar
            title="Irregularidades detectadas no seu caso"
            description="Nossos advogados podem analisar sua rescisao e verificar se voce tem direito a receber valores adicionais. A consulta inicial e gratuita."
            buttonText="Fale com um advogado"
          />
        ) : (
          <CtaZattar />
        )}

        {/* 6. Actions */}
        <ActionButtons onDownloadPDF={handleDownloadPDF} />

        {/* Disclaimer */}
        <Disclaimer text="*Este diagnostico tem carater meramente informativo e estimativo. Os valores e direitos podem variar conforme convencoes coletivas, acordos individuais e interpretacoes jurídicas. Consulte um advogado trabalhista para analise detalhada." />

        {/* Reset */}
        <button
          type="button"
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Refazer Diagnostico
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Diagnostico de Direitos na Demissao
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Descubra quais sao seus direitos trabalhistas com base no tipo de
          desligamento.
        </p>
      </div>

      {showResult ? (
        renderResult()
      ) : (
        <>
          {/* Step Indicator */}
          <StepIndicator />

          {/* Step Content */}
          <Card>
            <CardContent className="p-6">{renderStepContent()}</CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={cn(
                "flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-bold transition-all",
                currentStep === 0
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid}
              className={cn(
                "flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-bold transition-all",
                isStepValid
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                  : "bg-muted text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              {currentStep === STEPS.length - 1 ? "Gerar Diagnostico" : "Proximo"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
