import type { CriarClienteParams, CriarParteContrariaParams } from './partes';
import type { Pessoa } from '@/types/domain/pessoa';

export type PapelProcessual = 'CLIENTE' | 'PARTE_CONTRARIA';

export type CriarPessoaParams = (CriarClienteParams | CriarParteContrariaParams) & {
  papel_processual: PapelProcessual;
};

/**
 * @deprecated Use `Pessoa`
 */
export type Cliente = Pessoa;
export type ParteContraria = Pessoa;
