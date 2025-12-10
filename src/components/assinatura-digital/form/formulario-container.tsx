"use client";

import { useState, useEffect } from "react";
import { useFormularioStore } from "@/core/app/_lib/stores/assinatura-digital/formulario-store";
import VerificarCPF from "./verificar-cpf";
import DadosPessoais from "./dados-pessoais";
import DynamicFormStep from "./dynamic-form-step";
import CapturaFotoStep from "@/components/assinatura-digital/capture/captura-foto-step";
import GeolocationStep from "@/components/assinatura-digital/capture/geolocation-step";
import VisualizacaoPdfStep from "./visualizacao-pdf-step";
import VisualizacaoMarkdownStep from "./visualizacao-markdown-step";
import TermosAceiteStep from "./termos-aceite-step";
import AssinaturaManuscritaStep from "./assinatura-manuscrita-step";
import Sucesso from "./sucesso";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Template } from "@/types/assinatura-digital/template.types";
import type { StepConfig } from "@/core/app/_lib/stores/assinatura-digital/formulario-store";

export default function FormularioContainer() {
  const etapaAtual = useFormularioStore((state) => state.etapaAtual);
  const etapaAnterior = useFormularioStore((state) => state.etapaAnterior);

  // Fix: Use individual selectors to avoid recreating objects on every render
  const templateIdSelecionado = useFormularioStore((state) => state.templateIdSelecionado);
  const templateIds = useFormularioStore((state) => state.templateIds);
  const getCachedTemplate = useFormularioStore((state) => state.getCachedTemplate);
  const setCachedTemplate = useFormularioStore((state) => state.setCachedTemplate);
  const stepConfigs = useFormularioStore((state) => state.stepConfigs);
  const setStepConfigs = useFormularioStore((state) => state.setStepConfigs);
  const formularioFlowConfig = useFormularioStore((state) => state.formularioFlowConfig);

  const [templateHasMarkdown, setTemplateHasMarkdown] = useState<boolean | null>(null);
  const [hasTemplateError, setHasTemplateError] = useState<boolean>(false);

  // Comment 9: Estado para rastrear templates indisponíveis
  const [unavailableTemplateIds, setUnavailableTemplateIds] = useState<string[]>([]);

  // Função que constrói configuração de etapas baseado na configuração do formulário
  const buildStepConfigs = (formularioConfig: { foto_necessaria?: boolean; geolocation_necessaria?: boolean } | null): StepConfig[] => {
    console.log('📋 Construindo configuração de etapas do formulário:', {
      fotoNecessaria: formularioConfig?.foto_necessaria,
      geolocationNecessaria: formularioConfig?.geolocation_necessaria,
    });

    const configs: StepConfig[] = [
      { id: 'cpf', index: 0, component: 'VerificarCPF', required: true, enabled: true },
      { id: 'pessoais', index: 1, component: 'DadosPessoais', required: true, enabled: true },
      { id: 'acao', index: 2, component: 'DynamicFormStep', required: true, enabled: true },
      { id: 'visualizacao', index: 3, component: 'VisualizacaoPdfStep', required: true, enabled: true },
    ];

    let currentIndex = 4;

    // Adicionar etapa de foto se necessária (padrão: true)
    const fotoNecessaria = formularioConfig?.foto_necessaria ?? true; // undefined = necessária (default true)
    if (fotoNecessaria) {
      configs.push({ id: 'foto', index: currentIndex++, component: 'CapturaFotoStep', required: true, enabled: true });
      console.log('📷 Etapa de captura de foto adicionada ao fluxo (índice:', currentIndex - 1, ')');
    } else {
      console.log('⏭️ Etapa de captura de foto ignorada (formulario.foto_necessaria = false)');
    }

    // Adicionar etapa de geolocalização se necessária (padrão: false)
    // IMPORTANTE: Esta etapa só é adicionada se formulario.geolocation_necessaria === true
    // Se o formulário não tiver essa configuração, o navegador nunca pedirá permissão de localização
    const geolocationNecessaria = formularioConfig?.geolocation_necessaria ?? false;
    if (geolocationNecessaria) {
      configs.push({ id: 'geolocation', index: currentIndex++, component: 'GeolocationStep', required: true, enabled: true });
      console.log('🌍 Etapa de geolocalização adicionada ao fluxo (índice:', currentIndex - 1, ')');
    } else {
      console.log('⏭️ Etapa de geolocalização ignorada (formulario.geolocation_necessaria não é true)');
    }

    // Etapa de aceite de termos (sempre obrigatória para conformidade legal)
    configs.push({ 
      id: 'termos', 
      index: currentIndex++, 
      component: 'TermosAceiteStep', 
      required: true, 
      enabled: true 
    });
    console.log('📋 Etapa de aceite de termos adicionada ao fluxo (índice:', currentIndex - 1, ')');

    // Etapas finais sempre presentes
    configs.push({ id: 'assinatura', index: currentIndex++, component: 'AssinaturaManuscritaStep', required: true, enabled: true });
    configs.push({ id: 'sucesso', index: currentIndex++, component: 'Sucesso', required: true, enabled: true });

    console.log('✅ Configuração de etapas construída:', {
      totalEtapas: configs.length,
      etapas: configs.map(c => c.component),
      incluiFoto: configs.some(c => c.component === 'CapturaFotoStep'),
      incluiGeolocation: configs.some(c => c.component === 'GeolocationStep'),
      incluiTermos: configs.some(c => c.component === 'TermosAceiteStep')
    });

    return configs;
  };

  // Comment 9: useEffect para pré-validar todos os templates (se múltiplos)
  useEffect(() => {
    if (!templateIds || templateIds.length <= 1) {
      // Nenhum template ou apenas 1, não pré-validar
      setUnavailableTemplateIds([]);
      return;
    }

    let cancelled = false;

    (async () => {
      const validationPromises = templateIds.map(async (templateId) => {
        try {
          const response = await fetch(`/api/templates/${templateId}`);
          const data = await response.json();

          if (!data.success || !data.data) {
            return { templateId, available: false };
          }

          // Se sucesso, armazenar no cache para reutilização
          setCachedTemplate(templateId, data.data as Template);
          return { templateId, available: true };
        } catch (err) {
          console.error(`Erro ao validar template ${templateId}:`, err);
          return { templateId, available: false };
        }
      });

      const results = await Promise.all(validationPromises);

      if (!cancelled) {
        const unavailable = results.filter(r => !r.available).map(r => r.templateId);
        setUnavailableTemplateIds(unavailable);

        if (unavailable.length > 0) {
          console.warn('⚠️ Templates indisponíveis:', unavailable);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateIds]);

  // useEffect: Inicializar configuração de etapas baseado na configuração do formulário
  useEffect(() => {
    console.log('🔧 Inicializando configuração de etapas:', {
      formularioFlowConfig,
    });

    // Construir configuração de etapas usando dados do formulário
    const configs = buildStepConfigs(formularioFlowConfig);
    setStepConfigs(configs);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formularioFlowConfig]);

  // useEffect: Verificar se template possui conteúdo Markdown
  useEffect(() => {
    if (etapaAtual !== 3) {
      setTemplateHasMarkdown(null);
      setHasTemplateError(false);
      return;
    }

    const effectiveTemplateId = templateIdSelecionado || templateIds?.[0];

    // Comment 2 fix: Early detection of missing template - set error state
    if (!effectiveTemplateId) {
      setTemplateHasMarkdown(false);
      setHasTemplateError(true);
      return;
    }

    setHasTemplateError(false);

    // Comment 3 fix: Check cache first to avoid duplicate fetches
    const cachedTemplate = getCachedTemplate(effectiveTemplateId);
    if (cachedTemplate) {
      const hasMarkdown = !!cachedTemplate.conteudo_markdown && cachedTemplate.conteudo_markdown.trim() !== '';
      setTemplateHasMarkdown(hasMarkdown);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/templates/${effectiveTemplateId}`);
        const data = await response.json();

        if (!cancelled) {
          // Comment 1 fix: Explicitly handle success=false or missing data to prevent indefinite loading
          if (data.success && data.data) {
            const template = data.data as Template;

            // Comment 3 fix: Store in cache for reuse
            setCachedTemplate(effectiveTemplateId, template);

            const hasMarkdown = !!template.conteudo_markdown && template.conteudo_markdown.trim() !== '';
            setTemplateHasMarkdown(hasMarkdown);
          } else {
            // If success=false or data is missing, fallback to non-Markdown (PDF) rendering
            console.warn('Template fetch returned success=false or missing data, falling back to PDF view');
            setTemplateHasMarkdown(false);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar template:', err);
        if (!cancelled) setTemplateHasMarkdown(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapaAtual, templateIdSelecionado, templateIds]);
  // Note: Deliberately excluding getCachedTemplate and setCachedTemplate to prevent infinite loops
  // These are stable Zustand actions that don't need to be in dependencies

  const renderEtapa = () => {
    if (!stepConfigs || stepConfigs.length === 0) {
      // Fallback enquanto carrega configuração
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-gray-700">Carregando formulário...</p>
        </div>
      );
    }

    const currentStepConfig = stepConfigs.find(s => s.index === etapaAtual);

    if (!currentStepConfig) {
      // Etapa inválida, voltar para primeira etapa
      console.error('Etapa inválida:', etapaAtual);
      return <VerificarCPF />;
    }

    // Renderizar componente baseado em stepConfig.component
    switch (currentStepConfig.component) {
      case 'VerificarCPF':
        return <VerificarCPF />;
      case 'DadosPessoais':
        return <DadosPessoais />;
      case 'DynamicFormStep':
        return <DynamicFormStep />;
      case 'VisualizacaoPdfStep':
        // Comment 9: Mostrar alerta se há templates indisponíveis
        if (unavailableTemplateIds.length > 0) {
          return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 max-w-2xl mx-auto">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Alguns templates estão indisponíveis</AlertTitle>
                <AlertDescription className="mt-2 space-y-3">
                  <p>
                    Os seguintes templates não puderam ser carregados: {unavailableTemplateIds.join(', ')}
                  </p>
                  <p>
                    Você pode continuar com os templates disponíveis ou voltar para recarregar o formulário.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={etapaAnterior}
                    >
                      Voltar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setUnavailableTemplateIds([])}
                    >
                      Continuar com disponíveis
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          );
        }

        // Lógica existente de decisão entre PDF e Markdown
        if (hasTemplateError) {
          return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 max-w-2xl mx-auto">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Template não encontrado</AlertTitle>
                <AlertDescription className="mt-2 space-y-3">
                  <p>
                    Não foi possível encontrar um template associado a este formulário.
                    Por favor, volte e tente novamente ou entre em contato com o suporte.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={etapaAnterior}
                    className="mt-2"
                  >
                    Voltar
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          );
        }
        if (templateHasMarkdown === null) {
          return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-gray-700">Carregando visualização...</p>
            </div>
          );
        }
        return templateHasMarkdown ? <VisualizacaoMarkdownStep /> : <VisualizacaoPdfStep />;
      case 'CapturaFotoStep':
        return <CapturaFotoStep />;
      case 'GeolocationStep':
        return <GeolocationStep />;
      case 'TermosAceiteStep':
        return <TermosAceiteStep />;
      case 'AssinaturaManuscritaStep':
        return <AssinaturaManuscritaStep />;
      case 'Sucesso':
        return <Sucesso />;
      default:
        console.error('Componente desconhecido:', currentStepConfig.component);
        return <VerificarCPF />;
    }
  };

  return (
    <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {renderEtapa()}
      </div>
    </div>
  );
}