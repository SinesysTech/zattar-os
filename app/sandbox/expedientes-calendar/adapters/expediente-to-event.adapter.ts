/**
 * Adaptador para converter PendenteManifestacao para IEvent do calendário
 */

import type { PendenteManifestacao } from '@/backend/types/expedientes/types';
import type { IEvent, IUser } from '@/components/interfaces';
import type { TEventColor } from '@/components/types';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import type { TipoExpediente } from '@/backend/types/tipos-expedientes/types';

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
 * Converte PendenteManifestacao para IEvent
 * 
 * Mapeamento:
 * - id: expediente.id
 * - startDate: data_prazo_legal_parte (ou data_criacao_expediente se não houver prazo)
 * - endDate: mesma data (evento de um dia)
 * - title: número do processo + classe judicial
 * - color: baseado em tipo_expediente_id
 * - description: informações do expediente formatadas
 * - user: responsável (ou usuário padrão se não houver)
 */
export function expedienteToEvent(
	expediente: PendenteManifestacao,
	colors: TEventColor[],
	usuarios: Usuario[],
	tiposExpedientes: TipoExpediente[]
): IEvent {
	// Data principal: data_prazo_legal_parte ou data_criacao_expediente
	const dataPrincipal =
		expediente.data_prazo_legal_parte ||
		expediente.data_criacao_expediente ||
		expediente.created_at;

	// Garantir que é uma data válida
	const startDate = new Date(dataPrincipal);
	const endDate = new Date(startDate); // Evento de um dia

	// Título: classe judicial + número do processo (formato: "CLASSE JUDICIAL NÚMERO DO PROCESSO")
	const titulo = expediente.classe_judicial
		? `${expediente.classe_judicial} ${expediente.numero_processo}`
		: expediente.numero_processo;

	// Cor baseada no tipo de expediente
	const color = getColorByTipoExpediente(
		expediente.tipo_expediente_id,
		colors
	);

	// Descrição formatada com informações do expediente
	const tipoExpediente = tiposExpedientes.find(
		(t) => t.id === expediente.tipo_expediente_id
	);
	const responsavel = usuarios.find(
		(u) => u.id === expediente.responsavel_id
	);

	const descricaoParts: string[] = [];
	
	// Adicionar metadados no início (para uso interno)
	if (expediente.tipo_expediente_id) {
		descricaoParts.push(`__TIPO_ID__:${expediente.tipo_expediente_id}`);
	}
	if (expediente.responsavel_id) {
		descricaoParts.push(`__RESPONSAVEL_ID__:${expediente.responsavel_id}`);
	}
	
	// Informações visíveis
	if (tipoExpediente) {
		descricaoParts.push(`Tipo: ${tipoExpediente.tipo_expediente}`);
	}
	if (responsavel) {
		descricaoParts.push(`Responsável: ${responsavel.nomeExibicao}`);
	}
	if (expediente.nome_parte_autora) {
		descricaoParts.push(`Parte Autora: ${expediente.nome_parte_autora}`);
	}
	if (expediente.nome_parte_re) {
		descricaoParts.push(`Parte Ré: ${expediente.nome_parte_re}`);
	}
	if (expediente.descricao_orgao_julgador) {
		descricaoParts.push(`Órgão: ${expediente.descricao_orgao_julgador}`);
	}
	if (expediente.descricao_arquivos) {
		descricaoParts.push(`Descrição: ${expediente.descricao_arquivos}`);
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
 * Converte array de PendenteManifestacao para array de IEvent
 */
export function expedientesToEvents(
	expedientes: PendenteManifestacao[],
	colors: TEventColor[],
	usuarios: Usuario[],
	tiposExpedientes: TipoExpediente[]
): IEvent[] {
	return expedientes
		.filter((exp) => {
			// Filtrar apenas expedientes com data_prazo_legal_parte válida
			// ou data_criacao_expediente válida
			return (
				exp.data_prazo_legal_parte ||
				exp.data_criacao_expediente ||
				exp.created_at
			);
		})
		.map((exp) => expedienteToEvent(exp, colors, usuarios, tiposExpedientes));
}

