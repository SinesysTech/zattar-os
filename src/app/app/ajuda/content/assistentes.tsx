'use client';

import {
  DocSection,
  DocActionList,
  DocTip,
  DocSteps,
} from '../components/doc-components';
import {
  Bot,
  MessageSquare,
  FileText,
  Scale,
  Calculator,
  Search,
  Users,
  Sparkles,
} from 'lucide-react';

export default function AssistentesDoc() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading mb-2">Assistentes</h1>
        <p className="text-muted-foreground text-lg">
          Assistentes de IA especializados em tarefas jurídicas específicas, cada um otimizado para um domínio diferente do trabalho advocatício.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          Os Assistentes são agentes de inteligência artificial pré-configurados com conhecimento
          especializado em áreas específicas do direito e da gestão do escritório. Diferente do
          Chat genérico, cada assistente tem um foco definido, instruções específicas e pode executar
          tarefas estruturadas com mais profundidade e precisão dentro do seu domínio.
        </p>
        <DocTip>
          Use o Assistente correto para cada tarefa. Um assistente especializado em trabalhista
          produz resultados muito mais precisos para questões dessa área do que o Chat genérico.
        </DocTip>
      </DocSection>

      <DocSection title="Assistentes Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Scale,
              nome: 'Assistente Trabalhista',
              descricao:
                'Especializado em direito do trabalho brasileiro. Auxilia na análise de rescisões, cálculos de verbas trabalhistas, interpretação de convenções coletivas, prazos processuais na Justiça do Trabalho e elaboração de argumentos para reclamações e defesas.',
            },
            {
              icon: Scale,
              nome: 'Assistente Cível',
              descricao:
                'Focado no direito civil e processual civil. Auxilia na análise de contratos, responsabilidade civil, direito das obrigações, prazos do CPC, elaboração de petições cíveis e análise de jurisprudência do STJ.',
            },
            {
              icon: Scale,
              nome: 'Assistente Previdenciário',
              descricao:
                'Especializado em direito previdenciário. Auxilia no cálculo de benefícios, análise de requisitos para aposentadoria, revisão de benefícios, recursos administrativos no INSS e ações judiciais previdenciárias.',
            },
            {
              icon: FileText,
              nome: 'Assistente de Contratos',
              descricao:
                'Analisa e elabora contratos. Identifica cláusulas abusivas, sugere melhorias, verifica conformidade legal, explica termos técnicos e compara versões de documentos contratuais.',
            },
            {
              icon: Calculator,
              nome: 'Assistente Financeiro',
              descricao:
                'Auxilia em questões financeiras do escritório: interpretação de relatórios, análise de honorários, orientação sobre controle financeiro e gestão de inadimplência.',
            },
            {
              icon: Search,
              nome: 'Assistente de Pesquisa',
              descricao:
                'Especializado em pesquisa jurídica. Formula estratégias de busca, analisa resultados, sintetiza jurisprudência e identifica tendências nos tribunais sobre teses específicas.',
            },
            {
              icon: Users,
              nome: 'Assistente de Clientes',
              descricao:
                'Auxilia na comunicação com clientes. Elabora e-mails explicativos, resumos de situação processual em linguagem acessível e orientações para clientes sobre próximos passos.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Como Interagir com um Assistente">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse o módulo de Assistentes',
              descricao: 'No menu lateral, clique em "Assistentes".',
            },
            {
              titulo: 'Selecione o assistente adequado',
              descricao:
                'Leia a descrição de cada assistente e selecione o mais adequado para a sua necessidade. Cada assistente tem uma área de especialização definida.',
            },
            {
              titulo: 'Inicie a sessão',
              descricao:
                'Clique em "Iniciar Conversa" ou "Usar Assistente". Uma janela de chat dedicada é aberta com o contexto do assistente já carregado.',
            },
            {
              titulo: 'Forneça contexto relevante',
              descricao:
                'Descreva sua situação com o máximo de detalhes relevantes: área do direito, fatos do caso, o que você precisa e qualquer restrição ou particularidade.',
            },
            {
              titulo: 'Refine com perguntas de acompanhamento',
              descricao:
                'Se a resposta não cobriu algum aspecto, faça perguntas de acompanhamento para aprofundar ou ajustar o resultado.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Exemplos de Uso por Assistente">
        <DocActionList
          actions={[
            {
              icon: Scale,
              nome: 'Trabalhista: Cálculo de Rescisão',
              descricao:
                '"Meu cliente trabalhou 3 anos e 4 meses como CLT com salário de R$ 3.500. Foi demitido sem justa causa. Quais são as verbas rescisórias devidas e qual o valor estimado de cada uma?"',
            },
            {
              icon: FileText,
              nome: 'Contratos: Análise de Risco',
              descricao:
                '"Analise a seguinte cláusula de exclusividade [colar cláusula] e me diga se há riscos para o contratante e como ela poderia ser redigida de forma mais equilibrada."',
            },
            {
              icon: Scale,
              nome: 'Previdenciário: Requisitos',
              descricao:
                '"Minha cliente nasceu em 1968, é mulher, tem 30 anos de contribuição e atividade rural nos primeiros 10 anos. Ela tem direito a alguma modalidade de aposentadoria agora?"',
            },
            {
              icon: Users,
              nome: 'Clientes: Comunicação',
              descricao:
                '"Elabore um e-mail para meu cliente João explicando em linguagem simples que o processo dele foi extinto sem julgamento do mérito por ilegitimidade ativa e que precisamos ajuizar novamente."',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Diferença entre Chat e Assistentes">
        <p className="text-muted-foreground mb-4">
          Embora tanto o Chat quanto os Assistentes utilizem inteligência artificial, há diferenças
          importantes em como cada um deve ser usado:
        </p>
        <DocActionList
          actions={[
            {
              icon: MessageSquare,
              nome: 'Chat',
              descricao:
                'Conversa genérica de propósito geral. Ideal para dúvidas rápidas, consultas diversas e quando você não precisa de profundidade especializada em uma área específica.',
            },
            {
              icon: Bot,
              nome: 'Assistentes',
              descricao:
                'Agentes especializados com instruções e conhecimento focado em um domínio. Produzem respostas mais detalhadas, precisas e estruturadas para tarefas da sua área de especialização.',
            },
            {
              icon: Sparkles,
              nome: 'Quando usar cada um',
              descricao:
                'Use o Chat para consultas rápidas e variadas. Use os Assistentes quando precisar de análise profunda, elaboração de documentos complexos ou quando a questão é específica de uma área do direito.',
            },
          ]}
        />
        <DocTip>
          As conversas com Assistentes também ficam salvas no histórico. Você pode retomar uma sessão
          com um assistente de onde parou, mantendo todo o contexto da conversa anterior.
        </DocTip>
      </DocSection>
    </div>
  );
}
