// Serviço para sincronizar usuários de auth.users para public.usuarios
// Popula a tabela usuarios com dados dos usuários autenticados

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { criarUsuario, type UsuarioDados } from './usuario-persistence.service';

/**
 * Extrai primeiro e último nome de um e-mail no formato primeiro.ultimo@dominio.com
 * Exemplo: "joao.zattar@zattaradvogados.com" -> { primeiro: "João", ultimo: "Zattar" }
 */
function extrairNomeDoEmail(email: string): { primeiro: string; ultimo: string } {
  const parteLocal = email.split('@')[0].toLowerCase();
  const partes = parteLocal.split('.');
  
  if (partes.length >= 2) {
    // Formato: primeiro.ultimo
    const primeiro = partes[0].charAt(0).toUpperCase() + partes[0].slice(1);
    const ultimo = partes[partes.length - 1].charAt(0).toUpperCase() + partes[partes.length - 1].slice(1);
    return { primeiro, ultimo };
  } else if (partes.length === 1) {
    // Formato: primeiro (sem sobrenome)
    const primeiro = partes[0].charAt(0).toUpperCase() + partes[0].slice(1);
    return { primeiro, ultimo: '' };
  }
  
  return { primeiro: 'Usuário', ultimo: '' };
}

/**
 * Capitaliza palavras corretamente
 */
function capitalizarNome(nome: string): string {
  return nome
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Gera um CPF temporário baseado no ID do usuário
 * Formato: 00000000000 + últimos dígitos do UUID
 */
function gerarCpfTemporario(authUserId: string): string {
  // Pega os últimos 11 caracteres numéricos do UUID
  const numeros = authUserId.replace(/\D/g, '').slice(-11);
  // Se não tiver 11 dígitos, completa com zeros à esquerda
  return numeros.padStart(11, '0');
}

/**
 * Busca todos os usuários de auth.users que ainda não estão em public.usuarios
 * Usa função SQL criada no banco para acessar auth.users
 */
async function buscarUsuariosAuthNaoSincronizados(): Promise<Array<{
  id: string;
  email: string | null;
  raw_user_meta_data: Record<string, unknown> | null;
  created_at: string;
}>> {
  const supabase = createServiceClient();
  
  // Usar função SQL para buscar usuários não sincronizados
  const { data, error } = await supabase.rpc('list_auth_users_nao_sincronizados');
  
  if (error) {
    throw new Error(`Erro ao buscar usuários de auth.users: ${error.message}`);
  }
  
  return (data || []).map((user: {
    id: string;
    email: string | null | undefined;
    raw_user_meta_data: Record<string, unknown> | null | undefined;
    created_at: string;
  }) => ({
    id: user.id,
    email: user.email || null,
    raw_user_meta_data: user.raw_user_meta_data || {},
    created_at: user.created_at,
  }));
}

/**
 * Sincroniza um usuário de auth.users para public.usuarios
 */
async function sincronizarUsuario(authUser: {
  id: string;
  email: string | null;
  raw_user_meta_data: Record<string, unknown> | null;
}): Promise<{ sucesso: boolean; erro?: string; usuarioId?: number }> {
  if (!authUser.email) {
    return { sucesso: false, erro: 'Usuário não possui e-mail' };
  }
  
  const email = authUser.email.toLowerCase();
  
  // Tentar obter nome do metadata primeiro
  let nomeCompleto = '';
  let nomeExibicao = '';
  
  const userMetadata = authUser.raw_user_meta_data || {};
  if (userMetadata.name && typeof userMetadata.name === 'string') {
    nomeCompleto = capitalizarNome(userMetadata.name);
    nomeExibicao = nomeCompleto;
  } else {
    // Extrair nome do e-mail
    const { primeiro, ultimo } = extrairNomeDoEmail(email);
    nomeCompleto = ultimo ? `${primeiro} ${ultimo}` : primeiro;
    nomeExibicao = nomeCompleto;
  }
  
  // Gerar CPF temporário
  const cpfTemporario = gerarCpfTemporario(authUser.id);
  
  // Preparar dados do usuário
  const dadosUsuario: UsuarioDados = {
    authUserId: authUser.id,
    nomeCompleto,
    nomeExibicao,
    cpf: cpfTemporario,
    emailCorporativo: email,
    ativo: true,
  };
  
  // Criar usuário
  const resultado = await criarUsuario(dadosUsuario);
  
  if (!resultado.sucesso) {
    return { sucesso: false, erro: resultado.erro };
  }
  
  return {
    sucesso: true,
    usuarioId: resultado.usuario?.id,
  };
}

/**
 * Sincroniza todos os usuários de auth.users para public.usuarios
 * 
 * @returns Resultado da sincronização com estatísticas
 */
export async function sincronizarUsuariosAuth(): Promise<{
  sucesso: boolean;
  totalEncontrados: number;
  sincronizados: number;
  erros: Array<{ email: string; erro: string }>;
}> {
  console.log('🔄 Iniciando sincronização de usuários de auth.users para public.usuarios...');
  
  try {
    // Buscar usuários não sincronizados
    const usuariosNaoSincronizados = await buscarUsuariosAuthNaoSincronizados();
    
    console.log(`📊 Encontrados ${usuariosNaoSincronizados.length} usuários para sincronizar`);
    
    if (usuariosNaoSincronizados.length === 0) {
      return {
        sucesso: true,
        totalEncontrados: 0,
        sincronizados: 0,
        erros: [],
      };
    }
    
    const erros: Array<{ email: string; erro: string }> = [];
    let sincronizados = 0;
    
    // Sincronizar cada usuário
    for (const authUser of usuariosNaoSincronizados) {
      try {
        const resultado = await sincronizarUsuario({
          id: authUser.id,
          email: authUser.email,
          raw_user_meta_data: authUser.raw_user_meta_data,
        });
        
        if (resultado.sucesso) {
          sincronizados++;
          console.log(`✅ Sincronizado: ${authUser.email} (ID: ${resultado.usuarioId})`);
        } else {
          erros.push({
            email: authUser.email || 'sem-email',
            erro: resultado.erro || 'Erro desconhecido',
          });
          console.error(`❌ Erro ao sincronizar ${authUser.email}:`, resultado.erro);
        }
      } catch (error) {
        const erroMsg = error instanceof Error ? error.message : String(error);
        erros.push({
          email: authUser.email || 'sem-email',
          erro: erroMsg,
        });
        console.error(`❌ Erro inesperado ao sincronizar ${authUser.email}:`, error);
      }
    }
    
    console.log(`✅ Sincronização concluída: ${sincronizados} sincronizados, ${erros.length} erros`);
    
    return {
      sucesso: erros.length === 0,
      totalEncontrados: usuariosNaoSincronizados.length,
      sincronizados,
      erros,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao sincronizar usuários:', error);
    throw new Error(`Erro ao sincronizar usuários: ${erroMsg}`);
  }
}

