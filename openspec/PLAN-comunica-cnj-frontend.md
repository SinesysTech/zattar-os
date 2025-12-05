# Plano: Frontend Comunica CNJ - Fase 2

## Contexto

O backend da integração Comunica CNJ já está completo (Fase 1) com:
- 4 API routes: `/consulta`, `/certidao/[hash]`, `/tribunais`, `/captura`
- Cliente HTTP com rate limiting e retry logic
- Serviços de persistência e captura
- Vinculação automática comunicação ↔ expediente

Existe um protótipo de frontend em `dev/comunica-cnj/frontend/` que precisa ser migrado e integrado ao sistema.

---

## Estrutura Proposta

### Localização no Menu

```
navAdministração:
  - Captura (existente)
    - Histórico
    - Agendamentos
    - Credenciais
    - Tribunais
  - Comunica CNJ (NOVO)      ← Adicionar aqui
    - Consulta
    - Comunicações Capturadas
    - Configurações
```

### Estrutura de Diretórios

```
app/(dashboard)/comunica-cnj/
├── page.tsx                           # Redirect → /consulta
├── consulta/
│   └── page.tsx                       # Busca manual na API CNJ
├── comunicacoes/
│   └── page.tsx                       # Lista de comunicações capturadas
├── configuracoes/
│   └── page.tsx                       # Agendamentos de captura CNJ
└── components/
    ├── comunica-cnj-search-form.tsx   # Formulário de busca
    ├── comunica-cnj-results-table.tsx # Tabela de resultados
    ├── comunicacao-detalhes-dialog.tsx # Dialog de detalhes
    ├── comunicacoes-capturadas-list.tsx # Lista de capturadas do banco
    ├── pdf-viewer-dialog.tsx          # Visualizador de certidão PDF
    ├── captura-cnj-form.tsx           # Formulário para executar captura
    └── captura-cnj-stats.tsx          # Estatísticas de captura
```

---

## Páginas e Funcionalidades

### 1. Consulta Manual (`/comunica-cnj/consulta`)

**Objetivo:** Buscar comunicações na API do CNJ em tempo real (sem persistir).

**Filtros disponíveis:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| Tribunal | Combobox com busca | TRT1-TRT24, TST, TJs |
| Número do Processo | Input | Com máscara CNJ |
| OAB | Advogado cadastrado ou manual | Número + UF |
| Nome da Parte | Input | Busca parcial |
| Período | DateRangePicker | data_inicio / data_fim |
| Meio | Select | Edital (E) / Diário (D) |
| Texto | Input | Busca no conteúdo |

**Tabela de Resultados:**
- Data disponibilização
- Tribunal (badge colorido)
- Número do processo (com máscara)
- Tipo de comunicação (Intimação, Citação, etc.)
- Tipo de documento (Despacho, Sentença, etc.)
- Partes (autoras/rés)
- Ações: Ver detalhes, Ver certidão PDF, Abrir no PJE

**Funcionalidades extras:**
- Exportar Excel/JSON
- Paginação (5 ou 100 itens)
- Status de rate limit da API
- Dialog de detalhes completos

---

### 2. Comunicações Capturadas (`/comunica-cnj/comunicacoes`)

**Objetivo:** Listar comunicações já capturadas e persistidas no banco.

**Filtros:**
- Tribunal
- Advogado responsável pela captura
- Período de disponibilização
- Status de vinculação (com/sem expediente)
- Origem do expediente criado

**Colunas da tabela:**
- Data disponibilização
- Tribunal
- Processo
- Tipo comunicação
- Expediente vinculado (link)
- Advogado captura
- Data captura
- Ações: Ver detalhes, Ver certidão, Ir para expediente

---

### 3. Configurações (`/comunica-cnj/configuracoes`)

**Objetivo:** Gerenciar agendamentos de captura automática do CNJ.

**Funcionalidades:**
- Criar agendamento por advogado (usa OAB cadastrada)
- Definir horário de execução
- Ativar/desativar agendamentos
- Histórico de execuções com estatísticas

**Formulário de Captura Manual:**
- Seletor de advogado
- Opção de OAB manual (número + UF)
- Filtro por tribunal (opcional)
- Período de busca (opcional)
- Botão "Executar Captura"
- Exibição de estatísticas após execução:
  - Total encontradas
  - Novas persistidas
  - Duplicadas ignoradas
  - Expedientes vinculados
  - Expedientes criados
  - Erros

---

## Componentes a Criar

### 1. `ComunicaCNJSearchForm`
Baseado em `dev/comunica-cnj/frontend/components/search-form.tsx`, adaptado para:
- Usar SWR para lista de tribunais
- Integrar com `useAdvogados` hook existente
- Usar `FormDatePicker` do projeto
- Seguir padrões de formulário do projeto

### 2. `ComunicaCNJResultsTable`
Baseado em `dev/comunica-cnj/frontend/components/results-table.tsx`, adaptado para:
- Usar `DataTable` do projeto (se aplicável)
- Usar `TribunalBadge` existente
- Integrar com exportação Excel/JSON existente

### 3. `ComunicacaoDetalhesDialog`
Dialog para exibir:
- Dados do processo (número, tribunal, classe, órgão)
- Dados da comunicação (tipo, categoria, data)
- Partes (autores e réus)
- Advogados
- Texto completo da comunicação (HTML renderizado)
- Botões: Ver certidão PDF, Abrir no PJE

### 4. `PdfViewerDialog`
Componente para visualizar certidão PDF:
- Fetch da API `/api/comunica-cnj/certidao/[hash]`
- Exibir em iframe ou embed
- Opção de download

