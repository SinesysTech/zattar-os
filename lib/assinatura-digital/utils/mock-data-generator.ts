/**
 * Gerador de Dados Fictícios para Preview de PDF
 *
 * Este utilitário gera dados mock realistas para permitir preview de templates
 * durante a edição sem precisar de dados reais de clientes/ações.
 *
 * IMPORTANTE: Dados gerados são apenas para preview e NÃO devem ser persistidos.
 *
 * @module lib/assinatura-digital/utils/mock-data-generator
 */

import type { Template } from '@/types/assinatura-digital/template.types';
import type { ClienteBasico, SegmentoBasico, FormularioBasico } from '@/backend/assinatura-digital/services/data.service';

/**
 * Dados mock para preview de template
 */
export interface MockPreviewData {
  cliente: ClienteBasico;
  segmento: SegmentoBasico;
  formulario: FormularioBasico;
  protocolo: string;
  ip: string;
  user_agent: string;
  extras: Record<string, unknown>; // For custom variables
  images: {
    assinaturaBase64?: string;
    fotoBase64?: string;
  };
}

/**
 * Gera imagem base64 dummy para preview
 *
 * Cria um data URI PNG mínimo válido para uso em preview.
 * Não usa canvas (para compatibilidade com server-side rendering).
 *
 * @param width Largura em pixels (ignorado - sempre retorna imagem mínima)
 * @param height Altura em pixels (ignorado - sempre retorna imagem mínima)
 * @param text Texto a exibir (ignorado - sempre retorna imagem mínima)
 * @returns Data URI válido para imagem PNG
 */
export function generateDummyBase64Image(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parâmetros mantidos para futura implementação
  _width: number = 200,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parâmetros mantidos para futura implementação
  _height: number = 100,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parâmetros mantidos para futura implementação
  _text: string = 'PREVIEW'
): string {
  // PNG transparente 1x1 mínimo (válido)
  // Este é um PNG válido que pode ser processado pelo pdf-lib
  const minimalPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  return `data:image/png;base64,${minimalPngBase64}`;
}

/**
 * Gera dados mock completos para preview de template
 *
 * Cria um objeto MockPreviewData completo com valores fictícios realistas
 * que podem ser usados para gerar PDF de teste durante edição de template.
 *
 * @param template Template para o qual gerar dados
 * @param options Opções de customização (segmento ID/nome, foto)
 * @returns Objeto MockPreviewData completo e pronto para uso
 *
 * @example
 * ```typescript
 * const template = await getTemplate('123');
 * const mockData = generateMockDataForPreview(template, {
 *   segmentoId: 5,
 *   segmentoNome: 'Jurídico SP',
 *   includeFoto: true,
 * });
 * const pdfBuffer = await generatePdfFromTemplate(
 *   template,
 *   {
 *     cliente: mockData.cliente,
 *     segmento: mockData.segmento,
 *     formulario: mockData.formulario,
 *     protocolo: mockData.protocolo,
 *     ip: mockData.ip,
 *     user_agent: mockData.user_agent,
 *   },
 *   mockData.extras,
 *   mockData.images
 * );
 * ```
 */
export function generateMockDataForPreview(
  template: Template,
  options?: { segmentoId?: number; segmentoNome?: string; includeFoto?: boolean; includeGeolocation?: boolean }
): MockPreviewData {
  // Gerar cliente mock
  const cliente: ClienteBasico = {
    id: 999,
    nome: 'João da Silva Santos',
    cpf: '12345678901',
    cnpj: null,
  };

  // Gerar segmento mock
  const segmento: SegmentoBasico = {
    id: options?.segmentoId || 1,
    nome: options?.segmentoNome || 'Segmento de Teste',
    slug: 'segmento-teste',
    ativo: true,
  };

  // Gerar formulário mock
  const formulario: FormularioBasico = {
    id: 0,
    formulario_uuid: 'preview',
    nome: 'Preview',
    slug: 'preview',
    segmento_id: segmento.id,
    ativo: true,
  };

  // Gerar dados do sistema
  const protocolo = `PREVIEW-${Date.now()}`;
  const ip = '192.168.1.100';
  const user_agent = 'Mozilla/5.0 (Preview Generator)';

  // Extras vazio (pode ser estendido para variáveis customizadas)
  const extras: Record<string, unknown> = {};

  // Gerar imagens mock
  const includeFoto = options?.includeFoto ?? true;
  const images = {
    assinaturaBase64: generateDummyBase64Image(200, 100, 'ASSINATURA'),
    ...(includeFoto && {
      fotoBase64: generateDummyBase64Image(150, 200, 'FOTO'),
    }),
  };

  return {
    cliente,
    segmento,
    formulario,
    protocolo,
    ip,
    user_agent,
    extras,
    images,
  };
}