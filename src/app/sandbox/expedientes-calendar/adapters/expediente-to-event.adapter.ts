/**
 * Adaptador para converter Expediente (domain) para IEvent do calendário
 */

import type { Expediente } from '@/features/expedientes/domain';
import type { IEvent, IUser } from '@/components/calendar/interfaces';
import type { TEventColor } from '@/components/calendar/types';
import type { Usuario } from '@/features/usuarios';
import type { TipoExpediente } from '@/features/tipos-expedientes';

/**
 * Mapeia tipo_expediente_id para cor do evento
 * Usa módulo para garantir que sempre tenha uma cor válida
 */
export function getColorByTipoExpediente(
	tipoExpedienteId: number | null,
	colors: TEventColor[]
): TEventColor {
	if (!tipoExpedienteId) {
		return colors[0]; // Cor padrão (blue)
	}
	const index = (tipoExpedienteId - 1) % colors.length;
	return colors[index];
}

/**
 * Converte Usuario para IUser
 */
export function usuarioToIUser(usuario: Usuario): IUser {
	return {
		id: usuario.id.toString(),
		name: usuario.nomeExibicao,
		picturePath: null, // TODO: Adicionar foto do usuário se disponível
	};
}

/**
 * Converte Expediente para IEvent
 * 
 * Mapeamento:
 * - id: expediente.id
 * - startDate: dataPrazoLegalParte (ou dataCriacaoExpediente se não houver prazo)
 * - endDate: mesma data (evento de um dia)
 * - title: número do processo + classe judicial
 * - color: baseado em tipoExpedienteId
 * - description: informações do expediente formatadas
 * - user: responsável (ou usuário padrão se não houver)
 */
export function expedienteToEvent(
	expediente: Expediente,
	colors: TEventColor[],
	usuarios: Usuario[],
	tiposExpedientes: TipoExpediente[]
): IEvent {
	// Data principal: dataPrazoLegalParte ou dataCriacaoExpediente
	const dataPrincipal =
		expediente.dataPrazoLegalParte ||
		expediente.dataCriacaoExpediente ||
		expediente.createdAt;

	// Garantir que é uma data válida
	const startDate = new Date(dataPrincipal);
	const endDate = new Date(startDate); // Evento de um dia

	// Título: classe judicial + número do processo (formato: "CLASSE JUDICIAL NÚMERO DO PROCESSO")
	const titulo = expediente.classeJudicial
		? `${expediente.classeJudicial} ${expediente.numeroProcesso}`
		: expediente.numeroProcesso;

	// Cor baseada no tipo de expediente
	const color = getColorByTipoExpediente(
		expediente.tipoExpedienteId,
		colors
	);

	// Descrição formatada com informações do expediente
	const tipoExpediente = tiposExpedientes.find(
		(t) => t.id === expediente.tipoExpedienteId
	);
	const responsavel = usuarios.find(
		(u) => u.id === expediente.responsavelId
	);

	const descricaoParts: string[] = [];

	// Adicionar metadados no início (para uso interno)
	if (expediente.tipoExpedienteId) {
		descricaoParts.push(`__TIPO_ID__:${expediente.tipoExpedienteId}`);
	}
	if (expediente.responsavelId) {
		descricaoParts.push(`__RESPONSAVEL_ID__:${expediente.responsavelId}`);
	}

	// Informações visíveis
	if (tipoExpediente) {
		descricaoParts.push(`Tipo: ${tipoExpediente.tipo_expediente}`);
	}
	if (responsavel) {
		descricaoParts.push(`Responsável: ${responsavel.nomeExibicao}`);
	}
	if (expediente.nomeParteAutora) {
		descricaoParts.push(`Parte Autora: ${expediente.nomeParteAutora}`);
	}
	if (expediente.nomeParteRe) {
		descricaoParts.push(`Parte Ré: ${expediente.nomeParteRe}`);
	}
	if (expediente.descricaoOrgaoJulgador) {
		descricaoParts.push(`Órgão: ${expediente.descricaoOrgaoJulgador}`);
	}
	if (expediente.descricaoArquivos) {
		descricaoParts.push(`Descrição: ${expediente.descricaoArquivos}`);
	}
	if (expediente.observacoes) {
		descricaoParts.push(`Observações: ${expediente.observacoes}`);
	}

	const description = descricaoParts.join('\n') || 'Sem descrição';

	// Usuário: responsável ou usuário padrão
	const user = responsavel
		? usuarioToIUser(responsavel)
		: {
			id: '0',
			name: 'Sem responsável',
			picturePath: null,
		};

	return {
		id: expediente.id,
		startDate: startDate.toISOString(),
		endDate: endDate.toISOString(),
		title: titulo,
		color,
		description,
		user,
	};
}

/**
 * Converte array de Expediente para array de IEvent
 */
export function expedientesToEvents(
	expedientes: Expediente[],
	colors: TEventColor[],
	usuarios: Usuario[],
	tiposExpedientes: TipoExpediente[]
): IEvent[] {
	return expedientes
		.filter((exp) => {
			// Filtrar apenas expedientes com dataPrazoLegalParte válida
			// ou dataCriacaoExpediente válida
			return (
				exp.dataPrazoLegalParte ||
				exp.dataCriacaoExpediente ||
				exp.createdAt
			);
		})
		.map((exp) => expedienteToEvent(exp, colors, usuarios, tiposExpedientes));
}

