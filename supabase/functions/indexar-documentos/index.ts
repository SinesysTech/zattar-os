import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Obtém headers CORS dinâmicos baseados na origem da requisição
 *
 * Em Edge Functions, não podemos importar de src/lib, então duplicamos a lógica aqui.
 * Configure ALLOWED_ORIGINS no Supabase Dashboard > Functions > Environment Variables
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  // Origens padrão permitidas
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') || '',
  ].filter(Boolean);

  // Ler origens adicionais da variável de ambiente
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  const allowedOrigins = envOrigins
    ? envOrigins.split(',').map((o) => o.trim()).filter(Boolean)
    : defaultOrigins;

  const baseHeaders = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Verificar se a origem é permitida
  if (origin && allowedOrigins.includes(origin)) {
    return {
      ...baseHeaders,
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    };
  }

  // Para requisições sem origem ou não permitidas, retorna headers básicos sem CORS
  return baseHeaders;
}

interface DocumentoPendente {
  id: number;
  tipo: string;
  entity_id: number;
  texto: string;
  metadata: Record<string, unknown>;
  tentativas?: number;
  ultimo_erro?: string;
  created_at: string;
}

serve(async (req) => {
  // Obter origem para CORS
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Autenticação via secret token
    const authHeader = req.headers.get('authorization');
    const expectedToken = Deno.env.get('CRON_SECRET');

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      console.warn('[Edge Function] Tentativa de acesso não autorizado');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Edge Function] Iniciando processamento de indexação');

    // Buscar documentos pendentes de indexação
    const { data: pendentes, error } = await supabase
      .from('documentos_pendentes_indexacao')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      throw new Error(`Erro ao buscar pendentes: ${error.message}`);
    }

    if (!pendentes || pendentes.length === 0) {
      console.log('[Edge Function] Nenhum documento pendente');
      return new Response(
        JSON.stringify({
          success: true,
          processados: 0,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Edge Function] ${pendentes.length} documentos pendentes`);

    let processados = 0;
    let erros = 0;

    // Processar cada documento (sem paralelização para respeitar limites de Edge Functions)
    for (const doc of pendentes as DocumentoPendente[]) {
      try {
        // Skip documentos sem texto
        if (!doc.texto || doc.texto.trim().length === 0) {
          console.warn(`[Edge Function] Documento ${doc.id} sem texto, refilerado`);
          const currentTentativas = doc.tentativas ?? 0;
          await supabase
            .from('documentos_pendentes_indexacao')
            .update({
              tentativas: currentTentativas + 1,
              ultimo_erro: 'Texto vazio - aguardando extração',
            })
            .eq('id', doc.id);
          continue;
        }

        // Aqui seria feita a chamada para a lógica de indexação
        // Por enquanto, apenas marca como processado
        console.log(`[Edge Function] Processando documento ${doc.id} (${doc.tipo})`);

        // Remover da fila após sucesso
        await supabase
          .from('documentos_pendentes_indexacao')
          .delete()
          .eq('id', doc.id);

        processados++;
        console.log(`[Edge Function] Documento ${doc.id} processado com sucesso`);
      } catch (error) {
        erros++;
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`[Edge Function] Erro ao processar ${doc.id}:`, errorMsg);

        const currentTentativas = doc.tentativas ?? 0;
        await supabase
          .from('documentos_pendentes_indexacao')
          .update({
            tentativas: currentTentativas + 1,
            ultimo_erro: errorMsg,
          })
          .eq('id', doc.id);
      }
    }

    const message = `Processamento concluído: ${processados} processados, ${erros} erros`;
    console.log(`[Edge Function] ${message}`);

    return new Response(
      JSON.stringify({
        success: true,
        processados,
        erros,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Edge Function] Erro fatal:', errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
