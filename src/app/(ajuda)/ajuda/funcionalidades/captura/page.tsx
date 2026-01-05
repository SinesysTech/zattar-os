import { Download, RefreshCw, Shield, Clock, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CapturaDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Download className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Captura PJE</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Automação de captura de dados do PJE-TRT com suporte a todos os 24 Tribunais Regionais do Trabalho.
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Sincronização Automática</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Capture automaticamente processos, audiências, pendentes e timeline de movimentações.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Autenticação Segura</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Suporte a autenticação SSO com 2FA/OTP para acesso seguro aos tribunais.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Agendamento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Configure capturas programadas para manter os dados sempre atualizados.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Múltiplos Tribunais</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Suporte completo a todos os 24 TRTs brasileiros com configuração por tribunal.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Types */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Tipos de Captura</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h3>Acervo Geral</h3>
          <p>
            Captura todos os processos ativos vinculados ao advogado no tribunal selecionado.
          </p>

          <h3>Processos Arquivados</h3>
          <p>
            Captura processos que foram arquivados para manter o histórico completo.
          </p>

          <h3>Audiências</h3>
          <p>
            Captura todas as audiências agendadas com data, hora, tipo e local.
          </p>

          <h3>Pendentes de Manifestação</h3>
          <p>
            Captura intimações e notificações que requerem manifestação do escritório.
          </p>
        </div>
      </div>

      {/* How to Use */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Como Usar</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h3>Configurando Credenciais</h3>
          <ol>
            <li>Acesse <strong>Configurações → Credenciais PJE</strong></li>
            <li>Selecione o advogado</li>
            <li>Informe o login e senha do PJE</li>
            <li>Configure o 2FA no sistema 2FAuth (se necessário)</li>
            <li>Teste a conexão</li>
          </ol>

          <h3>Executando uma Captura</h3>
          <ol>
            <li>Acesse <strong>Captura</strong> no menu</li>
            <li>Selecione o tipo de captura</li>
            <li>Escolha o TRT e grau de jurisdição</li>
            <li>Selecione a credencial do advogado</li>
            <li>Clique em <strong>Iniciar Captura</strong></li>
          </ol>

          <h3>Acompanhando Execuções</h3>
          <p>
            O histórico de capturas mostra todas as execuções com:
          </p>
          <ul>
            <li>Data e hora de início/fim</li>
            <li>Status (em andamento, sucesso, erro)</li>
            <li>Quantidade de registros capturados</li>
            <li>Mensagens de erro (se houver)</li>
          </ul>
        </div>
      </div>

      {/* Supported TRTs */}
      <Card>
        <CardHeader>
          <CardTitle>Tribunais Suportados</CardTitle>
          <CardDescription>
            Todos os 24 Tribunais Regionais do Trabalho são suportados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {Array.from({ length: 24 }, (_, i) => (
              <div
                key={i + 1}
                className="text-center p-2 bg-muted rounded-md text-sm font-medium"
              >
                TRT{i + 1}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Mantenha as credenciais sempre atualizadas</li>
            <li>Execute capturas em horários de menor tráfego</li>
            <li>Verifique o histórico regularmente para identificar erros</li>
            <li>Configure agendamentos para capturas automáticas</li>
            <li>Em caso de erro, verifique se a senha não expirou</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
