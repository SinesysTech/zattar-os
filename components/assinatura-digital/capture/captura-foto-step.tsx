"use client";

import { useRef, useState } from "react";
import { useFormularioStore } from "@/app/_lib/stores/assinatura-digital/formulario-store";
import CapturaFoto, { type CapturaFotoRef } from "@/components/assinatura-digital/capture/captura-foto";
import FormStepLayout from "@/components/assinatura-digital/form/form-step-layout";
import { toast } from "sonner";
import { validatePhotoQuality } from "@/app/_lib/formsign/validations/business.validations";

export default function CapturaFotoStep() {
  const [loading, setLoading] = useState(false);
  const [hasWebcamError, setHasWebcamError] = useState(false);
  const fotoRef = useRef<CapturaFotoRef>(null);

  const { fotoBase64, setFotoBase64, proximaEtapa, etapaAnterior, getTotalSteps, etapaAtual } = useFormularioStore();

  const handleContinuar = async () => {
    // Verificar se foto foi capturada
    if (!fotoRef.current?.hasPhoto()) {
      toast.error("Por favor, capture uma foto usando a câmera");
      return;
    }

    setLoading(true);

    try {
      // Obter foto em base64
      const foto = fotoRef.current?.getPhotoBase64();

      if (!foto) {
        toast.error("Erro ao obter foto. Tente novamente.");
        return;
      }

      // Validar qualidade da foto
      const fotoValidation = validatePhotoQuality(foto);
      if (!fotoValidation.valid) {
        toast.error(fotoValidation.issues[0]);
        return;
      }

      // Foto já foi salva no store via onPhotoCaptured callback
      // Avançar para próxima etapa
      proximaEtapa();
    } catch (error) {
      console.error("Erro ao processar foto:", error);
      toast.error("Erro ao processar foto. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const hasSavedPhoto = Boolean(fotoBase64 && fotoBase64.trim() !== "");

  return (
    <FormStepLayout
      title="Foto do Cliente"
      description="Tire uma selfie usando sua câmera para validação de identidade."
      currentStep={etapaAtual}
      totalSteps={getTotalSteps()}
      onPrevious={etapaAnterior}
      onNext={handleContinuar}
      nextLabel="Continuar"
      isNextDisabled={loading || (hasWebcamError && !hasSavedPhoto)}
      isPreviousDisabled={loading}
      isLoading={loading}
      cardClassName="w-full max-w-lg mx-auto"
    >
      <CapturaFoto
        initialPhoto={fotoBase64 ?? ''}
        onWebcamErrorChange={setHasWebcamError}
        onPhotoCaptured={(b64) => setFotoBase64(b64)}
        ref={fotoRef}
      />
    </FormStepLayout>
  );
}