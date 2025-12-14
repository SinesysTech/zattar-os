"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ConsultaSinesysResponse } from '../types/sinesys';

interface DashboardContextType {
  data: ConsultaSinesysResponse | null;
  isLoading: boolean;
  error: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const cpf = searchParams.get('cpf');

  const [data, setData] = useState<ConsultaSinesysResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!cpf) {
        setError('CPF não fornecido na URL.');
        setData(null);
        setIsLoading(false);
        return;
      }

      // Começa o processo de carregamento para um CPF novo/alterado
      setIsLoading(true);
      setError(null);

      const cacheKey = `sinesys-data-${cpf}`;

      try {
        // 1. Verifica dados em cache
        const cachedDataJSON = localStorage.getItem(cacheKey);
        if (cachedDataJSON) {
          console.log(`[Cache] Encontrado dados para o CPF ${cpf}.`);
          try {
            const cachedData = JSON.parse(cachedDataJSON);
            setData(cachedData);
            setIsLoading(false); // Para de carregar, temos os dados
            return; // Sai com sucesso
          } catch (parseError) {
            console.error('[Cache] Falha ao parsear dados do cache. Limpando cache.', parseError);
            localStorage.removeItem(cacheKey); // Remove dados corrompidos
          }
        }

        // 2. Se não houver cache ou o cache estava corrompido, busca na API
        console.log(`[API] Cache miss para o CPF ${cpf}. Buscando na API.`);
        const response = await fetch('/api/consulta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('[API] Erro na resposta da API:', result);
          throw new Error(
            result.error ||
            result.message ||
            `Erro ao consultar CPF: ${response.status} ${response.statusText}`
          );
        }

        const responseData = result as ConsultaSinesysResponse;

        // Validação básica: deve ter pelo menos a chave 'processos'
        if (!responseData || !responseData.processos) {
          console.warn('[API] Resposta da API não tem estrutura válida:', responseData);
          throw new Error('A API retornou uma resposta inválida.');
        }

        setData(responseData);

        // 3. Salva dados válidos no cache
        if (responseData) {
          localStorage.setItem(cacheKey, JSON.stringify(responseData));
          console.log(`[Cache] Resposta da API salva para o CPF ${cpf}.`);
        }
      } catch (err: unknown) {
        console.error(`[Erro] Falha ao carregar dados para o CPF ${cpf}:`, err);
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar os dados';
        setError(errorMessage);
        setData(null);

        // Se for um erro de autenticação, limpa o cache para forçar nova autenticação
        if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
          console.error('[API] Erro de autenticação - Limpando cache de autenticação');
          localStorage.removeItem(cacheKey);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [cpf]); // Roda novamente apenas se o CPF mudar

  return (
    <DashboardContext.Provider value={{ data, isLoading, error }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard deve ser usado dentro de um DashboardProvider');
  }
  return context;
}
