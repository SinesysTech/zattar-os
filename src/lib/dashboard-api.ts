import { supabase } from '@/lib/supabase';
import { 
  Tarefa, Nota, LayoutPainel, LinkPersonalizado,
  CreateTarefaData, UpdateTarefaData, CreateNotaData, UpdateNotaData,
  CreateLinkData, UpdateLinkData
} from './dashboard-types';

// Tarefas API
export async function getTarefas(): Promise<Tarefa[]> {
  const { data, error } = await supabase
    .from('tarefas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTarefa(tarefa: CreateTarefaData): Promise<Tarefa> {
  const { data, error } = await supabase
    .from('tarefas')
    .insert(tarefa)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTarefa(id: number, tarefa: UpdateTarefaData): Promise<Tarefa> {
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
  const { error } = await supabase
    .from('tarefas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Notas API
export async function getNotas(): Promise<Nota[]> {
  const { data, error } = await supabase
    .from('notas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createNota(nota: CreateNotaData): Promise<Nota> {
  const { data, error } = await supabase
    .from('notas')
    .insert(nota)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNota(id: number, nota: UpdateNotaData): Promise<Nota> {
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
  const { error } = await supabase
    .from('notas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Layouts Painel API
export async function getLayoutPainel(): Promise<LayoutPainel | null> {
  const { data, error } = await supabase
    .from('layouts_painel')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createLayoutPainel(configuracao_layout: Record<string, any>): Promise<LayoutPainel> {
  const { data, error } = await supabase
    .from('layouts_painel')
    .insert({ configuracao_layout })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLayoutPainel(id: number, configuracao_layout: Record<string, any>): Promise<LayoutPainel> {
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
  const { data, error } = await supabase
    .from('links_personalizados')
    .select('*')
    .order('ordem', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createLinkPersonalizado(link: CreateLinkData): Promise<LinkPersonalizado> {
  const { data, error } = await supabase
    .from('links_personalizados')
    .insert(link)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLinkPersonalizado(id: number, link: UpdateLinkData): Promise<LinkPersonalizado> {
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
  const { error } = await supabase
    .from('links_personalizados')
    .delete()
    .eq('id', id);

  if (error) throw error;
}