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
  Pencil,
  Trash2,
  Play,
  Pause,
  Clock,
  RefreshCw,
  Bell,
} from 'lucide-react';

export default function CapturaAgendamentos() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Agendamentos de Captura</h1>
        <p className="text-muted-foreground mt-2">
          Configure capturas automáticas e recorrentes para que o sistema verifique novidades nos
          processos sem que você precise disparar manualmente cada consulta.
        </p>
      </div>

      <DocSection title="Criando um Agendamento">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse Captura > Agendamentos',
              descricao: 'No menu lateral, vá em Captura > Agendamentos.',
            },
            {
              titulo: 'Clique em "Novo Agendamento"',
              descricao: 'O botão fica no canto superior direito da tela.',
            },
            {
              titulo: 'Selecione a credencial e o tribunal',
              descricao:
                'Escolha o advogado cujas credenciais serão usadas e o tribunal a ser monitorado.',
            },
            {
              titulo: 'Configure a frequência',
              descricao:
                'Defina com qual intervalo a captura será executada: a cada hora, diariamente, semanalmente ou em horários específicos.',
            },
            {
              titulo: 'Defina o escopo',
              descricao:
                'Selecione quais processos capturar: todos os processos do advogado, uma lista específica ou processos com determinados filtros.',
            },
            {
              titulo: 'Ative o agendamento',
              descricao:
                'Salve e ative o agendamento. A primeira execução ocorrerá conforme a frequência configurada.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos do Agendamento">
        <DocFieldTable
          fields={[
            {
              campo: 'Nome',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'Identificação do agendamento, ex: "Captura diária TRT-2 — Dr. Silva".',
            },
            {
              campo: 'Credencial / Advogado',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Credencial PJe cadastrada que será utilizada para autenticação no tribunal.',
            },
            {
              campo: 'Tribunal',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Tribunal a ser monitorado (TRT, TJ, JFDF, etc.).',
            },
            {
              campo: 'Frequência',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'A cada hora, a cada 6h, diária, semanal ou personalizada (cron).',
            },
            {
              campo: 'Horário de Execução',
              tipo: 'Hora',
              obrigatorio: false,
              descricao: 'Para frequência diária ou semanal, define o horário preferencial de início.',
            },
            {
              campo: 'Dias da Semana',
              tipo: 'Múltipla seleção',
              obrigatorio: false,
              descricao: 'Para frequência semanal, define em quais dias a captura será executada.',
            },
            {
              campo: 'Escopo de Processos',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Todos os processos do advogado ou uma lista personalizada de números.',
            },
            {
              campo: 'Notificar ao concluir',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao: 'Envia notificação ao usuário quando a captura terminar com novidades.',
            },
            {
              campo: 'Ativo',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao: 'Habilita ou desabilita o agendamento sem excluí-lo.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Frequências Disponíveis">
        <DocActionList
          actions={[
            {
              icon: RefreshCw,
              nome: 'A cada hora',
              descricao:
                'Executa a captura de hora em hora. Recomendado para processos com prazos urgentes.',
            },
            {
              icon: RefreshCw,
              nome: 'A cada 6 horas',
              descricao:
                'Executa 4 vezes ao dia. Equilibra atualização frequente com consumo de recursos.',
            },
            {
              icon: Clock,
              nome: 'Diária',
              descricao:
                'Executa uma vez por dia no horário configurado. Recomendado para a maioria dos escritórios.',
            },
            {
              icon: Clock,
              nome: 'Semanal',
              descricao:
                'Executa nos dias da semana selecionados. Útil para processos menos urgentes.',
            },
            {
              icon: Clock,
              nome: 'Personalizada (Cron)',
              descricao:
                'Permite configurar qualquer frequência usando expressão cron para cenários avançados.',
            },
          ]}
        />
        <DocTip>
          Capturas muito frequentes (a cada hora) podem gerar grande volume de notificações.
          Ative o agrupamento de notificações em Configurações &gt; Notificações para receber
          um resumo ao invés de uma notificação por movimentação.
        </DocTip>
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Plus,
              nome: 'Novo Agendamento',
              descricao: 'Cria um novo agendamento de captura automática.',
            },
            {
              icon: Play,
              nome: 'Executar Agora',
              descricao: 'Dispara a captura imediatamente, independente do horário agendado.',
            },
            {
              icon: Pause,
              nome: 'Pausar',
              descricao: 'Suspende o agendamento sem excluí-lo.',
            },
            {
              icon: Pencil,
              nome: 'Editar',
              descricao: 'Altera frequência, escopo ou notificações do agendamento.',
            },
            {
              icon: Bell,
              nome: 'Configurar Notificações',
              descricao: 'Define quem será notificado quando a captura encontrar novidades.',
            },
            {
              icon: Trash2,
              nome: 'Excluir',
              descricao: 'Remove o agendamento permanentemente.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Monitoramento dos Agendamentos">
        <p className="text-muted-foreground">
          A listagem de agendamentos exibe, para cada item, a próxima execução prevista, a última
          execução realizada e o status (Ativo, Pausado, Com Erro). Agendamentos que falharam
          consecutivamente três vezes são automaticamente pausados e o administrador é notificado
          para revisão das credenciais.
        </p>
      </DocSection>
    </div>
  );
}
