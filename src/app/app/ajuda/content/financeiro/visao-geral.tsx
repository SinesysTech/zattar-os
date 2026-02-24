'use client';

import {
  DocSection,
  DocActionList,
  DocTip,
} from '../../components/doc-components';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  FileText,
  ArrowRightLeft,
  DollarSign,
  PieChart,
} from 'lucide-react';

export default function FinanceiroVisaoGeral() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Financeiro — Visão Geral</h1>
        <p className="text-muted-foreground mt-2">
          O módulo Financeiro centraliza todas as operações financeiras do escritório, desde o
          controle de receitas e despesas até a conciliação bancária e geração de relatórios
          gerenciais.
        </p>
      </div>

      <DocSection title="Painel Principal">
        <p className="text-muted-foreground">
          O dashboard financeiro exibe os principais indicadores do período selecionado em tempo
          real. Os cards de resumo mostram:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Receita total do mês corrente</li>
          <li>Despesas totais do mês corrente</li>
          <li>Resultado líquido (receitas menos despesas)</li>
          <li>Contas a receber em aberto</li>
          <li>Contas a pagar vencidas ou a vencer</li>
          <li>Saldo consolidado de todas as contas bancárias</li>
        </ul>
        <DocTip>
          Clique em qualquer card de resumo para navegar diretamente ao módulo correspondente com
          o filtro de período já aplicado.
        </DocTip>
      </DocSection>

      <DocSection title="Gráficos e Métricas">
        <p className="text-muted-foreground mb-4">
          O painel inclui visualizações gráficas que facilitam a análise do desempenho financeiro
          ao longo do tempo.
        </p>
        <DocActionList
          actions={[
            {
              icon: BarChart3,
              nome: 'Receitas x Despesas',
              descricao:
                'Gráfico de barras comparando receitas e despesas mês a mês nos últimos 12 meses.',
            },
            {
              icon: TrendingUp,
              nome: 'Evolução de Receitas',
              descricao:
                'Linha de tendência mostrando o crescimento (ou queda) da receita ao longo do período.',
            },
            {
              icon: TrendingDown,
              nome: 'Evolução de Despesas',
              descricao:
                'Linha de tendência das despesas, útil para identificar meses com gastos atípicos.',
            },
            {
              icon: PieChart,
              nome: 'Distribuição por Categoria',
              descricao:
                'Gráfico de pizza exibindo a proporção de cada categoria de despesa no total do período.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Acesso Rápido aos Submódulos">
        <p className="text-muted-foreground mb-4">
          A partir do painel financeiro você acessa diretamente cada submódulo:
        </p>
        <DocActionList
          actions={[
            {
              icon: TrendingUp,
              nome: 'Orçamentos',
              descricao:
                'Crie e gerencie orçamentos anuais ou mensais, compare com o realizado e analise desvios.',
            },
            {
              icon: TrendingDown,
              nome: 'Contas a Pagar',
              descricao:
                'Registre despesas, organize por categoria do plano de contas e marque como pagas.',
            },
            {
              icon: DollarSign,
              nome: 'Contas a Receber',
              descricao:
                'Registre receitas, vincule a contratos e honorários, e controle a inadimplência.',
            },
            {
              icon: FileText,
              nome: 'Plano de Contas',
              descricao:
                'Gerencie a estrutura hierárquica de categorias contábeis do escritório.',
            },
            {
              icon: ArrowRightLeft,
              nome: 'Conciliação Bancária',
              descricao:
                'Importe extratos bancários e reconcilie com os lançamentos do sistema.',
            },
            {
              icon: BarChart3,
              nome: 'DRE',
              descricao:
                'Visualize o Demonstrativo de Resultado do Exercício por período e compare com o orçado.',
            },
            {
              icon: CreditCard,
              nome: 'Conta Bancária',
              descricao:
                'Gerencie as contas bancárias do escritório e visualize saldos consolidados.',
            },
            {
              icon: Receipt,
              nome: 'Extrato',
              descricao:
                'Visualize o extrato consolidado de movimentações financeiras por conta e período.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Filtro de Período">
        <p className="text-muted-foreground">
          Todos os dados do painel financeiro respondem ao seletor de período localizado no canto
          superior direito. Você pode filtrar por:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Mês corrente</li>
          <li>Mês anterior</li>
          <li>Trimestre atual</li>
          <li>Ano corrente</li>
          <li>Período personalizado (data inicial e data final)</li>
        </ul>
        <DocTip>
          O período selecionado no painel principal é propagado automaticamente quando você navega
          para os submódulos, evitando a necessidade de refiltrar os dados.
        </DocTip>
      </DocSection>

      <DocSection title="Exportação de Dados">
        <p className="text-muted-foreground">
          O botão de exportação no painel permite gerar relatórios consolidados em formato PDF ou
          planilha (XLSX). Os relatórios exportados incluem todos os gráficos, tabelas e o período
          de referência selecionado. Para exportações detalhadas por submódulo, utilize a exportação
          disponível em cada tela específica.
        </p>
      </DocSection>
    </div>
  );
}
