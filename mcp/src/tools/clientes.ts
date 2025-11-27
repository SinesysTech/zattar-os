import { z } from 'zod';
import type { Cliente, CriarClienteParams, AtualizarClienteParams, ListarClientesResult } from '@/backend/types/partes';
import { SinesysApiClient } from '../client';
import type { ToolDefinition } from '../types';

/**
 * Converte recursivamente chaves de objeto de camelCase para snake_case.
 * Trata arrays recursivamente e preserva valores null/undefined.
 */
function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = toSnakeCase(value);
  }
  return result;
}

const clientesTools: ToolDefinition[] = [
  {
    name: 'sinesys_listar_clientes',
    description: 'Lista clientes do sistema com paginação e filtros opcionais. Filtros disponíveis: busca (em nome, nome fantasia, CPF, CNPJ ou e-mail), tipoPessoa (pf para pessoa física ou pj para jurídica), trt (Tribunal Regional do Trabalho), grau (primeiro_grau ou segundo_grau), incluirEndereco (boolean para incluir dados de endereço via JOIN). Campos obrigatórios: nenhum (todos opcionais).',
    inputSchema: z.object({
      pagina: z.number().int().positive().optional(),
      limite: z.number().int().positive().optional(),
      busca: z.string().optional(),
      tipoPessoa: z.enum(['pf', 'pj']).optional(),
      trt: z.string().optional(),
      grau: z.enum(['primeiro_grau', 'segundo_grau']).optional(),
      incluirEndereco: z.boolean().optional(),
    }),
    handler: async (args, client) => {
      const params = toSnakeCase(args);
      const response = await client.get<ListarClientesResult>('/api/clientes', params);
      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    },
  },
  {
    name: 'sinesys_buscar_cliente',
    description: 'Busca um cliente específico pelo ID. Retorna os dados completos do cliente ou erro 404 se não encontrado. Campo obrigatório: id (número inteiro positivo).',
    inputSchema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args, client) => {
      const response = await client.get<Cliente>(`/api/clientes/${args.id}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    },
  },
  {
    name: 'sinesys_criar_cliente',
    description: 'Cria um novo cliente no sistema (pessoa física ou jurídica). TipoPessoa é obrigatório (pf ou pj). Para PF: nome e cpf obrigatórios; para PJ: nome e cnpj obrigatórios. Outros campos são opcionais e incluem dados pessoais, contato, endereço, etc.',
    inputSchema: z.discriminatedUnion('tipoPessoa', [
      z.object({
        tipoPessoa: z.literal('pf'),
        nome: z.string(),
        cpf: z.string(),
        nomeSocialFantasia: z.string().optional(),
        emails: z.array(z.string()).optional(),
        dddCelular: z.string().optional(),
        numeroCelular: z.string().optional(),
        dddResidencial: z.string().optional(),
        numeroResidencial: z.string().optional(),
        dddComercial: z.string().optional(),
        numeroComercial: z.string().optional(),
        tipoDocumento: z.string().optional(),
        statusPje: z.string().optional(),
        situacaoPje: z.string().optional(),
        loginPje: z.string().optional(),
        autoridade: z.boolean().optional(),
        rg: z.string().optional(),
        dataNascimento: z.string().optional(),
        genero: z.string().optional(),
        estadoCivil: z.string().optional(),
        nacionalidade: z.string().optional(),
        sexo: z.string().optional(),
        nomeGenitora: z.string().optional(),
        naturalidadeIdPje: z.number().optional(),
        naturalidadeMunicipio: z.string().optional(),
        naturalidadeEstadoIdPje: z.number().optional(),
        naturalidadeEstadoSigla: z.string().optional(),
        ufNascimentoIdPje: z.number().optional(),
        ufNascimentoSigla: z.string().optional(),
        ufNascimentoDescricao: z.string().optional(),
        paisNascimentoIdPje: z.number().optional(),
        paisNascimentoCodigo: z.string().optional(),
        paisNascimentoDescricao: z.string().optional(),
        escolaridadeCodigo: z.number().optional(),
        situacaoCpfReceitaId: z.number().optional(),
        situacaoCpfReceitaDescricao: z.string().optional(),
        podeUsarCelularMensagem: z.boolean().optional(),
        observacoes: z.string().optional(),
        enderecoId: z.number().optional(),
        ativo: z.boolean().optional(),
        createdBy: z.number().optional(),
      }),
      z.object({
        tipoPessoa: z.literal('pj'),
        nome: z.string(),
        cnpj: z.string(),
        nomeSocialFantasia: z.string().optional(),
        emails: z.array(z.string()).optional(),
        dddCelular: z.string().optional(),
        numeroCelular: z.string().optional(),
        dddResidencial: z.string().optional(),
        numeroResidencial: z.string().optional(),
        dddComercial: z.string().optional(),
        numeroComercial: z.string().optional(),
        tipoDocumento: z.string().optional(),
        statusPje: z.string().optional(),
        situacaoPje: z.string().optional(),
        loginPje: z.string().optional(),
        autoridade: z.boolean().optional(),
        inscricaoEstadual: z.string().optional(),
        dataAbertura: z.string().optional(),
        dataFimAtividade: z.string().optional(),
        orgaoPublico: z.boolean().optional(),
        tipoPessoaCodigoPje: z.string().optional(),
        tipoPessoaLabelPje: z.string().optional(),
        tipoPessoaValidacaoReceita: z.string().optional(),
        dsTipoPessoa: z.string().optional(),
        situacaoCnpjReceitaId: z.number().optional(),
        situacaoCnpjReceitaDescricao: z.string().optional(),
        ramoAtividade: z.string().optional(),
        cpfResponsavel: z.string().optional(),
        oficial: z.boolean().optional(),
        dsPrazoExpedienteAutomatico: z.string().optional(),
        porteCodigo: z.number().optional(),
        porteDescricao: z.string().optional(),
        ultimaAtualizacaoPje: z.string().optional(),
        observacoes: z.string().optional(),
        enderecoId: z.number().optional(),
        ativo: z.boolean().optional(),
        createdBy: z.number().optional(),
      }),
    ]),
    handler: async (args, client) => {
      const body = toSnakeCase(args);
      const response = await client.post<Cliente>('/api/clientes', body);
      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    },
  },
  {
    name: 'sinesys_atualizar_cliente',
    description: 'Atualiza um cliente existente. ID é obrigatório (número inteiro positivo). Dados é um objeto com campos parciais a atualizar (todos opcionais), incluindo nome, cpf, cnpj, nomeSocialFantasia, emails, observacoes, ativo, etc.',
    inputSchema: z.object({
      id: z.number().int().positive(),
      dados: z.object({
        nome: z.string().optional(),
        cpf: z.string().optional(),
        cnpj: z.string().optional(),
        nomeSocialFantasia: z.string().optional(),
        emails: z.array(z.string()).optional(),
        dddCelular: z.string().optional(),
        numeroCelular: z.string().optional(),
        dddResidencial: z.string().optional(),
        numeroResidencial: z.string().optional(),
        dddComercial: z.string().optional(),
        numeroComercial: z.string().optional(),
        tipoDocumento: z.string().optional(),
        statusPje: z.string().optional(),
        situacaoPje: z.string().optional(),
        loginPje: z.string().optional(),
        autoridade: z.boolean().optional(),
        rg: z.string().optional(),
        dataNascimento: z.string().optional(),
        genero: z.string().optional(),
        estadoCivil: z.string().optional(),
        nacionalidade: z.string().optional(),
        sexo: z.string().optional(),
        nomeGenitora: z.string().optional(),
        naturalidadeIdPje: z.number().optional(),
        naturalidadeMunicipio: z.string().optional(),
        naturalidadeEstadoIdPje: z.number().optional(),
        naturalidadeEstadoSigla: z.string().optional(),
        ufNascimentoIdPje: z.number().optional(),
        ufNascimentoSigla: z.string().optional(),
        ufNascimentoDescricao: z.string().optional(),
        paisNascimentoIdPje: z.number().optional(),
        paisNascimentoCodigo: z.string().optional(),
        paisNascimentoDescricao: z.string().optional(),
        escolaridadeCodigo: z.number().optional(),
        situacaoCpfReceitaId: z.number().optional(),
        situacaoCpfReceitaDescricao: z.string().optional(),
        podeUsarCelularMensagem: z.boolean().optional(),
        inscricaoEstadual: z.string().optional(),
        dataAbertura: z.string().optional(),
        dataFimAtividade: z.string().optional(),
        orgaoPublico: z.boolean().optional(),
        tipoPessoaCodigoPje: z.string().optional(),
        tipoPessoaLabelPje: z.string().optional(),
        tipoPessoaValidacaoReceita: z.string().optional(),
        dsTipoPessoa: z.string().optional(),
        situacaoCnpjReceitaId: z.number().optional(),
        situacaoCnpjReceitaDescricao: z.string().optional(),
        ramoAtividade: z.string().optional(),
        cpfResponsavel: z.string().optional(),
        oficial: z.boolean().optional(),
        dsPrazoExpedienteAutomatico: z.string().optional(),
        porteCodigo: z.number().optional(),
        porteDescricao: z.string().optional(),
        ultimaAtualizacaoPje: z.string().optional(),
        observacoes: z.string().optional(),
        enderecoId: z.number().optional(),
        ativo: z.boolean().optional(),
      }),
    }),
    handler: async (args, client) => {
      const { id, dados } = args;
      const body = toSnakeCase(dados);
      const response = await client.patch<Cliente>(`/api/clientes/${id}`, body);
      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    },
  },
];

export { clientesTools };