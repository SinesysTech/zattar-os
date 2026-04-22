'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Text } from '@/components/ui/typography'
import CanvasAssinatura, {
  type CanvasAssinaturaRef,
} from '@/shared/assinatura-digital/components/signature/canvas-assinatura'
import { AssinaturaMetrics } from '@/shared/assinatura-digital/utils/signature-metrics'
import {
  PublicStepCard,
  PublicStepFooter,
  SelfieCaptureSheet,
} from '@/shared/assinatura-digital'

export interface SignatureData {
  assinatura: string
  metrics: AssinaturaMetrics
  rubrica?: string
  rubricaMetrics?: AssinaturaMetrics
}

export interface SignatureStepProps {
  token: string
  rubricaNecessaria: boolean
  selfieBase64?: string
  selfieHabilitada?: boolean
  onSelfieCapture?: (base64: string) => void
  currentStep?: number
  totalSteps?: number
  onPrevious: () => void
  onSuccess: (data: SignatureData) => Promise<void>
  onCapture?: (data: SignatureData) => void
  onTermosChange?: (value: boolean) => void
}

export function SignatureStep({
  rubricaNecessaria,
  selfieHabilitada = false,
  selfieBase64,
  onSelfieCapture,
  onPrevious,
  onSuccess,
  onCapture,
  onTermosChange,
}: SignatureStepProps) {
  const [termosAceite, setTermosAceite] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [assinaturaVazia, setAssinaturaVazia] = React.useState(true)
  const [rubricaVazia, setRubricaVazia] = React.useState(true)
  const [selfieSheetOpen, setSelfieSheetOpen] = React.useState(
    selfieHabilitada && !selfieBase64,
  )

  const assinaturaRef = React.useRef<CanvasAssinaturaRef>(null)
  const rubricaRef = React.useRef<CanvasAssinaturaRef>(null)

  const handleAssinaturaEnd = React.useCallback(() => {
    setAssinaturaVazia(assinaturaRef.current?.isEmpty() ?? true)
  }, [])

  const handleRubricaEnd = React.useCallback(() => {
    setRubricaVazia(rubricaRef.current?.isEmpty() ?? true)
  }, [])

  const handleClearAssinatura = () => {
    assinaturaRef.current?.clear()
    setAssinaturaVazia(true)
  }

  const handleClearRubrica = () => {
    rubricaRef.current?.clear()
    setRubricaVazia(true)
  }

  const handleFinalize = async () => {
    if (assinaturaRef.current?.isEmpty()) {
      toast.error('Por favor, desenhe sua assinatura para continuar.')
      return
    }
    if (rubricaNecessaria && rubricaRef.current?.isEmpty()) {
      toast.error('Por favor, desenhe sua rubrica para continuar.')
      return
    }
    if (!termosAceite) {
      toast.error('Aceite os termos para finalizar.')
      return
    }
    setIsSubmitting(true)
    try {
      const assinaturaBase64 = assinaturaRef.current?.getSignatureBase64() || ''
      const assinaturaMetrics = assinaturaRef.current?.getMetrics()
      const rubricaBase64 = rubricaNecessaria ? rubricaRef.current?.getSignatureBase64() : undefined
      const rubricaMetrics = rubricaNecessaria ? rubricaRef.current?.getMetrics() : undefined

      if (!assinaturaMetrics) {
        toast.error('Não foi possível capturar métricas da assinatura.')
        return
      }

      const data: SignatureData = {
        assinatura: assinaturaBase64,
        metrics: assinaturaMetrics,
        rubrica: rubricaBase64 || undefined,
        rubricaMetrics: rubricaMetrics || undefined,
      }
      onCapture?.(data)
      await onSuccess(data)
    } catch (error) {
      console.error('Erro ao finalizar assinatura:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao finalizar assinatura.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canFinalize = termosAceite && !assinaturaVazia && (!rubricaNecessaria || !rubricaVazia)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-2xl">
          <PublicStepCard
            chip="Última etapa"
            chipTone="info"
            title="Assine o documento"
            description="Desenhe sua assinatura no espaço abaixo."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Sua assinatura</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAssinatura}
                    className="h-7 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Limpar
                  </Button>
                </div>
                <div className="overflow-hidden rounded-xl border-2 border-dashed border-outline-variant bg-muted/40 p-2">
                  <div className="h-55 sm:h-50">
                    <CanvasAssinatura
                      ref={assinaturaRef}
                      hideClearButton
                      onStrokeEnd={handleAssinaturaEnd}
                    />
                  </div>
                </div>
                <Text variant="micro-caption" className="text-center text-muted-foreground">
                  Use o mouse ou o dedo para desenhar
                </Text>
              </div>

              {rubricaNecessaria && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Rubrica / Iniciais</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearRubrica}
                      className="h-7 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Limpar
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-xl border-2 border-dashed border-outline-variant bg-muted/40 p-2">
                    <div className="h-35">
                      <CanvasAssinatura
                        ref={rubricaRef}
                        hideClearButton
                        onStrokeEnd={handleRubricaEnd}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </PublicStepCard>
        </div>
      </div>

      <div className="shrink-0 border-t border-outline-variant/20 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-2xl px-4 py-3 sm:px-8">
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={termosAceite}
              onCheckedChange={(v) => {
                const value = v === true
                setTermosAceite(value)
                onTermosChange?.(value)
              }}
              className="mt-0.5"
            />
            <span className="flex-1 text-xs text-muted-foreground sm:text-sm">
              Aceito os termos de assinatura eletrônica, conforme MP 2.200-2/2001.
            </span>
          </label>
        </div>
      </div>

      <PublicStepFooter
        onPrevious={onPrevious}
        onNext={handleFinalize}
        isPreviousDisabled={isSubmitting}
        isNextDisabled={!canFinalize || isSubmitting}
        isLoading={isSubmitting}
        nextLabel="Finalizar assinatura"
      />

      <SelfieCaptureSheet
        open={selfieSheetOpen}
        onSkip={() => setSelfieSheetOpen(false)}
        onCapture={(base64) => {
          if (base64) onSelfieCapture?.(base64)
          setSelfieSheetOpen(false)
        }}
      />
    </div>
  )
}
