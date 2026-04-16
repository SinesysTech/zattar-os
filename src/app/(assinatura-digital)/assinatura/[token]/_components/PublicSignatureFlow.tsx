'use client'

import * as React from 'react'
import { useMemo, useCallback, useEffect, useRef } from 'react'
import { AlertCircle, RefreshCcw, FileX2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/typography'
import {
  PublicSignatureProvider,
  usePublicSignature,
  type SignatureMetrics,
} from './PublicSignatureContext'
import type { AssinaturaMetrics } from '@/shared/assinatura-digital/utils/signature-metrics'
import {
  PublicWizardShell,
  type PublicWizardStep,
} from '@/shared/assinatura-digital'
import {
  WelcomeStep,
  ConfirmDetailsStep,
  ReviewDocumentStep,
  SignatureStep,
  SuccessStep,
} from './steps'

export interface PublicSignatureFlowProps {
  token: string
}

function LoadingState({ message = 'Carregando documento...' }: { message?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-outline-variant sm:h-16 sm:w-16" />
        <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-t-primary sm:h-16 sm:w-16" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-4 animate-in fade-in duration-300 sm:gap-6 sm:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive sm:h-16 sm:w-16">
        <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden="true" />
      </div>
      <div className="max-w-sm space-y-1.5 text-center">
        <Heading level="section" className="text-base text-foreground sm:text-lg">
          Erro ao carregar
        </Heading>
        <p className="text-xs text-muted-foreground sm:text-sm">{error}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="min-h-11 cursor-pointer gap-2">
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

function DocumentNotReadyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-4 animate-in fade-in duration-300 sm:gap-6 sm:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/10 text-info sm:h-16 sm:w-16">
        <FileX2 className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden="true" />
      </div>
      <div className="max-w-sm space-y-1.5 text-center">
        <Heading level="section" className="text-base text-foreground sm:text-lg">
          Documento indisponível
        </Heading>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Este documento ainda não está pronto para assinatura. Por favor, tente novamente mais
          tarde ou entre em contato com o remetente.
        </p>
      </div>
    </div>
  )
}

function PublicSignatureFlowContent({ token }: { token: string }) {
  const {
    state,
    reloadContext,
    nextStep,
    previousStep,
    captureSelfie,
    captureSignature,
    finalizeSigning,
    setTermosAceite,
    setGeolocation,
    hasRubrica,
    isDocumentReady,
    isSignerCompleted,
  } = usePublicSignature()

  const contentRef = useRef<HTMLDivElement>(null)
  const prevStepRef = useRef(state.currentStep)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy,
          )
        },
        () => {},
        { enableHighAccuracy: false, timeout: 10000 },
      )
    }
  }, [setGeolocation])

  useEffect(() => {
    if (prevStepRef.current !== state.currentStep) {
      prevStepRef.current = state.currentStep
      contentRef.current?.focus({ preventScroll: true })
    }
  }, [state.currentStep])

  // Steps visíveis no progress (Welcome não conta)
  const wizardSteps: PublicWizardStep[] = useMemo(() => {
    if (!state.context) return []
    return [
      { id: 'confirm', label: 'Dados' },
      { id: 'review', label: 'Revisão' },
      { id: 'signature', label: 'Assinatura' },
    ]
  }, [state.context])

  // Map linear currentStep -> step id (welcome é pre-wizard)
  const ALL_STEP_IDS = ['welcome', 'confirm', 'review', 'signature'] as const
  const currentStepId = ALL_STEP_IDS[state.currentStep] ?? 'welcome'

  const selfieHabilitada = state.context?.documento.selfie_habilitada ?? false

  const handleSelfieCapture = useCallback(
    (base64: string) => {
      captureSelfie(base64)
    },
    [captureSelfie],
  )

  const convertMetrics = useCallback(
    (metrics?: SignatureMetrics | AssinaturaMetrics | null): SignatureMetrics | undefined => {
      if (!metrics) return undefined
      if ('pointCount' in metrics) return metrics
      return {
        pointCount: metrics.pontos ?? 0,
        strokeCount: metrics.tracos ?? 0,
        totalLength: 0,
        boundingBox: {
          minX: 0,
          minY: 0,
          maxX: metrics.largura ?? 0,
          maxY: metrics.altura ?? 0,
          width: metrics.largura ?? 0,
          height: metrics.altura ?? 0,
        },
        duration: metrics.tempoDesenho,
      }
    },
    [],
  )

  const reviewNextLabel = 'Continuar para Assinatura'

  // Early returns para estados globais
  if (state.isLoading && !state.context) {
    return (
      <PublicWizardShell steps={[]} currentIndex={0}>
        <LoadingState />
      </PublicWizardShell>
    )
  }

  if (state.error && !state.context) {
    return (
      <PublicWizardShell steps={[]} currentIndex={0}>
        <ErrorState error={state.error} onRetry={reloadContext} />
      </PublicWizardShell>
    )
  }

  if (!state.context) {
    return (
      <PublicWizardShell steps={[]} currentIndex={0}>
        <ErrorState error="Não foi possível carregar o documento." onRetry={reloadContext} />
      </PublicWizardShell>
    )
  }

  if (!isDocumentReady) {
    return (
      <PublicWizardShell steps={[]} currentIndex={0}>
        <DocumentNotReadyState />
      </PublicWizardShell>
    )
  }

  if (isSignerCompleted) {
    return (
      <PublicWizardShell steps={[]} currentIndex={0} tint="success">
        <SuccessStep
          documento={{
            titulo: state.context.documento.titulo,
            pdf_final_url: state.context.documento.pdf_final_url,
          }}
          onReturnToDashboard={() => {
            window.location.href = '/'
          }}
        />
      </PublicWizardShell>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStepId) {
      case 'welcome':
        return (
          <WelcomeStep
            documento={{
              titulo: state.context!.documento.titulo,
              pdf_original_url: state.context!.documento.pdf_original_url,
            }}
            selfieHabilitada={selfieHabilitada}
            onNext={nextStep}
          />
        )
      case 'confirm':
        return (
          <ConfirmDetailsStep
            token={token}
            dadosSnapshot={{
              nome_completo: String(state.context!.assinante.dados_snapshot.nome_completo ?? ''),
              cpf: String(state.context!.assinante.dados_snapshot.cpf ?? ''),
              email: String(state.context!.assinante.dados_snapshot.email ?? ''),
              telefone: String(state.context!.assinante.dados_snapshot.telefone ?? ''),
            }}
            onPrevious={previousStep}
            onNext={nextStep}
          />
        )
      case 'review':
        return (
          <ReviewDocumentStep
            pdfUrl={state.context!.documento.pdf_original_url}
            documentTitle={state.context!.documento.titulo}
            onPrevious={previousStep}
            onNext={nextStep}
            nextLabel={reviewNextLabel}
          />
        )
      case 'signature':
        return (
          <SignatureStep
            token={token}
            rubricaNecessaria={hasRubrica}
            selfieHabilitada={selfieHabilitada}
            selfieBase64={state.selfieBase64 ?? undefined}
            onSelfieCapture={handleSelfieCapture}
            onPrevious={previousStep}
            onCapture={(data) => {
              const assinaturaMetrics = convertMetrics(data.metrics)
              if (!assinaturaMetrics) return
              const rubricaMetrics = data.rubricaMetrics
                ? convertMetrics(data.rubricaMetrics)
                : undefined
              captureSignature(data.assinatura, assinaturaMetrics, data.rubrica, rubricaMetrics)
            }}
            onTermosChange={setTermosAceite}
            onSuccess={async (data) => {
              const assinaturaMetrics = convertMetrics(data.metrics)
              if (!assinaturaMetrics) {
                throw new Error('Erro ao converter métricas da assinatura')
              }
              const rubricaMetrics = data.rubricaMetrics
                ? convertMetrics(data.rubricaMetrics)
                : undefined
              await finalizeSigning({
                assinatura: data.assinatura,
                metrics: assinaturaMetrics,
                rubrica: data.rubrica,
                rubricaMetrics,
              })
            }}
          />
        )
      default:
        return <ErrorState error="Step não encontrado." onRetry={() => window.location.reload()} />
    }
  }

  // Welcome não mostra o progress (é a capa)
  if (currentStepId === 'welcome') {
    return (
      <PublicWizardShell steps={[]} currentIndex={0}>
        <div
          ref={contentRef}
          tabIndex={-1}
          className="h-full outline-none animate-in fade-in duration-200"
          key={currentStepId}
          aria-live="polite"
        >
          {renderCurrentStep()}
        </div>
      </PublicWizardShell>
    )
  }

  const stepIndex = wizardSteps.findIndex((s) => s.id === currentStepId)
  return (
    <PublicWizardShell steps={wizardSteps} currentIndex={Math.max(0, stepIndex)}>
      <div
        ref={contentRef}
        tabIndex={-1}
        className="h-full outline-none animate-in fade-in duration-200"
        key={currentStepId}
        aria-live="polite"
      >
        {renderCurrentStep()}
      </div>
    </PublicWizardShell>
  )
}

export function PublicSignatureFlow({ token }: PublicSignatureFlowProps) {
  if (!token) {
    return (
      <div className="flex h-dvh items-center justify-center p-4">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <Heading level="section" className="text-lg text-foreground">
              Token inválido
            </Heading>
            <p className="text-sm text-muted-foreground">
              O link de assinatura é inválido ou expirado.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PublicSignatureProvider token={token}>
      <PublicSignatureFlowContent token={token} />
    </PublicSignatureProvider>
  )
}

export default PublicSignatureFlow
