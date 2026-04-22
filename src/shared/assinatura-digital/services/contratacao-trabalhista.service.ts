/**
 * Contratação Trabalhista — Service Unificado de Cadastro
 *
 * Orquestra em uma única chamada transacional best-effort:
 *   1. Upsert de cliente (busca por CPF; cria se não existir; opcionalmente atualiza)
 *   2. Upsert de parte contrária (busca por CNPJ ou CPF; cria se não existir)
 *   3. Criação do contrato vinculando cliente (autora) + parte contrária (re)
 *   4. Geração do link público do formulário de assinatura (segmento trabalhista)
 *
 * Usado pelo MCP Pedrinho (Chatwoot) para fechar contratação durante o atendimento.
 *
 * Rollback best-effort:
 *   - Só desativa entidades CRIADAS NESTA CHAMADA (não toca nas que já existiam).
 *   - Se contrato falhar e cliente foi criado agora, soft-delete do cliente.
 */

'use server';

import {
  findClienteByCPF,
  findParteContrariaByCPF,
  findParteContrariaByCNPJ,
  criarCliente,
  atualizarCliente,
  criarParteContraria,
  desativarCliente,
  desativarPartesContrariasEmMassa,
} from '@/app/(authenticated)/partes/server';
import {
  normalizarDocumento,
  type CreateClientePFInput,
  type CreateParteContrariaInput,
  type UpdateClienteInput,
  type Cliente,
  type ParteContraria,
} from '@/app/(authenticated)/partes';
import { criarContrato } from '@/app/(authenticated)/contratos/service';
import type {
  PapelContratual,
  Contrato,
} from '@/app/(authenticated)/contratos/domain';
import { criarEndereco } from '@/app/(authenticated)/enderecos/service';
import { getSegmentoBySlug } from './segmentos.service';
import { getFormularioBySlugAndSegmentoId } from './formularios.service';
import {
  criarContratacaoTrabalhistaSchema,
  type CriarContratacaoTrabalhistaInput,
  type CriarContratacaoTrabalhistaResult,
  type GerarLinkFormularioPublicoInput,
} from './contratacao-trabalhista.schema';

// ─── Helpers ────────────────────────────────────────────────────────

function splitCelular(celular?: string): { ddd: string | null; numero: string | null } {
  if (!celular) return { ddd: null, numero: null };
  const digits = celular.replace(/\D/g, '');
  if (digits.length < 10) return { ddd: null, numero: null };
  return { ddd: digits.slice(0, 2), numero: digits.slice(2) };
}

function buildPublicLink(
  baseUrl: string | undefined,
  segmentoSlug: string,
  formularioSlug: string,
): string {
  const base = (baseUrl ?? 'https://zattaradvogados.com').replace(/\/+$/, '');
  return `${base}/formulario/${segmentoSlug}/${formularioSlug}`;
}

// ─── Service Principal ─────────────────────────────────────────────

