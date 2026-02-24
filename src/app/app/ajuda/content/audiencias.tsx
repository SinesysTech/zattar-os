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
  CheckSquare,
  Bell,
  Filter,
} from 'lucide-react';

const fields: FieldDef[] = [
  {
    campo: 'Processo',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Processo judicial ao qual a audiência está vinculada.',
  },
  {
    campo: 'Data',
    tipo: 'Data',
    obrigatorio: true,
    descricao: 'Data de realização da audiência.',
  },
  {
    campo: 'Hora',
    tipo: 'Hora',
    obrigatorio: true,
    descricao: 'Horário de início da audiência.',
  },
  {
    campo: 'Tipo de Audiência',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Classifica o ato: Audiência de Conciliação, Instrução e Julgamento, UNA, Preliminar, de Custódia, entre outras.',
  },
  {
    campo: 'Local / Sala',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Local físico onde ocorrerá a audiência (fórum, sala virtual, endereço específico).',
  },
  {
    campo: 'Modalidade',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Presencial, Virtual (videoconferência) ou Híbrida.',
  },
  {
    campo: 'Link da Reunião',
    tipo: 'URL',
    obrigatorio: false,
    descricao: 'Link de acesso para audiências virtuais (Zoom, Teams, Webex etc.).',
  },
  {
    campo: 'Partes Presentes',
    tipo: 'Múltipla seleção',
    obrigatorio: false,
    descricao: 'Partes e representantes que deverão comparecer à audiência.',
  },
  {
    campo: 'Status',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Situação da audiência: Agendada, Realizada, Cancelada, Redesignada.',
  },
  {
    campo: 'Resultado / Ata',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Resumo do que ocorreu na audiência, preenchido após a realização do ato.',
  },
  {
    campo: 'Observações',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Notas internas, documentos necessários ou orientações para o advogado responsável.',
  },
];

const actions: ActionDef[] = [
  {
    icon: Plus,
    nome: 'Agendar Audiência',
    descricao: 'Cria uma nova audiência, vinculando-a a um processo e definindo data, hora e tipo.',
  },
  {
    icon: Pencil,
    nome: 'Editar',
    descricao: 'Altera dados da audiência como data, hora, local ou status.',
  },
  {
    icon: Eye,
    nome: 'Visualizar Detalhes',
    descricao: 'Exibe todas as informações da audiência e o processo vinculado.',
  },
  {
    icon: CheckSquare,
    nome: 'Marcar como Realizada',
    descricao: 'Atualiza o status para Realizada e abre o campo para preenchimento da ata ou resultado.',
  },
  {
    icon: Bell,
    nome: 'Configurar Lembrete',
    descricao: 'Define alertas automáticos por e-mail ou notificação antes da data da audiência.',
  },
  {
    icon: CalendarDays,
    nome: 'Visão Semana',
    descricao: 'Exibe as audiências da semana atual em formato de calendário por hora.',
  },
  {
    icon: CalendarRange,
    nome: 'Visão Mês / Ano',
    descricao: 'Exibe as audiências em formato de calendário mensal ou anual para planejamento a longo prazo.',
  },
  {
    icon: List,
    nome: 'Visão Lista',
    descricao: 'Exibe todas as audiências em formato de tabela, com filtros e ordenação.',
  },
  {
    icon: Filter,
    nome: 'Filtrar',
    descricao: 'Filtra por período, status, tipo, advogado responsável ou processo.',
  },
];

export default function AudienciasDoc() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Audiências</h1>
        <p className="text-muted-foreground text-lg">
          Gestão e acompanhamento de audiências judiciais com visualização em calendário.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Audiências centraliza o controle de todos os atos processuais que exigem
          presença física ou virtual do advogado. As audiências podem ser cadastradas manualmente
          ou importadas automaticamente a partir das movimentações capturadas do PJe.
        </p>
        <p className="text-muted-foreground">
          O sistema oferece múltiplas formas de visualização — semana, mês, ano e lista —
          permitindo que o escritório planeje a agenda jurídica com antecedência.
        </p>
        <DocTip>
          Audiências capturadas automaticamente do PJe são adicionadas com status Agendada.
          Lembre-se de conferir os dados e preencher informações complementares, como o local
          exato e os participantes esperados.
        </DocTip>
      </DocSection>

      <DocSection title="Campos da Audiência">
        <DocFieldTable fields={fields} />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList actions={actions} />
      </DocSection>

      <DocSection title="Modos de Visualização">
        <p className="text-muted-foreground">
          O módulo de Audiências oferece quatro modos de visualização, acessíveis pelos botões
          no canto superior direito da tela:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm mt-2">
          <li><strong>Semana:</strong> agenda por hora para os sete dias da semana. Ideal para planejamento do dia a dia.</li>
          <li><strong>Mês:</strong> calendário mensal com marcações por dia. Facilita a visualização de concentrações de atos.</li>
          <li><strong>Ano:</strong> visão anual com densidade de audiências por mês. Útil para planejamento estratégico.</li>
          <li><strong>Lista:</strong> tabela paginada e filtrável com todas as audiências. Melhor para exportação e análise.</li>
        </ul>
        <DocTip>
          Na visão de semana, é possível arrastar audiências para reagendar diretamente no calendário.
          O sistema atualiza automaticamente a data e registra a alteração no histórico do processo.
        </DocTip>
      </DocSection>

      <DocSection title="Integração com Processos">
        <p className="text-muted-foreground">
          Cada audiência é sempre vinculada a um processo. Na ficha do processo, a aba Audiências
          lista todos os atos agendados e realizados, em ordem cronológica. O Dashboard de Audiências
          exibe os próximos compromissos e alertas para audiências nas próximas 48 horas.
        </p>
      </DocSection>
    </div>
  );
}
