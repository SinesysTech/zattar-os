"use client";

import { useState, useEffect } from "react";
import { useFormularioStore } from "../../store";
import FormStepLayout from "../form/form-step-layout";
import { toast } from "sonner";
import { validateGeolocation } from "../../utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Loader2, AlertCircle, CheckCircle2, RefreshCw, Info } from "lucide-react";

export default function GeolocationStep() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);

  const {
    latitude,
    longitude,
    geolocationAccuracy,
    geolocationTimestamp,
    setGeolocation,
    clearGeolocation,
    proximaEtapa,
    etapaAnterior,
    etapaAtual,
    getTotalSteps,
  } = useFormularioStore();

  /**
   * Captura geolocalização usando API nativa do navegador.
   * Solicita permissão ao usuário e obtém coordenadas GPS de alta precisão.
   */
  const handleCaptureLocation = () => {
    // Verificar se API está disponível no navegador
    if (!navigator.geolocation) {
      console.error("❌ API de geolocalização não disponível no navegador");
      setError("Geolocalizacao nao suportada neste navegador");
      toast.error("Geolocalizacao nao disponivel");
      return;
    }

    console.log("🌍 Iniciando captura de geolocalização...", {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = new Date(position.timestamp).toISOString();

        console.log("✅ Geolocalização capturada com sucesso:", {
          latitude,
          longitude,
          accuracy: `${accuracy.toFixed(1)}m`,
          timestamp,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        });

        // Salvar no store
        setGeolocation(latitude, longitude, accuracy, timestamp);
        setCaptured(true);
        setLoading(false);

        toast.success("Localizacao capturada com sucesso!");
      },
      // Error callback
      (err) => {
        setLoading(false);

        console.error("❌ Erro ao capturar geolocalização:", {
          code: err.code,
          message: err.message,
          timestamp: new Date().toISOString(),
        });

        // Mapear códigos de erro para mensagens amigáveis
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            setError(
              "Permissao negada. Por favor, permita o acesso a localizacao nas configuracoes do navegador."
            );
            toast.error("Permissao de localizacao negada");
            console.warn("⚠️ Usuário negou permissão de geolocalização. Verifique configurações do navegador.");
            break;
          case 2: // POSITION_UNAVAILABLE
            setError("Localizacao indisponivel. Verifique se o GPS esta ativado.");
            toast.error("GPS indisponivel");
            console.warn("⚠️ Posição GPS indisponível. Verifique se GPS está ativado e se há sinal.");
            break;
          case 3: // TIMEOUT
            setError("Tempo esgotado ao tentar obter localizacao. Tente novamente.");
            toast.error("Timeout ao capturar localizacao");
            console.warn("⚠️ Timeout ao capturar geolocalização. Rede ou GPS podem estar lentos.");
            break;
          default:
            setError("Erro desconhecido ao capturar localizacao.");
            toast.error("Erro ao capturar localizacao");
            console.error("❌ Erro desconhecido:", err);
        }
      },
      // Options
      {
        enableHighAccuracy: true, // Solicitar GPS de alta precisão
        timeout: 10000, // Timeout de 10 segundos
        maximumAge: 0, // Não usar cache, sempre obter posição atual
      }
    );
  };

  /**
   * Permite retry em caso de erro.
   * Limpa dados anteriores e tenta capturar novamente.
   */
  const handleRetry = () => {
    clearGeolocation();
    setCaptured(false);
    setError(null);
    handleCaptureLocation();
  };

  /**
   * Valida dados de geolocalização antes de avançar para próxima etapa.
   */
  const handleContinuar = () => {
    // Verificar se geolocalização foi capturada
    if (!captured || latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      toast.error("Por favor, capture sua localizacao antes de continuar");
      return;
    }

    // Validar qualidade da geolocalização
    const timestampNumber = geolocationTimestamp ? new Date(geolocationTimestamp).getTime() : null;
    const validation = validateGeolocation(latitude, longitude, geolocationAccuracy, timestampNumber);

    if (!validation.valid) {
      toast.error(validation.issues[0]);
      return;
    }

    // Avançar para próxima etapa
    proximaEtapa();
  };

  /**
   * Auto-captura ao montar componente.
   * Se já existem dados no store, marca como capturado.
   * Caso contrário, captura automaticamente para melhor UX.
   */
  useEffect(() => {
    console.log("📍 GeolocationStep montado - verificando estado:", {
      latitudeExistente: latitude,
      longitudeExistente: longitude,
      accuracyExistente: geolocationAccuracy,
      timestampExistente: geolocationTimestamp,
    });

    // Se já tem dados no store, marcar como capturado
    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      console.log("✅ Geolocalização já capturada anteriormente, reutilizando dados do store");
      setCaptured(true);
    } else {
      console.log("🌍 Geolocalização não encontrada no store, iniciando captura automática...");
      // Auto-capturar ao montar
      handleCaptureLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez ao montar

  return (
    <FormStepLayout
      title="Captura de Localização"
      description="Precisamos capturar sua localização GPS para validação do contrato."
      currentStep={etapaAtual}
      totalSteps={getTotalSteps()}
      onPrevious={etapaAnterior}
      onNext={handleContinuar}
      nextLabel="Continuar"
      isNextDisabled={loading || !captured}
      isPreviousDisabled={loading}
      isLoading={loading}
      cardClassName="w-full max-w-lg mx-auto"
    >
      <div className="space-y-4">
        {/* Privacy Notice */}
        <Alert variant="default" className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-900 space-y-2">
            <p className="font-semibold">Por que precisamos da sua localização?</p>
            <p>
              A geolocalização é necessária para este template/contrato e será usada apenas para validação
              de autenticidade. Seus dados de localização não serão compartilhados com terceiros e serão
              armazenados de forma segura.
            </p>
          </AlertDescription>
        </Alert>

        {/* Estado de Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <MapPin className="h-16 w-16 text-blue-500" />
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-gray-900">Capturando sua localização...</p>
              <p className="text-sm text-gray-600">Aguarde enquanto obtemos suas coordenadas GPS</p>
            </div>
          </div>
        )}

        {/* Estado de Erro */}
        {!loading && error && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button onClick={handleRetry} variant="outline" className="w-full" size="lg">
                <RefreshCw className="mr-2 h-5 w-5" />
                Tentar Novamente
              </Button>

              <div className="text-xs text-gray-600 space-y-2 p-4 bg-gray-50 rounded-md border border-gray-200">
                <p className="font-semibold text-gray-900 text-sm">Como habilitar permissões de localização:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong>Chrome/Edge:</strong> Clique no ícone de cadeado ao lado da URL → Permissões do site →
                    Localização → Permitir
                  </li>
                  <li>
                    <strong>Firefox:</strong> Clique no ícone de informações (🔒) → Permissões → Localização →
                    Permitir
                  </li>
                  <li>
                    <strong>Safari (iOS):</strong> Ajustes → Safari → Localização → Perguntar ou Permitir
                  </li>
                  <li>
                    <strong>Safari (macOS):</strong> Safari → Preferências → Sites → Localização → Permitir
                  </li>
                </ul>
                <p className="mt-2 text-gray-700">
                  <strong>Dica:</strong> Se o GPS estiver desativado, vá para as configurações do dispositivo e
                  ative os serviços de localização.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estado de Sucesso */}
        {!loading && !error && captured && (
          <div className="space-y-4">
            <Alert variant="default" className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-900 font-medium">
                Localização capturada com sucesso!
              </AlertDescription>
            </Alert>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Coordenadas GPS</p>
                    <div className="mt-2 space-y-1 font-mono text-sm">
                      <p className="text-gray-900">
                        <span className="text-gray-600">Latitude:</span>{" "}
                        <span className="font-semibold">{latitude?.toFixed(6)}°</span>
                      </p>
                      <p className="text-gray-900">
                        <span className="text-gray-600">Longitude:</span>{" "}
                        <span className="font-semibold">{longitude?.toFixed(6)}°</span>
                      </p>
                      {geolocationAccuracy !== null && geolocationAccuracy !== undefined && (
                        <p className="text-gray-900">
                          <span className="text-gray-600">Precisão:</span>{" "}
                          <span className="font-semibold">{geolocationAccuracy.toFixed(1)}m</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Accuracy Warning */}
                  {geolocationAccuracy && geolocationAccuracy > 100 && (
                    <Alert variant="default" className="border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-xs text-yellow-900">
                        Precisão baixa ({geolocationAccuracy.toFixed(0)}m). Para melhor precisão, vá para área
                        aberta.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Botão para recapturar (opcional) */}
              <Button onClick={handleRetry} variant="outline" className="w-full" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Capturar Novamente
              </Button>
            </div>
          </div>
        )}
      </div>
    </FormStepLayout>
  );
}