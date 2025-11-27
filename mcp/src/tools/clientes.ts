import { z } from 'zod';
import type { Cliente, CriarClienteParams, AtualizarClienteParams, ListarClientesResult } from '@/backend/types/partes';
import { SinesysApiClient } from '../client';
import type { ToolDefinition, ToolResponse } from '../types';
import { toSnakeCase, formatToolResponse, handleToolError } from './utils';

const clientesTools: ToolDefinition[] = [
  {
    name: 'sinesys_listar_clientes',
    description: 'Lista clientes do sistema com paginação e filtros opcionais. Filtros disponíveis: busca (em nome, nome fantasia, CPF, CNPJ ou e-mail), tipoPessoa (pf para pessoa física ou pj para jurídica), trt (Tribunal Regional do Trabalho), grau (primeiro_grau ou segundo_grau), incluirEndereco (boolean para incluir dados de endereço via JOIN), ativo (boolean para filtrar por status ativo/inativo). Campos obrigatórios: nenhum (todos opcionais).',
    inputSchema: z.object({
      pagina: z.number().int().positive().optional(),
      limite: z.number().int().positive().optional(),
      busca: z.string().optional(),
      tipoPessoa: z.enum(['pf', 'pj']).optional(),
      trt: z.string().optional(),
      grau: z.enum(['primeiro_grau', 'segundo_grau']).optional(),
      incluirEndereco: z.boolean().optional(),
      ativo: z.boolean().optional(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const params = toSnakeCase(args);
        const response = await client.get<ListarClientesResult>('/api/clientes', params);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro desconhecido ao listar clientes');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_buscar_cliente',
    description: 'Busca um cliente específico pelo ID. Retorna os dados completos do cliente ou erro 404 se não encontrado. Campo obrigatório: id (número inteiro positivo).',
    inputSchema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const response = await client.get<Cliente>(`/api/clientes/${args.id}`);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Cliente não encontrado');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_criar_cliente',
    description: 'Cria um novo cliente no sistema (pessoa física ou jurídica). TipoPessoa é obrigatório (pf ou pj). Para PF: nome e cpf obrigatórios; para PJ: nome e cnpj obrigatórios. Campos básicos incluem dados de contato (emails, telefones), observações e endereço. Nota: Este tool também aceita campos adicionais relacionados à integração com o PJE (Processo Judicial Eletrônico), como statusPje, situacaoPje, loginPje, naturalidade, nacionalidade, etc. Estes campos são opcionais e destinados a uso avançado/interno.',
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
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const body = toSnakeCase(args);
        const response = await client.post<Cliente>('/api/clientes', body);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao criar cliente');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
  {
    name: 'sinesys_atualizar_cliente',
    description: 'Atualiza um cliente existente. ID é obrigatório (número inteiro positivo). Dados é um objeto com campos parciais a atualizar (todos opcionais), incluindo nome, cpf, cnpj, nomeSocialFantasia, emails, observacoes, ativo, etc. Nota: Também aceita campos PJE estendidos para uso avançado/interno.',
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
    handler: async (args, client): Promise<ToolResponse> => {
      try {
        const { id, dados } = args;
        const body = toSnakeCase(dados);
        const response = await client.patch<Cliente>(`/api/clientes/${id}`, body);
        if (response.success && response.data) {
          return formatToolResponse(response.data);
        } else {
          return handleToolError(response.error || 'Erro ao atualizar cliente');
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  },
];

export { clientesTools };