export async function criarContratacaoTrabalhista(
  rawInput: CriarContratacaoTrabalhistaInput,
): Promise<{ success: true; data: CriarContratacaoTrabalhistaResult } | { success: false; error: string }> {
  const parsed = criarContratacaoTrabalhistaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Input inválido' };
  }
  const input = parsed.data;

  const warnings: string[] = [];
  const createdInThisCall: { clienteId?: number; parteContrariaId?: number } = {};

  // ── PASSO 1: Upsert de Cliente ─────────────────────────────────
  let clienteFinal: Cliente;
  let clienteCriado = false;
  let clienteAtualizado = false;

  const cpfNorm = normalizarDocumento(input.cliente.cpf);
  const buscaCliente = await findClienteByCPF(cpfNorm);
  if (!buscaCliente.success) {
    return { success: false, error: `Erro ao buscar cliente: ${buscaCliente.error.message}` };
  }

  if (buscaCliente.data) {
    clienteFinal = buscaCliente.data as Cliente;

    if (input.atualizar_cliente_se_existir) {
      const { ddd: dddCel, numero: numCel } = splitCelular(input.cliente.celular);
      const updatePayload: UpdateClienteInput = {
        nome: input.cliente.nome,
        emails: input.cliente.email ? [input.cliente.email] : undefined,
        ddd_celular: dddCel,
        numero_celular: numCel,
        rg: input.cliente.rg ?? null,
        data_nascimento: input.cliente.data_nascimento ?? null,
        estado_civil: input.cliente.estado_civil ?? null,
        genero: input.cliente.genero ?? null,
        nacionalidade: input.cliente.nacionalidade ?? null,
      };
      const upd = await atualizarCliente(clienteFinal.id, updatePayload);
      if (!upd.success) {
        warnings.push(`Falha ao atualizar cliente existente: ${upd.error.message}`);
      } else {
        clienteFinal = upd.data as Cliente;
        clienteAtualizado = true;
      }
    }
  } else {
    const { ddd: dddCel, numero: numCel } = splitCelular(input.cliente.celular);
    const createPayload: CreateClientePFInput = {
      tipo_pessoa: 'pf',
      cpf: cpfNorm,
      nome: input.cliente.nome,
      emails: input.cliente.email ? [input.cliente.email] : null,
      ddd_celular: dddCel,
      numero_celular: numCel,
      rg: input.cliente.rg ?? null,
      data_nascimento: input.cliente.data_nascimento ?? null,
      estado_civil: input.cliente.estado_civil ?? null,
      genero: input.cliente.genero ?? null,
      nacionalidade: input.cliente.nacionalidade ?? null,
      ativo: true,
    };
    const created = await criarCliente(createPayload);
    if (!created.success) {
      return { success: false, error: `Erro ao criar cliente: ${created.error.message}` };
    }
    clienteFinal = created.data as Cliente;
    clienteCriado = true;
    createdInThisCall.clienteId = clienteFinal.id;

    // Endereço (best-effort; warning se falhar)
    if (input.cliente.endereco) {
      const e = input.cliente.endereco;
      const enderecoResult = await criarEndereco({
        entidade_tipo: 'cliente',
        entidade_id: clienteFinal.id,
        cep: e.cep ?? null,
        logradouro: e.logradouro ?? null,
        numero: e.numero ?? null,
        complemento: e.complemento ?? null,
        bairro: e.bairro ?? null,
        municipio: e.municipio ?? null,
        estado_sigla: e.estado_sigla ?? null,
      });
      if (enderecoResult.success) {
        const vinc = await atualizarCliente(clienteFinal.id, {
          endereco_id: enderecoResult.data.id,
        });
        if (vinc.success) clienteFinal = vinc.data as Cliente;
      } else {
        warnings.push(`Endereço não foi vinculado: ${enderecoResult.error.message}`);
      }
    }
  }

  // ── PASSO 2: Upsert de Parte Contrária ─────────────────────────
  let parteContrariaFinal: ParteContraria;
  let parteCriada = false;

  const docPC = input.parte_contraria.tipo_pessoa === 'pj'
    ? normalizarDocumento(input.parte_contraria.cnpj!)
    : normalizarDocumento(input.parte_contraria.cpf!);

  const buscaPC = input.parte_contraria.tipo_pessoa === 'pj'
    ? await findParteContrariaByCNPJ(docPC)
    : await findParteContrariaByCPF(docPC);

  if (!buscaPC.success) {
    await rollback(createdInThisCall);
    return { success: false, error: `Erro ao buscar parte contrária: ${buscaPC.error.message}` };
  }

  if (buscaPC.data) {
    parteContrariaFinal = buscaPC.data as ParteContraria;
  } else {
    const createPCPayload: CreateParteContrariaInput =
      input.parte_contraria.tipo_pessoa === 'pj'
        ? {
            tipo_pessoa: 'pj',
            cnpj: docPC,
            nome: input.parte_contraria.nome,
            nome_social_fantasia: input.parte_contraria.nome_fantasia ?? null,
            emails: input.parte_contraria.email ? [input.parte_contraria.email] : null,
            ativo: true,
          }
        : {
            tipo_pessoa: 'pf',
            cpf: docPC,
            nome: input.parte_contraria.nome,
            emails: input.parte_contraria.email ? [input.parte_contraria.email] : null,
            ativo: true,
          };

    const createdPC = await criarParteContraria(createPCPayload);
    if (!createdPC.success) {
      await rollback(createdInThisCall);
      return {
        success: false,
        error: `Erro ao criar parte contrária: ${createdPC.error.message}`,
      };
    }
    parteContrariaFinal = createdPC.data;
    parteCriada = true;
    createdInThisCall.parteContrariaId = parteContrariaFinal.id;

    if (input.parte_contraria.endereco) {
      const e = input.parte_contraria.endereco;
      const enderecoResult = await criarEndereco({
        entidade_tipo: 'parte_contraria',
        entidade_id: parteContrariaFinal.id,
        cep: e.cep ?? null,
        logradouro: e.logradouro ?? null,
        numero: e.numero ?? null,
        complemento: e.complemento ?? null,
        bairro: e.bairro ?? null,
        municipio: e.municipio ?? null,
        estado_sigla: e.estado_sigla ?? null,
      });
      if (!enderecoResult.success) {
        warnings.push(`Endereço da parte contrária não foi vinculado: ${enderecoResult.error.message}`);
      }
    }
  }

  // ── PASSO 3: Resolver segmento (precisa do segmentoId pro contrato) ──
  const segmentoSlug = input.contrato.segmento_slug ?? 'trabalhista';
  const segmento = await getSegmentoBySlug(segmentoSlug);
  if (!segmento) {
    await rollback(createdInThisCall);
    return {
      success: false,
      error: `Segmento "${segmentoSlug}" não encontrado. Configure o segmento antes de cadastrar contratações.`,
    };
  }

  // ── PASSO 4: Criar Contrato ────────────────────────────────────
  const papelCliente = input.contrato.papel_cliente ?? 'autora';
  const papelParteContraria: PapelContratual = papelCliente === 'autora' ? 're' : 'autora';

  const contratoResult = await criarContrato({
    segmentoId: segmento.id,
    tipoContrato: input.contrato.tipo_contrato ?? 'ajuizamento',
    tipoCobranca: input.contrato.tipo_cobranca ?? 'pro_exito',
    clienteId: clienteFinal.id,
    papelClienteNoContrato: papelCliente,
    status: 'em_contratacao',
    responsavelId: input.contrato.responsavel_id ?? null,
    observacoes: input.contrato.observacoes ?? null,
    partes: [
      {
        tipoEntidade: 'cliente',
        entidadeId: clienteFinal.id,
        papelContratual: papelCliente,
        ordem: 0,
      },
      {
        tipoEntidade: 'parte_contraria',
        entidadeId: parteContrariaFinal.id,
        papelContratual: papelParteContraria,
        ordem: 1,
      },
    ],
  });

  if (!contratoResult.success) {
    await rollback(createdInThisCall);
    return { success: false, error: `Erro ao criar contrato: ${contratoResult.error.message}` };
  }

  const contrato: Contrato = contratoResult.data;

  // ── PASSO 5: Resolver formulário público (best-effort) ─────────
  let linkFormulario: string | null = null;
  if (input.contrato.formulario_slug) {
    const form = await getFormularioBySlugAndSegmentoId(input.contrato.formulario_slug, segmento.id);
    if (form && form.ativo) {
      linkFormulario = buildPublicLink(input.base_url_publica, segmentoSlug, form.slug);
    } else {
      warnings.push(
        `Formulário "${input.contrato.formulario_slug}" não encontrado ou inativo no segmento "${segmentoSlug}"`,
      );
    }
  }

  const proximosPassos: string[] = [
    linkFormulario
      ? `Envie ao cliente o link do formulário público: ${linkFormulario}`
      : 'Envie o link do formulário público apropriado para o cliente revisar e assinar',
    'Após a assinatura digital, o status do contrato muda automaticamente para "contratado"',
    'Acompanhe o ciclo de vida do contrato no painel administrativo',
  ];

  return {
    success: true,
    data: {
      cliente: {
        id: clienteFinal.id,
        nome: clienteFinal.nome,
        cpf: cpfNorm,
        criado: clienteCriado,
        atualizado: clienteAtualizado,
      },
      parte_contraria: {
        id: parteContrariaFinal.id,
        nome: parteContrariaFinal.nome,
        documento: docPC,
        criado: parteCriada,
      },
      contrato: {
        id: contrato.id,
        status: contrato.status,
        tipo_contrato: contrato.tipoContrato,
        tipo_cobranca: contrato.tipoCobranca,
        papel_cliente: contrato.papelClienteNoContrato,
      },
      link_formulario_publico: linkFormulario,
      proximos_passos: proximosPassos,
      warnings,
    },
  };
}

