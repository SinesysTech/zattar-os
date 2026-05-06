import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/typography';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { actionBuscarAssistente, requireAuth } from '@/app/(authenticated)/assistentes/feature';
import { getDifyAppAction } from '@/lib/dify/actions';
import { AssistenteNativoView } from './components/assistente-nativo-view';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  const result = await actionBuscarAssistente(id);

  if (!result.success || !result.data) {
    return {
      title: 'Assistente não encontrado | ZattarOS',
    };
  }

  return {
    title: `${result.data.nome} | Assistentes | ZattarOS`,
    description: result.data.descricao || 'Detalhes do assistente',
  };
}

export default async function AssistenteDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  await requireAuth(['assistentes:listar']);

  const result = await actionBuscarAssistente(id);

  if (!result.success || !result.data) {
    return (
      <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex flex-col items-center justify-center p-8 stack-default")}>
        <Heading level="section" className="text-destructive">Assistente não encontrado</Heading>
        <Button asChild variant="outline">
          <Link href="/assistentes">Voltar</Link>
        </Button>
      </div>
    );
  }

  const assistente = result.data;

  // Renderização nativa para assistentes Dify
  if (assistente.tipo === 'dify' && assistente.dify_app_id) {
    const difyApp = await getDifyAppAction(assistente.dify_app_id);

    if (!difyApp) {
      return (
        <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex flex-col items-center justify-center p-8 stack-default")}>
          <Heading level="section" className="text-destructive">App Dify não encontrado</Heading>
          <p className={cn("text-body-sm text-muted-foreground")}>
            O app Dify vinculado a este assistente foi removido.
          </p>
          <Button asChild variant="outline">
            <Link href="/assistentes">Voltar</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; md:p-6 sem equivalente DS */ "flex-1 p-4 md:p-6 h-full flex flex-col")}>
        <div className="border rounded-md flex-1 overflow-hidden bg-background min-h-0 flex flex-col">
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS; px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "flex items-center gap-3 border-b px-4 py-3 shrink-0")}>
            <Button asChild variant="ghost" size="icon" aria-label="Voltar" className="h-7 w-7 shrink-0">
              <Link href="/assistentes">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <small className="text-sm font-medium leading-none">{assistente.nome}</small>
          </div>
          <div className="flex-1 min-h-0">
            <AssistenteNativoView appId={difyApp.id} appType={difyApp.app_type} metadata={difyApp.metadata ?? null} />
          </div>
        </div>
      </div>
    );
  }

  // Renderização iframe (comportamento original)
  return (
    <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; md:p-6 sem equivalente DS */ "flex-1 p-4 md:p-6 h-full flex flex-col")}>
      <div className="border rounded-md flex-1 overflow-hidden bg-background min-h-0 flex flex-col">
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS; px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "flex items-center gap-3 border-b px-4 py-3 shrink-0")}>
          <Button asChild variant="ghost" size="icon" aria-label="Voltar" className="h-7 w-7 shrink-0">
            <Link href="/assistentes">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <small className="text-sm font-medium leading-none">{assistente.nome}</small>
        </div>
        <div className="flex-1 min-h-0">
          <div
            className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
            dangerouslySetInnerHTML={{ __html: assistente.iframe_code || '' }}
          />
        </div>
      </div>
    </div>
  );
}
