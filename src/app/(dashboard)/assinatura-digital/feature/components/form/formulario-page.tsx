"use client";

import { useEffect } from "react";
import { useFormularioStore } from "../../store";
import FormularioContainer from "./formulario-container";
import type { DynamicFormSchema, MetadadoSeguranca } from '../../types/domain';

interface FormularioPageProps {
  segmentoId: number;
  formularioId: number;
  templateIds?: string[];
  formularioNome?: string;
  segmentoNome?: string;
  formSchema?: DynamicFormSchema;
  fotoNecessaria?: boolean;
  geolocationNecessaria?: boolean;
  metadadosSeguranca?: MetadadoSeguranca[];
}

/**
 * Wrapper genérico para páginas de formulário multi-step.
 *
 * Responsabilidades:
 * - Inicializa o contexto do formulário (segmento, formulário e templates)
 * - Garante estado limpo ao resetar o formulário na montagem
 * - Delega toda a lógica de navegação e renderização para FormularioContainer
 *
 * NOTA: Na arquitetura agnóstica, segmentoId e formularioId substituem
 * escritorioId e tipoAcao. formularioId agora é number (ID inteiro do formulário).
 *
 * Uso: Importado por páginas server que exportam metadata e passam props estáticas
 */
export default function FormularioPage({
  segmentoId,
  formularioId,
  templateIds,
  formularioNome,
  segmentoNome,
  formSchema,
  fotoNecessaria,
  geolocationNecessaria,
  metadadosSeguranca
}: FormularioPageProps) {
  const hydrateContext = useFormularioStore((state) => state.hydrateContext);

  useEffect(() => {
    // Inicializa contexto e reseta estado em uma única operação atômica
    // Configuração de fluxo (foto, geolocalização, metadados) vem do formulário
    hydrateContext({
      segmentoId,
      formularioId,
      templateIds,
      formularioNome,
      segmentoNome,
      formSchema,
      flowConfig: {
        foto_necessaria: fotoNecessaria,
        geolocation_necessaria: geolocationNecessaria,
        metadados_seguranca: metadadosSeguranca,
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentoId, formularioId, formularioNome, segmentoNome, fotoNecessaria, geolocationNecessaria]);
  // Note: Deliberately excluding formSchema, templateIds, metadadosSeguranca, and hydrateContext to prevent infinite loops
  // These values are passed through but don't need to trigger re-hydration

  return <FormularioContainer />;
}