/**
 * Funções para buscar dados reais de expedientes para o calendário
 * Usa serviços do backend diretamente (Server Component)
 */

import { expedientesToEvents } from './adapters/expediente-to-event.adapter';
import type { IEvent, IUser } from '@/components/interfaces';
import type { TEventColor } from '@/components/types';
import { COLORS } from '@/components/constants';
import type { ListarPendentesParams } from '@/backend/types/expedientes/types';
import { obterPendentes } from '@/backend/expedientes/services/listar-pendentes.service';
import { obterUsuarios } from '@/backend/usuarios/services/usuarios/listar-usuarios.service';
import { listarTiposExpedientes } from '@/backend/tipos-expedientes/services/tipos-expedientes/listar-tipos-expedientes.service';
import type { ListarTiposExpedientesParams } from '@/backend/types/tipos-expedientes/types';

/**
 * Busca expedientes usando serviços do backend e converte para eventos do calendário
 */
export async function getExpedientesEvents(
	params?: {
		dataInicio?: string;
		dataFim?: string;
		responsavelId?: number;
		baixado?: boolean;
		limite?: number;
	}
): Promise<IEvent[]> {
	try {
		// Construir parâmetros para o serviço
		const listarParams: ListarPendentesParams = {
			pagina: 1,
			limite: params?.limite || 1000,
		};

		if (params?.dataInicio) {
			listarParams.data_prazo_legal_inicio = params.dataInicio;
		}
		if (params?.dataFim) {
			listarParams.data_prazo_legal_fim = params.dataFim;
		}
		if (params?.responsavelId !== undefined) {
			listarParams.responsavel_id =
				params.responsavelId === null ? null : params.responsavelId;
		}
		if (params?.baixado !== undefined) {
			listarParams.baixado = params.baixado;
		}

		// Buscar expedientes usando o serviço diretamente
		const resultado = await obterPendentes(listarParams);

		// Verificar se é resultado agrupado ou normal
		if ('grupos' in resultado) {
			// Resultado agrupado - não esperado aqui, retornar vazio
			return [];
		}

		const expedientes = resultado.pendentes || [];

		// Buscar usuários e tipos de expedientes em paralelo
		const [usuariosResult, tiposResult] = await Promise.all([
			obterUsuarios({ ativo: true, limite: 100 }),
			listarTiposExpedientes({ limite: 100 } as ListarTiposExpedientesParams),
		]);

		const usuarios = usuariosResult.usuarios || [];
		const tiposExpedientes = tiposResult.tipos_expedientes || [];

		// Converter expedientes para eventos
		return expedientesToEvents(
			expedientes,
			COLORS as TEventColor[],
			usuarios,
			tiposExpedientes
		);
	} catch (error) {
		console.error('Erro ao buscar expedientes:', error);
		return [];
	}
}

/**
 * Busca usuários usando serviços do backend e converte para formato do calendário
 */
export async function getExpedientesUsers(): Promise<IUser[]> {
	try {
		const resultado = await obterUsuarios({ ativo: true, limite: 100 });
		const usuarios = resultado.usuarios || [];

		return usuarios.map((usuario) => ({
			id: usuario.id.toString(),
			name: usuario.nomeExibicao,
			picturePath: null,
		}));
	} catch (error) {
		console.error('Erro ao buscar usuários:', error);
		return [];
	}
}

