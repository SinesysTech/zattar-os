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
  Columns3,
  User,
  Filter,
  MoveHorizontal,
  Tag,
  Calendar,
  Search,
} from 'lucide-react';

export default function TarefasDoc() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading mb-2">Tarefas</h1>
        <p className="text-muted-foreground text-lg">
          Gerencie o trabalho da equipe com quadros Kanban organizados por projeto, área ou fluxo de trabalho.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Tarefas utiliza a metodologia Kanban para organizar o trabalho em quadros visuais.
          Cada quadro contém colunas que representam etapas ou status, e cada tarefa é um cartão que pode
          ser movido entre colunas conforme avança. É possível criar múltiplos quadros para diferentes
          projetos ou áreas do escritório.
        </p>
        <DocTip>
          Crie quadros separados para diferentes áreas do escritório, como &quot;Gestão de Processos&quot;,
          &quot;Administrativo&quot; e &quot;Projetos Internos&quot;, mantendo o trabalho de cada área organizado.
        </DocTip>
      </DocSection>

      <DocSection title="Criando um Quadro">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse o módulo de Tarefas',
              descricao: 'No menu lateral, navegue até Planner > Tarefas.',
            },
            {
              titulo: 'Crie um novo quadro',
              descricao:
                'Clique em "Novo Quadro" e informe o nome do quadro. Você pode definir uma cor ou ícone de identificação.',
            },
            {
              titulo: 'Adicione colunas',
              descricao:
                'Por padrão, o quadro é criado com as colunas "A Fazer", "Em Andamento" e "Concluído". Você pode renomear, adicionar ou remover colunas conforme sua necessidade.',
            },
            {
              titulo: 'Convide membros',
              descricao:
                'Adicione membros da equipe ao quadro para que possam visualizar e gerenciar as tarefas. Defina permissões de visualização ou edição.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Criando uma Tarefa">
        <DocSteps
          steps={[
            {
              titulo: 'Selecione o quadro',
              descricao: 'Abra o quadro onde a tarefa será criada.',
            },
            {
              titulo: 'Clique em "+" na coluna desejada',
              descricao:
                'Cada coluna possui um botão de adição no topo. Clicar nele abre o formulário de nova tarefa já posicionada naquela coluna.',
            },
            {
              titulo: 'Preencha os dados',
              descricao:
                'Informe título, descrição, responsável, prazo e prioridade. Adicione etiquetas para facilitar a busca e filtragem.',
            },
            {
              titulo: 'Salve a tarefa',
              descricao:
                'A tarefa aparece como um cartão na coluna selecionada, pronta para ser gerenciada.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos da Tarefa">
        <DocFieldTable
          fields={[
            {
              campo: 'Título',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'Nome claro e objetivo da tarefa.',
            },
            {
              campo: 'Descrição',
              tipo: 'Texto Rico',
              obrigatorio: false,
              descricao:
                'Detalhamento da tarefa, instruções, contexto ou checklist de subtarefas.',
            },
            {
              campo: 'Responsável',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao:
                'Membro da equipe responsável pela execução da tarefa. A tarefa aparecerá em destaque na visão do responsável.',
            },
            {
              campo: 'Prioridade',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao:
                'Nível de urgência: Baixa, Média, Alta ou Urgente. Tarefas urgentes são destacadas visualmente com cor vermelha.',
            },
            {
              campo: 'Prazo',
              tipo: 'Data',
              obrigatorio: false,
              descricao:
                'Data limite para conclusão. Tarefas com prazo vencido são sinalizadas automaticamente.',
            },
            {
              campo: 'Etiquetas',
              tipo: 'Seleção Múltipla',
              obrigatorio: false,
              descricao:
                'Tags personalizáveis para categorização e filtragem das tarefas (ex: "Urgente", "Cliente X", "Revisão").',
            },
            {
              campo: 'Processo Vinculado',
              tipo: 'Busca',
              obrigatorio: false,
              descricao:
                'Associa a tarefa a um processo jurídico, permitindo rastrear o trabalho relacionado a cada processo.',
            },
            {
              campo: 'Anexos',
              tipo: 'Arquivos',
              obrigatorio: false,
              descricao:
                'Documentos, imagens ou arquivos relevantes para a execução da tarefa.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Drag and Drop">
        <p className="text-muted-foreground mb-4">
          O quadro Kanban suporta arrastar e soltar para mover tarefas entre colunas e reordenar tarefas
          dentro de uma mesma coluna.
        </p>
        <DocActionList
          actions={[
            {
              icon: MoveHorizontal,
              nome: 'Mover entre colunas',
              descricao:
                'Clique e segure um cartão de tarefa e arraste-o para a coluna de destino. O status da tarefa é atualizado automaticamente.',
            },
            {
              icon: MoveHorizontal,
              nome: 'Reordenar dentro da coluna',
              descricao:
                'Arraste o cartão para cima ou para baixo dentro da mesma coluna para ajustar a prioridade visual das tarefas.',
            },
            {
              icon: Columns3,
              nome: 'Reordenar colunas',
              descricao:
                'As próprias colunas do quadro podem ser reorganizadas arrastando pelo cabeçalho da coluna.',
            },
          ]}
        />
        <DocTip>
          Ao mover uma tarefa para a coluna &quot;Concluído&quot; (ou equivalente configurada), o sistema
          registra automaticamente a data de conclusão para fins de controle e relatórios.
        </DocTip>
      </DocSection>

      <DocSection title="Filtros Disponíveis">
        <DocActionList
          actions={[
            {
              icon: User,
              nome: 'Por Responsável',
              descricao:
                'Filtre para ver apenas as tarefas atribuídas a um membro específico da equipe.',
            },
            {
              icon: Tag,
              nome: 'Por Etiqueta',
              descricao:
                'Exiba apenas tarefas que possuem determinada etiqueta, facilitando a visão por projeto ou categoria.',
            },
            {
              icon: Calendar,
              nome: 'Por Prazo',
              descricao:
                'Filtre tarefas por prazo: vencidas, com prazo hoje, esta semana ou sem prazo definido.',
            },
            {
              icon: Filter,
              nome: 'Por Prioridade',
              descricao:
                'Destaque ou filtre tarefas por nível de prioridade para focar no que é mais urgente.',
            },
            {
              icon: Search,
              nome: 'Busca por Texto',
              descricao:
                'Pesquise tarefas pelo título ou conteúdo da descrição dentro do quadro ativo.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Gerenciando Colunas">
        <p className="text-muted-foreground mb-4">
          As colunas representam os status ou etapas do seu fluxo de trabalho. Você pode personalizar
          completamente as colunas de cada quadro.
        </p>
        <DocActionList
          actions={[
            {
              icon: Plus,
              nome: 'Adicionar Coluna',
              descricao:
                'Clique em "+ Adicionar Coluna" ao final do quadro para criar uma nova etapa no fluxo.',
            },
            {
              icon: Columns3,
              nome: 'Renomear Coluna',
              descricao:
                'Clique duas vezes no nome de uma coluna para editá-lo diretamente.',
            },
            {
              icon: Columns3,
              nome: 'Excluir Coluna',
              descricao:
                'Clique no menu de opções da coluna (três pontos) e selecione "Excluir". Tarefas na coluna serão movidas para a coluna anterior.',
            },
          ]}
        />
      </DocSection>
    </div>
  );
}
