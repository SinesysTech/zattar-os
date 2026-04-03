'use client';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, type LucideIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ---------------------------------------------------------------------------
// DocSection — wrapper de seção com título e âncora
// ---------------------------------------------------------------------------

export function DocSection({
  id,
  title,
  children,
  className,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const anchor = id ?? title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  return (
    <section id={anchor} className={cn('space-y-4', className)}>
      <h2 className="text-xl font-semibold tracking-tight font-heading scroll-mt-20">
        <a href={`#${anchor}`} className="hover:underline underline-offset-4">
          {title}
        </a>
      </h2>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// DocFieldTable — tabela de campos
// ---------------------------------------------------------------------------

export type FieldDef = {
  campo: string;
  tipo?: string;
  obrigatorio?: boolean;
  descricao: string;
};

export function DocFieldTable({ fields }: { fields: FieldDef[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-45">Campo</TableHead>
            <TableHead className="w-25">Tipo</TableHead>
            <TableHead className="w-25">Obrigatório</TableHead>
            <TableHead>Descrição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((f) => (
            <TableRow key={f.campo}>
              <TableCell className="font-medium">{f.campo}</TableCell>
              <TableCell className="text-muted-foreground">{f.tipo ?? '—'}</TableCell>
              <TableCell>{f.obrigatorio ? 'Sim' : 'Não'}</TableCell>
              <TableCell>{f.descricao}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DocActionList — lista de ações com ícone
// ---------------------------------------------------------------------------

export type ActionDef = {
  icon?: LucideIcon;
  nome: string;
  descricao: string;
};

export function DocActionList({ actions }: { actions: ActionDef[] }) {
  return (
    <ul className="space-y-3">
      {actions.map((a) => (
        <li key={a.nome} className="flex items-start gap-3">
          {a.icon && <a.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />}
          <div>
            <span className="font-medium">{a.nome}</span>
            <span className="text-muted-foreground"> — {a.descricao}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// DocTip — callout de dica
// ---------------------------------------------------------------------------

export function DocTip({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Lightbulb className="h-4 w-4 text-primary" />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

// ---------------------------------------------------------------------------
// DocSteps — passos numerados
// ---------------------------------------------------------------------------

export type StepDef = {
  titulo: string;
  descricao: string;
};

export function DocSteps({ steps }: { steps: StepDef[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {i + 1}
          </span>
          <div className="pt-0.5">
            <p className="font-medium">{s.titulo}</p>
            <p className="text-muted-foreground text-sm">{s.descricao}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
