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
  FileText,
  Filter,
  UserCheck,
} from 'lucide-react';

const fields: FieldDef[] = [
  {
    campo: 'Processo',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Processo judicial ao qual a perícia está vinculada.',
  },
  {
    campo: 'Tipo de Perícia',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Classifica a perícia: Contábil, Médica, de Engenharia, Grafotécnica, Ambiental, Psicológica, Informática, entre outras.',
  },
  {
    campo: 'Perito',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Perito nomeado pelo juízo. Vincula ao cadastro de Terceiros com tipo Perito.',
  },
  {
    campo: 'Assistente Técnico',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Assistente técnico indicado pelo escritório ou pela parte contrária. Vincula ao cadastro de Terceiros.',
  },
  {
    campo: 'Data de Realização',
    tipo: 'Data',
    obrigatorio: false,
    descricao: 'Data prevista ou realizada para a execução da perícia.',
  },
  {
    campo: 'Data de Entrega do Laudo',
    tipo: 'Data',
    obrigatorio: false,
    descricao: 'Prazo determinado pelo juízo para entrega do laudo pericial.',
  },
  {
    campo: 'Local',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Local onde será realizada a perícia (endereço físico, laboratório, cartório etc.).',
  },
  {
    campo: 'Quesitos',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Perguntas formuladas pelas partes ao perito, que deverão ser respondidas no laudo.',
  },
  {
    campo: 'Status',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Situação da perícia: Aguardando Nomeação, Agendada, Em Andamento, Laudo Entregue, Concluída, Cancelada.',
  },
  {
    campo: 'Resultado / Laudo',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Resumo das conclusões do laudo pericial ou link para o documento anexado.',
  },
  {
    campo: 'Observações',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Notas internas sobre a perícia, estratégias ou providências necessárias.',
  },
];

const actions: ActionDef[] = [
  {
    icon: Plus,
    nome: 'Cadastrar Perícia',
    descricao: 'Cria um novo registro de perícia vinculado a um processo.',
  },
  {
    icon: Pencil,
    nome: 'Editar',
    descricao: 'Atualiza dados da perícia, como data, perito, quesitos ou status.',
  },
  {
    icon: Eye,
    nome: 'Visualizar Detalhes',
    descricao: 'Exibe a ficha completa com quesitos, assistentes técnicos e histórico de atualizações.',
  },
  {
    icon: UserCheck,
    nome: 'Vincular Perito / Assistente',
    descricao: 'Associa o perito nomeado e/ou o assistente técnico indicado pela parte.',
  },
  {
    icon: FileText,
    nome: 'Registrar Laudo',
    descricao: 'Preenche o resultado da perícia e atualiza o status para Laudo Entregue.',
  },
  {
    icon: CheckSquare,
    nome: 'Marcar como Concluída',
    descricao: 'Encerra o ciclo da perícia após análise e impugnação do laudo.',
  },
  {
    icon: CalendarDays,
    nome: 'Visão Semana',
    descricao: 'Exibe as perícias agendadas para a semana em formato de calendário.',
  },
  {
    icon: CalendarRange,
    nome: 'Visão Mês / Ano',
    descricao: 'Calendário mensal ou anual com as datas de realização e entrega de laudo.',
  },
  {
    icon: List,
    nome: 'Visão Lista',
    descricao: 'Tabela completa com todas as perícias, filtrável e ordenável.',
  },
  {
    icon: Filter,
    nome: 'Filtrar',
    descricao: 'Filtra por tipo, status, perito, processo ou período.',
  },
];

export default function PericiasDoc() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Perícias</h1>
        <p className="text-muted-foreground text-lg">
          Gestão de perícias judiciais, quesitos, peritos e laudos periciais.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Perícias permite o acompanhamento completo dos procedimentos periciais
          nos processos do escritório. Desde o cadastro da perícia determinada pelo juízo
          até o recebimento e análise do laudo, todas as etapas são registradas e monitoradas.
        </p>
        <p className="text-muted-foreground">
          Perícias podem ser capturadas automaticamente pelo PJe quando uma determinação judicial
          for identificada, ou cadastradas manualmente pelo usuário.
        </p>
        <DocTip>
          Mantenha os quesitos atualizados antes da data de realização da perícia. O sistema permite
          editar e complementar os quesitos a qualquer momento enquanto o status for Aguardando
          Nomeação ou Agendada.
        </DocTip>
      </DocSection>

      <DocSection title="Campos da Perícia">
        <DocFieldTable fields={fields} />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList actions={actions} />
      </DocSection>

      <DocSection title="Fluxo de uma Perícia">
        <p className="text-muted-foreground">
          Uma perícia judicial tipicamente passa pelas seguintes etapas no sistema:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mt-2">
          <li><strong>Aguardando Nomeação:</strong> perícia determinada, mas perito ainda não nomeado.</li>
          <li><strong>Agendada:</strong> perito nomeado e data definida.</li>
          <li><strong>Em Andamento:</strong> perícia em execução.</li>
          <li><strong>Laudo Entregue:</strong> perito entregou o laudo ao juízo.</li>
          <li><strong>Concluída:</strong> partes analisaram o laudo e eventuais impugnações foram decididas.</li>
        </ul>
        <DocTip>
          Peritos cadastrados no módulo de Terceiros (tipo Perito) ficam disponíveis para seleção
          rápida no campo Perito. Se o perito nomeado não estiver cadastrado, o sistema permite
          cadastrá-lo diretamente durante a criação da perícia.
        </DocTip>
      </DocSection>

      <DocSection title="Modos de Visualização">
        <p className="text-muted-foreground">
          O módulo de Perícias oferece quatro modos de visualização: semana, mês, ano e lista.
          As visões de calendário exibem tanto as datas de realização quanto os prazos de entrega
          de laudo, permitindo um planejamento integrado com audiências e expedientes.
        </p>
      </DocSection>
    </div>
  );
}
