'use server';

/**
 * DYTE ACTIONS
 * 
 * Server Actions for video/audio calls using Dyte.
 */

import { createClient } from '@/lib/supabase/server';
import { createMeeting, addParticipant } from '@/lib/dyte/client';
import { generateMeetingTitle } from '@/lib/dyte/utils';
import { ActionResult } from '../domain';

// Helper to get current user (duplicated from chat actions for isolation)
async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data } = await supabase
    .from('usuarios')
    .select('id, nome_completo')
    .eq('auth_user_id', user.id)
    .single();

  return data; // Returns { id, nome_completo }
}

export async function actionIniciarVideoCall(salaId: number, salaNome: string): Promise<ActionResult<{ meetingId: string; authToken: string; participantName: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized', message: 'Usuário não autenticado.' };
    }

    const title = generateMeetingTitle(salaId, salaNome, 'video');
    const meetingId = await createMeeting(title);
    const authToken = await addParticipant(meetingId, user.nome_completo);

    return {
      success: true,
      data: {
        meetingId,
        authToken,
        participantName: user.nome_completo,
      },
      message: 'Chamada de vídeo iniciada.',
    };
  } catch (error: any) {
    console.error('Erro ao iniciar video call:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erro ao iniciar chamada de vídeo.',
    };
  }
}

export async function actionIniciarAudioCall(salaId: number, salaNome: string): Promise<ActionResult<{ meetingId: string; authToken: string; participantName: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized', message: 'Usuário não autenticado.' };
    }

    const title = generateMeetingTitle(salaId, salaNome, 'audio');
    const meetingId = await createMeeting(title);
    const authToken = await addParticipant(meetingId, user.nome_completo);

    return {
      success: true,
      data: {
        meetingId,
        authToken,
        participantName: user.nome_completo,
      },
      message: 'Chamada de áudio iniciada.',
    };
  } catch (error: any) {
    console.error('Erro ao iniciar audio call:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erro ao iniciar chamada de áudio.',
    };
  }
}
