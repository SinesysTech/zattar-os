// Rota de API para estatísticas de cache
// GET: Obter estatísticas do Redis

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { getCacheStats, isRedisAvailable } from '@/lib/redis/cache-utils';

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Obter estatísticas do cache Redis
 *     description: Retorna estatísticas do Redis incluindo uso de memória, hits, misses, uptime e disponibilidade
 *     tags:
 *       - Cache
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     responses:
 *       200:
 *         description: Estatísticas do cache retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                       description: Indica se o Redis está disponível
 *                       example: true
 *                     stats:
 *                       type: object
 *                       description: Estatísticas do Redis
 *                       properties:
 *                         used_memory:
 *                           type: string
 *                           description: Memória usada pelo Redis
 *                           example: "1024000"
 *                         keyspace_hits:
 *                           type: string
 *                           description: Número de hits no cache
 *                           example: "1500"
 *                         keyspace_misses:
 *                           type: string
 *                           description: Número de misses no cache
 *                           example: "200"
 *                         uptime_in_seconds:
 *                           type: string
 *                           description: Tempo de atividade do Redis em segundos
 *                           example: "3600"
 *                         total_connections_received:
 *                           type: string
 *                           description: Total de conexões recebidas
 *                           example: "500"
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação obrigatória
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter estatísticas do cache
    const stats = await getCacheStats();
    const available = await isRedisAvailable();

    // 3. Retornar resposta JSON
    return NextResponse.json({
      success: true,
      data: {
        available,
        stats,
      },
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas do cache:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}