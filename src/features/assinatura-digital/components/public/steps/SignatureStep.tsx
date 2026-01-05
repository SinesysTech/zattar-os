"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PublicStepLayout } from "../layout/PublicStepLayout";
import CanvasAssinatura, {
  type CanvasAssinaturaRef,
} from "../../signature/canvas-assinatura";
import { collectDeviceFingerprint } from "../../../utils/device-fingerprint";
import type { DeviceFingerprintData } from "../../../types";

export interface SignatureStepProps {
  token: string;
  rubricaNecessaria: boolean;
  selfieBase64?: string;
  onPrevious: () => void;
  onSuccess: () => void;
}

export function SignatureStep({
  token,
  rubricaNecessaria,
  selfieBase64,
  onPrevious,
  onSuccess,
}: SignatureStepProps) {
  const [termosAceite, setTermosAceite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] =
    useState<DeviceFingerprintData | null>(null);
  const [assinaturaVazia, setAssinaturaVazia] = useState(true);
  const [rubricaVazia, setRubricaVazia] = useState(true);

  const assinaturaRef = useRef<CanvasAssinaturaRef>(null);
  const rubricaRef = useRef<CanvasAssinaturaRef>(null);

  // Coleta device fingerprint ao montar
  useEffect(() => {
    collectDeviceFingerprint().then(setDeviceFingerprint);
  }, []);

  // Verifica se os canvas estão vazios periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setAssinaturaVazia(assinaturaRef.current?.isEmpty() ?? true);
      if (rubricaNecessaria) {
        setRubricaVazia(rubricaRef.current?.isEmpty() ?? true);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [rubricaNecessaria]);

  const handleClearAssinatura = () => {
    assinaturaRef.current?.clear();
    setAssinaturaVazia(true);
  };

  const handleClearRubrica = () => {
    rubricaRef.current?.clear();
    setRubricaVazia(true);
  };

  const handleFinalize = async () => {
    // Validar assinatura
    if (assinaturaRef.current?.isEmpty()) {
      toast.error("Por favor, desenhe sua assinatura para continuar.");
      return;
    }

    // Validar rubrica se necessária
    if (rubricaNecessaria && rubricaRef.current?.isEmpty()) {
      toast.error("Por favor, desenhe sua rubrica para continuar.");
      return;
    }

    // Validar aceite dos termos
    if (!termosAceite) {
      toast.error("Por favor, aceite os termos para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Coletar dados da assinatura
      const assinaturaBase64 = assinaturaRef.current?.getSignatureBase64();
      const assinaturaMetrics = assinaturaRef.current?.getMetrics();
      const rubricaBase64 = rubricaNecessaria
        ? rubricaRef.current?.getSignatureBase64()
        : null;
      const rubricaMetrics = rubricaNecessaria
        ? rubricaRef.current?.getMetrics()
        : null;

      // Coletar geolocalização (opcional)
      let geolocation: {
        latitude: number;
        longitude: number;
        accuracy: number;
      } | null = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 0,
              });
            }
          );
          geolocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
        } catch (error) {
          console.warn("Geolocalização não disponível:", error);
        }
      }

      // Enviar para API
      const response = await fetch(
        `/api/assinatura-digital/public/${token}/finalizar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assinatura_base64: assinaturaBase64,
            assinatura_metrics: assinaturaMetrics,
            rubrica_base64: rubricaBase64,
            rubrica_metrics: rubricaMetrics,
            selfie_base64: selfieBase64,
            geolocation,
            termos_aceite_versao: "v1.0-MP2200-2",
            dispositivo_fingerprint_raw: deviceFingerprint,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erro ao finalizar assinatura");
      }

      toast.success("Assinatura concluída com sucesso!");
      onSuccess();
    } catch (error) {
      console.error("Erro ao finalizar assinatura:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao finalizar assinatura"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canFinalize =
    termosAceite && !assinaturaVazia && (!rubricaNecessaria || !rubricaVazia);

  return (
    <PublicStepLayout
      currentStep={4}
      totalSteps={4}
      title="Assinar Documento"
      description="Por favor, desenhe sua assinatura abaixo para confirmar o conteúdo do documento."
      onPrevious={onPrevious}
      isPreviousDisabled={isSubmitting}
    >
      <div className="space-y-6">
        {/* Canvas de Assinatura Principal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-900 dark:text-white">
              Sua Assinatura
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAssinatura}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <RotateCcw className="h-4 w-4 mr-1" aria-hidden="true" />
              Limpar
            </Button>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-2 overflow-hidden">
            <CanvasAssinatura ref={assinaturaRef} hideClearButton />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Use o mouse ou toque para desenhar sua assinatura acima
          </p>
        </div>

        {/* Canvas de Rubrica (condicional) */}
        {rubricaNecessaria && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-slate-900 dark:text-white">
                Rubrica / Iniciais
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearRubrica}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <RotateCcw className="h-4 w-4 mr-1" aria-hidden="true" />
                Limpar
              </Button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-2 overflow-hidden">
              <CanvasAssinatura ref={rubricaRef} hideClearButton />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Desenhe suas iniciais ou rubrica para validação adicional
            </p>
          </div>
        )}

        {/* Checkbox de Termos */}
        <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-100 dark:border-slate-800 p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="termos-aceite"
              checked={termosAceite}
              onCheckedChange={(checked) => setTermosAceite(checked === true)}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor="termos-aceite"
                className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer"
              >
                Consentimento para Assinatura Eletrônica
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Concordo com os Termos de Serviço e consinto com o uso de
                assinaturas eletrônicas para esta transação, em conformidade com
                a MP 2.200-2/2001 - ICP-Brasil.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <X className="h-4 w-4 mr-2" aria-hidden="true" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleFinalize}
            disabled={!canFinalize || isSubmitting}
            className="flex-1 bg-[#135bec] hover:bg-[#114dc8] text-white shadow-md shadow-[#135bec]/20 hover:shadow-lg hover:shadow-[#135bec]/30 active:scale-[0.98] transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Finalizando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                Finalizar Assinatura
              </>
            )}
          </Button>
        </div>

        {/* Informação Legal */}
        <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Esta assinatura eletrônica tem validade jurídica conforme MP
            2.200-2/2001
          </p>
        </div>
      </div>
    </PublicStepLayout>
  );
}
