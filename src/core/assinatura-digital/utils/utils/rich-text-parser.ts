/**
 * Utilitário para processar campos compostos durante geração de PDF
 * Arquivo: rich-text-parser.ts
 */

import { DadosGeracao, TipoVariavel } from '@/types/assinatura-digital/template.types';
import { formatCPF } from '@/app/_lib/assinatura-digital/formatters/cpf';
import { formatCNPJ } from '@/app/_lib/assinatura-digital/formatters/cnpj';
import { formatTelefone } from '@/app/_lib/assinatura-digital/formatters/telefone';
import { formatCEP } from '@/app/_lib/assinatura-digital/formatters/cep';
import { formatDataExtenso } from '@/app/_lib/assinatura-digital/formatters/data';
import { format } from 'date-fns';
import type { PDFFont } from 'pdf-lib';

/**
 * Estrutura que mantém texto e alinhamento sincronizados
 * Evita desincronização entre mapa de alinhamentos e linhas renderizadas
 */
export interface ProcessedLine {
  text: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
  paragraphIndex: number;
  isLastLineOfParagraph: boolean;
}

/**
 * Extrai valor de uma variável dos dados de geração
 * @internal Exportada para uso em debug de geração de PDF
 */
export function extractFieldValue(variavel: string, dados: DadosGeracao): string {
  const [categoria, campo] = variavel.split('.');

  switch (categoria) {
    case 'cliente':
      // Aliases de nomenclatura (PT → EN/Real)
      if (campo === 'nome' || campo === 'nome_completo') {
        return dados.cliente.name || '';
      }

      // Campos de texto legível (usar versão _txt ao invés de código numérico)
      if (campo === 'nacionalidade') {
        return dados.cliente.nacionalidade_txt || '';
      }
      if (campo === 'estado_civil') {
        return dados.cliente.estado_civil_txt || '';
      }
      if (campo === 'genero') {
        return dados.cliente.genero_txt || '';
      }

      // Variação de endereço (alias para endereco_completo)
      if (campo === 'endereco') {
        const end = dados.cliente;
        const partes = [
          end.logradouro,
          end.numero,
          end.complemento,
          end.bairro,
          end.cidade,
          end.estado,
          end.cep ? formatCEP(String(end.cep)) : undefined
        ].filter(Boolean);
        return partes.join(', ');
      }

      if (campo === 'cpf' && dados.cliente.cpf) {
        return formatCPF(dados.cliente.cpf);
      }

      // Telefone genérico: retorna celular ou telefone_1
      if (campo === 'telefone') {
        const telefone = dados.cliente.celular || dados.cliente.telefone_1;
        return telefone ? formatTelefone(telefone) : '';
      }
      if (campo === 'celular' && dados.cliente.celular) {
        return formatTelefone(dados.cliente.celular);
      }
      if (campo === 'telefone_1' && dados.cliente.telefone_1) {
        return formatTelefone(dados.cliente.telefone_1);
      }

      if (campo === 'data_nascimento' && dados.cliente.data_nascimento) {
        return format(new Date(dados.cliente.data_nascimento), 'dd/MM/yyyy');
      }

      // Mapeamento de campos de endereço: PDF usa prefixo "endereco_", DB usa campos diretos
      if (campo.startsWith('endereco_')) {
        const endCampo = campo.replace('endereco_', '');

        // Mapeamento de nomes de campos PDF para campos do banco
        const fieldMap: Record<string, keyof typeof dados.cliente> = {
          rua: 'logradouro',
          numero: 'numero',
          complemento: 'complemento',
          bairro: 'bairro',
          cidade: 'cidade',
          uf: 'estado',
          cep: 'cep',
        };

        const actualField = fieldMap[endCampo] || `endereco_${endCampo}` as keyof typeof dados.cliente;
        const valor = dados.cliente[actualField];

        if (endCampo === 'cep' && valor) {
          return formatCEP(String(valor));
        }

        return valor ? String(valor) : '';
      }

      // Suporte direto aos novos campos de endereço
      if (['logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep'].includes(campo)) {
        const valor = dados.cliente[campo as keyof typeof dados.cliente];
        if (campo === 'cep' && valor) {
          return formatCEP(String(valor));
        }
        return valor ? String(valor) : '';
      }

      if (campo === 'endereco_completo') {
        const end = dados.cliente;
        const partes = [
          end.logradouro,
          end.numero,
          end.complemento,
          end.bairro,
          end.cidade,
          end.estado,
          end.cep ? formatCEP(String(end.cep)) : undefined
        ].filter(Boolean);
        return partes.join(', ');
      }
      return dados.cliente[campo as keyof typeof dados.cliente] as string || '';

    case 'acao':
      // Dados específicos de Apps
      if (campo === 'plataforma_nome' && 'plataforma_nome' in dados.acao) {
        return dados.acao.plataforma_nome || '';
      }
      if (campo === 'modalidade_nome' && 'modalidade_nome' in dados.acao) {
        return dados.acao.modalidade_nome || '';
      }
      if (campo === 'data_inicio_plataforma' && 'data_inicio_plataforma' in dados.acao) {
        const data = dados.acao.data_inicio_plataforma;
        return typeof data === 'string' || typeof data === 'number' ? format(new Date(data), 'dd/MM/yyyy') : '';
      }
      if (campo === 'data_bloqueado_plataforma' && 'data_bloqueado_plataforma' in dados.acao) {
        const data = dados.acao.data_bloqueado_plataforma;
        return typeof data === 'string' || typeof data === 'number' ? format(new Date(data), 'dd/MM/yyyy') : '';
      }

      // Dados específicos de Trabalhista
      if (campo === 'cpf_cnpj_empresa_pessoa' && 'cpf_cnpj_empresa_pessoa' in dados.acao) {
        const valor = (dados.acao as Record<string, unknown>).cpf_cnpj_empresa_pessoa;
        if (typeof valor !== 'string' || !valor) return '';
        return valor.length === 11 ? formatCPF(valor) : formatCNPJ(valor);
      }
      if (campo === 'cep_empresa_pessoa' && 'cep_empresa_pessoa' in dados.acao) {
        const valor = (dados.acao as Record<string, unknown>).cep_empresa_pessoa;
        return typeof valor === 'string' && valor ? formatCEP(valor) : '';
      }
      if (campo === 'data_inicio' && 'data_inicio' in dados.acao) {
        const data = (dados.acao as Record<string, unknown>).data_inicio as unknown;
        return typeof data === 'string' || typeof data === 'number' ? format(new Date(data), 'dd/MM/yyyy') : '';
      }
      if (campo === 'data_rescisao' && 'data_rescisao' in dados.acao) {
        const data = (dados.acao as Record<string, unknown>).data_rescisao as unknown;
        return typeof data === 'string' || typeof data === 'number' ? format(new Date(data), 'dd/MM/yyyy') : '';
      }

      return dados.acao[campo as keyof typeof dados.acao] as string || '';

    case 'assinatura':
      // Assinatura: suporta assinatura_base64, foto_base64, latitude, longitude, geolocation_accuracy, geolocation_timestamp
      // Formatar coordenadas GPS com 6 casas decimais e símbolo de grau
      if (campo === 'latitude' || campo === 'longitude') {
        const assinatura = dados.assinatura as { latitude?: number | string; longitude?: number | string } | undefined;
        const coord = assinatura ? assinatura[campo as 'latitude' | 'longitude'] : undefined;
        if (typeof coord === 'number') {
          return coord.toFixed(6) + '°';
        }
        if (typeof coord === 'string') {
          const parsed = parseFloat(coord);
          if (!isNaN(parsed)) {
            return parsed.toFixed(6) + '°';
          }
        }
      }
      {
        const assinatura = dados.assinatura as { assinatura_base64?: string; foto_base64?: string } | undefined;
        const valor = assinatura ? (campo === 'assinatura_base64' ? assinatura.assinatura_base64 : assinatura.foto_base64) : undefined;
        return valor ? String(valor) : '';
      }

    case 'sistema':
      // Sistema: suporta numero_contrato, protocolo, data_geracao, ip_cliente, user_agent, timestamp
      // data_geracao: formato extenso brasileiro (ex: "16 de outubro de 2025")
      if (campo === 'data_geracao') {
        const dg = dados.sistema.data_geracao;
        return dg ? formatDataExtenso(dg) : '';
      }
      // timestamp: carimbo de data/hora (ex: "16/10/2025 às 14:30:45")
      if (campo === 'timestamp') {
        const ts = dados.sistema.timestamp;
        return ts ? format(new Date(ts), "dd/MM/yyyy 'às' HH:mm:ss") : '';
      }
      {
        const v = dados.sistema[campo as keyof typeof dados.sistema];
        return v ? String(v) : '';
      }

    case 'segmento':
      // Suporte a dados do segmento
      if (campo === 'id' && dados.segmento?.id !== undefined) {
        return String(dados.segmento.id);
      }
      if (campo === 'nome' && dados.segmento?.nome) {
        return dados.segmento.nome;
      }
      if (campo === 'slug' && dados.segmento?.slug) {
        return dados.segmento.slug;
      }
      if (campo === 'descricao' && dados.segmento?.descricao) {
        return dados.segmento.descricao;
      }
      return '';

    default:
      return '';
  }
}

