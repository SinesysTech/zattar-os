/**
 * Orquestrador de envio de notificações de prestação de contas.
 * Busca dados do cliente e envia link por email, WhatsApp ou ambos.
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import { getEscritorioConfig } from '../escritorio-config';
import {
  enviarEmailPrestacaoContas,
  type EnviarEmailOutput,
} from './email-notificacao';
import {
  enviarWhatsAppPrestacaoContas,
  type EnviarWhatsAppOutput,
} from './whatsapp-notificacao';

export type CanalNotificacao = 'email' | 'whatsapp' | 'ambos';

export interface EnviarNotificacaoInput {
  token: string;
  canal: CanalNotificacao;
  baseUrl: string;
}

export interface EnviarNotificacaoOutput {
  email?: EnviarEmailOutput;
  whatsapp?: EnviarWhatsAppOutput;
  erros: Array<{ canal: 'email' | 'whatsapp'; mensagem: string }>;
}

interface ContatoCliente {
  nome: string;
  email: string | null;
  telefoneE164: string | null;
  processoNumero: string;
}

async function carregarContatoDoToken(token: string): Promise<ContatoCliente> {
  const supabase = createServiceClient();

  const { data: ass, error: assErr } = await supabase
    .from('assinatura_digital_documento_assinantes')
    .select('assinante_entidade_id, documento_id')
    .eq('token', token)
    .single();
  if (assErr || !ass?.assinante_entidade_id) throw new Error('Token inválido');

  const { data: documento, error: docErr } = await supabase
    .from('assinatura_digital_documentos')
    .select('contexto_parcela_id' as never)
    .eq('id', ass.documento_id)
    .single();
  if (docErr || !documento) throw new Error('Documento não encontrado');

  const parcelaId = (documento as { contexto_parcela_id?: number | null })
    .contexto_parcela_id;
  if (!parcelaId) throw new Error('Documento sem parcela vinculada');

  const { data: parcela } = await supabase
    .from('parcelas')
    .select(
      `id, acordo_condenacao_id,
       acordos_condenacao!inner(processo_id)`,
    )
    .eq('id', parcelaId)
    .single();

  const processoId = (
    parcela as unknown as { acordos_condenacao: { processo_id: number } }
  )?.acordos_condenacao.processo_id;
  if (!processoId) throw new Error('Processo não encontrado');

  const { data: processo } = await supabase
    .from('acervo')
    .select('numero_processo')
    .eq('id', processoId)
    .single();

  const { data: cliente } = await supabase
    .from('clientes')
    .select('nome, emails, ddd_celular, numero_celular')
    .eq('id', ass.assinante_entidade_id)
    .single();
  if (!cliente) throw new Error('Cliente não encontrado');

  const email = extrairEmailPrincipal(cliente.emails);
  const telefone = combinarTelefone(
    cliente.ddd_celular,
    cliente.numero_celular,
  );

  return {
    nome: cliente.nome,
    email,
    telefoneE164: telefone,
    processoNumero: processo?.numero_processo ?? '(processo não identificado)',
  };
}

function extrairEmailPrincipal(emails: unknown): string | null {
  if (!emails) return null;
  if (typeof emails === 'string') return emails;
  if (Array.isArray(emails) && emails.length > 0) {
    const primeiro = emails[0];
    if (typeof primeiro === 'string') return primeiro;
    if (typeof primeiro === 'object' && primeiro && 'email' in primeiro) {
      return String((primeiro as { email: unknown }).email);
    }
  }
  if (typeof emails === 'object' && emails && 'principal' in emails) {
    return String((emails as { principal: unknown }).principal);
  }
  return null;
}

function combinarTelefone(
  ddd: string | null,
  numero: string | null,
): string | null {
  if (!numero) return null;
  const limpo = numero.replace(/\D/g, '');
  if (!limpo) return null;
  // Se o número já vem com DDD (11+ dígitos), usa direto
  if (limpo.length >= 10) return `+55${limpo}`;
  if (!ddd) return null;
  const dddLimpo = ddd.replace(/\D/g, '');
  return `+55${dddLimpo}${limpo}`;
}

export async function enviarNotificacaoLink(
  input: EnviarNotificacaoInput,
): Promise<EnviarNotificacaoOutput> {
  const contato = await carregarContatoDoToken(input.token);
  const escritorio = getEscritorioConfig();
  const linkCompleto = `${input.baseUrl.replace(/\/$/, '')}/prestacao-contas/${input.token}`;

  const out: EnviarNotificacaoOutput = { erros: [] };

  if (input.canal === 'email' || input.canal === 'ambos') {
    if (!contato.email) {
      out.erros.push({
        canal: 'email',
        mensagem: 'Cliente não tem e-mail cadastrado.',
      });
    } else {
      try {
        out.email = await enviarEmailPrestacaoContas({
          destinatario: contato.email,
          clienteNome: contato.nome,
          escritorioNome: escritorio.razaoSocial,
          processoNumero: contato.processoNumero,
          linkCompleto,
        });
      } catch (e) {
        out.erros.push({
          canal: 'email',
          mensagem: e instanceof Error ? e.message : 'Erro desconhecido',
        });
      }
    }
  }

  if (input.canal === 'whatsapp' || input.canal === 'ambos') {
    if (!contato.telefoneE164) {
      out.erros.push({
        canal: 'whatsapp',
        mensagem: 'Cliente não tem telefone celular cadastrado.',
      });
    } else {
      try {
        out.whatsapp = await enviarWhatsAppPrestacaoContas({
          telefoneE164: contato.telefoneE164,
          clienteNome: contato.nome,
          escritorioNome: escritorio.razaoSocial,
          processoNumero: contato.processoNumero,
          linkCompleto,
        });
      } catch (e) {
        out.erros.push({
          canal: 'whatsapp',
          mensagem: e instanceof Error ? e.message : 'Erro desconhecido',
        });
      }
    }
  }

  return out;
}
