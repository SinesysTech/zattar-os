'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
} from '../../components/doc-components';
import {
  Plus,
  Copy,
  Pencil,
  Trash2,
  CheckCircle,
  BarChart3,
  Download,
  Eye,
} from 'lucide-react';

export default function Orcamentos() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Orçamentos</h1>
        <p className="text-muted-foreground mt-2">
          O módulo de Orçamentos permite criar planos financeiros por período, comparar valores
          orçados com o realizado e acompanhar desvios para uma gestão financeira mais eficiente.
        </p>
      </div>

      <DocSection title="Criando um Orçamento">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse o módulo de Orçamentos',
              descricao:
                'No menu lateral, navegue até Financeiro > Orçamentos.',
            },
            {
              titulo: 'Clique em "Novo Orçamento"',
              descricao:
                'O botão fica no canto superior direito da listagem.',
            },
            {
              titulo: 'Preencha os dados do orçamento',
              descricao:
                'Informe o nome, período de vigência e as metas por categoria do plano de contas.',
            },
            {
              titulo: 'Distribua os valores por mês',
              descricao:
                'Para cada categoria, informe o valor mensal previsto ou utilize a distribuição automática proporcional.',
            },
            {
              titulo: 'Salve e envie para aprovação (opcional)',
              descricao:
                'O orçamento pode ser salvo como rascunho ou submetido ao fluxo de aprovação.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos do Orçamento">
        <DocFieldTable
          fields={[
            {
              campo: 'Nome',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'Identificação do orçamento, ex: "Orçamento Anual 2025".',
            },
            {
              campo: 'Ano de Referência',
              tipo: 'Número',
              obrigatorio: true,
              descricao: 'Ano fiscal ao qual o orçamento se aplica.',
            },
            {
              campo: 'Período Inicial',
              tipo: 'Data',
              obrigatorio: true,
              descricao: 'Data de início da vigência do orçamento.',
            },
            {
              campo: 'Período Final',
              tipo: 'Data',
              obrigatorio: true,
              descricao: 'Data de encerramento da vigência do orçamento.',
            },
            {
              campo: 'Descrição',
              tipo: 'Texto longo',
              obrigatorio: false,
              descricao: 'Observações gerais ou premissas utilizadas na elaboração.',
            },
            {
              campo: 'Status',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Rascunho, Em aprovação, Aprovado ou Encerrado.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Plus,
              nome: 'Novo Orçamento',
              descricao: 'Cria um orçamento do zero para um novo período.',
            },
            {
              icon: Copy,
              nome: 'Duplicar',
              descricao:
                'Copia um orçamento existente como base para o novo período, economizando tempo no preenchimento.',
            },
            {
              icon: Pencil,
              nome: 'Editar',
              descricao:
                'Permite alterar valores e categorias de um orçamento em status de Rascunho ou Em aprovação.',
            },
            {
              icon: CheckCircle,
              nome: 'Aprovar',
              descricao:
                'Aprova o orçamento, tornando-o o plano oficial do período. Somente usuários com permissão podem aprovar.',
            },
            {
              icon: BarChart3,
              nome: 'Ver Análise',
              descricao:
                'Abre o painel comparativo orçado x realizado com desvios por categoria.',
            },
            {
              icon: Eye,
              nome: 'Visualizar',
              descricao: 'Exibe os valores do orçamento em modo somente leitura.',
            },
            {
              icon: Download,
              nome: 'Exportar',
              descricao: 'Exporta o orçamento em PDF ou planilha XLSX.',
            },
            {
              icon: Trash2,
              nome: 'Excluir',
              descricao: 'Remove um orçamento em status de Rascunho. Orçamentos aprovados não podem ser excluídos.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Comparativo Orçado x Realizado">
        <p className="text-muted-foreground mb-4">
          Ao clicar em &quot;Ver Análise&quot;, o sistema exibe uma tabela e gráfico comparando o valor
          orçado com o realizado para cada categoria do plano de contas. São apresentados:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Valor orçado por categoria e mês</li>
          <li>Valor realizado por categoria e mês (extraído dos lançamentos)</li>
          <li>Desvio absoluto (R$) e percentual (%)</li>
          <li>Indicador visual: verde para dentro do orçado, vermelho para acima</li>
        </ul>
        <DocTip>
          O campo de desvio percentual acima de 10% dispara um alerta visual. Use esse indicador
          para priorizar categorias que precisam de revisão.
        </DocTip>
      </DocSection>

      <DocSection title="Comparando Períodos">
        <p className="text-muted-foreground">
          Na tela de análise é possível selecionar dois orçamentos de períodos diferentes para
          comparação direta. Isso facilita identificar tendências de crescimento ou redução de
          custos e receitas entre exercícios.
        </p>
        <DocTip>
          Utilize a função &quot;Duplicar&quot; para criar o orçamento do ano seguinte com base nos valores
          do ano anterior já preenchidos, ajustando apenas as categorias que sofreram mudanças.
        </DocTip>
      </DocSection>

      <DocSection title="Fluxo de Aprovação">
        <p className="text-muted-foreground mb-4">
          Escritórios com controle de aprovação habilitado seguem o fluxo abaixo:
        </p>
        <DocSteps
          steps={[
            {
              titulo: 'Elaboração',
              descricao: 'O responsável financeiro cria o orçamento e o salva como Rascunho.',
            },
            {
              titulo: 'Submissão para aprovação',
              descricao: 'O orçamento é enviado para revisão. O status muda para "Em aprovação".',
            },
            {
              titulo: 'Revisão pelo aprovador',
              descricao:
                'O usuário com perfil de aprovador analisa os valores e pode solicitar ajustes ou aprovar.',
            },
            {
              titulo: 'Aprovação',
              descricao:
                'O orçamento é marcado como "Aprovado" e passa a ser utilizado nas análises comparativas.',
            },
          ]}
        />
      </DocSection>
    </div>
  );
}