/**
 * Processa string template substituindo placeholders {{variavel}} por valores reais
 *
 * COMPATIBILIDADE: Esta função é compatível com ambas as implementações do editor:
 * - Mention (extensão legada)
 * - Variable (nova extensão personalizada)
 *
 * Ambas geram o mesmo formato de template string: {{variavel}}
 *
 * @param template String com placeholders no formato {{variavel}}
 * @param dados Dados para geração do PDF
 * @param fallbackStrategy Estratégia para valores faltantes: 'empty' (padrão) ou 'placeholder' (mantém {{variavel}})
 * @returns String processada com valores substituídos
 */
export function parseRichTextContent(
  template: string,
  dados: DadosGeracao,
  fallbackStrategy: 'empty' | 'placeholder' = 'empty'
): string {
  // Regex para encontrar todos os {{...}}
  const regex = /\{\{([^}]+)\}\}/g;

  return template.replace(regex, (match, variavel) => {
    const variavelTrimmed = variavel.trim() as TipoVariavel;
    const valor = extractFieldValue(variavelTrimmed, dados);

    // Se tem valor, retorna o valor
    if (valor) return valor;

    // Se não tem valor, aplica estratégia de fallback
    return fallbackStrategy === 'placeholder' ? match : '';
  });
}

/**
 * Extrai informações de alinhamento dos parágrafos do JSON TipTap
 *
 * IMPORTANTE: Este mapa é indexado por PARÁGRAFO, não por linha renderizada.
 * Cada parágrafo pode gerar múltiplas linhas após quebra de texto.
 * Use wrapTextWithAlignment() para sincronizar alinhamento com linhas quebradas.
 *
 * @param json - JSON do editor TipTap (ConteudoComposto.json)
 * @returns Map onde chave é o índice do PARÁGRAFO e valor é o alinhamento
 */
