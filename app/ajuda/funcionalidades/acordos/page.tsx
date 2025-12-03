import { Banknote, Calculator, Calendar, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AcordosDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Banknote className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Acordos e Condenações</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Controle financeiro completo de acordos, condenações, parcelas e cálculo automático de honorários.
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Registro de Acordos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Cadastre acordos e condenações com todos os detalhes: valor, parcelas, datas e condições.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Controle de Parcelas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Acompanhe o pagamento de parcelas com datas de vencimento e status de cada pagamento.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Cálculo de Honorários</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Calcule automaticamente os honorários advocatícios com base no valor do acordo e percentual configurado.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Relatórios Financeiros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Visualize relatórios de valores recebidos, a receber e repasses para clientes.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Types */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Tipos de Obrigações</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h3>Acordos</h3>
          <p>
            Valores negociados entre as partes para encerramento do processo de forma consensual.
          </p>
          <ul>
            <li>Podem ser parcelados</li>
            <li>Permitem registro de data do acordo</li>
            <li>Calculam honorários automaticamente</li>
          </ul>

          <h3>Condenações</h3>
          <p>
            Valores determinados por sentença judicial que devem ser pagos pela parte condenada.
          </p>
          <ul>
            <li>Registro do valor total da condenação</li>
            <li>Controle de parcelas (se aplicável)</li>
            <li>Acompanhamento de execução</li>
          </ul>
        </div>
      </div>

      {/* How to Use */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Como Usar</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h3>Registrando um Acordo</h3>
          <ol>
            <li>Acesse o processo relacionado</li>
            <li>Vá para a aba <strong>Acordos/Condenações</strong></li>
            <li>Clique em <strong>Novo Acordo</strong></li>
            <li>Preencha o valor total e data</li>
            <li>Configure o parcelamento (se houver)</li>
            <li>Defina o percentual de honorários</li>
            <li>Salve o registro</li>
          </ol>

          <h3>Registrando Pagamento de Parcela</h3>
          <ol>
            <li>Localize o acordo na lista</li>
            <li>Clique na parcela a ser marcada como paga</li>
            <li>Informe a data do pagamento</li>
            <li>Confirme o registro</li>
          </ol>

          <h3>Calculando Honorários</h3>
          <p>
            O sistema calcula automaticamente os honorários com base no percentual configurado:
          </p>
          <ul>
            <li>Honorários são calculados sobre o valor bruto</li>
            <li>O valor líquido para o cliente é exibido automaticamente</li>
            <li>Repasses são controlados separadamente</li>
          </ul>
        </div>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Mantenha os dados de pagamento sempre atualizados</li>
            <li>Verifique parcelas vencidas regularmente</li>
            <li>Confirme o percentual de honorários antes de registrar</li>
            <li>Use os relatórios para acompanhar o fluxo financeiro</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
