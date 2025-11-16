import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/swagger.config';

/**
 * @swagger
 * /api/docs/openapi.json:
 *   get:
 *     summary: Retorna a especificação OpenAPI em formato JSON
 *     description: Endpoint que retorna a documentação completa da API no formato OpenAPI 3.0
 *     tags:
 *       - Documentação
 *     responses:
 *       200:
 *         description: Especificação OpenAPI retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  return NextResponse.json(swaggerSpec);
}