export function extractTextAlignment(json: Record<string, unknown>): Map<number, 'left' | 'center' | 'right' | 'justify'> {
  const alignmentMap = new Map<number, 'left' | 'center' | 'right' | 'justify'>();

  if (!json || !json.content || !Array.isArray(json.content)) {
    return alignmentMap;
  }

  let lineIndex = 0;

  type NodeType = {
    type?: string;
    attrs?: { textAlign?: 'left' | 'center' | 'right' | 'justify' };
    content?: unknown[];
  };

  function processNode(node: NodeType) {
    // Parágrafos e headings têm o atributo textAlign
    if (node.type === 'paragraph' || node.type === 'heading') {
      const alignment = node.attrs?.textAlign || 'left';
      alignmentMap.set(lineIndex, alignment);
      lineIndex++;
    }

    // Processar recursivamente conteúdo
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach((child) => processNode(child as NodeType));
    }
  }

  json.content.forEach((node) => processNode(node as NodeType));

  return alignmentMap;
}

/**
 * Quebra texto em linhas com alinhamento sincronizado
 *
 * Esta função resolve o problema de desincronização entre alinhamentos de parágrafo
 * e linhas quebradas. Retorna ProcessedLine[] onde cada linha mantém seu alinhamento
 * e metadados de parágrafo juntos.
 *
 * ⚠️ IMPORTANTE: O parâmetro `maxWidth` deve ser pré-convertido para coordenadas PDF.
 * Não passe `campo.posicao.width` diretamente - use `convertWidth()` em lib/pdf/generator.ts
 * para converter dimensões do canvas para dimensões do PDF antes de chamar esta função.
 *
 * @param text Texto completo (pode conter múltiplos parágrafos separados por \n)
 * @param maxWidth Largura máxima em pontos PDF (já convertida do canvas)
 * @param fontSize Tamanho da fonte
 * @param alignmentMap Mapa de alinhamentos por índice de parágrafo
 * @param font Fonte PDF para cálculo preciso de largura
 * @returns Array de ProcessedLine com texto e alinhamento sincronizados
 */
