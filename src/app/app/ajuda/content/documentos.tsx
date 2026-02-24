'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
} from '../components/doc-components';
import {
  Plus,
  Sparkles,
  FileText,
  Trash2,
  Download,
  FolderOpen,
  Bold,
  Image,
  Table,
  RotateCcw,
} from 'lucide-react';

export default function DocumentosDoc() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading mb-2">Documentos</h1>
        <p className="text-muted-foreground text-lg">
          Editor de documentos com inteligência artificial integrada para criar, formatar e colaborar em textos jurídicos e administrativos.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Documentos oferece um editor de texto completo, construído sobre a plataforma Plate.js,
          com suporte a formatação avançada, inserção de tabelas, imagens e outros elementos. O diferencial
          é a integração nativa com inteligência artificial, que auxilia na redação, revisão e expansão
          de conteúdo diretamente dentro do editor, sem precisar sair do documento.
        </p>
        <DocTip>
          Os documentos são salvos automaticamente na nuvem a cada alteração. Você nunca perderá
          o trabalho mesmo se fechar acidentalmente a aba do navegador.
        </DocTip>
      </DocSection>

      <DocSection title="Criando um Documento">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse o módulo de Documentos',
              descricao: 'No menu lateral, clique em "Documentos".',
            },
            {
              titulo: 'Crie um novo documento',
              descricao:
                'Clique em "Novo Documento" ou use um template pré-definido clicando em "Usar Template".',
            },
            {
              titulo: 'Dê um título ao documento',
              descricao:
                'Clique no campo de título no topo e informe o nome do documento.',
            },
            {
              titulo: 'Escreva e formate o conteúdo',
              descricao:
                'Utilize a barra de ferramentas para formatar texto, inserir tabelas, listas e outros elementos.',
            },
            {
              titulo: 'Organize em pastas',
              descricao:
                'Mova o documento para uma pasta clicando no menu de opções (três pontos) e selecionando "Mover para Pasta".',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Recursos de Formatação">
        <DocActionList
          actions={[
            {
              icon: Bold,
              nome: 'Formatação de Texto',
              descricao:
                'Negrito, itálico, sublinhado, tachado, sobrescrito, subscrito e destaque de cor. Acessíveis pela barra de ferramentas ou atalhos de teclado padrão.',
            },
            {
              icon: FileText,
              nome: 'Títulos e Parágrafos',
              descricao:
                'Estruture o documento com H1, H2, H3 e parágrafos. Ideal para criar documentos com hierarquia clara de seções.',
            },
            {
              icon: Table,
              nome: 'Tabelas',
              descricao:
                'Insira tabelas com número personalizado de linhas e colunas. Adicione ou remova linhas/colunas com clique direito.',
            },
            {
              icon: Image,
              nome: 'Imagens e Arquivos',
              descricao:
                'Faça upload de imagens diretamente no documento ou arraste e solte arquivos de imagem para incorporá-los.',
            },
            {
              icon: Bold,
              nome: 'Listas',
              descricao:
                'Listas com marcadores, numeradas e de tarefas. Suporte a indentação para sublistas.',
            },
            {
              icon: Bold,
              nome: 'Citações e Código',
              descricao:
                'Blocos de citação para trechos de legislação ou jurisprudência, e blocos de código para conteúdo técnico.',
            },
            {
              icon: Bold,
              nome: 'Links',
              descricao:
                'Insira hiperlinks para URLs externas, outros documentos do sistema ou processos.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Assistente de IA no Editor">
        <p className="text-muted-foreground mb-4">
          O assistente de IA pode ser acionado a qualquer momento durante a edição para ajudar com
          a redação do documento.
        </p>
        <DocSteps
          steps={[
            {
              titulo: 'Acione o assistente',
              descricao:
                'Pressione a barra de espaço em uma linha vazia ou clique no ícone de IA na barra de ferramentas para abrir o menu do assistente.',
            },
            {
              titulo: 'Selecione a ação desejada',
              descricao:
                'Escolha entre as opções: "Continuar Escrevendo", "Melhorar Texto", "Resumir", "Expandir", "Corrigir Gramática" ou "Digitar um comando livre".',
            },
            {
              titulo: 'Revise a sugestão',
              descricao:
                'A IA gera o conteúdo sugerido em destaque. Você pode aceitar, rejeitar ou pedir uma nova geração.',
            },
          ]}
        />
        <DocActionList
          actions={[
            {
              icon: Sparkles,
              nome: 'Continuar Escrevendo',
              descricao:
                'A IA analisa o texto já escrito e continua de onde você parou, mantendo o estilo e o contexto do documento.',
            },
            {
              icon: Sparkles,
              nome: 'Melhorar Texto',
              descricao:
                'Selecione um trecho e peça para a IA aprimorar a clareza, o tom e a fluidez do texto.',
            },
            {
              icon: Sparkles,
              nome: 'Resumir',
              descricao:
                'Condensa um trecho selecionado em uma versão mais concisa sem perder as informações essenciais.',
            },
            {
              icon: Sparkles,
              nome: 'Expandir',
              descricao:
                'Desenvolve e detalha um trecho selecionado com mais informações e argumentação.',
            },
            {
              icon: Sparkles,
              nome: 'Corrigir Gramática',
              descricao:
                'Revisa ortografia, pontuação e gramática do trecho selecionado.',
            },
            {
              icon: Sparkles,
              nome: 'Comando Livre',
              descricao:
                'Descreva livremente o que você precisa e a IA executará o comando. Ex: "Reescreva em linguagem formal" ou "Adicione uma introdução sobre o tema X".',
            },
          ]}
        />
        <DocTip>
          Para usar o assistente em um trecho específico, selecione o texto primeiro e depois
          acione o menu da IA. O assistente atuará apenas sobre o trecho selecionado.
        </DocTip>
      </DocSection>

      <DocSection title="Templates">
        <p className="text-muted-foreground mb-4">
          Templates são modelos pré-formatados que aceleram a criação de documentos recorrentes.
        </p>
        <DocActionList
          actions={[
            {
              icon: FolderOpen,
              nome: 'Usar um Template',
              descricao:
                'Ao criar um novo documento, selecione "Usar Template" e escolha o modelo desejado na galeria de templates disponíveis.',
            },
            {
              icon: Plus,
              nome: 'Salvar como Template',
              descricao:
                'Abra o menu de opções do documento (três pontos) e clique em "Salvar como Template" para reutilizar sua estrutura em futuros documentos.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Exportação">
        <DocActionList
          actions={[
            {
              icon: Download,
              nome: 'Exportar como PDF',
              descricao:
                'Gera um PDF do documento com a formatação preservada. Acesse pelo menu de opções do documento ou pelo botão de exportação na barra superior do editor.',
            },
            {
              icon: Download,
              nome: 'Exportar como DOCX',
              descricao:
                'Exporta o documento no formato Word (.docx) para compatibilidade com outros sistemas.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Lixeira">
        <p className="text-muted-foreground mb-4">
          Documentos excluídos não são removidos permanentemente de imediato. Eles são movidos para
          a Lixeira, onde ficam disponíveis para recuperação por até 30 dias.
        </p>
        <DocActionList
          actions={[
            {
              icon: Trash2,
              nome: 'Excluir Documento',
              descricao:
                'Clique no menu de opções do documento e selecione "Mover para Lixeira". O documento sai da listagem principal mas pode ser restaurado.',
            },
            {
              icon: RotateCcw,
              nome: 'Restaurar da Lixeira',
              descricao:
                'Acesse a seção "Lixeira" no painel lateral, localize o documento e clique em "Restaurar" para devolvê-lo à sua pasta original.',
            },
            {
              icon: Trash2,
              nome: 'Excluir Permanentemente',
              descricao:
                'Na Lixeira, você pode excluir documentos permanentemente. Esta ação é irreversível.',
            },
          ]}
        />
        <DocTip>
          Documentos na lixeira ainda ocupam espaço de armazenamento. Esvazie a lixeira periodicamente
          para liberar espaço.
        </DocTip>
      </DocSection>
    </div>
  );
}
