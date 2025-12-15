// Rota de API para limpeza manual de cache
// POST: Limpar cache (todo ou padrão específico)

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { getRedisClient } from '@/lib/redis/client';
import { isRedisAvailable } from '@/lib/redis/cache-utils';
import { deletePattern } from '@/lib/redis/cache-utils';
import { createServiceClient } from '@/lib/supabase/service-client';

/**
 * Verifica se o usuário tem permissão de administrador
 */
async function verificarPermissaoAdmin(usuarioId: number): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('usuarios')
      .select('admin')
      .eq('id', usuarioId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.admin === true;
  } catch {
    return false;
  }
}

/**
 * @swagger
 * /api/cache/clear:
 *   post:
 *     summary: Limpa o cache Redis manualmente
 *     description: Remove chaves do cache Redis. Requer permissão de administrador. Se nenhum padrão for especificado, limpa todo o cache.
 *     tags:
 *       - Cache
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pattern:
 *                 type: string
 *                 description: 'Padrão de chaves a remover (ex: pendentes:*). Se não informado, limpa todo o cache.'
 *     responses:
 *       200:
 *         description: Cache limpo com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 keysRemoved:
 *                   type: integer
 *                   description: Número de chaves removidas
 *       401:
 *         description: Não autenticado ou sem permissão de administrador
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verificar permissão de administrador (exceto para service API key)
    if (authResult.source !== 'service') {
      if (!authResult.usuarioId) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 401 }
        );
      }

      const isAdmin = await verificarPermissaoAdmin(authResult.usuarioId);
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Permissão negada: apenas administradores podem limpar o cache' },
          { status: 401 }
        );
      }
    }

    // 3. Parsear body da requisição
    const body = await request.json();
    const pattern = body.pattern as string | undefined;

    // 4. Executar limpeza do cache
    let keysRemoved = 0;

    if (pattern) {
      // Limpar padrão específico
      keysRemoved = await deletePattern(pattern);
    } else {
      // Limpar todo o cache
      const client = getRedisClient();
      if (client && (await isRedisAvailable())) {
        try {
          await client.flushdb();
          // Não há retorno direto de quantas chaves foram removidas no flushdb
          // Podemos estimar ou deixar como 0 (não crítico)
          keysRemoved = 0; // flushdb não retorna count
        } catch (error) {
          console.warn('Erro ao limpar todo o cache:', error);
          return NextResponse.json(
            { error: 'Erro ao limpar cache' },
            { status: 500 }
          );
        }
      }
    }

    // 5. Log de auditoria
    console.log(`Cache cleared by ${authResult.source === 'service' ? 'system' : `user ${authResult.usuarioId}`}, pattern: ${pattern || 'all'}, keys removed: ${keysRemoved}`);

    return NextResponse.json({
      success: true,
      keysRemoved,
    });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}