"use client";

import { useState, useEffect } from "react";
import { useFormularioStore } from '@/shared/assinatura-digital/store';
import VerificarCPF from "./verificar-cpf";
import ContratosPendentesStep from "./contratos-pendentes-step";
import DadosIdentidade from "./dados-identidade";
import DadosContatos from "./dados-contatos";
import DadosEndereco from "./dados-endereco";
import DynamicFormStep from "./dynamic-form-step";
import CapturaFotoStep from "../capture/captura-foto-step";
import GeolocationStep from "../capture/geolocation-step";
import VisualizacaoPdfStep from "./visualizacao-pdf-step";
import VisualizacaoMarkdownStep from "./visualizacao-markdown-step";
import TermosAceiteStep from "./termos-aceite-step";
import AssinaturaManuscritaStep from "./assinatura-manuscrita-step";
import Sucesso from "./sucesso";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { StepConfig } from '@/shared/assinatura-digital/types/store';
import { PublicFormShell } from '../public-form-shell';
import type { StepProgressItem } from '../step-progress';

const STEP_LABELS: Record<string, string> = {
  cpf: "CPF",
  pendentes: "Pendentes",
  pessoais: "Dados",
  identidade: "Identidade",
  contatos: "Contatos",
  endereco: "Endereço",
  acao: "Ação",
  visualizacao: "Revisão",
  foto: "Selfie",
  geolocation: "Local",
  termos: "Termos",
  assinatura: "Assinar",
  sucesso: "Pronto",
};

function formatResumeHint(timestamp: number | null, etapa: number): string | null {
  if (!timestamp || etapa === 0) return null;
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Continuando de onde parou · salvo agora";
  if (diffMin === 1) return "Continuando de onde parou · salvo há 1 min";
  return `Continuando de onde parou · salvo há ${diffMin} min`;
}

