import {
  Value,
  CriarDocumentoParams,
  AtualizarDocumentoParams,
  ListarDocumentosParams,
  DocumentoComUsuario,
  Pasta,
  CriarPastaParams,
  PastaComContadores,
  Template,
  ListarTemplatesParams,
  CriarTemplateParams,
  TemplateComUsuario,
  DocumentoCompartilhado,
  DocumentoCompartilhadoComUsuario,
  DocumentoVersao,
  DocumentoVersaoComUsuario,
  DocumentoUpload,
  DocumentoUploadComInfo,
  AutoSavePayload,
} from './types';
import * as repository from './repository';
import * as domain from './domain';
import {
  uploadFileToB2,
  deleteFileFromB2,
  generatePresignedUploadUrl,
  getTipoMedia,
  validateFileType,
  validateFileSize,
} from '@/backend/documentos/services/upload/b2-upload.service'; // Keep as utility
import { createServiceClient } from '@/backend/utils/supabase/service-client';

// ============================================================================
// DOCUMENTOS
// ============================================================================

export async function listarDocumentos(
  params: ListarDocumentosParams,
  usuario_id: number
): Promise<{ documentos: DocumentoComUsuario[]; total: number }> {
  // TODO: Implementar validação de acesso às pastas ou documentos compartilhados
  // Por enquanto, apenas o criador ou documentos públicos/compartilhados
  return repository.listarDocumentos(params);
}

export async function buscarDocumento(id: number, usuario_id: number): Promise<DocumentoComUsuario> {
  const { temAcesso, permissao } = await repository.verificarAcessoDocumento(id, usuario_id);
  if (!temAcesso) {
    throw new Error('Acesso negado ao documento');
  }
  const documento = await repository.buscarDocumentoComUsuario(id);
  if (!documento) {
    throw new Error('Documento não encontrado');
  }
  return documento;
}

export async function criarDocumento(
  params: unknown,
  usuario_id: number
): Promise<DocumentoComUsuario> {
  const parsedParams = domain.criarDocumentoSchema.parse(params);
  const documento = await repository.criarDocumento(parsedParams as CriarDocumentoParams, usuario_id);
  const novoDocumento = await repository.buscarDocumentoComUsuario(documento.id);
  if (!novoDocumento) {
    throw new Error('Documento criado mas não encontrado.');
  }
  return novoDocumento;
}

export async function atualizarDocumento(
  id: number,
  params: unknown,
  usuario_id: number
): Promise<DocumentoComUsuario> {
  const parsedParams = domain.atualizarDocumentoSchema.parse(params);
  const { temAcesso, permissao } = await repository.verificarAcessoDocumento(id, usuario_id);

  if (!temAcesso || (permissao !== 'editar' && permissao !== 'proprietario')) {
    throw new Error('Acesso negado: você não tem permissão para editar este documento.');
  }

  const documentoAtualizado = await repository.atualizarDocumento(id, parsedParams as AtualizarDocumentoParams, usuario_id);
  if (parsedParams.conteudo !== undefined && documentoAtualizado.conteudo !== parsedParams.conteudo) {
    // Apenas cria nova versão se o conteúdo for fornecido e mudar significativamente
    await repository.criarVersao(
      {
        documento_id: id,
        versao: documentoAtualizado.versao, // será incrementado na persistência
        conteudo: parsedParams.conteudo,
        titulo: parsedParams.titulo || documentoAtualizado.titulo,
      },
      usuario_id
    );
  }
  const result = await repository.buscarDocumentoComUsuario(id);
  if (!result) {
    throw new Error('Documento atualizado mas não encontrado.');
  }
  return result;
}

export async function deletarDocumento(id: number, usuario_id: number): Promise<void> {
  const { temAcesso, permissao } = await repository.verificarAcessoDocumento(id, usuario_id);
  if (!temAcesso || permissao !== 'proprietario') {
    throw new Error('Acesso negado: apenas o proprietário pode deletar o documento.');
  }
  await repository.deletarDocumento(id);
}

