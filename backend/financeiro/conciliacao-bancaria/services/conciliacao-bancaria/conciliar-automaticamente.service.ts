import type {
  ConciliarAutomaticaDTO,
  ConciliacaoResult,
} from '@/backend/types/financeiro/conciliacao-bancaria.types';
import { conciliarAutomaticamente as conciliarAutoMatching } from '../matching/matching-automatico.service';

export const conciliarAutomaticamente = async (
  dto: ConciliarAutomaticaDTO
): Promise<ConciliacaoResult[]> => {
  return conciliarAutoMatching(dto);
};
