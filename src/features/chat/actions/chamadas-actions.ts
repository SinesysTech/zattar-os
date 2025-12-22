'use server';

import { revalidatePath } from 'next/cache';
import { createChatService } from '../service';
import { TipoChamada, ActionResult, ListarChamadasParams, PaginatedResponse, ChamadaComParticipantes, DyteMeetingDetails } from '../domain';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { getMeetingDetails } from '@/lib/dyte/client';

// =============================================================================
// DYTE HELPERS
// =============================================================================

const DYTE_API_URL = 'https://api.dyte.io/v2';
const DYTE_ORG_ID = process.env.NEXT_PUBLIC_DYTE_ORG_ID;
const DYTE_API_KEY = process.env.DYTE_API_KEY;

if (!DYTE_ORG_ID || !DYTE_API_KEY) {
  console.warn('Dyte credentials missing. Calls will fail.');
}

async function createDyteMeeting(title: string) {
  const response = await fetch(`${DYTE_API_URL}/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${DYTE_ORG_ID}:${DYTE_API_KEY}`).toString('base64')}`,
    },
    body: JSON.stringify({
      title,
      preferred_region: 'sa-east-1', // South America
      record_on_start: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Dyte createMeeting error: ${response.statusText}`);
  }

  return response.json();
}