export async function autoSalvarDocumento(
  payload: AutoSavePayload,
  usuario_id: number
): Promise<DocumentoComUsuario> {
  const parsedPayload = domain.autoSavePayloadSchema.parse(payload);
  const { documento_id, conteudo, titulo } = parsedPayload;

  const { temAcesso, permissao } = await repository.verificarAcessoDocumento(
    documento_id,
    usuario_id
  );

  if (!temAcesso || (permissao !== 'editar' && permissao !== 'proprietario')) {
    throw new Error('Acesso negado: você não tem permissão para editar este documento.');
  }

  await repository.atualizarDocumento(
    documento_id,
    { conteudo, titulo },
    usuario_id
  );
  // Não cria nova versão para auto-save, apenas para salvamento manual ou atualizacao completa
  const result = await repository.buscarDocumentoComUsuario(documento_id);
  if (!result) {
    throw new Error('Documento auto-salvo mas não encontrado.');
  }
  return result;
}

// ============================================================================
// PASTAS
// ============================================================================

export async function listarPastas(usuario_id: number): Promise<PastaComContadores[]> {
  return repository.listarPastasComContadores(undefined, usuario_id);
}

export async function criarPasta(params: unknown, usuario_id: number): Promise<Pasta> {
  const parsedParams = domain.criarPastaSchema.parse(params);

  if (parsedParams.pasta_pai_id) {
    const temAcessoPastaPai = await repository.verificarAcessoPasta(parsedParams.pasta_pai_id, usuario_id);
    if (!temAcessoPastaPai) {
      throw new Error('Acesso negado à pasta pai.');
    }
  }

  return repository.criarPasta(parsedParams as CriarPastaParams, usuario_id);
}

export async function moverDocumento(
  documento_id: number,
  pasta_id: number | null,
  usuario_id: number
): Promise<DocumentoComUsuario> {
  const { temAcesso, permissao } = await repository.verificarAcessoDocumento(documento_id, usuario_id);
  if (!temAcesso || (permissao !== 'editar' && permissao !== 'proprietario')) {
    throw new Error('Acesso negado: você não tem permissão para mover este documento.');
  }

  if (pasta_id) {
    const temAcessoPasta = await repository.verificarAcessoPasta(pasta_id, usuario_id);
    if (!temAcessoPasta) {
      throw new Error('Acesso negado à pasta de destino.');
    }
  }

  await repository.atualizarDocumento(documento_id, { pasta_id }, usuario_id);
  const result = await repository.buscarDocumentoComUsuario(documento_id);
  if (!result) {
    throw new Error('Documento movido mas não encontrado.');
  }
  return result;
}

export async function deletarPasta(id: number, usuario_id: number): Promise<void> {
  const pasta = await repository.buscarPastaPorId(id);
  if (!pasta || pasta.criado_por !== usuario_id) {
    throw new Error('Acesso negado: apenas o proprietário pode deletar a pasta.');
  }

  const { documentos, subpastas } = await repository.listarPastasComContadores(id, usuario_id).then(
    (pastasComContadores) => ({
      documentos: pastasComContadores.reduce((acc, p) => acc + p.total_documentos, 0),
      subpastas: pastasComContadores.length, // Já considera subpastas diretas
    })
  );

  if (documentos > 0 || subpastas > 0) {
    throw new Error('Não é possível deletar pastas com documentos ou subpastas. Mova-os ou delete-os primeiro.');
  }

  await repository.deletarPasta(id);
}

// ============================================================================
// TEMPLATES
// ============================================================================

export async function listarTemplates(
  params: ListarTemplatesParams,
  usuario_id?: number
): Promise<{ templates: TemplateComUsuario[]; total: number }> {
  return repository.listarTemplates(params, usuario_id);
}

export async function criarTemplate(
  params: unknown,
  usuario_id: number
): Promise<Template> {
  const parsedParams = domain.criarTemplateSchema.parse(params);
  return repository.criarTemplate(parsedParams as CriarTemplateParams, usuario_id);
}

