import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { buscarExpediente, listarLogsPorExpediente } from '@/app/(authenticated)/expedientes/service';
import { ResultadoDecisao } from '@/app/(authenticated)/expedientes/domain';
import { service as usuariosService } from '@/app/(authenticated)/usuarios/service';
import * as tiposExpedientesService from '@/app/(authenticated)/tipos-expedientes/service';

import { ExpedienteDetalhesClient } from './expediente-detalhes-client';
import type {
  DetalheArquivo,
  DetalheHistoricoEvento,
  DetalheTipo,
  DetalheUsuario,
  ExpedienteDetalheBundle,
} from './types';

export const dynamic = 'force-dynamic';

interface ExpedientePageProps {
  params: Promise<{ id: string }>;
}

function parseExpedienteId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isNaN(id) || id <= 0 ? null : id;
}

function inferTipoArquivo(nome: string): DetalheArquivo['tipo'] {
  const ext = nome.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'docx';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'imagem';
  return 'outro';
}

async function carregarBundle(
  expedienteId: number
): Promise<ExpedienteDetalheBundle | null> {
  const expedienteResult = await buscarExpediente(expedienteId);
  if (!expedienteResult.success || !expedienteResult.data) return null;
  const expediente = expedienteResult.data;

  const [usuariosResult, tiposResult] = await Promise.all([
    usuariosService.listarUsuarios({ ativo: true }),
    tiposExpedientesService.listar({ limite: 1000 }),
  ]);

  const usuarios: DetalheUsuario[] = usuariosResult.usuarios.map((u) => ({
    id: u.id,
    nomeExibicao: u.nomeExibicao,
    nomeCompleto: u.nomeCompleto,
    avatarUrl: u.avatarUrl,
    cargo: u.cargo?.nome,
  }));

  const tiposExpedientes: DetalheTipo[] = tiposResult.data.map((t) => ({
    id: t.id,
    tipo_expediente: t.tipoExpediente,
  }));

  // O schema atual guarda 0 ou 1 arquivo por expediente nas colunas
  // arquivo_nome / arquivo_url. Uma tabela dedicada ainda não existe.
  const arquivos: DetalheArquivo[] =
    expediente.arquivoNome && expediente.arquivoUrl
      ? [
          {
            id: `expediente-${expediente.id}-arquivo`,
            nome: expediente.arquivoNome,
            tipo: inferTipoArquivo(expediente.arquivoNome),
            tamanhoBytes: 0,
            url: expediente.arquivoUrl,
            criadoEm: expediente.createdAt,
            categoria: 'intimacao',
          },
        ]
      : [];

const logsResult = await listarLogsPorExpediente(expedienteId);
  const historicoRaw = logsResult.success && logsResult.data ? logsResult.data : [];

  const historico: DetalheHistoricoEvento[] = historicoRaw.map((log) => {
    // Tenta mapear o tipo_evento do banco para o union type suportado
    let tipoMapeado: DetalheHistoricoEvento['tipo'] = 'alteracao_observacoes'; // fallback padrão
    const te = log.tipo_evento;

    if (te === 'criacao') tipoMapeado = 'criacao';
    else if (te === 'atribuicao_responsavel') tipoMapeado = 'atribuicao_responsavel';
    else if (te === 'alteracao_tipo') tipoMapeado = 'alteracao_tipo';
    else if (te === 'alteracao_tipo_descricao') tipoMapeado = 'alteracao_descricao'; // Assumindo mapeamento aproximado
    else if (te === 'alteracao_observacoes') tipoMapeado = 'alteracao_observacoes';
    else if (te === 'baixa') tipoMapeado = 'baixa';
    else if (te === 'reversao_baixa') tipoMapeado = 'reversao_baixa';
    else if (te === 'visualizacao') tipoMapeado = 'visualizacao';

    // Gera uma descricao automatica caso o front requeira
    let descricao = 'Alteração no expediente';
    if (tipoMapeado === 'criacao') descricao = 'Expediente criado';
    else if (tipoMapeado === 'atribuicao_responsavel') descricao = 'Responsável alterado';
    else if (tipoMapeado === 'alteracao_tipo') descricao = 'Tipo alterado';
    else if (tipoMapeado === 'alteracao_descricao') descricao = 'Descrição ou tipo alterado';
    else if (tipoMapeado === 'baixa') descricao = 'Expediente baixado';
    else if (tipoMapeado === 'reversao_baixa') descricao = 'Baixa revertida';

    return {
      id: String(log.id),
      tipo: tipoMapeado,
      data: log.created_at,
      autorId: log.usuario_que_executou_id,
      descricao,
      dadosAnteriores: log.dados_evento as Record<string, unknown>, // the actual front end might expect old vs new
      dadosNovos: log.dados_evento as Record<string, unknown>
    };
  });

  return {
    expediente,
    usuarios,
    tiposExpedientes,
    arquivos,
    historico,
    decisaoOptions: Object.values(ResultadoDecisao),
  };
}

export async function generateMetadata({
  params,
}: ExpedientePageProps): Promise<Metadata> {
  const { id } = await params;
  const expedienteId = parseExpedienteId(id);
  if (expedienteId === null) return { title: 'Expediente não encontrado · ZattarOS' };

  const result = await buscarExpediente(expedienteId);
  const expediente = result.success ? result.data : null;
  if (!expediente) return { title: 'Expediente não encontrado · ZattarOS' };

  const titulo = expediente.numeroProcesso
    ? `Expediente ${expediente.numeroProcesso}`
    : `Expediente #${expedienteId}`;

  return {
    title: `${titulo} · ZattarOS`,
    description: expediente.descricaoArquivos?.slice(0, 160) ??
      'Visualização detalhada do expediente com edição inline, arquivos e histórico.',
  };
}

export default async function ExpedientePage({ params }: ExpedientePageProps) {
  const { id } = await params;
  const expedienteId = parseExpedienteId(id);
  if (expedienteId === null) notFound();

  const bundle = await carregarBundle(expedienteId);
  if (!bundle) notFound();

  return <ExpedienteDetalhesClient bundle={bundle} expedienteId={expedienteId} />;
}
