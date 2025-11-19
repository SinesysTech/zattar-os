'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RepassePendente {
  parcelaId: number;
  acordoCondenacaoId: number;
  processoId: number;
  numeroParcela: number;
  valorRepasseCliente: number;
  statusRepasse: 'pendente_declaracao' | 'pendente_transferencia';
  dataEfetivacao: string;
}

interface RepassesPendentesListProps {
  onAnexarDeclaracao?: (parcelaId: number) => void;
  onRealizarRepasse?: (parcelaId: number, valorRepasse: number) => void;
}

export function RepassesPendentesList({
  onAnexarDeclaracao,
  onRealizarRepasse,
}: RepassesPendentesListProps) {
  const [repasses, setRepasses] = useState<RepassePendente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRepasses();
  }, []);

  const loadRepasses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/repasses');
      const data = await response.json();

      if (response.ok && data.success) {
        setRepasses(data.data || []);
      } else {
        setError(data.error || 'Erro ao carregar repasses');
      }
    } catch (err) {
      setError('Erro ao comunicar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: 'pendente_declaracao' | 'pendente_transferencia') => {
    const configs = {
      pendente_declaracao: {
        label: 'Aguardando Declaração',
        variant: 'secondary' as const,
      },
      pendente_transferencia: {
        label: 'Pronto para Transferir',
        variant: 'default' as const,
      },
    };

    const config = configs[status];

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Agrupar por status
  const repassesPorStatus = {
    pendente_declaracao: repasses.filter((r) => r.statusRepasse === 'pendente_declaracao'),
    pendente_transferencia: repasses.filter((r) => r.statusRepasse === 'pendente_transferencia'),
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando repasses...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pendentes de Declaração */}
      {repassesPorStatus.pendente_declaracao.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Aguardando Declaração de Prestação de Contas</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Valor Repasse</TableHead>
                  <TableHead>Data Recebimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repassesPorStatus.pendente_declaracao.map((repasse) => (
                  <TableRow key={repasse.parcelaId}>
                    <TableCell className="font-medium">{repasse.processoId}</TableCell>
                    <TableCell>{repasse.numeroParcela}</TableCell>
                    <TableCell>{formatCurrency(repasse.valorRepasseCliente)}</TableCell>
                    <TableCell>{formatDate(repasse.dataEfetivacao)}</TableCell>
                    <TableCell>{getStatusBadge(repasse.statusRepasse)}</TableCell>
                    <TableCell className="text-right">
                      {onAnexarDeclaracao && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAnexarDeclaracao(repasse.parcelaId)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Anexar Declaração
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pendentes de Transferência */}
      {repassesPorStatus.pendente_transferencia.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Prontos para Transferência</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Valor Repasse</TableHead>
                  <TableHead>Data Recebimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repassesPorStatus.pendente_transferencia.map((repasse) => (
                  <TableRow key={repasse.parcelaId}>
                    <TableCell className="font-medium">{repasse.processoId}</TableCell>
                    <TableCell>{repasse.numeroParcela}</TableCell>
                    <TableCell>{formatCurrency(repasse.valorRepasseCliente)}</TableCell>
                    <TableCell>{formatDate(repasse.dataEfetivacao)}</TableCell>
                    <TableCell>{getStatusBadge(repasse.statusRepasse)}</TableCell>
                    <TableCell className="text-right">
                      {onRealizarRepasse && (
                        <Button
                          size="sm"
                          onClick={() => onRealizarRepasse(repasse.parcelaId, repasse.valorRepasseCliente)}
                        >
                          <FileCheck className="h-4 w-4 mr-1" />
                          Realizar Repasse
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Nenhum repasse pendente */}
      {repasses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum repasse pendente no momento
        </div>
      )}
    </div>
  );
}
