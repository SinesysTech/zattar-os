'use server';

import { z } from 'zod';
import { authenticatedAction } from '@/lib/safe-action';
import {
  validarGeracaoPdfs,
  carregarDadosContrato,
  carregarPacoteContratacaoPorSegmento,
  carregarTemplatesPorUuids,
} from '../services/documentos-contratacao.service';
import { contratoParaInputData } from '../services/mapeamento-contrato-input-data';
import { generatePdfFromTemplate } from '@/shared/assinatura-digital/services/template-pdf.service';
import { criarPacote } from '@/shared/assinatura-digital/services/pacote.service';

const schema = z.object({
  contratoId: z.number().int().positive(),
  overrides: z.record(z.string()).optional(),
});

export const actionEnviarContratoParaAssinatura = authenticatedAction(
  schema,
  async (input, { user }) => {
    // 1. Validate via caminho A's helper
    const validacao = await validarGeracaoPdfs(input.contratoId, input.overrides ?? {});
    if (validacao.status !== 'pronto') {
      return validacao;
    }

    // 2. Load context (same 3 loaders the caminho A service uses)
    const dados = await carregarDadosContrato(input.contratoId);
    if (!dados || !dados.cliente) {
      return { status: 'erro' as const, mensagem: 'Contrato sem cliente vinculado' };
    }
    if (!dados.contrato.segmento_id) {
      return {
        status: 'erro' as const,
        mensagem:
          'Contrato sem segmento definido. Edite o contrato e escolha um segmento antes de enviar para assinatura.',
      };
    }
    const pacote = await carregarPacoteContratacaoPorSegmento(dados.contrato.segmento_id);
    if (!pacote || pacote.templateUuidsUnificados.length === 0) {
      return {
        status: 'erro' as const,
        mensagem:
          'Nenhum formulário de contratação ativo está cadastrado para este segmento. Configure um em Assinatura Digital › Formulários com tipo "Contrato" e pelo menos um template.',
      };
    }
    const templates = await carregarTemplatesPorUuids(pacote.templateUuidsUnificados);

    // 3. Merge PDFs in parallel
    const mapeado = contratoParaInputData(dados);
    const principal = pacote.formularioPrincipal;
    const ctx = {
      cliente: mapeado.cliente,
      segmento: pacote.segmento,
      formulario: {
        id: principal.id,
        formulario_uuid: principal.formulario_uuid,
        nome: principal.nome,
        slug: principal.slug,
        segmento_id: principal.segmento_id,
        ativo: principal.ativo,
      },
      protocolo: `CTR-${dados.contrato.id}-${Date.now()}`,
      parte_contraria: mapeado.parteContrariaNome
        ? { nome: mapeado.parteContrariaNome }
        : undefined,
    };
    const extras: Record<string, unknown> = {
      ...mapeado.ctxExtras,
      ...(input.overrides ?? {}),
    };

    const templatesComPdfs = await Promise.all(
      templates.map(async (template) => ({
        template,
        pdfBuffer: await generatePdfFromTemplate(template, ctx, extras, undefined),
        titulo: template.nome,
      })),
    );

    // 4. Create pacote
    const primeiroEmail = dados.cliente.emails?.[0] ?? null;
    const clienteDadosSnapshot = {
      nome: dados.cliente.nome,
      cpf: dados.cliente.cpf ?? null,
      email: primeiroEmail,
    };

    const result = await criarPacote({
      contratoId: input.contratoId,
      formularioId: principal.id,
      templatesComPdfs,
      clienteDadosSnapshot,
      userId: user.id,
      overrides: input.overrides ?? {},
    });

    return {
      status: result.status === 'reaproveitado' ? ('reaproveitado' as const) : ('criado' as const),
      token: result.token,
      expiraEm: result.expiraEm,
      quantidadeDocs: result.quantidadeDocs,
    };
  },
);
