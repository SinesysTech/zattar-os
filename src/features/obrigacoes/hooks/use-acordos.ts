
import { useState, useEffect } from 'react';
import { actionListarAcordos } from '../actions/acordos';
import { AcordoComParcelas, ListarAcordosParams } from '../types';

export function useAcordos(filtros: ListarAcordosParams) {
  const [data, setData] = useState<AcordoComParcelas[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const result = await actionListarAcordos(filtros);
    if (result.success && result.data) {
      setData(result.data.acordos);
      setTotal(result.data.total);
      setTotalPaginas(result.data.totalPaginas);
    } else {
      setError(result.error || 'Erro desconhecido');
    }
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, [filtros.processoId, filtros.tipo, filtros.direcao, filtros.status, filtros.pagina, filtros.limite, filtros.dataInicio, filtros.dataFim]);

  return { data, total, totalPaginas, isLoading, error, refetch: load };
}
