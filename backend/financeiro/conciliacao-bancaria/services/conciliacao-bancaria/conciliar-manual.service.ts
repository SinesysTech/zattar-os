import {
  validarConciliarManualDTO,
  type ConciliarManualDTO,
  type ConciliacaoBancaria,
} from '@/backend/types/financeiro/conciliacao-bancaria.types';
import { conciliarManualPersistence } from '../persistence/conciliacao-bancaria-persistence.service';

export const conciliarManual = async (
  dto: ConciliarManualDTO,
  usuarioId: number
): Promise<ConciliacaoBancaria> => {
  if (!validarConciliarManualDTO(dto)) {
    throw new Error('Dados de concilia\u00e7\u00e3o inv\u00e1lidos');
  }

  return conciliarManualPersistence(dto, usuarioId);
};
