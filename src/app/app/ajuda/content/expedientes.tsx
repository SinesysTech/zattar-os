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
  Eye,
  CheckSquare,
  Reply,
  CalendarDays,
  CalendarRange,
  List,
  Bell,
  Filter,
  Clock,
  RefreshCw,
} from 'lucide-react';

const fields: FieldDef[] = [
  {
    campo: 'Processo',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Processo judicial ao qual o expediente está vinculado.',
  },
  {
    campo: 'Data de Publicação',
    tipo: 'Data',
    obrigatorio: true,
    descricao: 'Data em que a intimação ou comunicação foi publicada no Diário de Justiça Eletrônico.',
  },
  {
    campo: 'Data de Início do Prazo',
    tipo: 'Data',
    obrigatorio: false,
    descricao: 'Data a partir da qual o prazo começa a contar, considerando dias úteis e feriados.',
  },
  {
    campo: 'Data de Vencimento',
    tipo: 'Data',
    obrigatorio: false,
    descricao: 'Data final para cumprimento do prazo. Calculada automaticamente quando o tipo de prazo é informado.',
  },
  {
    campo: 'Tipo',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Classifica o expediente: Intimação, Citação, Notificação, Despacho, Decisão, Acórdão, Sentença.',
  },
  {
    campo: 'Conteúdo',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Texto completo da publicação do Diário Oficial ou resumo do expediente.',
  },
  {
    campo: 'Prazo (dias)',
    tipo: 'Número',
    obrigatorio: false,
    descricao: 'Número de dias para cumprimento. O sistema calcula a data de vencimento descontando finais de semana e feriados.',
  },
  {
    campo: 'Status',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Situação do expediente: Não Lido, Lido, Em Andamento, Cumprido, Vencido.',
  },
  {
    campo: 'Responsável',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Advogado responsável pelo cumprimento deste expediente.',
  },
  {
    campo: 'Observações',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Anotações sobre providências tomadas, estratégias ou histórico de ações.',
  },
];

const actions: ActionDef[] = [
  {
    icon: RefreshCw,
    nome: 'Atualizar via Captura',
    descricao: 'Importa novos expedientes automaticamente a partir das movimentações capturadas do PJe e do Diário Oficial.',
  },
  {
    icon: Eye,
    nome: 'Visualizar Conteúdo',
    descricao: 'Exibe o texto completo da publicação ou intimação.',
  },
  {
    icon: CheckSquare,
    nome: 'Marcar como Lido',
    descricao: 'Atualiza o status do expediente para Lido, registrando quem realizou a leitura e a data/hora.',
  },
  {
    icon: CheckSquare,
    nome: 'Marcar como Cumprido',
    descricao: 'Indica que as providências necessárias foram tomadas e o prazo foi atendido.',
  },
  {
    icon: Reply,
    nome: 'Responder / Registrar Providência',
    descricao: 'Registra a ação tomada em resposta ao expediente, com data e descrição da providência.',
  },
  {
    icon: Bell,
    nome: 'Configurar Lembrete',
    descricao: 'Define alertas automáticos conforme o prazo se aproxima (ex: 5 dias, 2 dias, 1 dia antes do vencimento).',
  },
  {
    icon: CalendarDays,
    nome: 'Visão Semana',
    descricao: 'Exibe expedientes com vencimento na semana atual em formato de calendário.',
  },
  {
    icon: CalendarRange,
    nome: 'Visão Mês / Ano',
    descricao: 'Visão mensal ou anual dos vencimentos de prazo.',
  },
  {
    icon: List,
    nome: 'Visão Lista',
    descricao: 'Tabela completa e filtrável com todos os expedientes.',
  },
  {
    icon: Filter,
    nome: 'Filtrar',
    descricao: 'Filtra por status, tipo, responsável, processo ou período de publicação/vencimento.',
  },
  {
    icon: Clock,
    nome: 'Visualizar Vencendo Hoje',
    descricao: 'Atalho que filtra apenas os expedientes com prazo vencendo no dia atual.',
  },
];

export default function ExpedientesDoc() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Expedientes</h1>
        <p className="text-muted-foreground text-lg">
          Controle de intimações, citações, prazos e comunicações processuais.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Expedientes concentra todas as comunicações processuais que exigem atenção
          ou cumprimento de prazo: intimações, citações, despachos, decisões e sentenças publicadas
          no Diário de Justiça Eletrônico ou recebidas pelo PJe.
        </p>
        <p className="text-muted-foreground">
          A captura automática monitora continuamente os tribunais configurados e adiciona novos
          expedientes automaticamente, com alertas para prazos críticos.
        </p>
        <DocTip>
          Expedientes com status Não Lido são destacados em vermelho no Dashboard de Expedientes.
          Configure os lembretes automáticos para receber notificações com antecedência e evitar
          o vencimento de prazos importantes.
        </DocTip>
      </DocSection>

      <DocSection title="Campos do Expediente">
        <DocFieldTable fields={fields} />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList actions={actions} />
      </DocSection>

      <DocSection title="Cálculo de Prazos">
        <p className="text-muted-foreground">
          O sistema calcula automaticamente a data de vencimento do prazo levando em consideração:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mt-2">
          <li>Apenas dias úteis (exclui sábados e domingos).</li>
          <li>Feriados nacionais e estaduais configurados no sistema.</li>
          <li>Suspensões de prazo (férias forenses, recesso do judiciário).</li>
          <li>Regra de início do prazo no dia seguinte à publicação.</li>
        </ul>
        <DocTip>
          Verifique sempre os feriados locais no módulo de Configurações. Feriados municipais não
          são adicionados automaticamente e devem ser cadastrados manualmente para que o cálculo
          de prazos seja preciso.
        </DocTip>
      </DocSection>

      <DocSection title="Modos de Visualização">
        <p className="text-muted-foreground">
          Assim como Audiências, o módulo de Expedientes oferece quatro modos de visualização:
          semana, mês, ano e lista. A visão de lista é a mais completa para triagem de expedientes
          pendentes, enquanto as visões de calendário facilitam o planejamento de prazos.
        </p>
      </DocSection>
    </div>
  );
}