export function wrapTextWithAlignment(
  text: string,
  maxWidth: number,
  fontSize: number,
  alignmentMap: Map<number, 'left' | 'center' | 'right' | 'justify'>,
  font: PDFFont
): ProcessedLine[] {
  const result: ProcessedLine[] = [];
  const paragraphs = text.split('\n');

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const alignment = alignmentMap.get(paragraphIndex) || 'left';
    const words = paragraph.split(' ');
    let currentLine = '';

    const processedLines: string[] = [];

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          processedLines.push(currentLine);
        }
        // Se a palavra é muito longa, quebra ela também usando busca binária
        if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
          let remaining = word;
          while (font.widthOfTextAtSize(remaining, fontSize) > maxWidth) {
            // Busca binária para encontrar o ponto de corte ideal (O(log n))
            let left = 1;
            let right = remaining.length - 1;
            let bestFit = 1;

            while (left <= right) {
              const mid = Math.floor((left + right) / 2);
              const testWidth = font.widthOfTextAtSize(remaining.substring(0, mid), fontSize);

              if (testWidth <= maxWidth) {
                bestFit = mid;
                left = mid + 1;
              } else {
                right = mid - 1;
              }
            }

            processedLines.push(remaining.substring(0, bestFit));
            remaining = remaining.substring(bestFit);
          }
          currentLine = remaining;
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      processedLines.push(currentLine);
    }

    // Se parágrafo vazio, adicionar linha vazia
    if (processedLines.length === 0) {
      processedLines.push('');
    }

    // Converter linhas em ProcessedLine com metadados
    processedLines.forEach((line, lineIndex) => {
      result.push({
        text: line,
        alignment,
        paragraphIndex,
        isLastLineOfParagraph: lineIndex === processedLines.length - 1,
      });
    });
  });

  return result;
}

/**
 * Estima altura total necessária para renderizar texto
 *
 * Útil para validação no editor e prevenção de campos cortados
 *
 * @param text Texto completo a ser renderizado
 * @param maxWidth Largura máxima disponível em pontos
 * @param fontSize Tamanho da fonte
 * @param font Fonte PDF para cálculo preciso
 * @returns Altura estimada em pontos
 */
export function estimateTextHeight(
  text: string,
  maxWidth: number,
  fontSize: number,
  font: PDFFont
): number {
  // Usar alinhamento left para estimativa (não afeta número de linhas)
  const alignmentMap = new Map<number, 'left' | 'center' | 'right' | 'justify'>();
  const lines = wrapTextWithAlignment(text, maxWidth, fontSize, alignmentMap, font);
  const lineHeight = fontSize * 1.2;
  return lines.length * lineHeight;
}
