/**
 * Registro de Ferramentas MCP — Contratação Trabalhista (Cadastro Unificado)
 *
 * Tools disponíveis:
 * - cadastrar_contratacao_trabalhista: upsert cliente + parte contrária + contrato em uma chamada
 * - gerar_link_formulario_publico_contratacao: retorna URL do formulário público para auto-preenchimento
 *
 * Público-alvo: agentes de atendimento (ex.: Pedrinho/Chatwoot) que precisam
 * fechar contratação durante a conversa, respeitando o princípio "buscar antes de criar".
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

export async function registerContratacaoTrabalhistaTools(): Promise<void> {
  const {
    criarContratacaoTrabalhista,
    gerarLinkFormularioPublico,
  } = await import(
    '@/shared/assinatura-digital/services/contratacao-trabalhista.service'
  );

  /**
   * Cadastra contratação trabalhista completa (cliente + parte contrária + contrato).
   *
   * Comportamento:
   * - Cliente: busca por CPF; cria se não existir; opcionalmente atualiza se flag ligada.
   * - Parte contrária: busca por CNPJ ou CPF conforme tipo_pessoa; cria se não existir.
   * - Contrato: cria com status 'em_contratacao' vinculando cliente (autora) + parte contrária (re).
   * - Link público: se `formulario_slug` informado, retorna URL do formulário para assinatura.
   *
   * Rollback best-effort: se o contrato falhar e cliente/parte foram CRIADOS nesta chamada, desativa.
   */
  registerMcpTool({
    name: 'cadastrar_contratacao_trabalhista',
    description:
      'Cadastra contratação trabalhista completa em uma única chamada: faz upsert (busca-ou-cria) de cliente e parte contrária e cria o contrato vinculando os dois com status "em_contratacao". Opcionalmente retorna link do formulário público para o cliente assinar. Use APENAS após confirmar com o cliente que ele quer prosseguir.',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      cliente: z.object({
        cpf: z.string().min(11).describe('CPF do cliente (apenas números ou formatado)'),
        nome: z.string().min(1).describe('Nome completo'),
        email: z.string().email().optional(),
        celular: z.string().optional().describe('Celular DDD+NÚMERO, ex: 31999998888'),
        rg: z.string().optional(),
        data_nascimento: z.string().optional().describe('YYYY-MM-DD'),
        estado_civil: z
          .enum(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel'])
          .optional(),
        genero: z
          .enum(['masculino', 'feminino', 'outro', 'prefiro_nao_informar'])
          .optional(),
        nacionalidade: z.string().optional(),
        endereco: z
          .object({
            cep: z.string().optional(),
            logradouro: z.string().optional(),
            numero: z.string().optional(),
            complemento: z.string().optional(),
            bairro: z.string().optional(),
            municipio: z.string().optional(),
            estado_sigla: z.string().length(2).optional(),
          })
          .optional(),
      }),
      parte_contraria: z.object({
        tipo_pessoa: z.enum(['pf', 'pj']).describe('pf = pessoa física; pj = pessoa jurídica (apps, empresas)'),
        cpf: z.string().optional().describe('Obrigatório se tipo_pessoa = pf'),
        cnpj: z.string().optional().describe('Obrigatório se tipo_pessoa = pj'),
        nome: z.string().min(1).describe('Nome ou razão social'),
        nome_fantasia: z.string().optional(),
        email: z.string().email().optional(),
        endereco: z
          .object({
            cep: z.string().optional(),
            logradouro: z.string().optional(),
            numero: z.string().optional(),
            complemento: z.string().optional(),
            bairro: z.string().optional(),
            municipio: z.string().optional(),
            estado_sigla: z.string().length(2).optional(),
          })
          .optional(),
      }),
      contrato: z
        .object({
          tipo_contrato: z
            .enum(['ajuizamento', 'defesa', 'ato_processual', 'assessoria', 'consultoria', 'extrajudicial', 'parecer'])
            .optional()
            .describe('Default: ajuizamento'),
          tipo_cobranca: z.enum(['pro_exito', 'pro_labore']).optional().describe('Default: pro_exito'),
          papel_cliente: z.enum(['autora', 're']).optional().describe('Default: autora'),
          observacoes: z.string().optional(),
          segmento_slug: z.string().optional().describe('Default: trabalhista'),
          formulario_slug: z
            .string()
            .optional()
            .describe('Slug do formulário público (se informado, a resposta inclui link para o cliente)'),
          responsavel_id: z.number().int().positive().optional(),
        })
        .optional(),
      atualizar_cliente_se_existir: z
        .boolean()
        .optional()
        .default(false)
        .describe('Se true e cliente já existe, atualiza dados com as novas informações recebidas'),
      base_url_publica: z
        .string()
        .url()
        .optional()
        .describe('Base URL para montar link público (ex: https://zattaradvogados.com)'),
    }),
    handler: async (args) => {
      try {
        const result = await criarContratacaoTrabalhista(args as Parameters<typeof criarContratacaoTrabalhista>[0]);
        if (!result.success) return errorResult(result.error);
        return jsonResult({
          mensagem: 'Contratação cadastrada com sucesso',
          ...result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao cadastrar contratação');
      }
    },
  });

  /**
   * Gera link público do formulário de contratação (para o cliente preencher sozinho)
   */
  registerMcpTool({
    name: 'gerar_link_formulario_publico_contratacao',
    description:
      'Gera o link público do formulário de contratação para o cliente preencher e assinar sozinho (alternativa ao cadastro assistido). Use quando o cliente preferir autonomia.',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      segmento_slug: z.string().optional().default('trabalhista').describe('Default: trabalhista'),
      formulario_slug: z.string().min(1).describe('Slug do formulário (configurado no admin)'),
      base_url_publica: z.string().url().optional(),
    }),
    handler: async (args) => {
      try {
        const result = await gerarLinkFormularioPublico({
          segmento_slug: args.segmento_slug ?? 'trabalhista',
          formulario_slug: args.formulario_slug,
          base_url_publica: args.base_url_publica,
        });
        if (!result.success) return errorResult(result.error);
        return jsonResult({
          mensagem: 'Link gerado com sucesso',
          ...result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao gerar link público');
      }
    },
  });
}
