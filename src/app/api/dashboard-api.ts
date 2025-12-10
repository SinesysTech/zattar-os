import { createClient } from '../_lib/supabase/client';
import {
  Tarefa, Nota, LayoutPainel, LinkPersonalizado, DashboardWidget,
  CreateTarefaData, UpdateTarefaData, CreateNotaData, UpdateNotaData,
  CreateLinkData, UpdateLinkData
} from '../_lib/dashboard-types';

export type {
  Tarefa, Nota, LayoutPainel, LinkPersonalizado, DashboardWidget,
  CreateTarefaData, UpdateTarefaData, CreateNotaData, UpdateNotaData,
  CreateLinkData, UpdateLinkData
};

// Helper function to get current user
async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('User not authenticated');
  return { user, supabase };
}

// Helper function to get usuario_id from auth user
async function getUsuarioId() {
  const { user, supabase } = await getCurrentUser();

  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (error || !data) {
    throw new Error('User profile not found');
  }
  return { usuarioId: data.id, supabase };
}

// Tarefas API
export async function getTarefas(): Promise<Tarefa[]> {
  try {
    const { usuarioId, supabase } = await getUsuarioId();
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tarefas:', error);
    return [];
  }
}

export async function createTarefa(tarefa: CreateTarefaData): Promise<Tarefa> {
  const { usuarioId, supabase } = await getUsuarioId();
  const { data, error } = await supabase
    .from('tarefas')
    .insert({ ...tarefa, usuario_id: usuarioId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTarefa(id: number, tarefa: UpdateTarefaData): Promise<Tarefa> {
  const { supabase } = await getUsuarioId();
  const { data, error } = await supabase
    .from('tarefas')
    .update(tarefa)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTarefa(id: number): Promise<void> {
  const { supabase } = await getUsuarioId();
  const { error } = await supabase
    .from('tarefas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Notas API
export async function getNotas(): Promise<Nota[]> {
  try {
    const { usuarioId, supabase } = await getUsuarioId();
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notas:', error);
    return [];
  }
}

export async function createNota(nota: CreateNotaData): Promise<Nota> {
  const { usuarioId, supabase } = await getUsuarioId();
  const { data, error } = await supabase
    .from('notas')
    .insert({ ...nota, usuario_id: usuarioId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNota(id: number, nota: UpdateNotaData): Promise<Nota> {
  const { supabase } = await getUsuarioId();
  const { data, error } = await supabase
    .from('notas')
    .update(nota)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteNota(id: number): Promise<void> {
  const { supabase } = await getUsuarioId();
  const { error } = await supabase
    .from('notas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Layouts Painel API
export async function getLayoutPainel(): Promise<LayoutPainel | null> {
  try {
    const { usuarioId, supabase } = await getUsuarioId();
    const { data, error } = await supabase
      .from('layouts_painel')
      .select('*')
      .eq('usuario_id', usuarioId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching layout:', error);
    return null;
  }
}

export async function createLayoutPainel(configuracao_layout: Record<string, unknown>): Promise<LayoutPainel> {
  const { usuarioId, supabase } = await getUsuarioId();
  const { data, error } = await supabase
    .from('layouts_painel')
    .insert({ configuracao_layout, usuario_id: usuarioId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLayoutPainel(id: number, configuracao_layout: Record<string, unknown>): Promise<LayoutPainel> {
  const { supabase } = await getUsuarioId();
  const { data, error } = await supabase
    .from('layouts_painel')
    .update({ configuracao_layout })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Links Personalizados API
export async function getLinksPersonalizados(): Promise<LinkPersonalizado[]> {
  try {
    const { usuarioId, supabase } = await getUsuarioId();
    const { data, error } = await supabase
      .from('links_personalizados')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('ordem', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching links:', error);
    return [];
  }
}

export async function createLinkPersonalizado(link: CreateLinkData): Promise<LinkPersonalizado> {
  const { usuarioId, supabase } = await getUsuarioId();
  const { data, error } = await supabase
    .from('links_personalizados')
    .insert({ ...link, usuario_id: usuarioId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLinkPersonalizado(id: number, link: UpdateLinkData): Promise<LinkPersonalizado> {
  const { supabase } = await getUsuarioId();
  const { data, error } = await supabase
    .from('links_personalizados')
    .update(link)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLinkPersonalizado(id: number): Promise<void> {
  const { supabase } = await getUsuarioId();
  const { error } = await supabase
    .from('links_personalizados')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
