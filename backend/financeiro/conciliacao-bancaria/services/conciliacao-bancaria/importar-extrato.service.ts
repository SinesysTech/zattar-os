import { parseExtrato } from '../../parsers';
import {
  validarImportarExtratoDTO,
  type ImportarExtratoDTO,
  type ImportarExtratoResponse,
} from '@/backend/types/financeiro/conciliacao-bancaria.types';
import { importarTransacoes } from '../persistence/conciliacao-bancaria-persistence.service';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { TAMANHO_MAXIMO_ARQUIVO, EXTENSOES_PERMITIDAS } from '@/backend/types/financeiro/conciliacao-bancaria.types';

const validarArquivo = (dto: ImportarExtratoDTO) => {
  const extensao = dto.nomeArquivo.toLowerCase().slice(dto.nomeArquivo.lastIndexOf('.'));
  if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
    throw new Error('Extens\u00e3o de arquivo n\u00e3o permitida');
  }

  const tamanho = Buffer.byteLength(dto.arquivo as Buffer);
  if (tamanho <= 0 || tamanho > TAMANHO_MAXIMO_ARQUIVO) {
    throw new Error('Arquivo vazio ou maior que o limite permitido (10MB)');
  }
};

const normalizarBuffer = (arquivo: Buffer | ArrayBuffer): Buffer => {
  if (Buffer.isBuffer(arquivo)) {
    return arquivo;
  }
  return Buffer.from(arquivo);
};

export const importarExtrato = async (
  dto: ImportarExtratoDTO,
  usuarioId: number
): Promise<ImportarExtratoResponse> => {
  if (!validarImportarExtratoDTO(dto)) {
    throw new Error('Dados de importa\u00e7\u00e3o inv\u00e1lidos');
  }

  validarArquivo(dto);

  const buffer = normalizarBuffer(dto.arquivo);

  const supabase = createServiceClient();
  const { data: conta, error: erroConta } = await supabase
    .from('contas_bancarias')
    .select('id, ativa')
    .eq('id', dto.contaBancariaId)
    .single();

  if (erroConta || !conta) {
    throw new Error('Conta banc\u00e1ria n\u00e3o encontrada');
  }

  if (conta.ativa === false) {
    throw new Error('Conta banc\u00e1ria inativa');
  }

  const transacoes = await parseExtrato(buffer, dto.tipoArquivo, dto.configCSV);

  return importarTransacoes(dto.contaBancariaId, transacoes, dto.nomeArquivo, usuarioId);
};
