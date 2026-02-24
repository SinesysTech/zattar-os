import { lazy, type ComponentType } from 'react';

export type DocEntry = {
  title: string;
  slug: string;
  keywords?: string[];
  component?: React.LazyExoticComponent<ComponentType>;
  children?: DocEntry[];
};

// Lazy-load content pages
const lz = (path: string) =>
  lazy(() => import(`./content/${path}`));

export const docsRegistry: DocEntry[] = [
  {
    title: 'Dashboard',
    slug: 'dashboard',
    keywords: ['painel', 'métricas', 'gráficos', 'widgets'],
    component: lz('dashboard'),
  },
  {
    title: 'Partes',
    slug: 'partes',
    keywords: ['cadastro', 'pessoas'],
    children: [
      {
        title: 'Clientes',
        slug: 'partes/clientes',
        keywords: ['cadastro', 'cpf', 'cnpj', 'pessoa física', 'pessoa jurídica'],
        component: lz('partes/clientes'),
      },
      {
        title: 'Partes Contrárias',
        slug: 'partes/partes-contrarias',
        keywords: ['adversário', 'réu', 'reclamada', 'reclamado'],
        component: lz('partes/partes-contrarias'),
      },
      {
        title: 'Terceiros',
        slug: 'partes/terceiros',
        keywords: ['testemunha', 'perito', 'envolvido'],
        component: lz('partes/terceiros'),
      },
      {
        title: 'Representantes',
        slug: 'partes/representantes',
        keywords: ['advogado', 'oab', 'procurador'],
        component: lz('partes/representantes'),
      },
    ],
  },
  {
    title: 'Contratos',
    slug: 'contratos',
    keywords: ['honorário', 'contrato', 'parcela', 'valor'],
    component: lz('contratos'),
  },
  {
    title: 'Processos',
    slug: 'processos',
    keywords: ['processo', 'judicial', 'pje', 'tribunal', 'vara'],
    component: lz('processos'),
  },
  {
    title: 'Audiências',
    slug: 'audiencias',
    keywords: ['audiência', 'pauta', 'calendário', 'agenda'],
    component: lz('audiencias'),
  },
  {
    title: 'Expedientes',
    slug: 'expedientes',
    keywords: ['intimação', 'prazo', 'comunicação', 'notificação judicial'],
    component: lz('expedientes'),
  },
  {
    title: 'Perícias',
    slug: 'pericias',
    keywords: ['perito', 'laudo', 'quesito', 'exame'],
    component: lz('pericias'),
  },
  {
    title: 'Obrigações',
    slug: 'obrigacoes',
    keywords: ['acordo', 'condenação', 'parcela', 'pagamento'],
    component: lz('obrigacoes'),
  },
  {
    title: 'Planner',
    slug: 'planner',
    keywords: ['organização', 'produtividade'],
    children: [
      {
        title: 'Agenda',
        slug: 'planner/agenda',
        keywords: ['calendário', 'evento', 'compromisso'],
        component: lz('planner/agenda'),
      },
      {
        title: 'Tarefas',
        slug: 'planner/tarefas',
        keywords: ['kanban', 'quadro', 'to-do', 'tarefa'],
        component: lz('planner/tarefas'),
      },
      {
        title: 'Notas',
        slug: 'planner/notas',
        keywords: ['anotação', 'nota', 'rascunho'],
        component: lz('planner/notas'),
      },
    ],
  },
  {
    title: 'Documentos',
    slug: 'documentos',
    keywords: ['editor', 'documento', 'texto', 'ia'],
    component: lz('documentos'),
  },
  {
    title: 'Peças Jurídicas',
    slug: 'pecas-juridicas',
    keywords: ['petição', 'contestação', 'recurso', 'modelo', 'placeholder'],
    component: lz('pecas-juridicas'),
  },
  {
    title: 'Pesquisa Jurídica',
    slug: 'pesquisa-juridica',
    keywords: ['diário oficial', 'pangea', 'jurisprudência', 'busca'],
    component: lz('pesquisa-juridica'),
  },
  {
    title: 'Chat',
    slug: 'chat',
    keywords: ['conversa', 'ia', 'assistente', 'mensagem'],
    component: lz('chat'),
  },
  {
    title: 'Assistentes',
    slug: 'assistentes',
    keywords: ['ia', 'bot', 'inteligência artificial', 'agente'],
    component: lz('assistentes'),
  },
  {
    title: 'Assinatura Digital',
    slug: 'assinatura-digital',
    keywords: ['assinar', 'digital', 'certificado'],
    children: [
      {
        title: 'Documentos',
        slug: 'assinatura-digital/documentos',
        keywords: ['envio', 'signatário', 'assinatura'],
        component: lz('assinatura-digital/documentos'),
      },
      {
        title: 'Templates',
        slug: 'assinatura-digital/templates',
        keywords: ['modelo', 'pdf', 'campo'],
        component: lz('assinatura-digital/templates'),
      },
      {
        title: 'Formulários',
        slug: 'assinatura-digital/formularios',
        keywords: ['formulário', 'público', 'link', 'coleta'],
        component: lz('assinatura-digital/formularios'),
      },
    ],
  },
  {
    title: 'Financeiro',
    slug: 'financeiro',
    keywords: ['dinheiro', 'receita', 'despesa'],
    children: [
      {
        title: 'Visão Geral',
        slug: 'financeiro/visao-geral',
        keywords: ['dashboard', 'métricas', 'financeiro'],
        component: lz('financeiro/visao-geral'),
      },
      {
        title: 'Orçamentos',
        slug: 'financeiro/orcamentos',
        keywords: ['orçamento', 'previsão', 'comparação'],
        component: lz('financeiro/orcamentos'),
      },
      {
        title: 'Contas a Pagar',
        slug: 'financeiro/contas-pagar',
        keywords: ['despesa', 'fornecedor', 'pagamento'],
        component: lz('financeiro/contas-pagar'),
      },
      {
        title: 'Contas a Receber',
        slug: 'financeiro/contas-receber',
        keywords: ['receita', 'cobrança', 'inadimplência'],
        component: lz('financeiro/contas-receber'),
      },
      {
        title: 'Plano de Contas',
        slug: 'financeiro/plano-contas',
        keywords: ['categoria', 'contábil', 'hierarquia'],
        component: lz('financeiro/plano-contas'),
      },
      {
        title: 'Conciliação Bancária',
        slug: 'financeiro/conciliacao',
        keywords: ['extrato', 'banco', 'conciliar'],
        component: lz('financeiro/conciliacao'),
      },
      {
        title: 'DRE',
        slug: 'financeiro/dre',
        keywords: ['demonstrativo', 'resultado', 'exercício'],
        component: lz('financeiro/dre'),
      },
    ],
  },
  {
    title: 'Recursos Humanos',
    slug: 'rh',
    keywords: ['equipe', 'funcionário', 'salário'],
    children: [
      {
        title: 'Equipe',
        slug: 'rh/equipe',
        keywords: ['usuário', 'membro', 'cargo', 'permissão'],
        component: lz('rh/equipe'),
      },
      {
        title: 'Salários',
        slug: 'rh/salarios',
        keywords: ['salário', 'remuneração', 'custo pessoal'],
        component: lz('rh/salarios'),
      },
      {
        title: 'Folhas de Pagamento',
        slug: 'rh/folhas-pagamento',
        keywords: ['folha', 'pagamento', 'holerite'],
        component: lz('rh/folhas-pagamento'),
      },
    ],
  },
  {
    title: 'Captura',
    slug: 'captura',
    keywords: ['pje', 'scraping', 'automação', 'tribunal'],
    children: [
      {
        title: 'Histórico',
        slug: 'captura/historico',
        keywords: ['log', 'execução', 'resultado'],
        component: lz('captura/historico'),
      },
      {
        title: 'Agendamentos',
        slug: 'captura/agendamentos',
        keywords: ['programar', 'automático', 'cron'],
        component: lz('captura/agendamentos'),
      },
      {
        title: 'Advogados, Credenciais e Tribunais',
        slug: 'captura/configuracao',
        keywords: ['advogado', 'credencial', 'tribunal', 'login'],
        component: lz('captura/configuracao'),
      },
    ],
  },
  {
    title: 'Perfil e Configurações',
    slug: 'configuracoes',
    keywords: ['conta', 'preferência', 'tema'],
    children: [
      {
        title: 'Perfil',
        slug: 'configuracoes/perfil',
        keywords: ['dados pessoais', 'senha', 'avatar'],
        component: lz('configuracoes/perfil'),
      },
      {
        title: 'Configurações',
        slug: 'configuracoes/sistema',
        keywords: ['integração', 'aparência', 'ia'],
        component: lz('configuracoes/sistema'),
      },
      {
        title: 'Notificações',
        slug: 'configuracoes/notificacoes',
        keywords: ['alerta', 'aviso', 'lembrete'],
        component: lz('configuracoes/notificacoes'),
      },
    ],
  },
];

/** Resolve um slug (ex: ["partes", "clientes"]) para a entrada no registry */
export function resolveSlug(slugParts: string[]): DocEntry | null {
  const target = slugParts.join('/');

  function find(entries: DocEntry[]): DocEntry | null {
    for (const entry of entries) {
      if (entry.slug === target && entry.component) return entry;
      if (entry.children) {
        const found = find(entry.children);
        if (found) return found;
      }
    }
    return null;
  }

  return find(docsRegistry);
}

/** Busca entradas por termo (título ou keywords) */
export function searchDocs(term: string): DocEntry[] {
  const lower = term.toLowerCase();
  const results: DocEntry[] = [];

  function search(entries: DocEntry[]) {
    for (const entry of entries) {
      const matchTitle = entry.title.toLowerCase().includes(lower);
      const matchKeyword = entry.keywords?.some(k => k.toLowerCase().includes(lower));
      if ((matchTitle || matchKeyword) && entry.component) {
        results.push(entry);
      }
      if (entry.children) search(entry.children);
    }
  }

  search(docsRegistry);
  return results;
}