### 5. `CapturaCNJForm`
Formulário para executar captura:
- Seletor de advogado (combobox)
- Campos opcionais: tribunal, período
- Botão de execução com loading state
- Exibição de resultado com estatísticas

---

## Hooks a Criar

### `useComunicaCNJ`
```typescript
// Hook para busca manual na API
function useComunicaCNJ(params: ComunicacaoAPIParams) {
  return useSWR(
    params ? ['/api/comunica-cnj/consulta', params] : null,
    fetcher
  );
}
```

### `useComunicacoesCapturadas`
```typescript
// Hook para listar comunicações do banco
function useComunicacoesCapturadas(filtros: FiltrosComunicacoes) {
  return useSWR(['/api/comunica-cnj/capturadas', filtros], fetcher);
}
```

### `useTribunaisCNJ`
```typescript
// Hook para lista de tribunais (cached)
function useTribunaisCNJ() {
  return useSWR('/api/comunica-cnj/tribunais', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
}
```

---

## Tipos a Criar/Mover

```typescript
// lib/types/comunica-cnj.ts

interface ComunicacaoItem {
  id: number;
  hash: string;
  numeroProcesso: string;
  numeroProcessoComMascara: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  tipoDocumento: string;
  dataDisponibilizacao: string;
  dataDisponibilizacaoFormatada: string;
  meio: 'E' | 'D';
  texto: string;
  link: string;
  partesAutoras: string[];
  partesReus: string[];
  advogados: string[];
  // ...
}

interface ComunicacaoBuscaParams {
  siglaTribunal?: string;
  texto?: string;
  nomeParte?: string;
  numeroOab?: string;
  ufOab?: string;
  numeroProcesso?: string;
  dataInicio?: string;
  dataFim?: string;
  meio?: 'E' | 'D';
  pagina?: number;
  itensPorPagina?: 5 | 100;
}

interface CapturaStats {
  total: number;
  novos: number;
  duplicados: number;
  vinculados: number;
  expedientesCriados: number;
  erros: number;
}
```

---

## Alterações em Arquivos Existentes

### 1. `components/layout/app-sidebar.tsx`
Adicionar item "Comunica CNJ" em `navAdministracao`:
```typescript
{
  name: "Comunica CNJ",
  url: "/comunica-cnj",
  icon: Bell, // ou outro ícone apropriado
  items: [
    { title: "Consulta", url: "/comunica-cnj/consulta" },
    { title: "Comunicações", url: "/comunica-cnj/comunicacoes" },
    { title: "Configurações", url: "/comunica-cnj/configuracoes" },
  ],
},
```

### 2. `lib/types/index.ts`
Exportar novos tipos de comunica-cnj.

---

## Tasks de Implementação (Estimativa)

### Modelagem e Tipos
- [ ] Criar `lib/types/comunica-cnj.ts` com interfaces
- [ ] Criar tipos frontend para formulários e tabelas

### Hooks e Data Fetching
- [ ] Criar `app/_lib/hooks/use-comunica-cnj.ts`
- [ ] Criar `app/_lib/hooks/use-tribunais-cnj.ts`
- [ ] Criar `app/_lib/hooks/use-comunicacoes-capturadas.ts`

### Componentes
- [ ] Mover e adaptar `ComunicaCNJSearchForm`
- [ ] Mover e adaptar `ComunicaCNJResultsTable`
- [ ] Criar `ComunicacaoDetalhesDialog`
- [ ] Criar `PdfViewerDialog`
- [ ] Criar `CapturaCNJForm`
- [ ] Criar `CapturaStatsCard`

### Páginas
- [ ] Criar `app/(dashboard)/comunica-cnj/page.tsx` (redirect)
- [ ] Criar `app/(dashboard)/comunica-cnj/consulta/page.tsx`
- [ ] Criar `app/(dashboard)/comunica-cnj/comunicacoes/page.tsx`
- [ ] Criar `app/(dashboard)/comunica-cnj/configuracoes/page.tsx`

### Navegação
- [ ] Adicionar item no sidebar (`app-sidebar.tsx`)

### API Routes Adicionais (se necessário)
- [ ] `GET /api/comunica-cnj/capturadas` - Listar do banco com filtros
- [ ] Já existentes: `/consulta`, `/certidao/[hash]`, `/tribunais`, `/captura`

---

## Decisões de Design

### Store vs SWR
**Recomendação:** Usar SWR (padrão do projeto) ao invés de Zustand store.
- Mantém consistência com outras partes do sistema
- Cache automático e revalidação
- Mais simples de manter

### Tabela
**Opção A:** DataTable do projeto com TanStack Table
**Opção B:** Tabela customizada (como no protótipo)
**Recomendação:** Avaliar se DataTable atende, senão usar tabela customizada.

### Localização no Menu
**Opção A:** Submenu de "Captura" existente
**Opção B:** Item separado em navAdministração (recomendado)
**Opção C:** Item em navPrincipal junto com Expedientes

---

## Pontos de Atenção

1. **Rate Limiting:** Exibir status do rate limit para o usuário
2. **Performance:** Paginação obrigatória (100 itens máx por página)
3. **UX:** Loading states claros durante buscas
4. **Acessibilidade:** Seguir padrões WCAG existentes no projeto
5. **Responsividade:** Testar em mobile (tabela pode precisar de scroll horizontal)

---

## Referências

- Protótipo existente: `dev/comunica-cnj/frontend/`
- Backend implementado: `backend/comunica-cnj/`
- API routes: `app/api/comunica-cnj/`
- Spec OpenSpec: `openspec/specs/comunica-cnj/spec.md`