// ─── Rollback Best-Effort ──────────────────────────────────────────

async function rollback(created: { clienteId?: number; parteContrariaId?: number }): Promise<void> {
  if (created.parteContrariaId) {
    await desativarPartesContrariasEmMassa([created.parteContrariaId]).catch(() => undefined);
  }
  if (created.clienteId) {
    await desativarCliente(created.clienteId).catch(() => undefined);
  }
}

// ─── Service: Geração de Link Público (standalone) ─────────────────

// Schema gerarLinkFormularioPublicoSchema e tipo GerarLinkFormularioPublicoInput
// movidos para ./contratacao-trabalhista.schema

export async function gerarLinkFormularioPublico(
  input: GerarLinkFormularioPublicoInput,
): Promise<
  | { success: true; data: { url: string; segmento: string; formulario: string } }
  | { success: false; error: string }
> {
  const segmento = await getSegmentoBySlug(input.segmento_slug);
  if (!segmento) {
    return { success: false, error: `Segmento "${input.segmento_slug}" não encontrado` };
  }

  const formulario = await getFormularioBySlugAndSegmentoId(input.formulario_slug, segmento.id);
  if (!formulario) {
    return {
      success: false,
      error: `Formulário "${input.formulario_slug}" não encontrado no segmento "${input.segmento_slug}"`,
    };
  }
  if (!formulario.ativo) {
    return { success: false, error: `Formulário "${input.formulario_slug}" está inativo` };
  }

  return {
    success: true,
    data: {
      url: buildPublicLink(input.base_url_publica, input.segmento_slug, formulario.slug),
      segmento: segmento.nome,
      formulario: formulario.nome,
    },
  };
}
