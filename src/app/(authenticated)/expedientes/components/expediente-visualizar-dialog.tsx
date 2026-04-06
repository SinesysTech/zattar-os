'use client';

// Componente Sheet para visualizar detalhes completos de um expediente

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, FileText, Users, Building2, Scale, AlertCircle } from 'lucide-react';
import { Expediente, GrauTribunal, GRAU_TRIBUNAL_LABELS } from '../domain';
import type { Usuario } from '@/app/(authenticated)/usuarios';
import type { TipoExpediente } from '@/app/(authenticated)/tipos-expedientes';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import {
  DetailSheet,
  DetailSheetHeader,
  DetailSheetTitle,
  DetailSheetDescription,
  DetailSheetContent,
  DetailSheetSection,
  DetailSheetInfoRow,
  DetailSheetSeparator,
  DetailSheetMetaGrid,
  DetailSheetMetaItem,
  DetailSheetAudit,
  DetailSheetFooter,
  DetailSheetEmpty,
} from '@/components/shared/detail-sheet';


interface ExpedienteVisualizarDialogProps {
  expediente: Expediente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarios?: Usuario[];
  tiposExpedientes?: TipoExpediente[];
}

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 */
const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Formata data ISO para formato brasileiro com hora (DD/MM/YYYY HH:mm)
 */
const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Formata o grau para exibição
 */
const formatarGrau = (grau: GrauTribunal): string => {
  return GRAU_TRIBUNAL_LABELS[grau] || grau;
};

