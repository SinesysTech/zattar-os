'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Toaster, toast } from '@/components/ui/sonner';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Users, TrendingUp, TrendingDown, FileText } from 'lucide-react';

import { MetricCard } from '@/components/modules/dashboard/metric-card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { TableSkeleton, MetricCardSkeleton } from '@/components/shared/skeletons';

export default function DesignSystemPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
      <header className="text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Design System - Test Bed
        </h1>
        <p className="mt-2 text-muted-foreground">
          Demonstração de componentes visuais da Zattar.
        </p>
      </header>

      {/* Botões */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Botões</h2>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-4">
          <Button>Padrão</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="destructive">Destrutivo</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Badges</h2>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-4">
          <Badge>Padrão</Badge>
          <Badge variant="secondary">Secundário</Badge>
          <Badge variant="destructive">Destrutivo</Badge>
          <Badge variant="success">Sucesso</Badge>
          <Badge variant="warning">Aviso</Badge>
          <Badge variant="outline">Contorno</Badge>
        </div>
      </section>

      {/* Inputs */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Inputs</h2>
        <Separator className="my-4" />
        <div className="max-w-sm">
          <Input placeholder="Escreva algo..." />
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Cards</h2>
        <Separator className="my-4" />
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Título do Card</CardTitle>
            <CardDescription>Descrição do card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Este é o conteúdo principal do card.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline">Ação</Button>
          </CardFooter>
        </Card>
      </section>
      
      {/* Metric Cards */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Metric Cards</h2>
        <p className="text-muted-foreground mt-1">Cards de métricas para dashboards com valores numéricos e tendências.</p>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
                title="Valor em Acordos"
                value="R$ 45.230,00"
                icon={<DollarSign />}
                description="Total do mês de Maio"
            />
            <MetricCard
                title="Novos Clientes"
                value="+5"
                icon={<Users />}
                trendValue="+15%"
                trend="up"
                description="Em relação ao mês passado"
            />
            <MetricCard
                title="Processos Finalizados"
                value="8"
                icon={<FileText />}
                trendValue="-2"
                trend="down"
                description="Em relação ao mês passado"
            />
        </div>
      </section>

      {/* Tabelas */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Tabelas</h2>
        <p className="text-muted-foreground mt-1">Componente de tabela com header, rows e hover states.</p>
        <Separator className="my-4" />
        <div className="rounded-xl border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>PROC-001</TableCell>
                        <TableCell>Ação Trabalhista v. Empresa X</TableCell>
                        <TableCell><Badge variant="success">Ativo</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>PROC-002</TableCell>
                        <TableCell>Recurso Ordinário v. Empresa Y</TableCell>
                        <TableCell><Badge variant="warning">Pendente</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>PROC-003</TableCell>
                        <TableCell>Consulta Jurídica - Sindicato Z</TableCell>
                        <TableCell><Badge variant="outline">Arquivado</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>PROC-004</TableCell>
                        <TableCell>Defesa em Processo Administrativo</TableCell>
                        <TableCell><Badge variant="destructive">Urgente</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>PROC-005</TableCell>
                        <TableCell>Elaboração de Contrato</TableCell>
                        <TableCell><Badge>Em andamento</Badge></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
      </section>

      {/* Loading States (Skeletons) */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Loading States (Skeletons)</h2>
        <p className="text-muted-foreground mt-1">Placeholders animados para estados de carregamento.</p>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="font-heading text-lg font-medium mb-4">Table Skeleton</h3>
                <TableSkeleton />
            </div>
            <div>
                <h3 className="font-heading text-lg font-medium mb-4">Metric Card Skeletons</h3>
                <div className="grid grid-cols-1 gap-4">
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                </div>
            </div>
        </div>
      </section>

      {/* Toasts */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Toasts (Notificações)</h2>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => toast.success('Sucesso!', { description: 'Ação completada com sucesso.' })}>
            Toast de Sucesso
          </Button>
          <Button variant="destructive" onClick={() => toast.error('Erro!', { description: 'Não foi possível completar a ação.' })}>
            Toast de Erro
          </Button>
          <Button variant="secondary" onClick={() => toast.info('Informação', { description: 'Esta é uma mensagem informativa.' })}>
            Toast de Informação
          </Button>
        </div>
      </section>
      <Toaster />
    </div>
  );
}