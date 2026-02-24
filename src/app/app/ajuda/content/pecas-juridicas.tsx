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
  FileText,
  Download,
  Edit,
  Code,
  Sparkles,
  RefreshCw,
  Copy,
} from 'lucide-react';

export default function PecasJuridicasDoc() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading mb-2">Peças Jurídicas</h1>
        <p className="text-muted-foreground text-lg">
          Gere petições, contestações, recursos e outros documentos jurídicos automaticamente a partir de modelos com placeholders inteligentes.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Peças Jurídicas permite criar modelos reutilizáveis de documentos jurídicos com
          campos variáveis (placeholders) que são preenchidos automaticamente com dados do sistema —
          como informações do cliente, do processo ou do contrato — no momento da geração da peça.
          O resultado é um documento pronto para revisão, edição final e exportação.
        </p>
        <DocTip>
          Crie modelos para os tipos de peça mais frequentes no seu escritório (ex: petição inicial
          trabalhista, contestação, recurso ordinário) e reduza drasticamente o tempo de elaboração
          de documentos repetitivos.
        </DocTip>
      </DocSection>

      <DocSection title="Entendendo os Placeholders">
        <p className="text-muted-foreground mb-4">
          Placeholders são variáveis inseridas no texto do modelo no formato{' '}
          <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{'{{nome_variavel}}'}</code>.
          No momento da geração, o sistema substitui automaticamente cada placeholder pelo dado correspondente.
        </p>
        <DocActionList
          actions={[
            {
              icon: Code,
              nome: '{{cliente.nome}}',
              descricao: 'Nome completo do cliente vinculado ao processo ou contrato.',
            },
            {
              icon: Code,
              nome: '{{cliente.cpf}} / {{cliente.cnpj}}',
              descricao: 'Documento de identificação do cliente.',
            },
            {
              icon: Code,
              nome: '{{processo.numero}}',
              descricao: 'Número do processo no formato CNJ.',
            },
            {
              icon: Code,
              nome: '{{processo.vara}}',
              descricao: 'Vara e comarca do processo.',
            },
            {
              icon: Code,
              nome: '{{parte_contraria.nome}}',
              descricao: 'Nome da parte contrária (réu, reclamada, etc.).',
            },
            {
              icon: Code,
              nome: '{{advogado.nome}} / {{advogado.oab}}',
              descricao: 'Nome e número OAB do advogado responsável.',
            },
            {
              icon: Code,
              nome: '{{data.hoje}}',
              descricao: 'Data atual por extenso no momento da geração.',
            },
            {
              icon: Code,
              nome: '{{contrato.valor}}',
              descricao: 'Valor do contrato vinculado ao processo.',
            },
          ]}
        />
        <DocTip>
          No editor de modelos, use o menu de inserção de placeholders (ícone de chaves{' '}
          <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{'{}'}</code>) para ver a lista
          completa de variáveis disponíveis e inseri-las sem precisar digitá-las manualmente.
        </DocTip>
      </DocSection>

      <DocSection title="Criando um Modelo de Peça">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse Peças Jurídicas',
              descricao: 'No menu lateral, clique em "Peças Jurídicas" e depois em "Modelos".',
            },
            {
              titulo: 'Crie um novo modelo',
              descricao:
                'Clique em "Novo Modelo", informe o nome, o tipo da peça (petição, contestação, recurso, etc.) e uma descrição opcional.',
            },
            {
              titulo: 'Escreva o texto da peça',
              descricao:
                'No editor, escreva o conteúdo completo da peça. Utilize o menu de placeholders para inserir as variáveis nos pontos corretos do texto.',
            },
            {
              titulo: 'Salve o modelo',
              descricao:
                'Clique em "Salvar Modelo". O modelo ficará disponível para todos os membros da equipe.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos do Modelo">
        <DocFieldTable
          fields={[
            {
              campo: 'Nome do Modelo',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'Identificação do modelo. Ex: "Petição Inicial – Reclamação Trabalhista".',
            },
            {
              campo: 'Tipo de Peça',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao:
                'Categoria da peça: Petição Inicial, Contestação, Recurso, Contrarrazões, Manifestação, Outro.',
            },
            {
              campo: 'Área do Direito',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao:
                'Área jurídica de aplicação: Trabalhista, Cível, Previdenciário, Criminal, etc.',
            },
            {
              campo: 'Descrição',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Breve descrição do modelo e quando utilizá-lo.',
            },
            {
              campo: 'Conteúdo',
              tipo: 'Editor Rico',
              obrigatorio: true,
              descricao:
                'Corpo da peça com formatação completa e placeholders inseridos nas posições corretas.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Gerando uma Peça a partir de um Modelo">
        <DocSteps
          steps={[
            {
              titulo: 'Selecione o modelo',
              descricao:
                'Na listagem de modelos, localize o modelo desejado e clique em "Gerar Peça".',
            },
            {
              titulo: 'Vincule o processo ou contrato',
              descricao:
                'Selecione o processo ou contrato de onde os dados serão extraídos para preencher os placeholders.',
            },
            {
              titulo: 'Revise o preenchimento',
              descricao:
                'O sistema exibe os valores que serão substituídos em cada placeholder. Corrija qualquer dado antes de confirmar.',
            },
            {
              titulo: 'Gere o documento',
              descricao:
                'Clique em "Gerar". A peça é criada com todos os placeholders substituídos e aberta no editor para revisão final.',
            },
            {
              titulo: 'Edite e exporte',
              descricao:
                'Faça os ajustes necessários no editor e exporte a peça em PDF ou DOCX.',
            },
          ]}
        />
        <DocTip>
          Mesmo após a geração, você pode editar livremente o conteúdo da peça antes de exportar.
          As alterações não afetam o modelo original.
        </DocTip>
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Plus,
              nome: 'Novo Modelo',
              descricao: 'Cria um novo modelo de peça jurídica do zero.',
            },
            {
              icon: Edit,
              nome: 'Editar Modelo',
              descricao:
                'Abre o modelo no editor para alterações. Modificações afetam somente gerações futuras.',
            },
            {
              icon: Copy,
              nome: 'Duplicar Modelo',
              descricao:
                'Cria uma cópia do modelo com o nome "Cópia de [nome]". Útil para criar variações de um modelo base.',
            },
            {
              icon: Sparkles,
              nome: 'Melhorar com IA',
              descricao:
                'Aciona o assistente de IA para revisar, expandir ou melhorar o texto de um modelo ou de uma peça já gerada.',
            },
            {
              icon: RefreshCw,
              nome: 'Regerar Peça',
              descricao:
                'Regenera a peça a partir do modelo, útil quando os dados do processo foram atualizados após a geração inicial.',
            },
            {
              icon: Download,
              nome: 'Exportar',
              descricao: 'Exporta a peça gerada em PDF ou DOCX.',
            },
          ]}
        />
      </DocSection>
    </div>
  );
}
