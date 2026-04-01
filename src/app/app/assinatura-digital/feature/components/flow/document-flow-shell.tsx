"use client";

/**
 * DocumentFlowShell — Shell unificado para o fluxo de criação de documentos
 *
 * Provê:
 * - Header sticky com stepper horizontal (desktop) ou progress bar (mobile)
 * - Botão de saída (volta para lista)
 * - Detecção automática da etapa atual pela URL
 * - Layout full-height que se integra com o CopilotDashboard
 *
 * Usado como wrapper nas 3 rotas: /novo, /editar/[uuid], /revisar/[uuid]
 */

import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { ArrowLeft, Upload, Settings, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// ─── Step Definitions ──────────────────────────────────────────────────

interface FlowStep {
  id: string;
  label: string;
  icon: React.ElementType;
  pathPattern: string;
}

const FLOW_STEPS: FlowStep[] = [
  { id: "upload", label: "Enviar", icon: Upload, pathPattern: "/novo" },
  { id: "configurar", label: "Configurar", icon: Settings, pathPattern: "/editar" },
  { id: "revisar", label: "Revisar", icon: Eye, pathPattern: "/revisar" },
];

// ─── Step Detection Hook ───────────────────────────────────────────────

function useCurrentFlowStep() {
  const pathname = usePathname();

  return useMemo(() => {
    const idx = FLOW_STEPS.findIndex((s) => pathname?.includes(s.pathPattern));
    return Math.max(0, idx);
  }, [pathname]);
}

// ─── Stepper Indicator ─────────────────────────────────────────────────

function StepDot({
  step,
  index,
  currentStep,
}: {
  step: FlowStep;
  index: number;
  currentStep: number;
}) {
  const isCompleted = index < currentStep;
  const isCurrent = index === currentStep;
  const Icon = step.icon;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-full transition-all duration-300",
          isCompleted && "bg-primary text-primary-foreground",
          isCurrent && "border-2 border-primary bg-primary/10 text-primary",
          !isCompleted && !isCurrent && "border-2 border-border bg-background text-muted-foreground"
        )}
        aria-current={isCurrent ? "step" : undefined}
      >
        <Icon className="size-4" />
      </div>
      <span
        className={cn(
          "hidden text-sm transition-colors duration-200 lg:inline",
          isCurrent && "font-semibold text-primary",
          isCompleted && "font-medium text-foreground",
          !isCompleted && !isCurrent && "text-muted-foreground"
        )}
      >
        {step.label}
      </span>
    </div>
  );
}

function FlowStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav
      aria-label="Progresso do fluxo de assinatura"
      className="flex items-center gap-2"
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Etapa {currentStep + 1} de {FLOW_STEPS.length}:{" "}
        {FLOW_STEPS[currentStep]?.label}
      </div>
      {FLOW_STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center gap-2">
          <StepDot step={step} index={idx} currentStep={currentStep} />
          {idx < FLOW_STEPS.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-6 transition-all duration-500 lg:w-10",
                idx < currentStep ? "bg-primary" : "bg-border"
              )}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </nav>
  );
}

function FlowMobileProgress({ currentStep }: { currentStep: number }) {
  const percentage = Math.round((currentStep / (FLOW_STEPS.length - 1)) * 100);
  const stepLabel = FLOW_STEPS[currentStep]?.label;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Etapa {currentStep + 1} de {FLOW_STEPS.length}
        </span>
        {stepLabel && (
          <span className="text-xs font-semibold text-primary">{stepLabel}</span>
        )}
      </div>
      <Progress
        value={percentage}
        className="h-1"
        aria-label={`Progresso: ${percentage}%`}
      />
    </div>
  );
}

// ─── Main Shell ────────────────────────────────────────────────────────

interface DocumentFlowShellProps {
  children: ReactNode;
  /** Se true, o conteúdo ocupa a altura inteira (sem padding interno) */
  fullHeight?: boolean;
}

export function DocumentFlowShell({
  children,
  fullHeight = false,
}: DocumentFlowShellProps) {
  const router = useRouter();
  const currentStep = useCurrentFlowStep();

  return (
    <div
      className="-m-6 flex flex-col overflow-hidden bg-background"
      style={{ height: "calc(100% + 3rem)", minHeight: "calc(100% + 3rem)" }}
    >
      {/* ── Sticky Header ────────────────────────────── */}
      <header className="shrink-0 border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 z-10">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push("/app/assinatura-digital/documentos/lista")
            }
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>

          {/* Stepper — desktop */}
          <div className="hidden sm:block">
            <FlowStepper currentStep={currentStep} />
          </div>

          {/* Spacer para alinhar stepper ao centro */}
          <div className="hidden sm:block w-20" />
        </div>

        {/* Stepper — mobile (progress bar) */}
        <div className="block sm:hidden px-4 pb-3">
          <FlowMobileProgress currentStep={currentStep} />
        </div>
      </header>

      {/* ── Content ──────────────────────────────────── */}
      <div
        className={cn(
          "flex-1 min-h-0 overflow-auto",
          !fullHeight && "p-6"
        )}
      >
        {children}
      </div>
    </div>
  );
}
