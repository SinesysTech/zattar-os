'use client';

import {
  DocSection,
  DocActionList,
  DocTip,
  DocSteps,
} from '../../components/doc-components';
import {
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

export default function Dre() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">
          Demonstração de Resultado do Exercício
        </h1>
        <p className="text-muted-foreground mt-2">
          O DRE consolida receitas e despesas do período selecionado, apresentando o resultado
          líquido do escritório de forma estruturada por categorias do plano de contas.
        </p>
      </div>

      <DocSection title="Selecionando o Período">
        <p className="text-muted-foreground mb-4">
          O DRE é gerado para qualquer período de sua escolha. Use o seletor de período no topo
          da tela para definir o intervalo de análise:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Mês específico</li>
          <li>Trimestre</li>
          <li>Semestre</li>
          <li>Ano completo</li>
          <li>Período personalizado com datas de início e fim</li>
        </ul>
        <DocTip>
          Para análises anuais, selecione a visualização &quot;Mensal&quot; para ver o detalhamento mês a
          mês em uma única tabela, facilitando a identificação de sazonalidades.
        </DocTip>
      </DocSection>

      <DocSection title="Estrutura do DRE">
        <p className="text-muted-foreground mb-4">
          O demonstrativo segue a estrutura definida no Plano de Contas e apresenta:
        </p>
        <DocSteps
          steps={[
            {
              titulo: 'Receitas Brutas',
              descricao:
                'Total de todas as receitas operacionais do período (honorários, reembolsos, etc.).',
            },
            {
              titulo: 'Deduções de Receitas',
              descricao:
                'Impostos incidentes sobre receitas, devoluções e descontos concedidos.',
            },
            {
              titulo: 'Receita Líquida',
              descricao: 'Receita Bruta menos as Deduções.',
            },
            {
              titulo: 'Despesas Operacionais',
              descricao:
                'Custos com pessoal, aluguel, tecnologia, custas processuais e demais despesas.',
            },
            {
              titulo: 'Resultado Operacional',
              descricao: 'Receita Líquida menos as Despesas Operacionais.',
            },
            {
              titulo: 'Resultado Líquido',
              descricao:
                'Resultado após receitas e despesas financeiras (juros, IOF, rendimentos).',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Abas de Visualização">
        <DocActionList
          actions={[
            {
              icon: BarChart3,
              nome: 'Estrutura',
              descricao:
                'Visão consolidada do DRE com todos os grupos, subgrupos e totais do período.',
            },
            {
              icon: TrendingUp,
              nome: 'Receitas',
              descricao:
                'Detalhamento somente das receitas, com drill-down até o nível de conta.',
            },
            {
              icon: Filter,
              nome: 'Despesas',
              descricao:
                'Detalhamento somente das despesas, com drill-down até o nível de conta.',
            },
            {
              icon: Calendar,
              nome: 'Evolução',
              descricao:
                'Gráfico de linhas mostrando a evolução mensal de receitas, despesas e resultado ao longo do ano.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Comparativo com Orçamento">
        <p className="text-muted-foreground mb-4">
          Ao habilitar o comparativo orçado, o DRE exibe colunas adicionais para cada linha:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>
            <strong>Orçado:</strong> valor planejado no orçamento aprovado do período
          </li>
          <li>
            <strong>Realizado:</strong> valor efetivo dos lançamentos
          </li>
          <li>
            <strong>Desvio R$:</strong> diferença absoluta entre orçado e realizado
          </li>
          <li>
            <strong>Desvio %:</strong> variação percentual em relação ao orçado
          </li>
        </ul>
        <DocTip>
          Para usar o comparativo com orçamento, é necessário ter um orçamento aprovado para o
          período selecionado. Acesse Financeiro &gt; Orçamentos para criar e aprovar orçamentos.
        </DocTip>
      </DocSection>

      <DocSection title="Exportação">
        <DocActionList
          actions={[
            {
              icon: Download,
              nome: 'Exportar PDF',
              descricao:
                'Gera o DRE em PDF formatado com logo e cabeçalho do escritório, pronto para apresentação.',
            },
            {
              icon: FileSpreadsheet,
              nome: 'Exportar XLSX',
              descricao:
                'Exporta o DRE em planilha Excel com todas as colunas, incluindo comparativo orçado quando ativado.',
            },
            {
              icon: RefreshCw,
              nome: 'Atualizar Dados',
              descricao:
                'Recarrega o DRE com os lançamentos mais recentes, útil durante o fechamento do período.',
            },
          ]}
        />
        <DocTip>
          O PDF exportado inclui automaticamente a data de geração e o período de referência no
          rodapé, facilitando o controle de versões dos relatórios enviados à diretoria.
        </DocTip>
      </DocSection>

      <DocSection title="Drill-down por Categoria">
        <p className="text-muted-foreground">
          Clique em qualquer linha do DRE para expandir o detalhamento hierárquico da conta ou
          para visualizar os lançamentos individuais que compõem aquele valor. O drill-down
          permite navegar desde o grupo principal até o lançamento específico, facilitando
          a auditoria e verificação dos dados.
        </p>
      </DocSection>
    </div>
  );
}
