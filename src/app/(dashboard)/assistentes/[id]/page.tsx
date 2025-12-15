import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { actionBuscarAssistente, requireAuth } from '@/features/assistentes';
// import { checkMultiplePermissions } from '@/lib/auth/authorization';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const result = await actionBuscarAssistente(id);
  
  if (!result.success || !result.data) {
    return {
      title: 'Assistente não encontrado | Sinesys',
    };
  }

  return {
    title: `${result.data.nome} | Assistentes | Sinesys`,
    description: result.data.descricao || 'Detalhes do assistente',
  };
}

export default async function AssistenteDetalhesPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  await requireAuth(['assistentes:listar']);
  
  const result = await actionBuscarAssistente(id);

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <h2 className="text-xl font-semibold text-red-500">Assistente não encontrado</h2>
        <Button asChild variant="outline">
          <Link href="/assistentes">Voltar</Link>
        </Button>
      </div>
    );
  }

  const assistente = result.data;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
         <Button asChild variant="ghost" size="icon">
            <Link href="/assistentes">
               <ChevronLeft className="h-4 w-4" />
            </Link>
         </Button>
         <div>
            <h2 className="text-3xl font-bold tracking-tight">{assistente.nome}</h2>
            {assistente.descricao && (
               <p className="text-muted-foreground">{assistente.descricao}</p>
            )}
         </div>
      </div>

      <div className="border rounded-md flex-1 overflow-hidden bg-white dark:bg-zinc-950">
        <div 
           className="w-full h-full"
           dangerouslySetInnerHTML={{ __html: assistente.iframe_code }} 
        />
      </div>
    </div>
  );
}
