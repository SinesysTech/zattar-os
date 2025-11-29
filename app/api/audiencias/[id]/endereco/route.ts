// Rota de API para atualizar endereço da audiência (URL virtual ou endereço físico)

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { deletePattern } from '@/backend/utils/redis/cache-utils';
import { CACHE_PREFIXES } from '@/backend/utils/redis/cache-utils';

/**
 * @swagger
 * /api/audiencias/{id}/endereco:
 *   patch:
 *     summary: Atualiza endereço da audiência (URL virtual ou endereço físico)
 *     description: Atualiza o endereço de uma audiência - pode ser URL virtual ou endereço físico
 *     tags:
 *       - Audiências
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da audiência
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [virtual, presencial, hibrida]
 *                 description: Tipo de endereço a atualizar (hibrida permite URL e endereço simultaneamente)
 *               urlAudienciaVirtual:
 *                 type: string
 *                 nullable: true
 *                 description: URL da audiência virtual (quando tipo=virtual)
 *               enderecoPresencial:
 *                 type: object
 *                 nullable: true
 *                 description: Endereço físico (quando tipo=presencial)
 *                 properties:
 *                   logradouro:
 *                     type: string
 *                   numero:
 *                     type: string
 *                   complemento:
 *                     type: string
 *                   bairro:
 *                     type: string
 *                   cidade:
 *                     type: string
 *                   estado:
 *                     type: string
 *                   pais:
 *                     type: string
 *                   cep:
 *                     type: string
 *               presencaHibrida:
 *                 type: string
 *                 enum: [advogado, cliente]
 *                 nullable: true
 *                 description: Para modalidade híbrida, indica quem comparece presencialmente
 *     responses:
 *       200:
 *         description: Endereço atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Audiência não encontrada
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Verificar permissão: audiencias.editar
        const authOrError = await requirePermission(request, 'audiencias', 'editar');
        if (authOrError instanceof NextResponse) {
            return authOrError;
        }

        // 2. Await params e validar ID
        const { id: idParam } = await params;
        const audienciaId = parseInt(idParam, 10);
        if (isNaN(audienciaId) || audienciaId <= 0) {
            return NextResponse.json(
                { error: 'ID inválido' },
                { status: 400 }
            );
        }

        // 3. Obter dados do body
        const body = await request.json();
        const { tipo, urlAudienciaVirtual, enderecoPresencial, presencaHibrida } = body;

        // Validar tipo
        if (!tipo || !['virtual', 'presencial', 'hibrida'].includes(tipo)) {
            return NextResponse.json(
                { error: 'Tipo deve ser "virtual", "presencial" ou "hibrida"' },
                { status: 400 }
            );
        }

        // 4. Preparar dados para atualização
        const supabase = createServiceClient();
        const updateData: {
            url_audiencia_virtual?: string | null;
            endereco_presencial?: Record<string, string> | null;
            modalidade?: 'virtual' | 'presencial' | 'hibrida';
            presenca_hibrida?: 'advogado' | 'cliente' | null;
            updated_at: string;
        } = {
            updated_at: new Date().toISOString(),
        };

        if (tipo === 'virtual') {
            // Validar URL se fornecida
            if (urlAudienciaVirtual && urlAudienciaVirtual.trim() !== '') {
                try {
                    new URL(urlAudienciaVirtual);
                } catch {
                    return NextResponse.json(
                        { error: 'URL inválida. Use o formato: https://exemplo.com' },
                        { status: 400 }
                    );
                }
                updateData.url_audiencia_virtual = urlAudienciaVirtual.trim();
            } else {
                updateData.url_audiencia_virtual = null;
            }
            // Limpar endereço presencial e presença híbrida quando for virtual
            updateData.endereco_presencial = null;
            updateData.modalidade = 'virtual';
            updateData.presenca_hibrida = null;
        } else if (tipo === 'presencial') {
            if (enderecoPresencial && Object.keys(enderecoPresencial).length > 0) {
                // Validar se pelo menos logradouro ou cidade estão preenchidos
                if (!enderecoPresencial.logradouro && !enderecoPresencial.cidade) {
                    return NextResponse.json(
                        { error: 'Informe pelo menos o logradouro ou a cidade' },
                        { status: 400 }
                    );
                }
                // Sempre definir "Brasil" como país padrão
                updateData.endereco_presencial = {
                    ...enderecoPresencial,
                    pais: 'Brasil'
                };
            } else {
                updateData.endereco_presencial = null;
            }
            // Limpar URL virtual e presença híbrida quando for presencial
            updateData.url_audiencia_virtual = null;
            updateData.modalidade = 'presencial';
            updateData.presenca_hibrida = null;
        } else {
            // tipo === 'hibrida'
            // Validar URL se fornecida
            if (urlAudienciaVirtual && urlAudienciaVirtual.trim() !== '') {
                try {
                    new URL(urlAudienciaVirtual);
                } catch {
                    return NextResponse.json(
                        { error: 'URL inválida. Use o formato: https://exemplo.com' },
                        { status: 400 }
                    );
                }
                updateData.url_audiencia_virtual = urlAudienciaVirtual.trim();
            } else {
                updateData.url_audiencia_virtual = null;
            }
            // Validar endereço presencial
            if (enderecoPresencial && Object.keys(enderecoPresencial).length > 0) {
                // Validar se pelo menos logradouro ou cidade estão preenchidos
                if (!enderecoPresencial.logradouro && !enderecoPresencial.cidade) {
                    return NextResponse.json(
                        { error: 'Informe pelo menos o logradouro ou a cidade' },
                        { status: 400 }
                    );
                }
                // Sempre definir "Brasil" como país padrão
                updateData.endereco_presencial = {
                    ...enderecoPresencial,
                    pais: 'Brasil'
                };
            } else {
                updateData.endereco_presencial = null;
            }
            // Para híbrida, ambos devem estar preenchidos
            if (!updateData.url_audiencia_virtual || !updateData.endereco_presencial) {
                return NextResponse.json(
                    { error: 'Para modalidade híbrida, é necessário informar tanto a URL virtual quanto o endereço presencial' },
                    { status: 400 }
                );
            }
            // Validar presença híbrida
            if (presencaHibrida && !['advogado', 'cliente'].includes(presencaHibrida)) {
                return NextResponse.json(
                    { error: 'Presença híbrida deve ser "advogado" ou "cliente"' },
                    { status: 400 }
                );
            }
            updateData.modalidade = 'hibrida';
            updateData.presenca_hibrida = presencaHibrida || null;
        }

        // 5. Atualizar endereço da audiência
        const { data, error } = await supabase
            .from('audiencias')
            .update(updateData)
            .eq('id', audienciaId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Audiência não encontrada' },
                    { status: 404 }
                );
            }
            throw error;
        }

        // 6. Invalidar cache de audiências
        try {
            await deletePattern(`${CACHE_PREFIXES.audiencias}:*`);
        } catch (cacheError) {
            console.warn('Erro ao invalidar cache de audiências:', cacheError);
            // Não lançar erro, apenas logar aviso
        }

        return NextResponse.json({
            success: true,
            message: 'Endereço da audiência atualizado com sucesso',
            data,
        });
    } catch (error) {
        console.error('Erro ao atualizar endereço da audiência:', error);
        const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';

        // Verificar tipo de erro
        if (erroMsg.includes('não encontrada')) {
            return NextResponse.json(
                { error: erroMsg },
                { status: 404 }
            );
        }

        if (erroMsg.includes('inválido') || erroMsg.includes('inválida')) {
            return NextResponse.json(
                { error: erroMsg },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: erroMsg },
            { status: 500 }
        );
    }
}
