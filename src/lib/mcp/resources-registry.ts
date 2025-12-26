/**
 * Registry de Resources MCP do Sinesys
 *
 * Registra todos os recursos acessíveis via MCP
 */

import {
  registerMcpResource,
  jsonResourceResult,
  textResourceResult,
  binaryResourceResult,
} from './resources';

/**
 * Registra todos os resources disponíveis
 */
export async function registerAllResources(): Promise<void> {
  console.log('[MCP Resources] Iniciando registro de resources...');

  // =========================================================================
  // DOCUMENTOS
  // =========================================================================

  registerMcpResource({
    uri: 'sinesys://documentos/{id}',
    name: 'Documento',
    description: 'Acessa conteúdo de documento Plate.js',
    mimeType: 'application/json',
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      // Import dinâmico para evitar dependências circulares
      const { buscarDocumento } = await import('@/features/documentos/service');

      const result = await buscarDocumento(id);

      if (!result.success || !result.data) {
        throw new Error(`Documento ${id} não encontrado`);
      }

      const doc = result.data;

      return jsonResourceResult(uri, doc.conteudo, {
        titulo: doc.titulo,
        versao: doc.versao,
        tags: doc.tags,
        criado_em: doc.created_at,
        atualizado_em: doc.updated_at,
      });
    },
  });

  // =========================================================================
  // PROCESSOS
  // =========================================================================

  registerMcpResource({
    uri: 'sinesys://processos/{id}',
    name: 'Processo',
    description: 'Acessa dados completos de processo',
    mimeType: 'application/json',
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      const { actionBuscarProcesso } = await import('@/features/processos/actions');

      const result = await actionBuscarProcesso(id);

      if (!result.success || !result.data) {
        throw new Error(`Processo ${id} não encontrado`);
      }

      return jsonResourceResult(uri, result.data, {
        numero: result.data.numero,
        trt: result.data.trt,
        grau: result.data.grau,
        status: result.data.status,
      });
    },
  });

  // =========================================================================
  // CLIENTES
  // =========================================================================

  registerMcpResource({
    uri: 'sinesys://clientes/{id}',
    name: 'Cliente',
    description: 'Acessa dados de cliente',
    mimeType: 'application/json',
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      const { actionBuscarCliente } = await import('@/features/partes');

      const result = await actionBuscarCliente(id);

      if (!result.success || !result.data) {
        throw new Error(`Cliente ${id} não encontrado`);
      }

      return jsonResourceResult(uri, result.data, {
        nome: result.data.nome,
        documento: result.data.cpf_cnpj,
        tipo: result.data.tipo_pessoa,
      });
    },
  });

  // =========================================================================
  // CONTRATOS
  // =========================================================================

  registerMcpResource({
    uri: 'sinesys://contratos/{id}',
    name: 'Contrato',
    description: 'Acessa dados de contrato',
    mimeType: 'application/json',
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      const { actionBuscarContrato } = await import('@/features/contratos');

      const result = await actionBuscarContrato(id);

      if (!result.success || !result.data) {
        throw new Error(`Contrato ${id} não encontrado`);
      }

      return jsonResourceResult(uri, result.data, {
        tipo: result.data.tipo_contrato,
        status: result.data.status,
        cliente_id: result.data.cliente_id,
      });
    },
  });

  // =========================================================================
  // EXPEDIENTES
  // =========================================================================

  registerMcpResource({
    uri: 'sinesys://expedientes/{id}',
    name: 'Expediente',
    description: 'Acessa dados de expediente/prazo',
    mimeType: 'application/json',
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      const { buscarExpediente } = await import('@/features/expedientes/service');

      const result = await buscarExpediente(id);

      if (!result.success || !result.data) {
        throw new Error(`Expediente ${id} não encontrado`);
      }

      return jsonResourceResult(uri, result.data, {
        numero_processo: result.data.numero_processo,
        prazo: result.data.data_prazo_legal_parte,
        status: result.data.status,
      });
    },
  });

  // =========================================================================
  // AUDIÊNCIAS
  // =========================================================================

  registerMcpResource({
    uri: 'sinesys://audiencias/{id}',
    name: 'Audiência',
    description: 'Acessa dados de audiência',
    mimeType: 'application/json',
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      const { actionBuscarAudienciaPorId } = await import('@/features/audiencias/actions');

      const result = await actionBuscarAudienciaPorId(id);

      if (!result.success || !result.data) {
        throw new Error(`Audiência ${id} não encontrada`);
      }

      return jsonResourceResult(uri, result.data, {
        data: result.data.data_audiencia,
        tipo: result.data.tipo_audiencia,
        status: result.data.status,
      });
    },
  });

  // =========================================================================
  // LANÇAMENTOS FINANCEIROS
  // =========================================================================

  registerMcpResource({
    uri: 'sinesys://lancamentos/{id}',
    name: 'Lançamento Financeiro',
    description: 'Acessa dados de lançamento financeiro',
    mimeType: 'application/json',
    handler: async (uri, params) => {
      const id = parseInt(params.id, 10);

      const { actionBuscarLancamento } = await import('@/features/financeiro/actions');

      const result = await actionBuscarLancamento(id);

      if (!result.success || !result.data) {
        throw new Error(`Lançamento ${id} não encontrado`);
      }

      return jsonResourceResult(uri, result.data, {
        tipo: result.data.tipo,
        valor: result.data.valor,
        status: result.data.status,
        vencimento: result.data.data_vencimento,
      });
    },
  });

  // =========================================================================
  // LISTAGENS
  // =========================================================================

  registerMcpResource({
    uri: 'sinesys://processos',
    name: 'Lista de Processos',
    description: 'Lista processos ativos',
    mimeType: 'application/json',
    handler: async (uri) => {
      const { actionListarProcessos } = await import('@/features/processos/actions');

      const result = await actionListarProcessos({ limite: 50 });

      if (!result.success) {
        throw new Error('Erro ao listar processos');
      }

      return jsonResourceResult(uri, result.data, {
        total: result.data?.total || 0,
      });
    },
  });

  registerMcpResource({
    uri: 'sinesys://clientes',
    name: 'Lista de Clientes',
    description: 'Lista clientes cadastrados',
    mimeType: 'application/json',
    handler: async (uri) => {
      const { actionListarClientes } = await import('@/features/partes');

      const result = await actionListarClientes({ limite: 50 });

      if (!result.success) {
        throw new Error('Erro ao listar clientes');
      }

      return jsonResourceResult(uri, result.data, {
        total: result.data?.total || 0,
      });
    },
  });

  console.log('[MCP Resources] Resources registrados com sucesso');
}
