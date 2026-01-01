"use client";

import * as React from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "@/components/shared/CardActionMenus";
import { CHART_PALETTE } from "@/components/ui/charts/mini-chart";

// Cores para os gráficos (usando a paleta do projeto)
const COLORS = CHART_PALETTE;

// Função para obter label do estado
function getEstadoLabel(estado: string): string {
  const estadosNomes: Record<string, string> = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
    'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
    'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
    'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
    'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
    'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins',
  };
  return estadosNomes[estado] || estado;
}

interface LeadBySourceCardProps {
  data?: Array<{ estado: string; count: number }>;
  error?: string;
}

export function LeadBySourceCard({ data, error }: LeadBySourceCardProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>Clientes por Estado</CardTitle>
          <CardAction className="relative">
            <ExportButton className="absolute end-0 top-0" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex items-center justify-center h-[250px]">
            <p className="text-sm text-muted-foreground">
              {error || 'Nenhum dado disponível'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    estado: item.estado,
    label: getEstadoLabel(item.estado),
    clientes: item.count,
    color: COLORS[index % COLORS.length],
  }));

  const totalClientes = chartData.reduce((acc, curr) => acc + curr.clientes, 0);
  const CHART_WIDTH = 300;
  const CHART_HEIGHT = 250;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row justify-between">
        <CardTitle>Clientes por Estado</CardTitle>
        <CardAction className="relative">
          <ExportButton className="absolute end-0 top-0" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {/* Gráfico de Pizza */}
          <div className="flex items-center justify-center">
            <div style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
              <PieChart width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) =>
                    `${value} ${value === 1 ? "cliente" : "clientes"}`
                  }
                  labelFormatter={(label) => getEstadoLabel(String(label))}
                />
                <Pie
                  data={chartData}
                  cx={CHART_WIDTH / 2}
                  cy={CHART_HEIGHT / 2}
                  dataKey="clientes"
                  nameKey="estado"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
          </div>

          {/* Total e Legenda dos estados */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalClientes.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">Total de Clientes</p>
            </div>
            
            <div className="flex justify-around flex-wrap gap-4">
              {chartData.map((item) => (
                <div className="flex flex-col" key={item.estado}>
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="block size-2 rounded-full"
                      style={{
                        backgroundColor: item.color
                      }}></span>
                    <div className="text-xs tracking-wide uppercase">
                      {item.label}
                    </div>
                  </div>
                  <div className="ms-3.5 text-lg font-semibold">{item.clientes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
