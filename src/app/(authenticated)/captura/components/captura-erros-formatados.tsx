'use client';

import { cn } from '@/lib/utils';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { XCircle, AlertTriangle, Clock, Wifi } from 'lucide-react';
import { formatarGrau, formatarFiltro } from '../utils/format-captura';

interface ErroCaptura {
  trt: string;
  grau: string;
  credencialId: string;
  filtro: string;
  mensagem: string;
  tipo: 'timeout' | 'auth' | 'network' | 'outro';
}

interface ErroAgrupado {
  tribunal: string;
  erros: ErroCaptura[];
}

const TIPO_ERRO_LABELS: Record<ErroCaptura['tipo'], string> = {
  timeout: 'Timeout',
  auth: 'Autenticação',
  network: 'Rede',
  outro: 'Outro',
};

function classificarErro(mensagem: string): ErroCaptura['tipo'] {
  const msg = mensagem.toLowerCase();
  if (msg.includes('timeout') || msg.includes('exceeded') || msg.includes('waitforselector')) {
    return 'timeout';
  }
  if (msg.includes('otp') || msg.includes('login') || msg.includes('jwt') || msg.includes('advogado')) {
    return 'auth';
  }
  if (msg.includes('network') || msg.includes('connection') || msg.includes('econnrefused')) {
    return 'network';
  }
  return 'outro';
}

function parsearErros(erro: string): ErroCaptura[] {
  // Padrão: "TRT4 primeiro_grau (ID 7) - sem_prazo: Campo OTP não apareceu..."
  const regex = /(\w+)\s+([\w_]+)\s+\(ID\s+(\d+)\)\s*-\s*([\w_]+):\s*([^;]+)/g;
  const erros: ErroCaptura[] = [];
  let match;

  while ((match = regex.exec(erro)) !== null) {
    erros.push({
      trt: match[1],
      grau: match[2],
      credencialId: match[3],
      filtro: match[4],
      mensagem: match[5].trim(),
      tipo: classificarErro(match[5]),
    });
  }

  if (erros.length === 0 && erro.trim()) {
    erros.push({
      trt: 'Desconhecido',
      grau: '',
      credencialId: '',
      filtro: '',
      mensagem: erro.trim(),
      tipo: 'outro',
    });
  }

  return erros;
}

function agruparPorTribunal(erros: ErroCaptura[]): ErroAgrupado[] {
  const mapa = new Map<string, ErroCaptura[]>();

  for (const erro of erros) {
    const chave = erro.trt;
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave)!.push(erro);
  }

  return Array.from(mapa.entries())
    .map(([tribunal, erros]) => ({ tribunal, erros }))
    .sort((a, b) => a.tribunal.localeCompare(b.tribunal));
}

function IconeErro({ tipo }: { tipo: ErroCaptura['tipo'] }) {
  switch (tipo) {
    case 'timeout': return <Clock className="h-3.5 w-3.5 text-warning shrink-0" />;
    case 'auth': return <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />;
    case 'network': return <Wifi className="h-3.5 w-3.5 text-warning shrink-0" />;
    default: return <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />;
  }
}

interface CapturaErrosFormatadosProps {
  erro: string;
}

export function CapturaErrosFormatados({ erro }: CapturaErrosFormatadosProps) {
  const errosParsed = parsearErros(erro);
  const grupos = agruparPorTribunal(errosParsed);

  const contagemPorTipo = errosParsed.reduce((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={cn("flex flex-col stack-default")}>
      {/* Cabeçalho de erros */}
      <div className={cn("flex items-start inline-medium rounded-lg border border-destructive/30 bg-destructive/[0.06] inset-card-compact")}>
        <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <div className={cn("flex flex-col stack-tight min-w-0 w-full")}>
          <p className={cn( "text-body-sm font-semibold text-destructive")}>
            {errosParsed.length} erro{errosParsed.length !== 1 ? 's' : ''} na captura
          </p>
          <div className={cn("flex flex-wrap inline-snug")}>
            {contagemPorTipo.timeout && (
              <Badge variant="outline" className={cn("flex text-[10px] px-1.5 py-0 inline-micro border-warning/30 bg-warning/5 text-warning-foreground")}>
                <Clock className="h-3 w-3 text-warning" />
                {contagemPorTipo.timeout} timeout{contagemPorTipo.timeout !== 1 ? 's' : ''}
              </Badge>
            )}
            {contagemPorTipo.auth && (
              <Badge variant="outline" className={cn("flex text-[10px] px-1.5 py-0 inline-micro border-destructive/30 bg-destructive/5")}>
                <AlertTriangle className="h-3 w-3 text-destructive" />
                {contagemPorTipo.auth} autenticação
              </Badge>
            )}
            {contagemPorTipo.network && (
              <Badge variant="outline" className={cn("flex text-[10px] px-1.5 py-0 inline-micro border-warning/30 bg-warning/5")}>
                <Wifi className="h-3 w-3 text-warning" />
                {contagemPorTipo.network} conexão de rede
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Erros agrupados por tribunal */}
      <div className={cn("flex flex-col stack-tight")}>
        {grupos.map((grupo) => (
          <div key={grupo.tribunal} className={cn(/* design-system-escape: p-3 → usar <Inset> */ "rounded-lg border p-3")}>
            <div className={cn("mb-2.5 flex items-center inline-tight")}>
              <p className={cn( "text-body-sm font-semibold text-foreground")}>{grupo.tribunal}</p>
              <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 font-normal")}>
                {grupo.erros.length} erro{grupo.erros.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className={cn("flex flex-col stack-tight")}>
              {grupo.erros.map((e, i) => (
                <div key={i} className={cn("flex items-start inline-tight text-caption")}>
                  <IconeErro tipo={e.tipo} />
                  <div className="min-w-0 flex-1">
                    <div className={cn("flex flex-wrap items-center inline-snug mb-1")}>
                      {e.grau && (
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 font-normal")}>
                          {formatarGrau(e.grau)}
                        </Badge>
                      )}
                      {e.filtro && (
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-normal")}>
                          {formatarFiltro(e.filtro)}
                        </Badge>
                      )}
                      {e.credencialId && (
                        <span className="text-muted-foreground font-mono">#{e.credencialId}</span>
                      )}
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-normal text-muted-foreground")}>
                        {TIPO_ERRO_LABELS[e.tipo]}
                      </Badge>
                    </div>
                    <p className={cn("text-muted-foreground leading-relaxed")}>{e.mensagem}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
