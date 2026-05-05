'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Heading, Text } from '@/components/ui/typography';
import { useAgentContext } from '@copilotkit/react-core/v2';
import { DocumentosTab } from './components/documentos-tab';
import { BuscarTab } from './components/buscar-tab';
import { ConfiguracoesTab } from './components/configuracoes-tab';
import type { KnowledgeBase, KnowledgeDocument } from '../domain';

const TABS = [
  { id: 'documentos', label: 'Documentos' },
  { id: 'buscar', label: 'Buscar' },
  { id: 'configuracoes', label: 'Configurações' },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface Props {
  base: KnowledgeBase;
  documentos: KnowledgeDocument[];
  isSuperAdmin: boolean;
}

export function ConhecimentoDetalheClient({ base, documentos, isSuperAdmin }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const currentTab: TabId = (searchParams.get('tab') as TabId) ?? 'documentos';

  useAgentContext({
    description: 'Detalhe de uma base de conhecimento',
    value: {
      base_slug: base.slug,
      base_nome: base.nome,
      total_documentos: documentos.length,
      tab_atual: currentTab,
    },
  });

  function setTab(tab: TabId) {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Link href="/conhecimento" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Bases de conhecimento
      </Link>

      <header>
        <Heading level="page">{base.nome}</Heading>
        {base.descricao && <Text variant="body" className="text-muted-foreground mt-1">{base.descricao}</Text>}
      </header>

      <nav className="border-b">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`px-4 py-2 text-sm border-b-2 transition ${
                currentTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {currentTab === 'documentos' && (
        <DocumentosTab base={base} documentos={documentos} isSuperAdmin={isSuperAdmin} />
      )}
      {currentTab === 'buscar' && <BuscarTab base={base} />}
      {currentTab === 'configuracoes' && (
        <ConfiguracoesTab base={base} isSuperAdmin={isSuperAdmin} />
      )}
    </div>
  );
}
