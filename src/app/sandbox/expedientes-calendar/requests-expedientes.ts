/**
 * Funções para buscar dados reais de expedientes para o calendário
 * Usa serviços do backend diretamente (Server Component)
 */

import { expedientesToEvents } from './adapters/expediente-to-event.adapter';
import type { IEvent, IUser } from '@/components/calendar/interfaces';
import type { TEventColor } from '@/components/calendar/types';
import { COLORS } from '@/components/calendar/constants';
import type { ListarPendentesParams } from '@/features/expedientes/types';
import { obterPendentes } from '@/features/expedientes/service';
import { obterUsuarios } from '@/backend/usuarios/services/usuarios/listar-usuarios.service';
import { listar } from '@/features/tipos-expedientes';
import type { ListarTiposExpedientesParams } from '@/features/tipos-expedientes';

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
		const result = await obterPendentes(listarParams);

		if (!result.success) {
			console.error('Erro ao buscar expedientes:', result.error);
			return [];
		}

		const resultado = result.data;

		// Verificar se é resultado agrupado ou normal
		if ('grupos' in resultado) {
			// Resultado agrupado - não esperado aqui, retornar vazio
			return [];
		}

		const expedientes = resultado.pendentes || [];

		// Buscar usuários e tipos de expedientes em paralelo
		const [usuariosResult, tiposResult] = await Promise.all([
			obterUsuarios({ ativo: true, limite: 100 }),
			listar({ limite: 100 } as ListarTiposExpedientesParams),
		]);

		const usuarios = usuariosResult.usuarios || [];
		const tiposExpedientes = tiposResult.data || [];

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

