import { z } from 'zod';
import { Result, ok, err } from 'neverthrow';
import {
  Audiencia,
  createAudienciaSchema,
  updateAudienciaSchema,
  ListarAudienciasParams,
  StatusAudiencia,
} from './domain';
import { AudienciasRepository } from './repository';
import { PaginatedResponse } from '@/core/types';

export class AudienciasService {
  constructor(private repository: AudienciasRepository) {}

  async criarAudiencia(input: z.infer<typeof createAudienciaSchema>): Promise<Result<Audiencia, z.ZodError | Error>> {
    const validation = createAudienciaSchema.safeParse(input);
    if (!validation.success) {
      return err(validation.error);
    }

    try {
      const { processoId, tipoAudienciaId } = validation.data;

      const processoExistsResult = await this.repository.processoExists(processoId);
      if (processoExistsResult.isErr() || !processoExistsResult.value) {
        return err(new Error('Processo não encontrado.'));
      }

      if (tipoAudienciaId) {
        const tipoExistsResult = await this.repository.tipoAudienciaExists(tipoAudienciaId);
        if (tipoExistsResult.isErr() || !tipoExistsResult.value) {
          return err(new Error('Tipo de audiência não encontrado.'));
        }
      }

      const result = await this.repository.saveAudiencia(validation.data);
      return result;
    } catch (e) {
      console.error(e);
      return err(new Error('Erro ao criar audiência.'));
    }
  }

  async buscarAudiencia(id: number): Promise<Result<Audiencia | null, Error>> {
    if (id <= 0) {
      return err(new Error('ID inválido.'));
    }
    return this.repository.findAudienciaById(id);
  }

  async listarAudiencias(params: ListarAudienciasParams): Promise<Result<PaginatedResponse<Audiencia>, Error>> {
    const sanitizedParams: ListarAudienciasParams = {
      ...params,
      pagina: params.pagina && params.pagina > 0 ? params.pagina : 1,
      limite: params.limite && params.limite > 0 && params.limite <= 100 ? params.limite : 10,
      ordenarPor: params.ordenarPor || 'data_inicio',
      ordem: params.ordem || 'asc',
    };
    return this.repository.findAllAudiencias(sanitizedParams);
  }

  async atualizarAudiencia(id: number, input: z.infer<typeof updateAudienciaSchema>): Promise<Result<Audiencia, z.ZodError | Error>> {
    const validation = updateAudienciaSchema.safeParse(input);
    if (!validation.success) {
      return err(validation.error);
    }
    
    try {
      const audienciaExistenteResult = await this.repository.findAudienciaById(id);
      if (audienciaExistenteResult.isErr() || !audienciaExistenteResult.value) {
        return err(new Error('Audiência não encontrada.'));
      }
      
      const { processoId, tipoAudienciaId } = validation.data;

      if (processoId) {
        const processoExistsResult = await this.repository.processoExists(processoId);
        if (processoExistsResult.isErr() || !processoExistsResult.value) {
          return err(new Error('Processo não encontrado.'));
        }
      }

      if (tipoAudienciaId) {
        const tipoExistsResult = await this.repository.tipoAudienciaExists(tipoAudienciaId);
        if (tipoExistsResult.isErr() || !tipoExistsResult.value) {
          return err(new Error('Tipo de audiência não encontrado.'));
        }
      }

      const result = await this.repository.updateAudiencia(id, validation.data, audienciaExistenteResult.value);
      return result;

    } catch(e) {
      console.error(e);
      return err(new Error('Erro ao atualizar audiência.'));
    }
  }

  async atualizarStatusAudiencia(id: number, status: StatusAudiencia, statusDescricao?: string, userId?: number): Promise<Result<Audiencia, Error>> {
    if (!Object.values(StatusAudiencia).includes(status)) {
      return err(new Error('Status inválido.'));
    }

    const audienciaExistenteResult = await this.repository.findAudienciaById(id);
    if (audienciaExistenteResult.isErr() || !audienciaExistenteResult.value) {
      return err(new Error('Audiência não encontrada.'));
    }
    
    // TODO: Log the user who made the change if a logging system exists
    // logService.log(`User ${userId} changed status of audiencia ${id} to ${status}`);

    return this.repository.atualizarStatus(id, status, statusDescricao);
  }
}
