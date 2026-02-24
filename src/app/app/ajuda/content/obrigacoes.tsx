'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  type FieldDef,
  type ActionDef,
} from '../components/doc-components';
import {
  Plus,
  Pencil,
  Eye,
  CalendarDays,
  CalendarRange,
  List,
  DollarSign,
  CheckSquare,
  Bell,
  Filter,
  AlertTriangle,
} from 'lucide-react';

const fields: FieldDef[] = [
  {
    campo: 'Processo',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Processo judicial de origem da obrigação.',
  },
  {
    campo: 'Tipo',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Define a natureza da obrigação: Acordo (homologado em juízo) ou Condenação (sentença ou acórdão).',
  },
  {
    campo: 'Polo',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Indica se o escritório deve receber (credor) ou pagar (devedor) o valor. Determina o fluxo do rastreamento.',
  },
  {
    campo: 'Valor Total',
    tipo: 'Monetário',
    obrigatorio: true,
    descricao: 'Valor total da obrigação financeira fixada.',
  },
  {
    campo: 'Número de Parcelas',
    tipo: 'Número',
    obrigatorio: false,
    descricao: 'Quantidade de parcelas em que o valor será pago. Informe 1 para pagamento único.',
  },
  {
    campo: 'Valor da Parcela',
    tipo: 'Monetário',
    obrigatorio: false,
    descricao: 'Calculado automaticamente com base no valor total e no número de parcelas.',
  },
  {
    campo: 'Data da Primeira Parcela',
    tipo: 'Data',
    obrigatorio: false,
    descricao: 'Data de vencimento do primeiro pagamento. As demais são geradas mensalmente.',
  },
  {
    campo: 'Índice de Correção',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Índice de atualização monetária aplicável: IPCA, INPC, SELIC, IGP-M ou Sem Correção.',
  },
  {
    campo: 'Juros',
    tipo: 'Percentual',
    obrigatorio: false,
    descricao: 'Taxa de juros moratórios aplicável ao débito, em percentual ao mês.',
  },
  {
    campo: 'Status',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Situação da obrigação: Em Andamento, Quitada, Inadimplente, Parcialmente Paga, Cancelada.',
  },
  {
    campo: 'Descrição',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Descrição do objeto da obrigação, como o texto do acordo ou a ementa da condenação.',
  },
  {
    campo: 'Observações',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Notas sobre a execução, histórico de negociações ou providências pendentes.',
  },
];

const actions: ActionDef[] = [
  {
    icon: Plus,
    nome: 'Cadastrar Obrigação',
    descricao: 'Cria uma nova obrigação financeira vinculada a um processo, seja por acordo ou condenação.',
  },
  {
    icon: Pencil,
    nome: 'Editar',
    descricao: 'Atualiza dados da obrigação, como valores, índices de correção ou datas de parcelas.',
  },
  {
    icon: Eye,
    nome: 'Visualizar Detalhes',
    descricao: 'Exibe a ficha completa com todas as parcelas, histórico de pagamentos e saldo atualizado.',
  },
  {
    icon: DollarSign,
    nome: 'Registrar Pagamento',
    descricao: 'Marca uma ou mais parcelas como pagas, registrando a data, o valor efetivo e a forma de pagamento.',
  },
  {
    icon: CheckSquare,
    nome: 'Marcar como Quitada',
    descricao: 'Encerra a obrigação após a confirmação do pagamento integral.',
  },
  {
    icon: AlertTriangle,
    nome: 'Marcar Inadimplência',
    descricao: 'Registra que uma ou mais parcelas não foram pagas no vencimento, ativando alertas.',
  },
  {
    icon: Bell,
    nome: 'Configurar Lembrete',
    descricao: 'Define alertas automáticos antes do vencimento de cada parcela.',
  },
  {
    icon: CalendarDays,
    nome: 'Visão Semana',
    descricao: 'Exibe parcelas com vencimento na semana em formato de calendário.',
  },
  {
    icon: CalendarRange,
    nome: 'Visão Mês / Ano',
    descricao: 'Visão mensal ou anual de vencimentos e pagamentos de obrigações.',
  },
  {
    icon: List,
    nome: 'Visão Lista',
    descricao: 'Tabela completa com todas as obrigações e suas parcelas.',
  },
  {
    icon: Filter,
    nome: 'Filtrar',
    descricao: 'Filtra por tipo (acordo/condenação), polo, status, processo ou período.',
  },
];

export default function ObrigacoesDoc() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Obrigações</h1>
        <p className="text-muted-foreground text-lg">
          Controle de obrigações financeiras oriundas de acordos e condenações judiciais.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Obrigações registra e acompanha os compromissos financeiros decorrentes de
          processos judiciais — tanto acordos homologados em juízo quanto condenações determinadas
          por sentença ou acórdão. O sistema monitora vencimentos, registra pagamentos e alerta
          sobre inadimplências.
        </p>
        <p className="text-muted-foreground">
          Cada obrigação é vinculada a um processo e pode envolver múltiplas parcelas, com
          atualização monetária e juros configuráveis.
        </p>
        <DocTip>
          O polo da obrigação (credor ou devedor) é fundamental: quando o cliente do escritório
          é o credor, o sistema monitora os pagamentos a receber e alerta sobre inadimplências
          da parte contrária. Quando é devedor, monitora os pagamentos a efetuar.
        </DocTip>
      </DocSection>

      <DocSection title="Campos da Obrigação">
        <DocFieldTable fields={fields} />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList actions={actions} />
      </DocSection>

      <DocSection title="Controle de Parcelas">
        <p className="text-muted-foreground">
          Após cadastrar uma obrigação parcelada, o sistema gera automaticamente todas as parcelas
          com as respectivas datas de vencimento. Cada parcela pode ter um dos seguintes status:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mt-2">
          <li><strong>Pendente:</strong> não venceu e ainda não foi paga.</li>
          <li><strong>Paga:</strong> pagamento confirmado e registrado.</li>
          <li><strong>Vencida:</strong> prazo ultrapassado sem registro de pagamento.</li>
          <li><strong>Inadimplente:</strong> marcada explicitamente como não paga após vencimento.</li>
        </ul>
        <DocTip>
          Quando uma parcela vence sem pagamento registrado, o sistema envia uma notificação para
          os responsáveis e destaca a obrigação no Dashboard Financeiro. Configure os lembretes
          com antecedência suficiente para adotar as medidas cabíveis a tempo.
        </DocTip>
      </DocSection>

      <DocSection title="Modos de Visualização">
        <p className="text-muted-foreground">
          O módulo de Obrigações oferece quatro modos de visualização: semana, mês, ano e lista.
          As visões de calendário mostram as datas de vencimento das parcelas, facilitando o
          planejamento financeiro e a antecipação de providências. A visão de lista é ideal para
          o controle detalhado e exportação de dados.
        </p>
      </DocSection>
    </div>
  );
}
