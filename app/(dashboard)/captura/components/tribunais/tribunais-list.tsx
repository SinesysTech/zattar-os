'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTribunais } from '@/app/_lib/hooks/use-tribunais';
import { criarColunasTribunais } from './tribunais-columns';
import { TribunaisDialog } from './tribunais-dialog';
import type { TribunalConfig } from '@/app/_lib/types/tribunais';

/**
 * Componente de listagem de configurações de tribunais
 */
export function TribunaisList() {
  const {
    tribunais,
    tribunaisCodigos,
    tiposAcesso,
    isLoading,
    error,
    refetch,
  } = useTribunais();

  // Estados de filtros
  const [busca, setBusca] = useState('');
  const [filtroCodigo, setFiltroCodigo] = useState<string>('todos');
  const [filtroTipoAcesso, setFiltroTipoAcesso] = useState<string>('todos');

  // Estado do dialog
  const [tribunalDialog, setTribunalDialog] = useState<{
    open: boolean;
    tribunal: TribunalConfig | null;
  }>({
    open: false,
    tribunal: null,
  });

  // Handler para editar tribunal
  const handleEdit = (tribunal: TribunalConfig) => {
    setTribunalDialog({ open: true, tribunal });
  };

  // Filtrar tribunais
  const tribunaisFiltrados = tribunais.filter((tribunal) => {
    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase();
      const match =
        tribunal.tribunal_codigo.toLowerCase().includes(buscaLower) ||
        tribunal.tribunal_nome.toLowerCase().includes(buscaLower) ||
        tribunal.url_base.toLowerCase().includes(buscaLower) ||
        tribunal.url_login_seam.toLowerCase().includes(buscaLower) ||
        tribunal.url_api.toLowerCase().includes(buscaLower);

      if (!match) return false;
    }

    // Filtro de código do tribunal
    if (filtroCodigo !== 'todos' && tribunal.tribunal_codigo !== filtroCodigo) {
      return false;
    }

    // Filtro de tipo de acesso
    if (filtroTipoAcesso !== 'todos' && tribunal.tipo_acesso !== filtroTipoAcesso) {
      return false;
    }

    return true;
  });

  // Calcular estatísticas
  const totalTribunais = tribunais.length;
  const totalComTimeouts = tribunais.filter(
    (t) => t.custom_timeouts && Object.keys(t.custom_timeouts).length > 0
  ).length;
  const totalPrimeiroGrau = tribunais.filter((t) => t.tipo_acesso === 'primeiro_grau').length;
  const totalSegundoGrau = tribunais.filter((t) => t.tipo_acesso === 'segundo_grau').length;

  const colunas = criarColunasTribunais({
    onEdit: handleEdit,
  });

  return (
    <>
      <div className="space-y-4">
        {/* Cabeçalho e estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Configurações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTribunais}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {tribunaisCodigos.length} tribunais diferentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Primeiro Grau</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalPrimeiroGrau}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Login específico 1º grau
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Segundo Grau</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{totalSegundoGrau}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Login específico 2º grau
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Timeouts Customizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{totalComTimeouts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Com configurações especiais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Buscar por tribunal, código ou URL..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="max-w-sm"
          />

          <Select value={filtroCodigo} onValueChange={setFiltroCodigo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tribunal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tribunais</SelectItem>
              {tribunaisCodigos.map((codigo) => (
                <SelectItem key={codigo} value={codigo}>
                  {codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroTipoAcesso} onValueChange={setFiltroTipoAcesso}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Acesso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              <SelectItem value="primeiro_grau">1º Grau</SelectItem>
              <SelectItem value="segundo_grau">2º Grau</SelectItem>
              <SelectItem value="unificado">Unificado</SelectItem>
              <SelectItem value="unico">Único</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        {error ? (
          <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-center text-destructive">
            <p className="font-medium">Erro ao carregar configurações de tribunais</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <DataTable
            columns={colunas}
            data={tribunaisFiltrados}
            isLoading={isLoading}
            emptyMessage="Nenhuma configuração de tribunal encontrada"
          />
        )}
      </div>

      {/* Dialog para criar/editar */}
      <TribunaisDialog
        tribunal={tribunalDialog.tribunal}
        open={tribunalDialog.open}
        onOpenChange={(open) => setTribunalDialog({ open, tribunal: null })}
        onSuccess={() => {
          refetch();
          setTribunalDialog({ open: false, tribunal: null });
        }}
      />
    </>
  );
}
