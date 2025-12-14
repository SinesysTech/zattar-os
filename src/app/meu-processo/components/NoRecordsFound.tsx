'use client';

import { Bot, CircleCheck, RefreshCw, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface NoRecordsFoundProps {
  cpf?: string;
}

export function NoRecordsFound({ cpf }: NoRecordsFoundProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCpf = cpf || searchParams.get('cpf') || '';

  // Formatar CPF para exibição
  const formatCpf = (cpf: string) => {
    if (!cpf || cpf.length !== 11) return cpf;
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="max-w-md mx-auto">
        {/* Ícone do próprio robô */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
          <Bot className="h-8 w-8 text-primary" />
        </div>
  
        {/* Título */}
        <h1 className="text-2xl font-bold tracking-tight mb-4">
          Investigação Concluída
        </h1>
  
        {/* Mensagem principal */}
        <div className="space-y-3 mb-8">
          <p className="text-muted-foreground">
            Missão cumprida! Vasculhei todo o sistema em busca de registros para o CPF{' '}
            <span className="font-mono font-medium text-foreground">
              {formatCpf(currentCpf)}
            </span>
            .
          </p>
          
          <p className="text-sm text-muted-foreground font-medium">
            Minha varredura confirmou a ausência de:
          </p>
          
          {/* Usamos ícones de check para indicar que cada item foi verificado */}
          <ul className="text-sm text-muted-foreground space-y-1 text-left inline-block">
            <li className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-green-500" /> Contratos registrados</li>
            <li className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-green-500" /> Processos em andamento</li>
            <li className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-green-500" /> Audiências agendadas</li>
            <li className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-green-500" /> Pagamentos pendentes</li>
          </ul>
        </div>
  
        {/* Sugestões do Robô */}
        <div className="bg-muted/30 rounded-lg p-4 mb-8">
          <h3 className="font-medium text-sm mb-2">Recomendações do Detetive:</h3>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li>🕵️‍♂️ Dar uma olhada dupla no CPF. Um número pode mudar toda a história.</li>
            <li>🤔 Confirmar se este é o CPF correto para a consulta que você precisa fazer.</li>
            <li>📞 Se a dúvida persistir, nossa equipe de humanos está pronta para ajudar.</li>
          </ul>
        </div>
  
        {/* Botões de ação temáticos */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Search className="h-4 w-4" />
            Investigar Outro CPF
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Fazer Nova Varredura
          </button>
        </div>
      </div>
    </div>
  );
}