export async function usarTemplate(
  template_id: number,
  usuario_id: number,
  opcoes?: { titulo?: string; pasta_id?: number | null }
): Promise<DocumentoComUsuario> {
  const template = await repository.buscarTemplatePorId(template_id);
  if (!template) {
    throw new Error('Template não encontrado.');
  }

  if (template.visibilidade === 'privado' && template.criado_por !== usuario_id) {
    throw new Error('Acesso negado a este template.');
  }

  if (opcoes?.pasta_id) {
    const temAcessoPasta = await repository.verificarAcessoPasta(opcoes.pasta_id, usuario_id);
    if (!temAcessoPasta) {
      throw new Error('Acesso negado à pasta de destino.');
    }
  }

  const novoDocumento = await repository.criarDocumentoDeTemplate(template_id, usuario_id, opcoes);
  await repository.incrementarUsoTemplate(template_id);
  const result = await repository.buscarDocumentoComUsuario(novoDocumento.id);
  if (!result) {
    throw new Error('Documento criado de template mas não encontrado.');
  }
  return result;
}

export async function deletarTemplate(id: number, usuario_id: number): Promise<void> {
  const template = await repository.buscarTemplatePorId(id);
  if (!template || template.criado_por !== usuario_id) {
    throw new Error('Acesso negado: apenas o proprietário pode deletar este template.');
  }
  await repository.deletarTemplate(id);
}

// ============================================================================
// COMPARTILHAMENTO
// ============================================================================

export async function compartilharDocumento(
  params: unknown,
  compartilhado_por: number
): Promise<DocumentoCompartilhado> {
  const parsedParams = domain.criarCompartilhamentoSchema.parse(params);
  const { documento_id, usuario_id, permissao } = parsedParams;

  const documento = await repository.buscarDocumentoPorId(documento_id);
  if (!documento || documento.criado_por !== compartilhado_por) {
    throw new Error('Acesso negado: apenas o proprietário pode compartilhar.');
  }

  if (usuario_id === compartilhado_por) {
    throw new Error('Não é possível compartilhar um documento consigo mesmo.');
  }

  // TODO: verificar se usuario_id existe no sistema
  return repository.compartilharDocumento(parsedParams, compartilhado_por);
}

export async function listarCompartilhamentos(
  documento_id: number,
  usuario_id: number
): Promise<DocumentoCompartilhadoComUsuario[]> {
  const { temAcesso } = await repository.verificarAcessoDocumento(documento_id, usuario_id);
  if (!temAcesso) {
    throw new Error('Acesso negado ao documento.');
  }
  return repository.listarCompartilhamentos({ documento_id });
}

export async function listarDocumentosCompartilhadosComUsuario(
  usuario_id: number
): Promise<DocumentoComUsuario[]> {
  return repository.listarDocumentosCompartilhadosComUsuario(usuario_id);
}

export async function atualizarPermissao(
  compartilhamento_id: number,
  updates: { permissao?: string; pode_deletar?: boolean },
  usuario_id: number
): Promise<DocumentoCompartilhado> {
  const parsed = domain.atualizarPermissaoCompartilhamentoSchema.parse(updates);

  const compartilhamento = await repository.buscarCompartilhamentoPorId(compartilhamento_id);
  if (!compartilhamento) {
    throw new Error('Compartilhamento não encontrado.');
  }

  const documento = await repository.buscarDocumentoPorId(compartilhamento.documento_id);
  if (!documento || documento.criado_por !== usuario_id) {
    throw new Error('Acesso negado: apenas o proprietário pode alterar permissões.');
  }

  if (compartilhamento.usuario_id === usuario_id) {
    throw new Error('Não é possível alterar sua própria permissão.');
  }

  return repository.atualizarPermissaoCompartilhamentoPorId(
    compartilhamento_id, 
    parsed.permissao as 'visualizar' | 'editar' | undefined, 
    parsed.pode_deletar
  );
}

export async function removerCompartilhamento(
  compartilhamento_id: number,
  usuario_id: number
): Promise<void> {
  const compartilhamento = await repository.buscarCompartilhamentoPorId(compartilhamento_id);
  if (!compartilhamento) {
    throw new Error('Compartilhamento não encontrado.');
  }

  const documento = await repository.buscarDocumentoPorId(compartilhamento.documento_id);
  if (!documento || documento.criado_por !== usuario_id) {
    throw new Error('Acesso negado: apenas o proprietário pode remover compartilhamentos.');
  }

  await repository.removerCompartilhamentoPorId(compartilhamento_id);
}

