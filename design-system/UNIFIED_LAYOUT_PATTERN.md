# Padrão de Layout Unificado (Unified Client Layout)

> **Diretriz Obrigatória para Agentes AI e Desenvolvedores**
> Este documento descreve o padrão arquitetural de "Single-column Unified Layout" (também chamado de Unified Client Pattern) que DEVE ser seguido no que tange à **arquitetura de informação e layout estrutural** ao criar ou refatorar páginas do Zattar OS (ex: Partes, Audiências, Processos, Expedientes, Contratos).
> _Nota: Diretrizes puramente estéticas (GlassMorphism, cores, sombras) já estão regidas no Design System central. Este documento foca estritamente na hierarquia estrutural e de componentes._

## 1. O Problema do Design Antigo (Legado)

No padrão antigo, usávamos `<PageShell>` e delegávamos a renderização de telas para instâncias isoladas de `<DataShell>` e `<DataTableToolbar>`.
**Por que abandonar?**

- Inconsistência de largura ao transitar entre visualizações (Lista, Quadro, Calendário).
- Cabeçalhos, buscas e filtros duplicados dentro de cada sub-visualização.
- Faltava uma visão executiva única (KPIs, Insights) que abraçasse todas as "visões" dos dados.

## 2. A Nova Arquitetura: Single-Column Unified Client

A arquitetura das páginas de módulos principais é roteada por um **único Client Component central (ex: `ProcessosClient`, `PartesClient`)** que toma o controle de todo o estado da view, gerenciamento dos controles e estado global (Tabs/Search). Os sub-componentes (listas, tabelas, quadros) operam apenas como visualizadores dos dados filtrados.

### 2.1. Estrutura Estratégica do Componente Central

Não envolva a página no injetor de grid obsoleto `<PageShell>`. Use o grid de layout centralizado para ancorar a Single-column:

```tsx
// ❌ ERRADO (Padrão Antigo)
<PageShell title="Expedientes">
  <ExpedientesContent />
</PageShell>

// ✅ CERTO (Unified Client Architecture)
<div className="max-w-350 mx-auto space-y-5">
  {/* Header: Estrutura Principal e Ações (Nível H1) */}
  {/* KPI Strip: Resumo Agregado */}
  {/* Insight Banners: Alertas Condicionais */}
  {/* View Controls: Ferramentas de Filtro e Busca */}
  {/* Content: View Renderizada Dinamicamente */}
  {/* Overlays: Forms, Dialogs (Proibido uso de Sheets) */}
</div>
```

### 2.2. Anatomia do Unified Client

Todo Client Component de Entidade (`{Entidade}Client.tsx`) DEVE seguir rigorosamente esta estrutura vertical de 6 blocos:

#### Bloco 1: Header (Cabeçalho de Página)

Deve conter apenas a hierarquia primária: Título (h1), subtítulo que representa dados métricos ou sumários do estado carregado e, por fim, botões de fluxo de ação globais (+ Novo) encapsulados à direita.

```tsx
<div className="flex items-end justify-between gap-4">
  <div>
    <h1 className="text-2xl font-heading font-semibold tracking-tight">
      Nome do Módulo
    </h1>
    <p className="text-sm text-muted-foreground/50 mt-0.5">
      Métricas da visualização ou descrição estrutural.
    </p>
  </div>
  <div className="flex items-center gap-2">
    {/* Ações Globais: Botão de Adição Contextual */}
  </div>
</div>
```

#### Bloco 2: KPI Strip (Destaques Numéricos)

Componente que engloba um resumo tático das informações da entidade renderizada. (Ex: `<PulseStrip>`, `<MissionKpiStrip>`). Este bloco independe da view atualmente selecionada.

#### Bloco 3: Insight Banners (Lógica Contextual de Alertas)

Avisos estruturais dinâmicos (renderizados se houver dados), dependendo da lógica do domínio. Usado prioritariamente para que o servidor ou cliente promova a atenção necessária antes das listagens explodirem a quantidade de itens.

#### Bloco 4: View Controls (Centro Gerenciador de Estados)

