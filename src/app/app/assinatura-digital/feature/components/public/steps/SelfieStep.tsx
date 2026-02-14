"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Lightbulb, User } from "lucide-react";
import { PublicStepLayout } from "../layout/PublicStepLayout";
import CapturaFoto, { type CapturaFotoRef } from "../../capture/captura-foto";

export interface SelfieStepProps {
  selfieHabilitada: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPhotoCapture?: (base64: string) => void;
}

export function SelfieStep({
  selfieHabilitada,
  onPrevious,
  onNext,
  onPhotoCapture,
}: SelfieStepProps) {
  const [hasPhoto, setHasPhoto] = useState(false);
  const [webcamError, setWebcamError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const capturaFotoRef = useRef<CapturaFotoRef>(null);

  const handlePhotoCapture = (base64: string) => {
    setHasPhoto(true);
    onPhotoCapture?.(base64);
  };

  const handlePhotoCleared = () => {
    setHasPhoto(false);
  };

  const handleWebcamError = (hasError: boolean) => {
    setWebcamError(hasError);
  };

  const handleNext = async () => {
    // Se selfie não é habilitada ou houve erro na webcam, permite pular
    if (!selfieHabilitada || webcamError) {
      onNext();
      return;
    }

    // Verifica se foto foi capturada
    if (!capturaFotoRef.current?.hasPhoto()) {
      toast.error("Por favor, capture uma foto para continuar.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Foto já está armazenada via onPhotoCapture, apenas avança
      onNext();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao processar foto"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se selfie não é habilitada, avança automaticamente
  if (!selfieHabilitada) {
    return (
      <PublicStepLayout
        currentStep={3}
        totalSteps={4}
        title="Verificação de Identidade"
        description="A verificação por foto não é necessária para este documento."
        onPrevious={onPrevious}
        onNext={onNext}
        nextLabel="Continuar"
        previousLabel="Voltar"
      >
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 32 }}
              aria-hidden="true"
            >
              check_circle
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Você pode prosseguir para a etapa de assinatura.
          </p>
        </div>
      </PublicStepLayout>
    );
  }

  return (
    <PublicStepLayout
      currentStep={3}
      totalSteps={4}
      title="Verificação de Identidade"
      description="Por favor, confirme sua identidade para prosseguir com a assinatura."
      onPrevious={onPrevious}
      onNext={handleNext}
      nextLabel="Continuar"
      previousLabel="Voltar"
      isNextDisabled={!hasPhoto && !webcamError}
      isLoading={isSubmitting}
    >
      <div className="space-y-6">
        {/* Captura de Foto */}
        <div className="max-w-sm mx-auto">
          <CapturaFoto
            ref={capturaFotoRef}
            onWebcamErrorChange={handleWebcamError}
            onPhotoCaptured={handlePhotoCapture}
            onPhotoCleared={handlePhotoCleared}
          />
        </div>

        {/* Dicas de Captura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Dica de Iluminação */}
          <div className="bg-white/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Lightbulb className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  Dicas de Iluminação
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Certifique-se de que seu rosto está iluminado pela frente.
                  Evite luz forte por trás que cria sombras.
                </p>
              </div>
            </div>
          </div>

          {/* Dica de Enquadramento */}
          <div className="bg-white/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <User className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  Dicas de Enquadramento
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Remova óculos ou chapéus se possível. Olhe diretamente para a
                  câmera com expressão neutra.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso de erro na webcam */}
        {webcamError && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-center">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              Não foi possível acessar a câmera. Você pode continuar sem a
              verificação por foto.
            </p>
          </div>
        )}
      </div>
    </PublicStepLayout>
  );
}