export default function FormularioContainer() {
  const etapaAtual = useFormularioStore((state) => state.etapaAtual);
  const etapaAnterior = useFormularioStore((state) => state.etapaAnterior);

  // Fix: Use individual selectors to avoid recreating objects on every render
  const templateIdSelecionado = useFormularioStore((state) => state.templateIdSelecionado);
  const templateIds = useFormularioStore((state) => state.templateIds);
  const getCachedTemplate = useFormularioStore((state) => state.getCachedTemplate);
  const stepConfigs = useFormularioStore((state) => state.stepConfigs);
  const setStepConfigs = useFormularioStore((state) => state.setStepConfigs);
  const formularioFlowConfig = useFormularioStore((state) => state.formularioFlowConfig);
  const contratosPendentes = useFormularioStore((state) => state.contratosPendentes);

  const [templateHasMarkdown, setTemplateHasMarkdown] = useState<boolean | null>(null);
  const [hasTemplateError, setHasTemplateError] = useState<boolean>(false);

  // Função que constrói configuração de etapas baseado na configuração do formulário
  const buildStepConfigs = (
    formularioConfig: { foto_necessaria?: boolean; geolocation_necessaria?: boolean } | null,
    temContratosPendentes: boolean = false,
  ): StepConfig[] => {
    console.log('📋 Construindo configuração de etapas do formulário:', {
      fotoNecessaria: formularioConfig?.foto_necessaria,
      geolocationNecessaria: formularioConfig?.geolocation_necessaria,
      temContratosPendentes,
    });

    const configs: StepConfig[] = [
      { id: 'cpf', index: 0, component: 'VerificarCPF', required: true, enabled: true },
    ];

    let currentIndex = 1;

    // Inserir step de contratos pendentes se houver contratos aguardando assinatura
    if (temContratosPendentes) {
      configs.push({ id: 'pendentes', index: currentIndex++, component: 'ContratosPendentesStep', required: false, enabled: true });
      console.log('📄 Etapa de contratos pendentes adicionada ao fluxo (índice:', currentIndex - 1, ')');
    }

    configs.push(
      { id: 'identidade', index: currentIndex++, component: 'DadosIdentidade', required: true, enabled: true },
      { id: 'contatos', index: currentIndex++, component: 'DadosContatos', required: true, enabled: true },
      { id: 'endereco', index: currentIndex++, component: 'DadosEndereco', required: true, enabled: true },
      { id: 'acao', index: currentIndex++, component: 'DynamicFormStep', required: true, enabled: true },
      { id: 'visualizacao', index: currentIndex++, component: 'VisualizacaoPdfStep', required: true, enabled: true },
    );

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

  // useEffect: Inicializar configuração de etapas baseado na configuração do formulário
  useEffect(() => {
    const temPendentes = (contratosPendentes?.length ?? 0) > 0;
    console.log('🔧 Inicializando configuração de etapas:', {
      formularioFlowConfig,
      temContratosPendentes: temPendentes,
    });

    // Construir configuração de etapas usando dados do formulário
    const configs = buildStepConfigs(formularioFlowConfig, temPendentes);
    setStepConfigs(configs);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formularioFlowConfig, contratosPendentes]);

  // useEffect: Verificar se template possui conteúdo Markdown
  // Templates são pré-carregados server-side em page.tsx e injetados no
  // cache via hydrateContext, então aqui só fazemos lookup síncrono.
  useEffect(() => {
    const isVisualizacaoStep = stepConfigs?.find(
      (s) => s.index === etapaAtual && s.component === 'VisualizacaoPdfStep'
    );
    if (!isVisualizacaoStep) {
      setTemplateHasMarkdown(null);
      setHasTemplateError(false);
      return;
    }

    const effectiveTemplateId = templateIdSelecionado || templateIds?.[0];

    if (!effectiveTemplateId) {
      setTemplateHasMarkdown(false);
      setHasTemplateError(true);
      return;
    }

    const cachedTemplate = getCachedTemplate(effectiveTemplateId);
    if (!cachedTemplate) {
      // Cache vazio nessa etapa indica que o prefetch server-side falhou
      // ou o usuário selecionou um templateId inexistente.
      console.warn('Template não encontrado no cache:', effectiveTemplateId);
      setTemplateHasMarkdown(false);
      setHasTemplateError(true);
      return;
    }

    setHasTemplateError(false);
    const hasMarkdown =
      !!cachedTemplate.conteudo_markdown && cachedTemplate.conteudo_markdown.trim() !== '';
    setTemplateHasMarkdown(hasMarkdown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapaAtual, templateIdSelecionado, templateIds, stepConfigs]);

  const renderEtapa = () => {
    if (!stepConfigs || stepConfigs.length === 0) {
      // Fallback enquanto carrega configuração
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Carregando formulário...</p>
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
      case 'ContratosPendentesStep':
        return <ContratosPendentesStep />;
      case 'DadosIdentidade':
        return <DadosIdentidade />;
      case 'DadosContatos':
        return <DadosContatos />;
      case 'DadosEndereco':
        return <DadosEndereco />;
      case 'DynamicFormStep':
        return <DynamicFormStep />;
      case 'VisualizacaoPdfStep':
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
              <p className="text-lg font-medium text-muted-foreground">Carregando visualização...</p>
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

  const resetAll = useFormularioStore((state) => state.resetAll);
  const timestamp = useFormularioStore((state) => state._timestamp);

  const stepItems: StepProgressItem[] = (stepConfigs ?? []).map((cfg) => ({
    id: cfg.id,
    label: STEP_LABELS[cfg.id] ?? cfg.component,
  }));

  const resumeHint = formatResumeHint(timestamp, etapaAtual);

  return (
    <PublicFormShell
      steps={stepItems}
      currentIndex={etapaAtual}
      onRestart={etapaAtual > 0 ? resetAll : undefined}
      resumeHint={resumeHint}
    >
      {renderEtapa()}
    </PublicFormShell>
  );
}