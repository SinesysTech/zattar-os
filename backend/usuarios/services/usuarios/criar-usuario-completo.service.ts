// Serviço para criar usuário completo: auth.users + public.usuarios
// Cria primeiro em auth.users, depois em public.usuarios

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { criarUsuario as criarUsuarioDb, type UsuarioDados, type OperacaoUsuarioResult } from '../persistence/usuario-persistence.service';
import { invalidateUsuariosCache } from '@/lib/redis/invalidation';

/**
 * Dados necessários para criar um usuário completo
 */
export interface CriarUsuarioCompletoParams extends Omit<UsuarioDados, 'authUserId'> {
  senha: string; // Senha para o usuário em auth.users
  emailConfirmado?: boolean; // Se o e-mail já está confirmado (default: true)
}

/**
 * Cria um usuário completo no sistema:
 * 1. Cria em auth.users (Supabase Auth)
 * 2. Cria em public.usuarios com o auth_user_id retornado
 * 
 * @param params Dados do usuário incluindo senha
 * @returns Resultado da operação com o usuário criado
 */
export async function criarUsuarioCompleto(
  params: CriarUsuarioCompletoParams
): Promise<OperacaoUsuarioResult> {
  const supabase = createServiceClient();

  console.log('📝 Iniciando criação de usuário completo...', {
    nomeCompleto: params.nomeCompleto,
    emailCorporativo: params.emailCorporativo,
    cpf: params.cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.***.$3-$4'), // Mascarar CPF no log
  });

  try {
    // Validações básicas
    if (!params.emailCorporativo?.trim()) {
      return { sucesso: false, erro: 'E-mail corporativo é obrigatório' };
    }

    if (!params.senha || params.senha.length < 6) {
      return { sucesso: false, erro: 'Senha é obrigatória e deve ter no mínimo 6 caracteres' };
    }

    // 1. Criar usuário em auth.users primeiro
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: params.emailCorporativo.trim().toLowerCase(),
      password: params.senha,
      email_confirm: params.emailConfirmado ?? true, // Por padrão, e-mail já confirmado
      user_metadata: {
        name: params.nomeCompleto || params.nomeExibicao,
      },
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário em auth.users:', authError);
      return { sucesso: false, erro: `Erro ao criar usuário em auth.users: ${authError.message}` };
    }

    if (!authUser?.user?.id) {
      return { sucesso: false, erro: 'Usuário criado em auth.users mas ID não retornado' };
    }

    const authUserId = authUser.user.id;
    console.log('✅ Usuário criado em auth.users:', { id: authUserId, email: params.emailCorporativo });

    // 2. Criar usuário em public.usuarios com o auth_user_id
    const dadosUsuario: UsuarioDados = {
      ...params,
      authUserId, // Vincular ao usuário criado em auth.users
    };

    const resultado = await criarUsuarioDb(dadosUsuario);

    if (!resultado.sucesso) {
      // Se falhar ao criar em public.usuarios, tentar remover o usuário de auth.users
      console.error('❌ Erro ao criar usuário em public.usuarios. Tentando remover de auth.users...');
      try {
        await supabase.auth.admin.deleteUser(authUserId);
        console.log('✅ Usuário removido de auth.users após falha');
      } catch (deleteError) {
        console.error('⚠️ Erro ao remover usuário de auth.users:', deleteError);
        // Continuar mesmo se não conseguir remover - o usuário ficará órfão em auth.users
      }

      return resultado;
    }

    console.log('✅ Usuário completo criado com sucesso:', {
      authUserId,
      usuarioId: resultado.usuario?.id,
      nomeExibicao: resultado.usuario?.nomeExibicao,
      emailCorporativo: resultado.usuario?.emailCorporativo,
    });

    // Invalidar cache de usuários após criação bem-sucedida
    await invalidateUsuariosCache();

    return resultado;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao criar usuário completo:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}