/**
 * @swagger
 * /api/uploadthing:
 *   get:
 *     summary: Handler de upload de arquivos (GET)
 *     description: Endpoint para verificação e callback do UploadThing
 *     tags:
 *       - Upload
 *     responses:
 *       200:
 *         description: Handler processado com sucesso
 *   post:
 *     summary: Handler de upload de arquivos (POST)
 *     description: Endpoint para upload de arquivos usando UploadThing
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo a ser enviado
 *     responses:
 *       200:
 *         description: Upload processado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL do arquivo enviado
 *       400:
 *         description: Erro no upload
 */

import { createRouteHandler } from 'uploadthing/next';

import { ourFileRouter } from '@/app/_lib/uploadthing';

export const { GET, POST } = createRouteHandler({ router: ourFileRouter });
