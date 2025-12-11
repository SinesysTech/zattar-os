// Serviço de logs estruturado para operações de captura
// Registra informações sobre inserções, atualizações e registros não alterados

export type TipoEntidade = 'acervo' | 'audiencias' | 'expedientes' | 'auth' | 'partes' | 'timeline';

export interface LogRegistroNaoAtualizado {
  tipo: 'nao_atualizado';
  entidade: TipoEntidade;
  id_pje: number;
  trt: string;
  grau: string;
  numero_processo: string;
  motivo: 'registro_identico';
}

export interface LogRegistroAtualizado {
  tipo: 'atualizado';
  entidade: TipoEntidade;
  id_pje: number;
  trt: string;
  grau: string;
  numero_processo: string;
  campos_alterados: string[];
}

export interface LogRegistroInserido {
  tipo: 'inserido';
  entidade: TipoEntidade;
  id_pje: number;
  trt: string;
  grau: string;
  numero_processo: string;
}

export interface LogErro {
  tipo: 'erro';
  entidade: TipoEntidade;
  erro: string;
  contexto?: Record<string, unknown>;
}

export type LogEntry =
  | LogRegistroNaoAtualizado
  | LogRegistroAtualizado
  | LogRegistroInserido
  | LogErro;

class CaptureLogService {
  private logs: LogEntry[] = [];

  /**
   * Registra um log de registro não atualizado (sem mudanças)
   */
  logNaoAtualizado(
    entidade: TipoEntidade,
    idPje: number,
    trt: string,
    grau: string,
    numeroProcesso: string
  ): void {
    this.logs.push({
      tipo: 'nao_atualizado',
      entidade,
      id_pje: idPje,
      trt,
      grau,
      numero_processo: numeroProcesso,
      motivo: 'registro_identico',
    });
  }

  /**
   * Registra um log de registro atualizado (com mudanças)
   */
  logAtualizado(
    entidade: TipoEntidade,
    idPje: number,
    trt: string,
    grau: string,
    numeroProcesso: string,
    camposAlterados: string[]
  ): void {
    this.logs.push({
      tipo: 'atualizado',
      entidade,
      id_pje: idPje,
      trt,
      grau,
      numero_processo: numeroProcesso,
      campos_alterados: camposAlterados,
    });
  }

  /**
   * Registra um log de registro inserido (novo)
   */
  logInserido(
    entidade: TipoEntidade,
    idPje: number,
    trt: string,
    grau: string,
    numeroProcesso: string
  ): void {
    this.logs.push({
      tipo: 'inserido',
      entidade,
      id_pje: idPje,
      trt,
      grau,
      numero_processo: numeroProcesso,
    });
  }

  /**
   * Registra um erro durante a persistência
   */
  logErro(
    entidade: TipoEntidade,
    erro: string,
    contexto?: Record<string, unknown>
  ): void {
    this.logs.push({
      tipo: 'erro',
      entidade,
      erro,
      contexto,
    });
  }

  /**
   * Retorna todos os logs acumulados
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Retorna os logs acumulados e limpa o buffer
   */
  consumirLogs(): LogEntry[] {
    const logs = [...this.logs];
    this.limpar();
    return logs;
  }

  /**
   * Retorna estatísticas dos logs
   */
  getEstatisticas(): {
    total: number;
    inseridos: number;
    atualizados: number;
    naoAtualizados: number;
    erros: number;
  } {
    return {
      total: this.logs.length,
      inseridos: this.logs.filter((l) => l.tipo === 'inserido').length,
      atualizados: this.logs.filter((l) => l.tipo === 'atualizado').length,
      naoAtualizados: this.logs.filter((l) => l.tipo === 'nao_atualizado')
        .length,
      erros: this.logs.filter((l) => l.tipo === 'erro').length,
    };
  }

  /**
   * Limpa todos os logs
   */
  limpar(): void {
    this.logs = [];
  }

  /**
   * Imprime resumo dos logs no console
   */
  imprimirResumo(): void {
    const stats = this.getEstatisticas();
    console.log('📊 Resumo da persistência:', {
      inseridos: stats.inseridos,
      atualizados: stats.atualizados,
      naoAtualizados: stats.naoAtualizados,
      erros: stats.erros,
      total: stats.total,
    });

    // Imprimir detalhes dos erros se houver
    const erros = this.logs.filter((l) => l.tipo === 'erro');
    if (erros.length > 0) {
      console.error('❌ Erros durante a persistência:', erros);
    }
  }
}

// Instância singleton para uso global
export const captureLogService = new CaptureLogService();

