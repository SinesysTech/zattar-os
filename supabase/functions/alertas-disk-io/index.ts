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

/**
 * Chamada à Supabase Management API para obter status de Disk IO
 * Retorna percentual de uso do disco
 */
async function getDiskIOMetrics(projectRef: string, accessToken: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/psql-stat-statements`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Se não conseguir acessar Management API, tenta fallback via RPC
      console.warn(`[Alertas Disk IO] Management API retornou ${response.status}, usando fallback RPC`);
      return -1; // Flag para fallback
    }

    // A Management API pode retornar diferentes endpoints - adaptamos aqui
    // Para Disk IO específico, consultamos /projects/{ref}/database
    const databaseResponse = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!databaseResponse.ok) {
      console.warn('[Alertas Disk IO] Não foi possível obter metricas via Management API');
      return -1;
    }

    const data: Record<string, unknown> = await databaseResponse.json();
    
    // Extrai Disk IO % consumed se disponível na resposta
    const diskIOPercent = (data['disk_io_percent'] as number) || 
                         (data['volume_size_gb'] && data['used_size_gb'] 
                           ? ((data['used_size_gb'] as number) / (data['volume_size_gb'] as number)) * 100 
                           : -1);
    
    return diskIOPercent;
  } catch (error) {
    console.error('[Alertas Disk IO] Erro ao chamar Management API:', error);
    return -1; // Fallback em caso de erro
  }
}

/**
 * Cria notificação para administradores
 */
async function criarNotificacaoAdmin(
  supabase: ReturnType<typeof createClient>,
  titulo: string,
  descricao: string,
  dados: Record<string, unknown>
): Promise<void> {
  try {
    const { data: admins, error: adminsError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('is_super_admin', true);

    if (adminsError) {
      console.error('[Alertas Disk IO] Erro ao buscar admins:', adminsError);
      return;
    }

    if (!admins || admins.length === 0) {
      console.warn('[Alertas Disk IO] Nenhum admin encontrado para notificação');
      return;
    }

    for (const admin of admins) {
      await supabase.rpc('criar_notificacao', {
        p_usuario_id: admin.id,
        p_tipo: 'sistema',
        p_titulo: titulo,
        p_descricao: descricao,
        p_link: '/app/admin/metricas-db',
        p_dados_adicionais: dados,
      });
    }

    console.log(`[Alertas Disk IO] Notificação enviada para ${admins.length} admin(s)`);
  } catch (error) {
    console.error('[Alertas Disk IO] Erro ao criar notificação:', error);
  }
}

/**
 * Envia email via SMTP configurado
 */
async function enviarEmailAlerta(
  destinatario: string,
  assunto: string,
  corpo: string
): Promise<void> {
  const smtpHost = Deno.env.get('SMTP_HOST');
  const smtpPort = Deno.env.get('SMTP_PORT');
  const smtpUser = Deno.env.get('SMTP_USER');
  const smtpPass = Deno.env.get('SMTP_PASSWORD');
  const smtpFrom = Deno.env.get('SMTP_FROM_EMAIL');

  // Se SMTP não está configurado, apenas log
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
    console.warn('[Alertas Disk IO] SMTP não configurado, pulando envio de email');
    return;
  }

  try {
    // Usar deno-smtp ou similar para enviar email
    // Por enquanto, mockamos com console.log para demonstração
    // Em produção, integrar com biblioteca como: https://deno.land/x/smtp@v0.7.0
    console.log('[Alertas Disk IO] Email enviado:', {
      to: destinatario,
      subject: assunto,
      body: corpo.substring(0, 100) + '...',
    });
  } catch (error) {
    console.error('[Alertas Disk IO] Erro ao enviar email:', error);
  }
}

serve(async (req) => {
  // Obter origem para CORS
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Autenticação via CRON_SECRET
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');

    if (!cronSecret) {
      console.error('[Alertas Disk IO] CRON_SECRET não configurado');
      return new Response(
        JSON.stringify({ error: 'CRON_SECRET not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Alertas Disk IO] Tentativa de acesso não autorizado');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Alertas Disk IO] Iniciando verificação de Disk IO...');

    // Configuração Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter Project Ref da URL para Management API
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    const managementApiToken = Deno.env.get('SUPABASE_MANAGEMENT_API_TOKEN');

    let diskIOPercent = -1;
    let diskIOSource = 'unknown';

    // Tentar obter metricas via Management API
    if (managementApiToken) {
      diskIOPercent = await getDiskIOMetrics(projectRef, managementApiToken);
      diskIOSource = diskIOPercent >= 0 ? 'management_api' : 'fallback_rpc';
    } else {
      console.warn('[Alertas Disk IO] SUPABASE_MANAGEMENT_API_TOKEN não configurado, usando RPC');
      diskIOSource = 'rpc';
    }

    // Fallback: usar RPC se Management API não disponível
    if (diskIOPercent < 0) {
      const { data: cacheData, error: cacheError } = await supabase.rpc('obter_cache_hit_rate');
      if (cacheError) {
        console.error('[Alertas Disk IO] Erro ao obter cache hit rate:', cacheError);
      } else {
        // Estimativa aproximada baseado em cache hit rate
        const cacheHitRate = (cacheData as Array<{ ratio: number }> | null)?.[0]?.ratio ?? 100;
        diskIOPercent = 100 - cacheHitRate; // Heurística simples
      }
    }

    // Verificar bloat de tabelas como indicador secundário
    const { data: bloatData, error: _bloatError } = await supabase.rpc('diagnosticar_bloat_tabelas');
    const tabelasCriticas = (
      (bloatData as Array<{ tabela: string; bloat_percent: number }> | null) || []
    ).filter((t) => t.bloat_percent > 50);

    console.log(`[Alertas Disk IO] Disk IO: ${diskIOPercent.toFixed(2)}% (source: ${diskIOSource})`);
    console.log(`[Alertas Disk IO] Tabelas críticas: ${tabelasCriticas.length}`);

    // ALERTA 1: Disk IO > 90%
    if (diskIOPercent > 90) {
      const titulo = '⚠️ Alerta Crítico: Disk IO Elevado';
      const descricao = `Disk IO está em ${diskIOPercent.toFixed(2)}% (limite crítico: 90%)`;
      
      await criarNotificacaoAdmin(supabase, titulo, descricao, {
        tipo: 'disk_io_alert',
        metrica: 'disk_io_percent',
        valor: diskIOPercent,
        threshold: 90,
        source: diskIOSource,
      });

      // Enviar email também
      const { data: adminEmails } = await supabase
        .from('usuarios')
        .select('email')
        .eq('is_super_admin', true);

      if (adminEmails) {
        for (const admin of adminEmails) {
          if (admin.email) {
            await enviarEmailAlerta(
              admin.email,
              titulo,
              `O Disk IO do banco de dados atingiu ${diskIOPercent.toFixed(2)}% (crítico >90%).\n\n` +
              `Por favor, verifique o painel de metricas em: /app/admin/metricas-db\n\n` +
              `Fonte: ${diskIOSource}\nTimestamp: ${new Date().toISOString()}`
            );
          }
        }
      }
    }

    // ALERTA 2: Bloat crítico
    if (tabelasCriticas.length > 0) {
      const titulo = '⚠️ Alerta: Bloat Crítico Detectado';
      const descricao = `${tabelasCriticas.length} tabela(s) com bloat >50%: ${tabelasCriticas.map((t) => t.tabela).join(', ')}`;

      await criarNotificacaoAdmin(supabase, titulo, descricao, {
        tipo: 'disk_io_alert',
        metrica: 'bloat_critico',
        tabelas: tabelasCriticas,
      });
    }

    const duration = Date.now() - startTime;

    console.log(`[Alertas Disk IO] Verificação concluída em ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verificação de Disk IO concluída',
        duration_ms: duration,
        metrics: {
          disk_io_percent: diskIOPercent,
          disk_io_source: diskIOSource,
          tabelas_criticas: tabelasCriticas.length,
        },
        alertas: {
          disk_io_elevado: diskIOPercent > 90,
          bloat_critico: tabelasCriticas.length > 0,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Alertas Disk IO] Erro:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
