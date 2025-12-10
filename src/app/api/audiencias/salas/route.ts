import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/backend/utils/supabase/server-client';
import { authenticateRequest } from '@/backend/auth/api-auth';

/**
 * @swagger
 * /api/audiencias/salas:
 *   get:
 *     summary: Lista salas de audiência
 *     description: Retorna lista de salas de audiência disponíveis para um TRT, grau e órgão julgador específicos
 *     tags:
 *       - Audiências
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: trt
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do TRT (ex. TRT3)
 *       - in: query
 *         name: grau
 *         required: true
 *         schema:
 *           type: string
 *           enum: [primeiro_grau, segundo_grau]
 *         description: Grau do tribunal
 *       - in: query
 *         name: orgao_julgador_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do órgão julgador
 *     responses:
 *       200:
 *         description: Lista de salas de audiência
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *       400:
 *         description: Parâmetros obrigatórios ausentes
 *       401:
 *         description: Não autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter parâmetros da query
    const searchParams = request.nextUrl.searchParams;
    const trt = searchParams.get('trt');
    const grau = searchParams.get('grau');
    const orgaoJulgadorId = searchParams.get('orgao_julgador_id');

    // 3. Validar parâmetros obrigatórios
    if (!trt) {
      return NextResponse.json(
        { error: 'Parâmetro trt é obrigatório' },
        { status: 400 }
      );
    }

    if (!grau) {
      return NextResponse.json(
        { error: 'Parâmetro grau é obrigatório' },
        { status: 400 }
      );
    }

    if (grau !== 'primeiro_grau' && grau !== 'segundo_grau') {
      return NextResponse.json(
        { error: 'Parâmetro grau deve ser primeiro_grau ou segundo_grau' },
        { status: 400 }
      );
    }

    if (!orgaoJulgadorId) {
      return NextResponse.json(
        { error: 'Parâmetro orgao_julgador_id é obrigatório' },
        { status: 400 }
      );
    }

    // 4. Buscar salas de audiência
    const supabase = await createClient();
    const { data: salas, error } = await supabase
      .from('sala_audiencia')
      .select('id, nome')
      .eq('trt', trt)
      .eq('grau', grau)
      .eq('orgao_julgador_id', parseInt(orgaoJulgadorId))
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar salas de audiência:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar salas de audiência' },
        { status: 500 }
      );
    }

    // 5. Retornar resultado
    return NextResponse.json({
      success: true,
      data: salas || [],
    });
  } catch (error) {
    console.error('Erro ao buscar salas de audiência:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro ao buscar salas de audiência';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