export function ExpedienteVisualizarDialog({
  expediente,
  open,
  onOpenChange,
  usuarios = [],
  tiposExpedientes = [],
}: ExpedienteVisualizarDialogProps) {
  if (!expediente) {
    return (
      <DetailSheet open={open} onOpenChange={onOpenChange}>
        <DetailSheetHeader>
          <DetailSheetTitle>Expediente</DetailSheetTitle>
        </DetailSheetHeader>
        <DetailSheetEmpty
          title="Expediente não encontrado"
          description="Os detalhes do expediente não estão disponíveis."
        />
        <DetailSheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DetailSheetFooter>
      </DetailSheet>
    );
  }

  const responsavel = usuarios.find(u => u.id === expediente.responsavelId);
  const tipoExpediente = tiposExpedientes.find(t => t.id === expediente.tipoExpedienteId);

  const handleAbrirPagina = () => {
    onOpenChange(false);
    // TODO: Navegar para /expedientes/[id] quando a página for criada
    // router.push(`/expedientes/${expediente.id}`);
  };

  const statusBadge = (
    <div className="flex items-center gap-1.5">
      <SemanticBadge
        category="status"
        value={expediente.baixadoEm ? 'BAIXADO' : 'PENDENTE'}
        variantOverride={expediente.baixadoEm ? 'neutral' : 'default'}
        toneOverride="soft"
      >
        {expediente.baixadoEm ? 'Baixado' : 'Pendente'}
      </SemanticBadge>
      {expediente.prazoVencido && !expediente.baixadoEm && (
        <SemanticBadge
          category="status"
          value="PRAZO_VENCIDO"
          variantOverride="destructive"
          toneOverride="soft"
        >
          Prazo Vencido
        </SemanticBadge>
      )}
    </div>
  );

  return (
    <DetailSheet open={open} onOpenChange={onOpenChange}>
      <DetailSheetHeader>
        <DetailSheetTitle badge={statusBadge}>
          {expediente.classeJudicial
            ? `${expediente.classeJudicial} ${expediente.numeroProcesso}`
            : expediente.numeroProcesso}
        </DetailSheetTitle>
        <DetailSheetDescription>
          <Scale className="h-3.5 w-3.5" />
          <span>{expediente.trt}</span>
          <span>·</span>
          <span>{formatarGrau(expediente.grau)}</span>
          {expediente.dataCriacaoExpediente && (
            <>
              <span>·</span>
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatarData(expediente.dataCriacaoExpediente)}</span>
            </>
          )}
        </DetailSheetDescription>
      </DetailSheetHeader>

      <DetailSheetContent>
        {/* Informações do Processo */}
        <DetailSheetSection icon={<Scale className="h-4 w-4" />} title="Informações do Processo">
          <DetailSheetInfoRow label="Número do Processo">
            {expediente.numeroProcesso}
          </DetailSheetInfoRow>
          {expediente.classeJudicial && (
            <DetailSheetInfoRow label="Classe Judicial">
              {expediente.classeJudicial}
            </DetailSheetInfoRow>
          )}
          <DetailSheetSeparator />
          <DetailSheetInfoRow label="TRT">
            <SemanticBadge category="tribunal" value={expediente.trt}>
              {expediente.trt}
            </SemanticBadge>
          </DetailSheetInfoRow>
          <DetailSheetInfoRow label="Grau">
            <SemanticBadge category="grau" value={expediente.grau}>
              {formatarGrau(expediente.grau)}
            </SemanticBadge>
          </DetailSheetInfoRow>
          {expediente.codigoStatusProcesso && (
            <DetailSheetInfoRow label="Status do Processo">
              {expediente.codigoStatusProcesso}
            </DetailSheetInfoRow>
          )}
        </DetailSheetSection>

        {/* Meta Grid: Flags do processo */}
        <DetailSheetMetaGrid>
          <DetailSheetMetaItem label="Prioridade">
            <SemanticBadge
              category="status"
              value={expediente.prioridadeProcessual ? 'ALTA' : 'NORMAL'}
              variantOverride={expediente.prioridadeProcessual ? 'warning' : 'neutral'}
              toneOverride="soft"
            >
              {expediente.prioridadeProcessual ? 'Sim' : 'Não'}
            </SemanticBadge>
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Segredo de Justiça">
            <SemanticBadge
              category="status"
              value={expediente.segredoJustica ? 'SEGREDO' : 'PUBLICO'}
              variantOverride={expediente.segredoJustica ? 'destructive' : 'neutral'}
              toneOverride="soft"
            >
              {expediente.segredoJustica ? 'Sim' : 'Não'}
            </SemanticBadge>
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Juízo Digital">
            <SemanticBadge
              category="status"
              value={expediente.juizoDigital ? 'DIGITAL' : 'FISICO'}
              variantOverride="neutral"
              toneOverride="soft"
            >
              {expediente.juizoDigital ? 'Sim' : 'Não'}
            </SemanticBadge>
          </DetailSheetMetaItem>
        </DetailSheetMetaGrid>

        {/* Partes Envolvidas */}
        <DetailSheetSection icon={<Users className="h-4 w-4" />} title="Partes Envolvidas">
          <DetailSheetInfoRow label="Parte Autora">
            <span className="text-right">
              {expediente.nomeParteAutora || '-'}
              {(expediente.qtdeParteAutora ?? 0) > 1 && (
                <span className="text-xs text-muted-foreground block">
                  {expediente.qtdeParteAutora} parte(s)
                </span>
              )}
            </span>
          </DetailSheetInfoRow>
          <DetailSheetInfoRow label="Parte Ré">
            <span className="text-right">
              {expediente.nomeParteRe || '-'}
              {expediente.qtdeParteRe && expediente.qtdeParteRe > 1 && (
                <span className="text-xs text-muted-foreground block">
                  {expediente.qtdeParteRe} parte(s)
                </span>
              )}
            </span>
          </DetailSheetInfoRow>
        </DetailSheetSection>

        {/* Órgão Julgador */}
        <DetailSheetSection icon={<Building2 className="h-4 w-4" />} title="Órgão Julgador">
          <DetailSheetInfoRow label="Descrição">
            {expediente.descricaoOrgaoJulgador || '-'}
          </DetailSheetInfoRow>
          {expediente.siglaOrgaoJulgador && (
            <DetailSheetInfoRow label="Sigla">
              <SemanticBadge
                category="status"
                value={expediente.siglaOrgaoJulgador}
                variantOverride="neutral"
                toneOverride="soft"
              >
                {expediente.siglaOrgaoJulgador}
              </SemanticBadge>
            </DetailSheetInfoRow>
          )}
        </DetailSheetSection>

        {/* Datas e Prazos */}
        <DetailSheetSection icon={<Calendar className="h-4 w-4" />} title="Datas e Prazos">
          <DetailSheetInfoRow label="Data de Autuação">
            {formatarData(expediente.dataAutuacao)}
          </DetailSheetInfoRow>
          <DetailSheetInfoRow label="Data de Ciência">
            {formatarData(expediente.dataCienciaParte)}
          </DetailSheetInfoRow>
          <DetailSheetInfoRow label="Prazo Legal">
            <span className={expediente.prazoVencido ? 'text-destructive font-semibold' : ''}>
              {formatarData(expediente.dataPrazoLegalParte)}
            </span>
          </DetailSheetInfoRow>
          <DetailSheetInfoRow label="Criação do Expediente">
            {formatarData(expediente.dataCriacaoExpediente)}
          </DetailSheetInfoRow>
          {expediente.dataArquivamento && (
            <DetailSheetInfoRow label="Data de Arquivamento">
              {formatarData(expediente.dataArquivamento)}
            </DetailSheetInfoRow>
          )}
          {expediente.baixadoEm && (
            <DetailSheetInfoRow label="Data de Baixa">
              {formatarDataHora(expediente.baixadoEm)}
            </DetailSheetInfoRow>
          )}
        </DetailSheetSection>

        {/* Tipo e Descrição */}
        {(tipoExpediente || expediente.descricaoArquivos) && (
          <DetailSheetSection icon={<FileText className="h-4 w-4" />} title="Tipo e Descrição">
            {tipoExpediente && (
              <DetailSheetInfoRow label="Tipo de Expediente">
                <SemanticBadge category="expediente_tipo" value={tipoExpediente.id}>
                  {tipoExpediente.tipoExpediente}
                </SemanticBadge>
              </DetailSheetInfoRow>
            )}
            {expediente.descricaoArquivos && (
              <>
                {tipoExpediente && <DetailSheetSeparator />}
                <DetailSheetInfoRow label="Descrição / Arquivos">
                  <span className="text-right">{expediente.descricaoArquivos}</span>
                </DetailSheetInfoRow>
              </>
            )}
          </DetailSheetSection>
        )}

        {/* Informações de Baixa */}
        {expediente.baixadoEm && (
          <DetailSheetSection icon={<AlertCircle className="h-4 w-4" />} title="Informações de Baixa">
            {expediente.protocoloId && (
              <DetailSheetInfoRow label="Protocolo ID">
                <span className="font-mono text-xs">{expediente.protocoloId}</span>
              </DetailSheetInfoRow>
            )}
            {expediente.justificativaBaixa && (
              <DetailSheetInfoRow label="Justificativa">
                <span className="text-right">{expediente.justificativaBaixa}</span>
              </DetailSheetInfoRow>
            )}
          </DetailSheetSection>
        )}

        {/* Responsável */}
        {responsavel && (
          <DetailSheetSection icon={<Users className="h-4 w-4" />} title="Responsável">
            <DetailSheetInfoRow label="Usuário Responsável">
              {responsavel.nomeExibicao || responsavel.nomeCompleto}
            </DetailSheetInfoRow>
          </DetailSheetSection>
        )}

        {/* Informações Técnicas */}
        <DetailSheetSection icon={<FileText className="h-4 w-4" />} title="Informações Técnicas">
          <DetailSheetInfoRow label="ID PJE">
            <span className="font-mono text-xs">{expediente.idPje || '-'}</span>
          </DetailSheetInfoRow>
          {expediente.idDocumento && (
            <DetailSheetInfoRow label="ID Documento">
              <span className="font-mono text-xs">{expediente.idDocumento}</span>
            </DetailSheetInfoRow>
          )}
        </DetailSheetSection>

        <DetailSheetAudit
          createdAt={expediente.createdAt}
          updatedAt={expediente.updatedAt}
        />
      </DetailSheetContent>

      <DetailSheetFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
        <Button onClick={handleAbrirPagina}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir Expediente
        </Button>
      </DetailSheetFooter>
    </DetailSheet>
  );
}
