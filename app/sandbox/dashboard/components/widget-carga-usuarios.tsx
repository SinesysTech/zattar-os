'use client';

import { Users, Scale, Calendar, FileCheck, FolderOpen } from 'lucide-react';
import { WidgetWrapper } from './widget-wrapper';
import { MiniBarChart, CHART_PALETTE } from './mini-chart';
import { CargaUsuario } from '../types/dashboard.types';

interface WidgetCargaUsuariosProps {
  data: CargaUsuario[];
  loading?: boolean;
  error?: string;
  className?: string;
  onRemove?: () => void;
}

function UserLoadBar({ usuario, total, maxTotal }: { usuario: CargaUsuario; total: number; maxTotal: number }) {
  const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate">{usuario.usuario.nome_exibicao}</span>
        <span className="text-muted-foreground">{total} itens</span>
      </div>
      <div className="flex h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: CHART_PALETTE[0],
          }}
        />
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Scale className="h-3 w-3" />
          {usuario.processos}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {usuario.audiencias}
        </span>
        <span className="flex items-center gap-1">
          <FileCheck className="h-3 w-3" />
          {usuario.pendentes}
        </span>
        <span className="flex items-center gap-1">
          <FolderOpen className="h-3 w-3" />
          {usuario.expedientes}
        </span>
      </div>
    </div>
  );
}

export function WidgetCargaUsuarios({
  data,
  loading,
  error,
  className,
  onRemove,
}: WidgetCargaUsuariosProps) {
  const maxTotal = Math.max(...data.map((u) => u.total), 1);
  const totalGeral = data.reduce((acc, u) => acc + u.total, 0);
  const mediaTotal = data.length > 0 ? totalGeral / data.length : 0;

  // Dados para o gráfico de barras horizontal
  const chartData = data.slice(0, 5).map((u) => ({
    name: u.usuario.nome_exibicao,
    value: u.total,
  }));

  return (
    <WidgetWrapper
      title="Carga por Usuário"
      icon={Users}
      loading={loading}
      error={error}
      className={className}
      onRemove={onRemove}
    >
      <div className="space-y-4">
        {/* Resumo geral */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div>
            <p className="text-2xl font-bold">{totalGeral}</p>
            <p className="text-xs text-muted-foreground">itens totais</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">{mediaTotal.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">média/usuário</p>
          </div>
        </div>

        {/* Gráfico de barras horizontal */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Top 5 usuários</p>
          <MiniBarChart
            data={chartData}
            horizontal
            height={150}
            color={CHART_PALETTE[0]}
            showYAxis
          />
        </div>

        {/* Lista detalhada */}
        <div className="space-y-4 pt-3 border-t">
          <p className="text-xs font-medium text-muted-foreground">Detalhamento</p>
          {data.slice(0, 4).map((usuario) => (
            <UserLoadBar
              key={usuario.usuario.id}
              usuario={usuario}
              total={usuario.total}
              maxTotal={maxTotal}
            />
          ))}
        </div>
      </div>
    </WidgetWrapper>
  );
}
