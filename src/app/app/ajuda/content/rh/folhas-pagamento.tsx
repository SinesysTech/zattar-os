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
  Eye,
  Download,
  CheckCircle,
  FileText,
  Users,
  Calendar,
  BarChart3,
} from 'lucide-react';

export default function FolhasPagamento() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Folhas de Pagamento</h1>
        <p className="text-muted-foreground mt-2">
          Gere a folha de pagamento mensal do escritório, visualize o detalhamento por
          colaborador e acesse relatórios mensais consolidados.
        </p>
      </div>

      <DocSection title="Gerando a Folha Mensal">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse RH > Folhas de Pagamento',
              descricao: 'No menu lateral, vá em RH > Folhas de Pagamento.',
            },
            {
              titulo: 'Clique em "Gerar Folha"',
              descricao: 'O botão fica no canto superior direito da listagem.',
            },
            {
              titulo: 'Selecione o mês e ano de referência',
              descricao:
                'Escolha o período da folha a ser gerada.',
            },
            {
              titulo: 'Revise os colaboradores incluídos',
              descricao:
                'O sistema lista todos os colaboradores ativos. Desmarque eventuais ausências ou afastamentos.',
            },
            {
              titulo: 'Confirme e gere',
              descricao:
                'O sistema calcula automaticamente os valores com base nas composições salariais vigentes.',
            },
            {
              titulo: 'Revise e aprove a folha',
              descricao:
                'Verifique os totais e, se correto, marque a folha como aprovada para bloquear edições.',
            },
          ]}
        />
        <DocTip>
          A geração da folha usa as composições salariais vigentes na data de competência. Se
          houve alteração salarial no meio do mês, o sistema aplica a proporcionalidade
          automaticamente.
        </DocTip>
      </DocSection>

      <DocSection title="Campos da Folha de Pagamento">
        <DocFieldTable
          fields={[
            {
              campo: 'Mês de Referência',
              tipo: 'Mês/Ano',
              obrigatorio: true,
              descricao: 'Período de competência da folha.',
            },
            {
              campo: 'Data de Pagamento',
              tipo: 'Data',
              obrigatorio: false,
              descricao: 'Data em que os salários serão efetivamente pagos.',
            },
            {
              campo: 'Status',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Rascunho, Aprovado ou Pago.',
            },
            {
              campo: 'Observações',
              tipo: 'Texto longo',
              obrigatorio: false,
              descricao: 'Notas gerais sobre a competência, ex: "13º salário incluído".',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Detalhamento por Colaborador">
        <p className="text-muted-foreground mb-4">
          Ao clicar em um colaborador dentro da folha, o sistema exibe o demonstrativo individual:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Salário base do período</li>
          <li>Adicionais aplicados (hora extra, adicional noturno, bonificações)</li>
          <li>Descontos aplicados (INSS, IRRF, faltas)</li>
          <li>Benefícios (vale refeição, vale transporte, plano de saúde)</li>
          <li>Total de proventos</li>
          <li>Total de descontos</li>
          <li>Salário líquido a pagar</li>
        </ul>
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Plus,
              nome: 'Gerar Folha',
              descricao: 'Cria a folha de pagamento para o período selecionado.',
            },
            {
              icon: Eye,
              nome: 'Visualizar Folha',
              descricao: 'Abre o detalhamento completo da folha com todos os colaboradores.',
            },
            {
              icon: Users,
              nome: 'Ver por Colaborador',
              descricao: 'Exibe o demonstrativo individual de pagamento de cada colaborador.',
            },
            {
              icon: CheckCircle,
              nome: 'Aprovar Folha',
              descricao: 'Marca a folha como aprovada e bloqueia edições posteriores.',
            },
            {
              icon: Calendar,
              nome: 'Registrar Pagamento',
              descricao: 'Registra a data de pagamento da folha e atualiza o status para Pago.',
            },
            {
              icon: FileText,
              nome: 'Gerar Holerite',
              descricao:
                'Gera o holerite individual de cada colaborador em PDF para envio ou impressão.',
            },
            {
              icon: BarChart3,
              nome: 'Relatório Mensal',
              descricao:
                'Gera relatório consolidado da folha com totais de proventos, descontos e encargos.',
            },
            {
              icon: Download,
              nome: 'Exportar',
              descricao: 'Exporta a folha completa em XLSX ou PDF para envio à contabilidade.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Relatório Mensal">
        <p className="text-muted-foreground mb-4">
          O relatório mensal da folha de pagamento consolida:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Total bruto da folha</li>
          <li>Total de descontos (INSS, IRRF, outros)</li>
          <li>Total líquido a pagar</li>
          <li>Encargos patronais (FGTS, INSS patronal)</li>
          <li>Custo total de pessoal do período</li>
          <li>Comparativo com mês anterior e acumulado do ano</li>
        </ul>
        <DocTip>
          O relatório da folha pode ser exportado e enviado diretamente ao contador do escritório.
          Configure o e-mail do contador em Configurações &gt; Sistema para habilitar o envio
          automático após a aprovação da folha.
        </DocTip>
      </DocSection>

      <DocSection title="Histórico de Folhas">
        <p className="text-muted-foreground">
          A listagem principal exibe o histórico de todas as folhas geradas, com data de
          geração, período de competência, data de pagamento e status. Folhas aprovadas ficam
          arquivadas e podem ser reabertas por administradores caso seja necessária alguma
          correção retroativa.
        </p>
      </DocSection>
    </div>
  );
}