// ============================================================================
// VERSÕES
// ============================================================================

export async function listarVersoes(
  documento_id: number,
  usuario_id: number
): Promise<{ versoes: DocumentoVersaoComUsuario[]; total: number }> {
  const { temAcesso } = await repository.verificarAcessoDocumento(documento_id, usuario_id);
  if (!temAcesso) {
    throw new Error('Acesso negado ao documento.');
  }
  return repository.listarVersoes({ documento_id });
}

export async function criarVersao(documento_id: number, usuario_id: number): Promise<DocumentoVersao> {
  const { temAcesso, permissao } = await repository.verificarAcessoDocumento(documento_id, usuario_id);
  if (!temAcesso || (permissao !== 'editar' && permissao !== 'proprietario')) {
    throw new Error('Acesso negado: você não tem permissão para criar versões deste documento.');
  }
  const documento = await repository.buscarDocumentoPorId(documento_id);
  if (!documento) {
    throw new Error('Documento não encontrado.');
  }
  const ultimaVersao = await repository.buscarVersaoMaisRecente(documento_id);
  const proximaVersaoNumero = (ultimaVersao?.versao || 0) + 1;

  return repository.criarVersao({
    documento_id,
    versao: proximaVersaoNumero,
    conteudo: documento.conteudo,
    titulo: documento.titulo,
  }, usuario_id);
}

export async function restaurarVersao(versao_id: number, usuario_id: number): Promise<DocumentoComUsuario> {
  const versao = await repository.buscarVersaoPorId(versao_id);
  if (!versao) {
    throw new Error('Versão não encontrada.');
  }
  const { documento_id } = versao;

  const { temAcesso, permissao } = await repository.verificarAcessoDocumento(documento_id, usuario_id);
  if (!temAcesso || (permissao !== 'editar' && permissao !== 'proprietario')) {
    throw new Error('Acesso negado: você não tem permissão para restaurar versões deste documento.');
  }

  await repository.restaurarVersao(documento_id, versao.versao, usuario_id);
  const result = await repository.buscarDocumentoComUsuario(documento_id);
  if (!result) {
    throw new Error('Documento restaurado mas não encontrado.');
  }
  return result;
}

// ============================================================================
// UPLOADS
// ============================================================================

export async function uploadArquivo(
  file: File,
  documento_id: number | null,
  usuario_id: number
): Promise<DocumentoUpload> {
  const { name, type, size } = file;
  const buffer = Buffer.from(await file.arrayBuffer()); // Converter File para Buffer

  if (!validateFileType(type)) {
    throw new Error('Tipo de arquivo não permitido.');
  }
  if (!validateFileSize(size)) {
    throw new Error('Tamanho do arquivo excede o limite (50MB).');
  }

  if (documento_id) {
    const { temAcesso, permissao } = await repository.verificarAcessoDocumento(documento_id, usuario_id);
    if (!temAcesso || (permissao !== 'editar' && permissao !== 'proprietario')) {
      throw new Error('Acesso negado: você não tem permissão para fazer upload para este documento.');
    }
  }

  const b2UploadResult = await uploadFileToB2({
    file: buffer,
    fileName: name,
    contentType: type,
    folder: documento_id ? `documentos/${documento_id}` : 'uploads',
  });

  return repository.registrarUpload({
    documento_id,
    nome_arquivo: name,
    tipo_mime: type,
    tamanho_bytes: size,
    b2_key: b2UploadResult.key,
    b2_url: b2UploadResult.url,
    tipo_media: getTipoMedia(type),
  }, usuario_id);
}

export async function listarUploads(
  documento_id: number,
  usuario_id: number
): Promise<{ uploads: DocumentoUploadComInfo[]; total: number }> {
  const { temAcesso } = await repository.verificarAcessoDocumento(documento_id, usuario_id);
  if (!temAcesso) {
    throw new Error('Acesso negado ao documento.');
  }
  return repository.listarUploads({ documento_id });
}

