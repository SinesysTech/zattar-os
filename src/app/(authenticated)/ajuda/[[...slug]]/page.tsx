'use client';

import { use, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Scale,
  Calendar,
  FolderOpen,
  Microscope,
  Handshake,
  CalendarCheck,
  FileEdit,
  PenTool,
  Briefcase,
  UserCog,
  Database,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveSlug } from '../docs-registry';

const categories = [
  {
    label: 'Navegação Principal',
    items: [
      { title: 'Dashboard', desc: 'Visão geral e métricas do escritório', icon: LayoutDashboard, href: '/app/ajuda/dashboard' },
      { title: 'Partes', desc: 'Clientes, partes contrárias, terceiros e representantes', icon: Users, href: '/app/ajuda/partes/clientes' },
      { title: 'Contratos', desc: 'Gestão de contratos de honorários', icon: FileText, href: '/app/ajuda/contratos' },
      { title: 'Processos', desc: 'Processos judiciais e timeline', icon: Scale, href: '/app/ajuda/processos' },
      { title: 'Audiências', desc: 'Agenda de audiências e pautas', icon: Calendar, href: '/app/ajuda/audiencias' },
      { title: 'Expedientes', desc: 'Intimações e prazos do tribunal', icon: FolderOpen, href: '/app/ajuda/expedientes' },
      { title: 'Perícias', desc: 'Perícias judiciais e laudos', icon: Microscope, href: '/app/ajuda/pericias' },
      { title: 'Obrigações', desc: 'Acordos, condenações e parcelas', icon: Handshake, href: '/app/ajuda/obrigacoes' },
    ],
  },
  {
    label: 'Serviços',
    items: [
      { title: 'Planner', desc: 'Agenda, tarefas e notas', icon: CalendarCheck, href: '/app/ajuda/planner/agenda' },
      { title: 'Documentos', desc: 'Editor de documentos com IA', icon: FileEdit, href: '/app/ajuda/documentos' },
      { title: 'Assinatura Digital', desc: 'Documentos, templates e formulários', icon: PenTool, href: '/app/ajuda/assinatura-digital/documentos' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { title: 'Financeiro', desc: 'Contas, orçamentos, DRE e conciliação', icon: Briefcase, href: '/app/ajuda/financeiro/visao-geral' },
      { title: 'Recursos Humanos', desc: 'Equipe, salários e folha de pagamento', icon: UserCog, href: '/app/ajuda/rh/equipe' },
      { title: 'Captura', desc: 'Captura automática de dados do PJE', icon: Database, href: '/app/ajuda/captura/historico' },
      { title: 'Configurações', desc: 'Perfil, integrações e preferências', icon: Settings, href: '/app/ajuda/configuracoes/perfil' },
    ],
  },
];

function DocLoading() {
  return (
    <div className="max-w-4xl space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight font-heading">Página não encontrada</h1>
      <p className="text-muted-foreground">
        O tópico de documentação que você procura não existe ou foi movido.
      </p>
      <Button variant="outline" asChild>
        <Link href="/app/ajuda">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a Central de Ajuda
        </Link>
      </Button>
    </div>
  );
}

function AjudaHome() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Central de Ajuda</h1>
        <p className="text-muted-foreground mt-2">
          Documentação completa do Sinesys. Navegue pelos módulos abaixo ou use a busca na barra lateral.
        </p>
      </div>

      {categories.map((cat) => (
        <div key={cat.label} className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">{cat.label}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {cat.items.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center gap-3 p-4">
                    <item.icon className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <CardTitle className="text-sm">{item.title}</CardTitle>
                      <CardDescription className="text-xs">{item.desc}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DocPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = use(params);

  if (!slug || slug.length === 0) {
    return <AjudaHome />;
  }

  const entry = resolveSlug(slug);

  if (!entry || !entry.component) {
    return <NotFound />;
  }

  const Component = entry.component;

  return (
    <Suspense fallback={<DocLoading />}>
      <Component />
    </Suspense>
  );
}