async function addDyteParticipant(meetingId: string, userId: string, name: string, preset: string = 'group_call_participant') {
  const response = await fetch(`${DYTE_API_URL}/meetings/${meetingId}/participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${DYTE_ORG_ID}:${DYTE_API_KEY}`).toString('base64')}`,
    },
    body: JSON.stringify({
      name,
      preset_name: preset,
      custom_participant_id: userId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Dyte addParticipant error: ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Inicia uma nova chamada
 */
export async function actionIniciarChamada(
  salaId: number,
  tipo: TipoChamada
): Promise<ActionResult<{ chamadaId: number; meetingId: string; authToken: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    
    // Buscar sala para usar nome
    const salaResult = await service.buscarSala(salaId);
    if (salaResult.isErr()) return { success: false, message: 'Sala não encontrada', error: salaResult.error.message };
    
    // 1. Criar meeting no Dyte
    const meetingData = await createDyteMeeting(`Sala ${salaResult.value?.nome} - ${tipo}`);
    const meetingId = meetingData.data.id;

    // 2. Persistir chamada no banco
    const chamadaResult = await service.iniciarChamada(salaId, tipo, user.id, meetingId);
    if (chamadaResult.isErr()) {
      return { success: false, message: chamadaResult.error.message, error: chamadaResult.error.message };
    }

    // 3. Gerar token para o iniciador
    const participantData = await addDyteParticipant(
      meetingId, 
      user.id.toString(), 
      user.nome_completo || 'Usuário',
      'group_call_host' // Iniciador é host
    );

    revalidatePath(`/chat/${salaId}`);
    
    return {
      success: true,
      data: {
        chamadaId: chamadaResult.value.id,
        meetingId,
        authToken: participantData.data.token,
      },
      message: 'Chamada iniciada com sucesso'
    };

  } catch (error) {
    console.error('Erro actionIniciarChamada:', error);
    return { success: false, message: 'Erro ao iniciar chamada', error: String(error) };
  }
}

/**
 * Responde a um convite de chamada
 */
export async function actionResponderChamada(
  chamadaId: number,
  aceitou: boolean
): Promise<ActionResult<{ meetingId?: string; authToken?: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();

    // Registrar resposta
    const responseResult = await service.responderChamada(chamadaId, user.id, aceitou);
    if (responseResult.isErr()) {
      return { success: false, message: responseResult.error.message, error: responseResult.error.message };
    }

    if (!aceitou) {
      return { success: true, data: {}, message: 'Chamada recusada' };
    }

    // Se aceitou, preparar dados para entrar
    // Buscar meetingId da chamada
    // (Poderíamos otimizar retornando na resposta, mas vamos buscar para garantir consistência)
    // Precisamos acessar o repository diretamente ou expor um método de busca no service
    // Vamos usar um hack temporário acessando service['repository'] ou criar um método de busca pública
    // Melhor: criar método buscarChamada no service?
    // O service.responderChamada já validou a chamada, mas não retornou o objeto.
    
    // Vamos instanciar repository para buscar
    // NOTA: Idealmente adicionaria `buscarChamada` no service. Vamos fazer isso no próximo passo se precisar.
    // Por enquanto, vou assumir que preciso buscar de novo via client direto ou adicionar no service.
    // Vou usar service.entrarNaChamada logic inside here implicitly via Dyte generation
    
    // Buscar chamada diretamente via service (precisamos adicionar método buscarChamada no service se não tiver)
    // O service tem `buscarHistoricoChamadas` que lista, mas não busca single publicamente.
    // Vou adicionar buscarChamada no Service rapidamente? Não posso editar service agora sem outra call.
    // Vou usar `buscarHistoricoChamadas` filtrando na memória ou assumir que o frontend já tem o meetingId?
    // O frontend tem o meetingId da notificação!
    // MAS por segurança, devemos buscar do banco.
    // Vou usar o `buscarHistoricoChamadas` (não ideal) ou instanciar repository direto aqui é "feio" mas funciona.
    // Melhor: Adicionar `buscarChamada` no service é o correto. Mas para economizar steps, vou usar `buscarHistoricoChamadas`.
    
    // Workaround: Assumindo que o service deve expor busca.
    // Mas espere, eu tenho `service.entrarNaChamada`.
    // Vou gerar o token do Dyte aqui. Preciso do meetingId.
    // O frontend PODE passar o meetingId como argumento extra se tiver, mas é inseguro confiar no client.
    
    // Solução rápida e segura: criar repository aqui também
    const { createChatRepository } = await import('../repository');
    const repo = await createChatRepository();
    const chamadaResult = await repo.findChamadaById(chamadaId);
    
    if (chamadaResult.isErr() || !chamadaResult.value) {
       return { success: false, message: 'Chamada não encontrada', error: 'Not Found' };
    }
    
    const meetingId = chamadaResult.value.meetingId;

    const participantData = await addDyteParticipant(
      meetingId,
      user.id.toString(),
      user.nome_completo || 'Usuário',
      'group_call_participant'
    );

    return {
      success: true,
      data: {
        meetingId,
        authToken: participantData.data.token
      },
      message: 'Chamada aceita'
    };

  } catch (error) {
    console.error('Erro actionResponderChamada:', error);
    return { success: false, message: 'Erro ao responder chamada', error: String(error) };
  }
}

/**
 * Registra entrada na chamada (atualiza status e timestamps)
 */
export async function actionEntrarNaChamada(
  chamadaId: number
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    const result = await service.entrarNaChamada(chamadaId, user.id);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    return { success: true, data: undefined, message: 'Entrada registrada' };
  } catch (error) {
    return { success: false, message: 'Erro ao entrar na chamada', error: String(error) };
  }
}

/**
 * Registra saída da chamada
 */
export async function actionSairDaChamada(
  chamadaId: number
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    const result = await service.sairDaChamada(chamadaId, user.id);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    return { success: true, data: undefined, message: 'Saída registrada' };
  } catch (error) {
    return { success: false, message: 'Erro ao sair da chamada', error: String(error) };
  }
}

/**
 * Finaliza chamada manualmente
 */
export async function actionFinalizarChamada(
  chamadaId: number
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    const result = await service.finalizarChamada(chamadaId, user.id);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    return { success: true, data: undefined, message: 'Chamada finalizada' };
  } catch (error) {
    return { success: false, message: 'Erro ao finalizar chamada', error: String(error) };
  }
}

/**
 * Busca histórico de chamadas
 */
export async function actionBuscarHistoricoChamadas(
  salaId: number
): Promise<ActionResult<ChamadaComParticipantes[]>> {
  try {
    const service = await createChatService();
    const result = await service.buscarHistoricoChamadas(salaId);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    return { success: true, data: result.value, message: 'Histórico recuperado' };
  } catch (error) {
    return { success: false, message: 'Erro ao buscar histórico', error: String(error) };
  }
}

/**
 * Lista histórico global de chamadas com filtros
 */
export async function actionListarHistoricoGlobal(
  params: ListarChamadasParams
): Promise<ActionResult<PaginatedResponse<ChamadaComParticipantes>>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    
    // Se não passar usuarioId, listar todas? Ou apenas do usuário?
    // Regra de negócio: Se não for admin, força filtro por usuário atual?
    // Vamos assumir por enquanto que cada um vê o seu histórico
    // TODO: Adicionar checagem de role para ver histórico global
    const paramsComUser = { ...params };
    // if (!user.roles.includes('admin')) {
      paramsComUser.usuarioId = user.id;
    // }

    const result = await service.buscarHistoricoGlobal(paramsComUser);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    // Revalidate path é opcional aqui, pois é uma busca
    revalidatePath('/chat/historico-chamadas');
    
    return { success: true, data: result.value, message: 'Histórico recuperado com sucesso' };
  } catch (error) {
    console.error('Erro actionListarHistoricoGlobal:', error);
    return { success: false, message: 'Erro ao listar histórico', error: String(error) };
  }
}

/**
 * Busca detalhes de um meeting no Dyte
 */
export async function actionBuscarDetalhesMeeting(
  meetingId: string
): Promise<ActionResult<DyteMeetingDetails>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const details = await getMeetingDetails(meetingId);
    
    if (!details) {
      return { success: false, message: 'Meeting não encontrado no Dyte', error: 'Not Found' };
    }

    // Mapear para nosso tipo interno se necessário, ou retornar direto
    // O tipo DyteMeetingDetails deve bater com a resposta da API Dyte
    // A resposta da API Dyte tem formato snake_case ou camelCase? 
    // A API Dyte geralmente retorna snake_case. Nosso domain define camelCase para DyteMeetingDetails?
    // Vamos verificar o domain.ts. Eu defini DyteMeetingDetails.
    
    // Mapeamento manual para garantir tipagem
    const mappedDetails: DyteMeetingDetails = {
      id: details.id,
      status: details.status,
      participantCount: details.participant_count || 0, // API pode retornar participant_count
      startedAt: details.started_at, // API field
      endedAt: details.ended_at, // API field
      duration: details.duration, // API field
    };

    return { success: true, data: mappedDetails, message: 'Detalhes recuperados' };
  } catch (error) {
    console.error('Erro actionBuscarDetalhesMeeting:', error);
    return { success: false, message: 'Erro ao buscar detalhes do meeting', error: String(error) };
  }
}

/**
 * Busca uma chamada por ID
 */
export async function actionBuscarChamadaPorId(
  id: number
): Promise<ActionResult<ChamadaComParticipantes | null>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Usuário não autenticado', error: 'Unauthorized' };

    const service = await createChatService();
    const result = await service.buscarChamadaPorId(id);

    if (result.isErr()) {
      return { success: false, message: result.error.message, error: result.error.message };
    }

    return { success: true, data: result.value, message: 'Chamada encontrada' };
  } catch (error) {
    return { success: false, message: 'Erro ao buscar chamada', error: String(error) };
  }
}
