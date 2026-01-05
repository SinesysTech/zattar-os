import { Gavel, Search, Users, Filter, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProcessosDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Gavel className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Processos</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Gestão completa do acervo processual com visualização, filtros avançados e atribuição de responsáveis.
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Busca Avançada</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Encontre processos rapidamente por número, cliente, parte contrária ou qualquer informação relevante.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Filtros Múltiplos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Filtre por TRT, grau de jurisdição, responsável, status e muito mais para encontrar exatamente o que precisa.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Atribuição de Responsáveis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Atribua advogados responsáveis aos processos para melhor organização e distribuição de trabalho.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Sincronização PJE</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Mantenha os dados sempre atualizados com sincronização automática do PJE-TRT.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* How to Use */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Como Usar</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h3>Acessando o Acervo</h3>
          <ol>
            <li>No menu lateral, clique em <strong>Acervo</strong></li>
            <li>Você verá a lista de todos os processos ativos</li>
            <li>Use os filtros no topo para refinar a busca</li>
          </ol>

          <h3>Filtrando Processos</h3>
          <p>Os filtros disponíveis incluem:</p>
          <ul>
            <li><strong>TRT:</strong> Selecione um tribunal específico (TRT1 a TRT24)</li>
            <li><strong>Grau:</strong> Primeiro ou segundo grau</li>
            <li><strong>Responsável:</strong> Filtre por advogado responsável</li>
            <li><strong>Busca:</strong> Pesquise por número do processo, nome do cliente ou parte contrária</li>
          </ul>

          <h3>Atribuindo Responsável</h3>
          <ol>
            <li>Clique no processo desejado para abrir os detalhes</li>
            <li>No campo <strong>Responsável</strong>, selecione o advogado</li>
            <li>A atribuição é salva automaticamente</li>
          </ol>

          <h3>Visualizando Detalhes</h3>
          <p>
            Ao clicar em um processo, você tem acesso a todas as informações:
          </p>
          <ul>
            <li>Dados do processo (número, vara, classe judicial)</li>
            <li>Partes envolvidas (cliente, parte contrária, terceiros)</li>
            <li>Audiências agendadas</li>
            <li>Expedientes pendentes</li>
            <li>Timeline de movimentações</li>
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
            <li>Use a busca global para encontrar processos rapidamente</li>
            <li>Combine filtros para resultados mais precisos</li>
            <li>Atribua responsáveis para facilitar a distribuição de trabalho</li>
            <li>Verifique regularmente os processos sem responsável atribuído</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
