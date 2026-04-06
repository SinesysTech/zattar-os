# Expedientes — UI-SPEC Executavel

> Redesign operacional do modulo de expedientes para o novo system design do Zattar OS.

**Data:** 2026-04-06
**Modulo:** `src/app/(authenticated)/expedientes/`
**Base visual:** `design-system/MASTER.md`
**Referencias internas:** Partes, Audiencias, Processos Cockpit

---

## 1. Objetivo

Transformar expedientes de um conjunto de views temporais em um **centro de comando de risco juridico**.

O modulo precisa responder, em qualquer view:

1. O que esta em risco agora.
2. Quem precisa agir.
3. Qual o contexto processual do item.
4. Qual a proxima acao segura e rastreavel.

---

## 2. Arquitetura de Informacao

### Views oficiais

| View     | URL                                    | Papel                  | Resultado esperado                           |
| -------- | -------------------------------------- | ---------------------- | -------------------------------------------- |
| Controle | `/expedientes` e `/expedientes/quadro` | Torre de controle      | Triar e redistribuir risco rapidamente       |
| Semana   | `/expedientes/semana`                  | Execucao diaria        | Operar prazos por dia                        |
| Lista    | `/expedientes/lista`                   | Processamento em massa | Filtrar, selecionar e agir em lote           |
| Mes      | `/expedientes/mes`                     | Radar de carga         | Entender concentracao e sazonalidade proxima |
| Ano      | `/expedientes/ano`                     | Leitura sistemica      | Entender padroes macro do acervo             |

### Hierarquia padrao das views

1. Header do modulo
2. Faixa de sinais/KPIs
3. Controles de trabalho
4. Conteudo principal da view
5. Inspector lateral ou detalhe contextual

---

## 3. Contratos de Layout

### 3.1 Controle

Layout em 3 zonas:

```text
┌──────────────────────────────────────────────────────────────┐
│ Header + contexto do modulo                                 │
├──────────────────────────────────────────────────────────────┤
│ KPI strip: vencidos | hoje | 3 dias | sem dono | sem tipo   │
├────────────────────────────────────────────┬─────────────────┤
│ Fila principal                             │ Radar lateral   │
│ Hero + triagem + cards/lista               │ carga e sinais  │
│                                            │ por responsavel │
├────────────────────────────────────────────┴─────────────────┤
│ Inspector lateral persistente ao selecionar item            │
└──────────────────────────────────────────────────────────────┘
```

Componentes:

- `GlassPanel` para hero, KPIs e paines secundarios
- `TabPills` para trocar a fila visivel
- `SearchInput` para busca operacional
- `ViewToggle` para alternar entre cards e lista compacta
- `DetailSheet` para inspector do expediente selecionado

### 3.2 Semana

Layout continua temporal, mas com shell unificado:

- KPI strip do modulo no topo
- `WeekNavigator`
- tabela/lista por dia
- inspector lateral opcional em iteracao futura

### 3.3 Lista

Layout de alta densidade:

- `DataShell`
- `DataTableToolbar`
- filtros por decisao rapida
- tabela com bulk actions
- detalhe via dialog/sheet

### 3.4 Mes

Layout master-detail:

- calendario compacto a esquerda
- lista do dia a direita
- KPI strip e filtros no topo

### 3.5 Ano

Layout de leitura macro:

- seletor de ano
- grid anual
- dia clicavel abre detalhe do conjunto

---

## 4. Componentes Novos

### `ExpedientesControlView`

Responsabilidades:

- carregar expedientes pendentes para triagem
- derivar filas por urgencia e classificacao
- renderizar cockpit principal
- controlar expediente selecionado

Props:

```ts
interface ExpedientesControlViewProps {
  viewModeSlot?: React.ReactNode;
  settingsSlot?: React.ReactNode;
  usuariosData?: UsuarioData[];
  tiposExpedientesData?: TipoExpedienteData[];
}
```

### `ExpedienteControlDetailSheet`

Responsabilidades:

- exibir contexto operacional do expediente
- mostrar processo, partes, classificacao e auditoria
- oferecer CTA para abrir processo vinculado

Props:

```ts
interface ExpedienteControlDetailSheetProps {
  expediente: Expediente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responsavelNome?: string | null;
  tipoExpedienteNome?: string | null;
}
```

---

## 5. Estados e Regras de Interacao

### Estados de dados

- `loading`: skeletons e paineis vazios
- `error`: erro com CTA de retry
- `empty`: mensagem contextual por fila
- `selectedExpediente`: controla inspector

### Regras de triagem

- `criticos`: pendentes vencidos
- `hoje`: pendentes que vencem hoje
- `proximos`: pendentes que vencem em ate 3 dias
- `sem_responsavel`: pendentes sem `responsavelId`
- `sem_tipo`: pendentes sem `tipoExpedienteId`
- `todos`: uniao ordenada por risco

### Regras de ordenacao no Controle

1. Vencidos primeiro
2. Hoje
3. Proximos 3 dias
4. Sem prazo
5. Restante

### Regras de selecao

- clique em card abre inspector
- clique em CTA de processo navega para `/processos/[id]`
- troca de fila preserva busca
- troca de layout preserva item selecionado

---

## 6. Regras Visuais

- Hero e paineis criticos usam `GlassPanel depth={2}`
- cards secundarios usam `GlassPanel depth={1}`
- badges sem cor hardcoded; usar `AppBadge`, `SemanticBadge` ou tokens semanticos existentes
- densidade alta com leitura clara: titulos pequenos, metadados micro, numeros tabulares
- mobile: empilhar paineis e manter inspector via sheet full-width

---

## 7. Dados Derivados Obrigatorios

Cada expediente exibido no Controle deve mostrar:

- numero do processo
- tribunal/grau
- prazo ou ausencia de prazo
- tipo/origem
- responsavel ou ausencia de responsavel
- autora/re
- status operacional derivado (`Vencido`, `Hoje`, `3 dias`, `Sem prazo`)

KPIs obrigatorios:

- vencidos
- vence hoje
- proximos 3 dias
- sem responsavel
- sem tipo
- capturados
- manuais

---

## 8. Critetrios de Aceite

1. `/expedientes` abre no novo `quadro`.
2. Usuario consegue identificar fila critica sem abrir filtros.
3. Usuario consegue abrir contexto detalhado de um expediente sem sair da tela.
4. Usuario consegue navegar do expediente para o processo relacionado.
5. Semana, lista, mes e ano continuam acessiveis pelo seletor de visualizacao.
6. Implementacao respeita o design system atual e nao reintroduz UI legado.

---

## 9. Proximos incrementos apos esta entrega

1. Unificar KPI strip entre todas as views.
2. Migrar detalhe de lista/semana para o mesmo inspector lateral.
3. Adicionar paleta de triagem com `Command`.
4. Adicionar painel de capacidade por responsavel com acao de redistribuicao.
5. Cruzar conflitos com audiencia/processo/pericia em tempo real.