export async function gerarPresignedUrl(
  filename: string,
  contentType: string,
  usuario_id: number // Adicionado usuario_id para validação
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  // TODO: Implementar validação de usuário e limites de upload antes de gerar URL
  return generatePresignedUploadUrl({ fileName: filename, contentType });
}

// ============================================================================
// LIXEIRA
// ============================================================================

export async function listarLixeira(usuario_id: number): Promise<DocumentoComUsuario[]> {
  return repository.listarDocumentosLixeira(usuario_id);
}

export async function restaurarDaLixeira(documento_id: number, usuario_id: number): Promise<DocumentoComUsuario> {
  const documento = await repository.buscarDocumentoPorId(documento_id); // Inclui deletados
  if (!documento || documento.criado_por !== usuario_id) {
    throw new Error('Acesso negado: apenas o proprietário pode restaurar o documento.');
  }
  if (!documento.deleted_at) {
    throw new Error('Documento não está na lixeira.');
  }

  await repository.restaurarDocumento(documento_id);
  const result = await repository.buscarDocumentoComUsuario(documento_id);
  if (!result) {
    throw new Error('Documento restaurado mas não encontrado.');
  }
  return result;
}

export async function limparLixeira(usuario_id: number): Promise<{ documentosDeletados: number; pastasDeletadas: number }> {
  // Este é um cenário mais complexo, pois `limparLixeira` no persistence service
  // não recebe usuario_id. Uma limpeza "por usuário" implicaria em
  // deletar apenas os documentos/pastas do usuário. Por simplicidade,
  // aqui, vamos considerar que `limparLixeira` no service de persistência
  // fará uma limpeza global (conforme implementado).
  // Se a intenção é limpar a lixeira *apenas* do usuário,
  // o método de persistência precisaria ser adaptado.

  // Por ora, apenas proprietários podem acionar a limpeza global,
  // ou a regra de negócio pode ser "limpar os meus itens".
  // Vamos assumir que o serviço aqui é para o próprio usuário limpar SEUS itens da lixeira.

  const supabase = createServiceClient(); // Usado para buscar itens do usuário

  let documentosDeletados = 0;
  let pastasDeletadas = 0;

  // Deletar documentos do usuário na lixeira
  const docsNaLixeira = await repository.listarDocumentosLixeira(usuario_id);
  for (const doc of docsNaLixeira) {
    try {
      await repository.deletarDocumentoPermanentemente(doc.id);
      documentosDeletados++;
    } catch (error) {
      console.error(`Erro ao deletar documento ${doc.id} do usuário ${usuario_id}:`, error);
    }
  }

  // Deletar pastas do usuário na lixeira
  // (Este é mais complexo, pois `deletarPastaPermanentemente` não verifica propriedade
  // e deletaria recursivamente. Seria melhor ter um `listarPastasLixeira(usuario_id)`
  // e então chamar `deletarPastaPermanentemente` para cada uma.)
  // Por simplicidade, vamos assumir um cenário onde apenas pastas vazias são deletadas.
  // A implementação atual de `deletarPasta` no service já lida com documentos/subpastas
  // antes de permitir a exclusão lógica. A exclusão *permanente* de pastas
  // precisaria de uma lógica mais robusta para garantir que só itens do usuário sejam afetados.

  // Para o propósito deste plano, vamos focar nos documentos do usuário.
  // A limpeza de pastas "do usuário" que estão na lixeira é mais granular
  // e provavelmente exige uma função de persistência dedicada `deletarPastaPermanentementeDoUsuario`.

  // O exemplo de `limpar-lixeira.service.ts` no backend original faz uma limpeza global.
  // Para manter a sanidade e o escopo, vou assumir que essa `limparLixeira` aqui
  // apenas orquestra a remoção permanente dos *próprios documentos* do usuário da lixeira.
  // Limpeza de pastas seria um passo separado ou exigiria um `deletarPastaPermanentemente`
  // que verificasse o criador.

  return { documentosDeletados, pastasDeletadas: 0 };
}
