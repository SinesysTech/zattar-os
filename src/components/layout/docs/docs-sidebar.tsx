'use client';

import * as React from 'react';
import {
  BookOpen,
  Rocket,
  Layers,
  Plug,
  Palette,
  HelpCircle,
  Gavel,
  Calendar,
  ClipboardList,
  Banknote,
  Download,
  Code,
  Bot,
  Shield,
  Type,
  Component,
  FileText,
  FileSignature,
  Smartphone,
  Wrench,
  FolderTree,
  Scale,
  MapPin,
  HardDrive,
  FileCode,
  Terminal,
  Container,
  Settings,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocsNavSection, type NavSection } from './docs-nav-item';

const docsNavigation: NavSection[] = [
  {
    title: 'Início',
    items: [
      {
        title: 'Visão Geral',
        href: '/primeiros-passos',
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        title: 'Primeiros Passos',
        href: '/primeiros-passos',
        icon: <Rocket className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Funcionalidades',
    items: [
      {
        title: 'Visão Geral',
        href: '/funcionalidades',
        icon: <Layers className="h-4 w-4" />,
      },
      {
        title: 'Processos',
        href: '/funcionalidades/processos',
        icon: <Gavel className="h-4 w-4" />,
      },
      {
        title: 'Audiências',
        href: '/funcionalidades/audiencias',
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        title: 'Expedientes',
        href: '/funcionalidades/expedientes',
        icon: <ClipboardList className="h-4 w-4" />,
      },
      {
        title: 'Acordos e Condenações',
        href: '/funcionalidades/acordos',
        icon: <Banknote className="h-4 w-4" />,
      },
      {
        title: 'Captura PJE',
        href: '/funcionalidades/captura',
        icon: <Download className="h-4 w-4" />,
      },
      {
        title: 'Documentos',
        href: '/funcionalidades/documentos',
        icon: <FileText className="h-4 w-4" />,
      },
      {
        title: 'Assinatura Digital',
        href: '/funcionalidades/assinatura-digital',
        icon: <FileSignature className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Integração',
    items: [
      {
        title: 'Visão Geral',
        href: '/integracao',
        icon: <Plug className="h-4 w-4" />,
      },
      {
        title: 'API REST',
        href: '/integracao/api',
        icon: <Code className="h-4 w-4" />,
      },
      {
        title: 'Ferramentas MCP',
        href: '/integracao/mcp',
        icon: <Bot className="h-4 w-4" />,
      },
      {
        title: 'Permissões',
        href: '/integracao/permissoes',
        icon: <Shield className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Design System',
    items: [
      {
        title: 'Visão Geral',
        href: '/design-system',
        icon: <Palette className="h-4 w-4" />,
      },
      {
        title: 'Tipografia',
        href: '/design-system/typography',
        icon: <Type className="h-4 w-4" />,
      },
      {
        title: 'Componentes',
        href: '/design-system/componentes',
        icon: <Component className="h-4 w-4" />,
      },
      {
        title: 'Responsividade',
        href: '/design-system/responsividade',
        icon: <Smartphone className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Desenvolvimento',
    items: [
      {
        title: 'Visão Geral',
        href: '/desenvolvimento',
        icon: <Wrench className="h-4 w-4" />,
      },
      {
        title: 'Arquitetura',
        href: '/desenvolvimento/arquitetura',
        icon: <FolderTree className="h-4 w-4" />,
      },
      {
        title: 'Arq. Assinatura Digital',
        href: '/desenvolvimento/arquitetura-assinatura-digital',
        icon: <FileSignature className="h-4 w-4" />,
      },
      {
        title: 'Integração PJE',
        href: '/desenvolvimento/integracao-pje',
        icon: <Scale className="h-4 w-4" />,
      },
      {
        title: 'Integração ViaCEP',
        href: '/desenvolvimento/integracao-viacep',
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        title: 'Integração Google Drive',
        href: '/desenvolvimento/integracao-google-drive',
        icon: <HardDrive className="h-4 w-4" />,
      },
      {
        title: 'API Swagger',
        href: '/desenvolvimento/api-swagger',
        icon: <FileCode className="h-4 w-4" />,
      },
      {
        title: 'Referência de API',
        href: '/desenvolvimento/api-referencia',
        icon: <Terminal className="h-4 w-4" />,
      },
      {
        title: 'Deploy',
        href: '/desenvolvimento/deploy',
        icon: <Container className="h-4 w-4" />,
      },
      {
        title: 'Variáveis de Ambiente',
        href: '/desenvolvimento/variaveis-ambiente',
        icon: <Settings className="h-4 w-4" />,
      },
      {
        title: 'Migrations',
        href: '/desenvolvimento/migrations',
        icon: <Database className="h-4 w-4" />,
      },
      {
        title: 'Troubleshooting',
        href: '/desenvolvimento/troubleshooting',
        icon: <AlertTriangle className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Suporte',
    items: [
      {
        title: 'FAQ',
        href: '/faq',
        icon: <HelpCircle className="h-4 w-4" />,
      },
    ],
  },
];

export function DocsSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r lg:block">
      <ScrollArea className="h-[calc(100vh-3.5rem)] py-6">
        <div className="space-y-6 px-4">
          {docsNavigation.map((section, index) => (
            <DocsNavSection key={index} section={section} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

// Exportar a navegação para uso em outros componentes (ex: mobile menu)
export { docsNavigation };
