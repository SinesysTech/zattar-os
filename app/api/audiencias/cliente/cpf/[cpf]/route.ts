/**
 * @swagger
 * /api/audiencias/cliente/cpf/{cpf}:
 *   get:
 *     summary: Buscar audiências por CPF do cliente
 *     description: |
 *       Retorna todas as audiências relacionadas a um cliente pelo CPF.
 *       Endpoint otimizado para consumo pelo Agente IA WhatsApp.
 *
 *       **Características:**
 *       - Busca apenas em clientes cadastrados (não em partes contrárias ou terceiros)
 *       - Dados sanitizados (sem IDs internos ou campos de sistema)
 *       - Formatos amigáveis para humanos (datas, nomes de tribunais, etc.)
 *       - Audiências ordenadas: futuras primeiro (mais próximas), depois passadas (mais recentes)
 *
 *     tags:
 *       - Audiências
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - name: cpf
 *         in: path
 *         required: true
 *         description: CPF do cliente (aceita com ou sem pontuação)
 *         schema:
 *           type: string
 *           example: "123.456.789-01"
 *     responses:
 *       200:
 *         description: Audiências encontradas com sucesso
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
 *                     cliente:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                           example: "João da Silva"
 *                         cpf:
 *                           type: string
 *                           example: "123.456.789-01"
 *                     resumo:
 *                       type: object
 *                       properties:
 *                         total_audiencias:
 *                           type: integer
 *                           example: 5
 *                         futuras:
 *                           type: integer
 *                           example: 2
 *                         realizadas:
 *                           type: integer
 *                           example: 2
 *                         canceladas:
 *                           type: integer
 *                           example: 1
 *                     audiencias:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           numero_processo:
 *                             type: string
 *                             example: "0001234-56.2024.5.03.0001"
 *                           tipo:
 *                             type: string
 *                             example: "Audiência de Instrução"
 *                           data:
 *                             type: string
 *                             example: "15/03/2025"
 *                           horario:
 *                             type: string
 *                             example: "14:00 - 15:00"
 *                           modalidade:
 *                             type: string
 *                             enum: [Virtual, Presencial, Híbrida]
 *                             example: "Virtual"
 *                           status:
 *                             type: string
 *                             example: "Designada"
 *                           local:
 *                             type: object
 *                             properties:
 *                               tipo:
 *                                 type: string
 *                                 enum: [virtual, presencial, hibrido]
 *                               url_virtual:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "https://zoom.us/j/123456789"
 *                               endereco:
 *                                 type: string
 *                                 nullable: true
 *                               sala:
 *                                 type: string
 *                                 nullable: true
 *                               presenca_hibrida:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "Advogado comparece presencialmente"
 *                           partes:
 *                             type: object
 *                             properties:
 *                               polo_ativo:
 *                                 type: string
 *                                 example: "João da Silva"
 *                               polo_passivo:
 *                                 type: string
 *                                 example: "Empresa XYZ Ltda"
 *                           papel_cliente:
 *                             type: string
 *                             example: "Reclamante"
 *                           parte_contraria:
 *                             type: string
 *                             example: "Empresa XYZ Ltda"
 *                           tribunal:
 *                             type: string
 *                             example: "TRT da 3ª Região (MG)"
 *                           vara:
 *                             type: string
 *                             example: "1ª Vara do Trabalho de Belo Horizonte"
 *                           sigilo:
 *                             type: boolean
 *                             example: false
 *                           observacoes:
 *                             type: string
 *                             nullable: true
 *       400:
 *         description: CPF inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "CPF inválido. Deve conter 11 dígitos."
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Cliente não encontrado para este CPF."
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erro interno ao buscar audiências"
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarAudienciasClientePorCpf } from '@/backend/audiencias/services/buscar-audiencias-cliente-cpf.service';

interface RouteParams {
  params: Promise<{
    cpf: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extrair CPF da URL
    const { cpf } = await params;

    if (!cpf) {
      return NextResponse.json(
        { success: false, error: 'CPF é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar audiências
    const resultado = await buscarAudienciasClientePorCpf(cpf);

    // Determinar status HTTP baseado no resultado
    if (resultado.success === false) {
      const errorMessage = resultado.error;
      // CPF inválido
      if (errorMessage.includes('inválido')) {
        return NextResponse.json(resultado, { status: 400 });
      }
      // Cliente não encontrado
      if (errorMessage.includes('não encontrado')) {
        return NextResponse.json(resultado, { status: 404 });
      }
      // Erro genérico
      return NextResponse.json(resultado, { status: 500 });
    }

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('❌ [API] Erro em /api/audiencias/cliente/cpf:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
