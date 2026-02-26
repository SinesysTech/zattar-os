'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
} from '../../components/doc-components';
import {
  Folder,
  Tag,
  Share2,
  Bold,
  List,
  Search,
  Lock,
} from 'lucide-react';

export default function NotasDoc() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading mb-2">Notas</h1>
        <p className="text-muted-foreground text-lg">
          Capture ideias, registre informações e organize anotações pessoais ou compartilhadas com a equipe.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Notas oferece um espaço flexível para registro de informações textuais. As notas
          podem ser pessoais (visíveis apenas para você) ou compartilhadas com membros da equipe. Organize
          suas notas em pastas e utilize etiquetas para encontrá-las rapidamente. O editor integrado
          suporta formatação de texto rica, listas e outros recursos de produtividade.
        </p>
        <DocTip>
          Notas vinculadas a processos aparecem automaticamente na aba de notas do processo,
          facilitando o acesso ao contexto sem precisar sair da tela.
        </DocTip>
      </DocSection>

      <DocSection title="Criando uma Nota">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse o módulo de Notas',
              descricao: 'No menu lateral, navegue até Planner > Notas.',
            },
            {
              titulo: 'Clique em "Nova Nota"',
              descricao:
                'Use o botão no topo do painel lateral ou o atalho de teclado Ctrl+N (Cmd+N no Mac).',
            },
            {
              titulo: 'Escreva o conteúdo',
              descricao:
                'A nota abre no editor. Adicione um título no campo superior e comece a digitar o conteúdo. Use a barra de formatação para estilizar o texto.',
            },
            {
              titulo: 'Configure visibilidade e organização',
              descricao:
                'Defina se a nota é pessoal ou compartilhada, selecione uma pasta e adicione etiquetas.',
            },
            {
              titulo: 'A nota é salva automaticamente',
              descricao:
                'Não é necessário clicar em "Salvar". O sistema salva automaticamente conforme você digita.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos e Propriedades da Nota">
        <DocFieldTable
          fields={[
            {
              campo: 'Título',
              tipo: 'Texto',
              obrigatorio: false,
              descricao:
                'Título da nota. Se não preenchido, o sistema usa a primeira linha do conteúdo como título.',
            },
            {
              campo: 'Conteúdo',
              tipo: 'Texto Rico',
              obrigatorio: false,
              descricao: 'Corpo da nota com suporte a formatação, listas e outros elementos.',
            },
            {
              campo: 'Pasta',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao:
                'Organiza a nota em uma pasta existente ou em uma nova pasta criada no momento.',
            },
            {
              campo: 'Etiquetas',
              tipo: 'Seleção Múltipla',
              obrigatorio: false,
              descricao:
                'Tags para categorização e filtragem. Ex: "Reunião", "Processo 123", "Urgente".',
            },
            {
              campo: 'Visibilidade',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao:
                'Define se a nota é "Pessoal" (só você vê) ou "Compartilhada" (visível para membros selecionados da equipe).',
            },
            {
              campo: 'Processo Vinculado',
              tipo: 'Busca',
              obrigatorio: false,
              descricao:
                'Vincula a nota a um processo jurídico específico.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Recursos do Editor de Texto">
        <DocActionList
          actions={[
            {
              icon: Bold,
              nome: 'Formatação Básica',
              descricao:
                'Negrito, itálico, sublinhado, tachado e código inline. Use os atalhos padrão (Ctrl+B, Ctrl+I, etc.) ou a barra de ferramentas flutuante.',
            },
            {
              icon: List,
              nome: 'Listas',
              descricao:
                'Listas com marcadores, listas numeradas e listas de tarefas com caixas de seleção clicáveis.',
            },
            {
              icon: List,
              nome: 'Títulos e Hierarquia',
              descricao:
                'Use H1, H2 e H3 para estruturar notas longas com seções e subseções.',
            },
            {
              icon: List,
              nome: 'Citações e Blocos de Código',
              descricao:
                'Destaque trechos importantes com blocos de citação ou formate código técnico com destaque de sintaxe.',
            },
            {
              icon: Share2,
              nome: 'Menções',
              descricao:
                'Digite @ seguido do nome de um colega para mencioná-lo na nota. A pessoa receberá uma notificação.',
            },
          ]}
        />
        <DocTip>
          Selecione qualquer trecho do texto para ver um menu flutuante com as opções de formatação mais comuns,
          sem precisar usar a barra de ferramentas fixa.
        </DocTip>
      </DocSection>

      <DocSection title="Organizando por Pastas e Etiquetas">
        <DocActionList
          actions={[
            {
              icon: Folder,
              nome: 'Criar Pasta',
              descricao:
                'No painel lateral, clique no ícone "+" ao lado de "Pastas" para criar uma nova pasta. Arraste notas para organizar.',
            },
            {
              icon: Folder,
              nome: 'Mover para Pasta',
              descricao:
                'Clique com o botão direito sobre uma nota ou use o menu de opções (três pontos) e selecione "Mover para".',
            },
            {
              icon: Tag,
              nome: 'Gerenciar Etiquetas',
              descricao:
                'As etiquetas são criadas conforme você as usa. Para excluir uma etiqueta, acesse as configurações do módulo de notas.',
            },
            {
              icon: Search,
              nome: 'Busca Full-text',
              descricao:
                'A busca no topo do painel pesquisa tanto nos títulos quanto no conteúdo de todas as suas notas.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Notas Compartilhadas">
        <p className="text-muted-foreground mb-4">
          Notas compartilhadas são visíveis para todos os membros da equipe selecionados e podem ser
          editadas colaborativamente. O sistema registra o histórico de alterações.
        </p>
        <DocActionList
          actions={[
            {
              icon: Share2,
              nome: 'Compartilhar com a Equipe',
              descricao:
                'Mude a visibilidade da nota para "Compartilhada" e selecione os membros ou defina o acesso para toda a equipe.',
            },
            {
              icon: Lock,
              nome: 'Tornar Pessoal',
              descricao:
                'Altere a visibilidade de volta para "Pessoal" para remover o acesso dos demais membros.',
            },
          ]}
        />
        <DocTip>
          Notas compartilhadas ideais para registros de reuniões de equipe, procedimentos internos
          e informações que todos precisam acessar rapidamente.
        </DocTip>
      </DocSection>
    </div>
  );
}