Este bloco de informações (Tooling Bar) é a alma do Unified Client. O gerenciamento de estados (`search`, `activeTab`, `viewMode`) reside e controla a view daqui.
As visualizações filhas recebem a cascata, em vez da view filha forçar seus próprios `<SearchInput>`.

```tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
  {/* Tabs para Status ou Tipos principais (ex: Ativos, Inativos) */}
  <TabPills tabs={tabs} active={activeTab} onChange={setActiveTab} />

  <div className="flex items-center gap-2 flex-1 justify-end">
    <SearchInput value={search} onChange={setSearch} placeholder="Buscar..." />
    <ViewToggle mode={viewMode} onChange={setViewMode} options={VIEW_OPTIONS} />
  </div>
</div>
```

#### Bloco 5: Content Switcher (Ponte de Views)

Aqui o roteamento lógico da UI injeta os dados num switch em `viewMode` para cada View filha.
**REGRA DE OURO AMARRADA À ESTRUTURA:** Por se utilizar de um grid estruturado superior, **nenhuma view deve aplicar `fixed-widths` expansivos** ou recriar shells (como usar `DataShell` limitadores de padding com Sub-Cabeçalhos).
Se, e apenas se, a view for tabular e técnica (com requisição de um componente avançado shadcn `DataTable`), remova o Header do container-wrapper (`DataShell`), delegando tudo puramente ao corpo dos resultados - pois o Header unificado em Bloco 4 já abrange este escopo.

#### Bloco 6: Overlays Arquiteturais (Apenas Modals e Dialogs)

Ao invés de renderizações recondicionais de página ou inserções por views aninhadas, os Forms e Diálogos Detalhados são persistidos na parte inferior do Component Client e orquestram renderizações através da injeção de ID local ativada por seleções no `Content Switcher`.

### 2.2. A Regra do "Quick Action & No-Sheet" (Fim do DetailSheet)

Em todos os módulos foi banido o uso do componente genérico **"Sheet"** / painéis laterais de detalhes.

- **Botões Acessíveis:** As listas, cards, e kanbans OBRIGATORIAMENTE precisam renderizar os botões de ação e status (Ex: `Finalizar`, `Assinar`, `Baixar`) diretamente no loop de item da listagem, tirando do usuário a dor de usar 2 clicks (Abrir Detalhe -> Clicar Ação).
- **Resumo Suficiente Direto no Item:** Mostre a classificação da urgência e as badges descritivas no próprio nível de listagem.
- **Dialog invés de Sheet:** Quando for inevitável e você precisar abrir um detalhamento amplo de uma entidade (um formulário extenso ou inspeção grande), instancie-o por um **`<DialogFormShell>`** (modais centralizados) em substituição aos defasados `SheetRight`.

## 3. Checklist Contrato e Validação (Agentes IA)

Antes de considerar uma refatoração de Client ou Component Pai concluída, o roteiro arquitetural base a ser checado é:

- [ ] A raiz da página tem a premissa de Single Column (`max-w-350 mx-auto space-y-5`) garantindo a fluidez responsiva sem limitação de layout? (Remoção total de `<PageShell>`).
- [ ] Views foram purgadas? A Busca (`SearchInput`) e os Toggles não causam rerenderização em duplicata porque vivem no Gerenciador Mestre (Client Pai)?
- [ ] O Container detém de faixas de agregação (KPIs) amarradas abaixo do Header e nunca dentro do "Switcher" de abas secundárias?
- [ ] Remoção de amarrações obsoletas como `<DataShell>` envolvendo os grids das "Lista View", desburocratizando as expansões verticais na página e duplicatas de cabeçalhos.
- [ ] O uso de Details Sheet (Painéis de expansão lateral/Direita) foi totalmente expurgado? Substituto por `<Dialog>` (Se for inevitável expandir itens muito densos).
- [ ] A Listagem / Cartões (ListRows/Cards do módulo) exibe os botões de manipulação do objeto abertamente no final daquela linha, evitando ao máximo abrir uma nova tela para interagir com o objeto (Quick Action)?

_Adoção referencial baseada na modernização do design da branch vigente, notavelmente em Módulos Maduros: Partes, Dashboard._
