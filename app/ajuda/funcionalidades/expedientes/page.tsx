import { ClipboardList, Clock, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExpedientesDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Expedientes</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Gerenciamento completo de expedientes manuais, controle de prazos e baixas de manifestações.
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Controle de Prazos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Acompanhe todos os prazos legais com alertas visuais para expedientes próximos do vencimento.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Baixa de Expedientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Registre a conclusão de expedientes com protocolo ou justificativa, mantendo histórico completo.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Alertas de Vencimento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Identifique rapidamente expedientes vencidos ou próximos do prazo com indicadores visuais.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Atribuição</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Distribua expedientes entre a equipe e acompanhe quem é responsável por cada tarefa.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Types */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Tipos de Expedientes</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h3>Expedientes Manuais</h3>
          <p>
            Expedientes criados manualmente pelo usuário para controle interno de prazos e tarefas.
          </p>
          <ul>
            <li>Podem ser vinculados a qualquer processo</li>
            <li>Permitem definir tipo, descrição e prazo</li>
            <li>Podem ser atribuídos a responsáveis</li>
          </ul>

          <h3>Pendentes de Manifestação</h3>
          <p>
            Expedientes capturados automaticamente do PJE que requerem manifestação do escritório.
          </p>
          <ul>
            <li>Sincronizados automaticamente com o PJE</li>
            <li>Incluem prazo legal definido pelo tribunal</li>
            <li>Requerem baixa com protocolo ou justificativa</li>
          </ul>
        </div>
      </div>

      {/* How to Use */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Como Usar</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h3>Criando Expediente Manual</h3>
          <ol>
            <li>Acesse o processo desejado</li>
            <li>Clique em <strong>Novo Expediente</strong></li>
            <li>Preencha tipo, descrição e prazo</li>
            <li>Opcionalmente, atribua um responsável</li>
            <li>Salve o expediente</li>
          </ol>

          <h3>Baixando um Expediente</h3>
          <ol>
            <li>Localize o expediente na lista</li>
            <li>Clique no botão <strong>Baixar</strong></li>
            <li>Informe o número do protocolo OU uma justificativa</li>
            <li>Confirme a baixa</li>
          </ol>

          <h3>Revertendo uma Baixa</h3>
          <p>
            Caso necessário, é possível reverter a baixa de um expediente:
          </p>
          <ol>
            <li>Localize o expediente baixado</li>
            <li>Clique em <strong>Reverter Baixa</strong></li>
            <li>Confirme a reversão</li>
          </ol>
        </div>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Verifique diariamente os expedientes com prazo vencido</li>
            <li>Use filtros para ver apenas seus expedientes</li>
            <li>Sempre informe o protocolo ao baixar expedientes com manifestação</li>
            <li>Organize os expedientes por prioridade usando os tipos</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
