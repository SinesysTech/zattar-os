import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Endpoint para verificar o status da aplicação
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Aplicação está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

