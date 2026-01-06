"use client";

import * as React from "react";
import { useMemo, useCallback } from "react";
import { AlertCircle, RefreshCcw, FileX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicSignatureProvider, usePublicSignature } from "./PublicSignatureContext";
import { PublicPageShell } from "./layout/PublicPageShell";
import {
  WelcomeStep,
  ConfirmDetailsStep,
  ReviewDocumentStep,
  SelfieStep,
  SignatureStep,
  SuccessStep,
} from "./steps";

// =============================================================================
// TIPOS
// =============================================================================

export interface PublicSignatureFlowProps {
  token: string;
}

// =============================================================================
// COMPONENTES DE ESTADO
// =============================================================================

interface LoadingStateProps {
  message?: string;
}

function LoadingState({ message = "Carregando documento..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-300">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-t-[#135bec] animate-spin" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
        <AlertCircle className="w-8 h-8" aria-hidden="true" />
      </div>
      <div className="text-center space-y-2 max-w-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Erro ao carregar
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCcw className="w-4 h-4" aria-hidden="true" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

function DocumentNotReadyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
        <FileX2 className="w-8 h-8" aria-hidden="true" />
      </div>
      <div className="text-center space-y-2 max-w-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Documento indisponível
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Este documento ainda não está pronto para assinatura. Por favor, tente
          novamente mais tarde ou entre em contato com o remetente.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// ORQUESTRADOR INTERNO (usa o Context)
// =============================================================================

interface PublicSignatureFlowContentProps {
  token: string;
}

function PublicSignatureFlowContent({ token }: PublicSignatureFlowContentProps) {
  const {
    state,
    reloadContext,
    nextStep,
    previousStep,
    captureSelfie,
    captureSignature,
    finalizeSigning,
    setTermosAceite,
    hasRubrica,
    isDocumentReady,
    isSignerCompleted,
  } = usePublicSignature();

  // Define os steps dinamicamente baseado no contexto
  const steps = useMemo(() => {
    if (!state.context) return [];

    const allSteps = [
      { id: "welcome", label: "Início" },
      { id: "confirm", label: "Dados" },
      { id: "review", label: "Revisão" },
      ...(state.context.documento.selfie_habilitada
        ? [{ id: "selfie", label: "Selfie" }]
        : []),
      { id: "signature", label: "Assinatura" },
    ];

    return allSteps;
  }, [state.context]);

  // Índice do step atual ajustado para steps dinâmicos
  const currentStepId = useMemo(() => {
    return steps[state.currentStep]?.id ?? "welcome";
  }, [steps, state.currentStep]);

  // Handler para avançar do ConfirmDetailsStep
  // O step já faz a chamada de API internamente, então apenas avançamos
  const handleConfirmDetailsNext = useCallback(() => {
    nextStep();
  }, [nextStep]);

  // Handler para captura de selfie
  const handleSelfieCapture = useCallback(
    (base64: string) => {
      captureSelfie(base64);
    },
    [captureSelfie]
  );

  // Label dinâmica para o botão "next" do ReviewDocumentStep
  const reviewNextLabel = useMemo(() => {
    if (state.context?.documento.selfie_habilitada) {
      return "Continuar para Selfie";
    }
    return "Continuar para Assinatura";
  }, [state.context?.documento.selfie_habilitada]);

  // =====================================================================
  // RENDERIZAÇÃO CONDICIONAL
  // =====================================================================

  // Estado de carregamento inicial
  if (state.isLoading && !state.context) {
    return (
      <PublicPageShell>
        <LoadingState />
      </PublicPageShell>
    );
  }

  // Estado de erro
  if (state.error && !state.context) {
    return (
      <PublicPageShell>
        <ErrorState error={state.error} onRetry={reloadContext} />
      </PublicPageShell>
    );
  }

  // Contexto não carregado (fallback)
  if (!state.context) {
    return (
      <PublicPageShell>
        <ErrorState
          error="Não foi possível carregar o documento."
          onRetry={reloadContext}
        />
      </PublicPageShell>
    );
  }

  // Documento não está pronto
  if (!isDocumentReady) {
    return (
      <PublicPageShell>
        <DocumentNotReadyState />
      </PublicPageShell>
    );
  }

  // Assinante já concluiu - mostra SuccessStep diretamente
  if (isSignerCompleted) {
    return (
      <PublicPageShell>
        <SuccessStep
          documento={{
            titulo: state.context.documento.titulo,
            pdf_final_url: state.context.documento.pdf_final_url,
          }}
          onReturnToDashboard={() => {
            window.location.href = "/";
          }}
        />
      </PublicPageShell>
    );
  }

  // =====================================================================
  // RENDERIZAÇÃO DOS STEPS
  // =====================================================================

  const renderCurrentStep = () => {
    switch (currentStepId) {
      case "welcome":
        return (
          <WelcomeStep
            documento={{
              titulo: state.context!.documento.titulo,
              pdf_original_url: state.context!.documento.pdf_original_url,
            }}
            onNext={nextStep}
          />
        );

      case "confirm":
        return (
          <ConfirmDetailsStep
            token={token}
            dadosSnapshot={{
              nome_completo: String(
                state.context!.assinante.dados_snapshot.nome_completo ?? ""
              ),
              cpf: String(state.context!.assinante.dados_snapshot.cpf ?? ""),
              email: String(state.context!.assinante.dados_snapshot.email ?? ""),
              telefone: String(
                state.context!.assinante.dados_snapshot.telefone ?? ""
              ),
            }}
            onPrevious={previousStep}
            onNext={handleConfirmDetailsNext}
          />
        );

      case "review":
        return (
          <ReviewDocumentStep
            pdfUrl={state.context!.documento.pdf_original_url}
            documentTitle={state.context!.documento.titulo}
            onPrevious={previousStep}
            onNext={nextStep}
            nextLabel={reviewNextLabel}
          />
        );

      case "selfie":
        return (
          <SelfieStep
            selfieHabilitada={state.context!.documento.selfie_habilitada}
            onPrevious={previousStep}
            onNext={nextStep}
            onPhotoCapture={handleSelfieCapture}
          />
        );

      case "signature":
        return (
          <SignatureStep
            token={token}
            rubricaNecessaria={hasRubrica}
            selfieBase64={state.selfieBase64 ?? undefined}
            onPrevious={previousStep}
            onCapture={(data) =>
              captureSignature(
                data.assinatura,
                data.metrics,
                data.rubrica,
                data.rubricaMetrics
              )
            }
            onTermosChange={setTermosAceite}
            onSuccess={finalizeSigning}
          />
        );

      default:
        return (
          <ErrorState
            error="Step não encontrado."
            onRetry={() => window.location.reload()}
          />
        );
    }
  };

  return <PublicPageShell>{renderCurrentStep()}</PublicPageShell>;
}

// =============================================================================
// COMPONENTE PRINCIPAL (com Provider)
// =============================================================================

export function PublicSignatureFlow({ token }: PublicSignatureFlowProps) {
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <AlertCircle className="w-8 h-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Token inválido
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              O link de assinatura é inválido ou expirado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PublicSignatureProvider token={token}>
      <PublicSignatureFlowContent token={token} />
    </PublicSignatureProvider>
  );
}

export default PublicSignatureFlow;
