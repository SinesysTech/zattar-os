# Zattar Glass — Meta-Skill para o Design System Glass Briefing

> **Spec de design** (fase de brainstorming). Este documento é contrato de intenção; o plano executável sai do próximo ciclo (`writing-plans`).
> Data: 2026-04-22 · Autor: Jordan Medeiros + Claude · Status: em revisão

---

## 1. Contexto e dor central

O ZattarOS tem Design System **Glass Briefing 2.0.0** com infraestrutura normativa robusta: `MASTER.md` (SSoT), `GOVERNANCE.md` (workflow formal), `ROADMAP.md` (KPIs mensuráveis), `audit:design-system` (CI bloqueador), `VISUAL-REVIEW-CHECKLIST.md`. Apesar disso, a grade atual do DS é **D (48/100)** e duas dores se repetem quando Claude mexe em UI:

**Dor 1 — Drift em código novo**: componentes criados sem passar por `GlassPanel`/`Heading`/`Text`, cores hardcoded (`bg-blue-500`, hex inline), `shadow-xl` onde o Glass pede `glass-widget`.

**Dor 2 — Divergência entre refactors paralelos (dor primária)**: quando múltiplos módulos são refatorados para o Glass Briefing (já foram: audiências, obrigações, perícias; pendentes: notas, e-mail), cada output vira "quase igual mas não exatamente". Pequenas decisões — qual `Heading level` num card, qual `GlassPanel depth`, qual variante de spacing — saem diferentes sem justificativa, produzindo inconsistência sutil no app.

**A skill resolve ambas, mas o princípio norteador é a Dor 2**: produzir **output determinístico** em workflow de UI. Mesmo input (ex: "refatorar módulo X para Glass Briefing") deve produzir as mesmas decisões estruturais, sempre.

---

## 2. Princípio norteador

**Determinismo via oráculos canônicos indexados por shape.**

Em vez de re-inventar decisões a cada refactor, a skill força consulta a um **módulo canônico** apropriado ao **shape** do alvo. Módulos do ZattarOS têm topologias diferentes (CRUD simples, temporal, nested FSD, kanban) e um canon único não serve para todos. Análise empírica (2026-04-22) estabelece a seguinte tabela de canons:

| Shape | Canon primário | Evidência |
|---|---|---|
| **CRUD simples** (lista + detail + form) | `src/app/(authenticated)/entrevistas-trabalhistas/` | 21/21 TSX com `Heading`/`Text` (100% density); FSD completo enxuto; 0 violações |
| **Temporal** (ano/mês/semana/lista/quadro) | `src/app/(authenticated)/expedientes/` | 76 shell refs (maior do app); 55 Glass refs; topologia idêntica compartilhada com `perícias` |
| **Nested FSD** (sub-domínios aninhados) | `src/app/(authenticated)/partes/` | Único módulo com 4 sub-domínios maduros (clientes, representantes, terceiros, partes-contrarias); 30 shell refs |
| **Kanban/pipeline** | ❌ sem canon hoje | `contratos` tem 6 violações (grade F); se módulo novo cair nesse shape, `translating` é fase mandatória |

Qualquer decisão de alto nível (níveis de heading, depths, tabs, empty states, shell escolhido) deve **replicar o canon do shape correspondente**. Divergência é permitida apenas quando justificada por escrito em `DIVERGENCE-LOG.md`.

Esse princípio ataca a Dor 2 diretamente: se dois refactors do mesmo shape consultam o mesmo oráculo, eles convergem.

Aplicado como guard-rail, também ataca a Dor 1: criar componente novo sem classificar shape + consultar o canon respectivo vira red flag explícito.

---

## 3. Decisões arquiteturais (travadas no brainstorm)

| # | Decisão | Escolha | Justificativa |
|---|---|---|---|
| 1 | **Granularidade** | Hub + 4 sub-skills | Foco por workflow; loopholes específicos por trilha; evolução granular |
| 2 | **Namespace** | Flat (`.claude/skills/zattar-glass{-creating,-migrating,…}`) | Recomendação explícita do `writing-skills` |
| 3 | **Localização** | `.claude/skills/` do projeto (versionado no repo) | Alinha com `GOVERNANCE.md §2` (docs simultâneas); reviewável em PR |
| 4 | **Trigger principal** | Auto-discovery via `description` | Claude precisa acionar sozinho em situação de UI-work; slash command vira opt-in |
| 5 | **Slash command** | Só no hub (`/zattar-glass`), como escape hatch | Não é default |
| 6 | **Testing** | Pressure scenarios com subagent (metodologia padrão) | Estabelecido em `writing-skills` |
| 7 | **Docs linkadas** | Referências por caminho relativo, nunca `@`-links | `@` force-loada 200k+ de context |
| 8 | **Oráculos canônicos por shape** | CRUD simples: `entrevistas-trabalhistas`; Temporal: `expedientes`; Nested FSD: `partes`; Kanban: sem canon (requer `translating`) | Análise empírica (§2) mostra shapes distintos com canons distintos; canon único geraria convergência errada |
| 9 | **Wipro Max** | `ui-ux-pro-max` (old, 96 palettes) = repertório; `ui-ux-pro-max:ui-ux-pro-max` (new, 161 palettes) = repertório + UX guidelines | Ambas são **agnósticas** ao Glass, sempre filtradas pela sub-skill `translating` antes de virar código |

---

## 4. Arquitetura de arquivos

```
.claude/skills/
├── zattar-glass/                     # HUB — ~180 palavras, só roteia
│   ├── SKILL.md
│   └── references/
│       └── glass-vocabulary.md       # Mapa condensado de tokens/componentes/anti-patterns
│
├── zattar-glass-creating/            # Componente/página nova
│   ├── SKILL.md                      # ~350 palavras
│   └── examples/
│       └── widget-template.tsx       # Template canônico
│
├── zattar-glass-migrating/           # Refactor para Glass Briefing (workflow primário da Dor 2)
│   ├── SKILL.md                      # ~400 palavras (mais denso — red flags extensas)
│   └── references/
│       └── violation-taxonomy.md     # Sintoma → token canônico
│
├── zattar-glass-translating/         # Briefing externo → plano Zattar
│   ├── SKILL.md                      # ~350 palavras
│   └── references/
│       └── wipro-max-bridge.md       # Como filtrar output da Wipro Max para tokens
│
└── zattar-glass-governing/           # Novo token (trigger em cascata)
    ├── SKILL.md                      # ~300 palavras
    └── references/
        └── token-pr-checklist.md     # globals.css + tokens.ts + registry + MASTER.md

.claude/commands/
└── zattar-glass.md                   # Slash command manual do hub
```

**Total**: 5 SKILL.md + 5 supporting files + 1 slash command = **11 arquivos**. Cada SKILL.md abaixo de 500 palavras (exigência de token efficiency).

---

## 5. Hub — `zattar-glass`

**`description`** (máx 500 chars, sem workflow summary):

> Use when modifying, creating, or reviewing any UI in ZattarOS (paths under `src/app/(authenticated)/**` or `src/components/**`). First skill to invoke for frontend work — routes to the right specialized sub-skill and provides shared Glass Briefing vocabulary (tokens, GlassPanel depths, Heading/Text variants, shape-indexed canonical modules).

**Conteúdo do SKILL.md**:

1. **Overview** (≤30 palavras): O que é Glass Briefing; por que essa skill existe.
2. **Routing table** (flowchart graphviz): decisão sobre qual sub-skill invocar.
3. **Vocabulário compartilhado** (≤80 palavras): 3 depths, `Heading`/`Text` obrigatórios, nunca hex/literals, sempre `audit:design-system`.
4. **Oráculos canônicos indexados por shape**: CRUD→`entrevistas-trabalhistas`, Temporal→`expedientes`, Nested FSD→`partes`, Kanban→passar por `translating` (§10).
5. **Ponteiros** (links, não force-load): `design-system/MASTER.md`, `src/lib/design-system/tokens.ts`, `design-system/GOVERNANCE.md`, `docs/architecture/VISUAL-REVIEW-CHECKLIST.md`.
6. **Boundary clause**: "This skill does NOT implement anything. It routes. If you're here without invoking a sub-skill, stop."
7. **Red flags** (table): 4 racionalizações que fazem Claude pular o hub.

---

## 6. `zattar-glass-creating`

**Trigger**: criação de componente ou página nova em `src/app/(authenticated)/**` ou `src/components/**`.

**Workflow determinístico** (em etapas fixas):

0. **CLASSIFY SHAPE** — Identificar o shape do componente/página a criar: CRUD simples, Temporal, Nested FSD, Kanban (§10.1). Para Kanban, interromper e chamar `translating` primeiro.
1. **DISCOVER** — Ler canon do shape identificado (ex: `entrevistas-trabalhistas/components/` para CRUD) e listar componentes shared já existentes em `@/components/shared/` e `@/components/ui/`. Objetivo: mapear o que REUSAR antes de criar.
2. **BRIEF** — Escrever briefing curto (≤100 palavras): o que o componente faz, densidade, estados (empty, loading, error), responsividade. Se briefing vier de fonte externa (Figma, Dribbble, ui-ux-pro-max), **parar e chamar `translating` primeiro**.
3. **PLAN** — Mapear decisões estruturais em tabela: `GlassPanel depth`, `Heading level`, tokens de cor/espaçamento, componentes shared usados. Cada decisão **cita** um precedente no canon ou justifica divergência.
4. **IMPLEMENT** — Escrever TSX consumindo tokens semânticos (`bg-primary`, `text-muted-foreground`). **Zero** hex, `bg-{color}-{scale}`, `shadow-xl`. Se precisa token novo → chamar `governing`.
5. **VERIFY** — Rodar `npm run audit:design-system` localmente. Precisa passar sem violações bloqueadoras.
6. **DIFF-VS-CANON** — Listar em commit message as decisões que divergem do canon e por quê.

**Output**: componente novo + entry em shared se reutilizável + commit com diff-vs-canon + audit passando.

**Boundary**: NÃO refatora código existente (delega a `migrating`); NÃO inventa token (delega a `governing`).

**Red flags**:
- "O canon não tem um componente parecido" → primeiro justifique por escrito, depois crie
- "Só um hex rapidinho pra demo" → não existe "rapidinho" aqui
- "O audit está lento, pulo" → não pula

---

## 7. `zattar-glass-migrating` (skill primária para a Dor 2)

**Trigger**: refactor de módulo existente para Glass Briefing. Sinais detectáveis: presença de hex literal, `bg-{color}-{scale}` do Tailwind default, `shadow-xl`, HTML cru no lugar de `Heading`/`Text`, ausência de `GlassPanel`.

**Workflow determinístico**:

0. **CLASSIFY SHAPE** — Identificar shape do módulo-alvo (§10.1): CRUD simples, Temporal, Nested FSD, Kanban. Output é `{shape, canon_path}`.
1. **MAP CANON** — Ler o canon do shape correspondente em profundidade (ex: `entrevistas-trabalhistas/` para CRUD; `expedientes/` para Temporal; `partes/` para Nested FSD): layout da página, `PageShell`/`DataShell`/`DialogFormShell`/`TemporalViewShell` usados, níveis de `Heading`, variantes de `Text`, depths, componentes shared, empty states, loading states, filtros. Produzir **mapa mental escrito** (≤200 palavras). Se canon é `partes` (atualmente imaturo — §10.1), sinalizar e incluir tarefa de lift como parte do mesmo trabalho.
2. **INVENTORY TARGET** — Listar todas as violações do módulo-alvo (output de `audit:design-system` + grep por `#[0-9a-f]`, `bg-(red|blue|green|yellow)-\d`, `shadow-xl`, `<h[1-6]`, `<p `). Priorizar por frequência.
3. **MAP DIFFS** — Tabela **por componente** do alvo: decisão atual → decisão canônica → ação (swap token, upgrade para componente shared, re-hierarquizar Heading).
4. **PROPOSE ATOMIC COMMITS** — Cada commit = uma decisão estrutural (ex: "commit 1: trocar hex por tokens semânticos em `notes-list.tsx`"). Nunca um commit "migrar tudo".
5. **EXECUTE** — Aplicar commit por commit, cada um passando `npm run type-check` e `npm run audit:design-system`.
6. **DIVERGENCE LOG** — Se algum componente do alvo precisa divergir do canon (ex: notas tem feature que o canon não tem), documentar em `docs/architecture/DIVERGENCE-LOG.md` com justificativa.
7. **FINAL AUDIT** — `npm run audit:design-system --ci` passa. Grade do módulo sobe para B+ ou melhor.

**Output**: série de PRs atômicos + grade do módulo elevada + divergence log atualizado.

**Boundary**: NÃO cria componentes novos (se o alvo falta feature, cria via `creating` em PR separado); NÃO redefine estilo — só traduz para o canon.

**Red flags** (cobrindo a dor de divergência):
- "Vou decidir na hora qual Heading level funciona melhor" → NÃO. Consulte o canon.
- "No outro módulo fiz diferente" → sinal de drift. Pare e reconcilie com canon.
- "Essa divergência é pequena" → documente ou reverta. Pequenas divergências são a dor.
- "Audit passou, terminei" → audit detecta só violações mecânicas; consistência vs canon exige o mapa §3.

---

## 8. `zattar-glass-translating`

**Trigger**: briefing externo chega — output da `ui-ux-pro-max`, link Figma/Dribbble/Behance, referência descritiva do usuário ("quero bento grid minimalista roxo").

**Workflow determinístico**:

1. **CAPTURE** — Transcrever briefing em ≤100 palavras estruturadas: forma, elementos, tom, referências visuais.
2. **IDENTIFY GENERIC** — Listar **escolhas do repertório genérico** (palette específica, estilo "glassmorphism", font pairing, chart library). Tudo isso é **tentativa**, não contrato.
3. **TRANSLATE** — Para cada escolha genérica, mapear para tokens Zattar:
   - Palette → `--chart-*`, `--primary`, `--success/warning/destructive` ou (se incompatível) sinalizar para `governing`
   - Estilo glassmorphism → `GlassPanel` depths 1–3
   - Font pairing → Montserrat/Inter/Manrope/Geist (já definidos em globals.css)
   - Animação → tokens `--anim-*` e regra "150–300ms, transform/opacity apenas"
4. **REJECT** — Itens que não traduzem (ex: "gradient radial arco-íris") são **rejeitados com justificativa** no output. Não "adaptar" em silêncio.
5. **PRODUCE PLAN** — Documento curto (≤1 página) listando: decisões mapeadas, rejeições, sub-skill destino (`creating` ou `migrating`).
6. **HANDOFF** — Invocar sub-skill destino com o plano como entrada.

**Output**: plano de 1 página + handoff para `creating` ou `migrating`.

**Boundary**: NÃO implementa código; só produz plano.

**Red flags**:
- "Vou usar essa palette do ui-ux-pro-max direto" → filtre primeiro
- "Esse estilo não cabe, mas vou adaptar" → rejeite explicitamente
- "Gradient legal, vou só usar hex" → jamais

---

## 9. `zattar-glass-governing`

**Trigger**: detecção de necessidade de token novo por qualquer outra sub-skill. Sintomas: "não existe `--chart-9`", "preciso de uma sombra entre `glass-kpi` e `glass-elevated`", "preciso de um `--status-arquivado`".

**Workflow determinístico**:

1. **JUSTIFY** — Explicar em ≤80 palavras por que token existente não serve. Lista de alternativas tentadas (reuso, opacidade, combinação).
2. **PROPOSE OKLCH** — Calcular valor light e dark (seguindo o hue 281° e croma conforme §2 do `MASTER.md`).
3. **WRITE 4-WAY PATCH** — Edit simultâneo de:
   - `src/app/globals.css` (`@theme inline` + `:root` + `.dark`)
   - `src/lib/design-system/tokens.ts`
   - `src/lib/design-system/token-registry.ts`
   - `design-system/MASTER.md` (entrada na seção apropriada + changelog)
4. **AUDIT** — `npm run audit:design-system` passa; drift "CSS sem registry" e "Registry sem CSS" ambos zero para esse token.
5. **ISSUE** — Abrir issue com formato de `GOVERNANCE.md §3.1` (Motivação, Alternativas, Valor proposto, Onde vai aparecer). Inclusive se for fast-track.
6. **HANDOFF** — Devolver para sub-skill que disparou (`creating`/`migrating`/`translating`) agora que token existe.

**Output**: PR único tocando 4 arquivos + issue formal + token utilizável.

**Boundary**: NÃO toca componentes — só token infrastructure.

**Red flags**:
- "Adiciono só no globals.css por enquanto" → não. Patch é atômico nos 4 arquivos.
- "Registry depois" → drift futuro garantido.
- "MASTER.md depois" → viola `GOVERNANCE.md §2`.

---

## 10. Oráculos canônicos indexados por shape

### 10.1 Shapes e canons

Estabelecidos por análise empírica (medições em 2026-04-22: grep por refs de `Heading`/`Text`, `GlassPanel`, `Shell`, hex/tailwind literals, raw `<h*>`, shadow-xl):

| Shape | Canon | Evidência |
|---|---|---|
| **CRUD simples** (lista + detail + form) | `src/app/(authenticated)/entrevistas-trabalhistas/` | 21 TSX, 21 refs `Heading`/`Text` (100% density), FSD completo, 0 violações; porte enxuto, ideal para CRUD |
| **Temporal** (ano/mês/semana/lista/quadro) | `src/app/(authenticated)/expedientes/` | 42 TSX, **76 shell refs (maior do app)**, 55 Glass, 0 violações; topologia de visões temporais consolidada |
| **Nested FSD** (sub-domínios aninhados) | `src/app/(authenticated)/partes/` | 34 TSX, 30 shell refs, 4 sub-domínios (clientes, representantes, terceiros, partes-contrarias); único módulo com essa topologia. **Drift presente** (5 raw `<h*>`, 7 `Heading`/`Text`) — canon vai precisar lift junto com a primeira iteração da skill |
| **Kanban/pipeline** | ❌ sem canon maduro | `contratos` tem 6 violações hex/tailwind-color (grade F em `ROADMAP`) + design doc próprio em andamento. Para módulo novo nesse shape: `translating` é fase **mandatória** antes de qualquer código |

### 10.2 Uso nas sub-skills

Primeiro passo de qualquer sub-skill é **classificar o shape do alvo**:

- **CRUD simples** — módulo tem apenas lista + detail (opcional) + form. Canon: `entrevistas-trabalhistas`.
- **Temporal** — módulo tem visões múltiplas por período (ano/mês/semana/lista/quadro ou subset). Canon: `expedientes`.
- **Nested FSD** — módulo tem 2+ sub-domínios aninhados sob um domínio pai. Canon: `partes`.
- **Kanban/pipeline** — módulo usa colunas-estado ou timeline de stages. Sem canon — passar por `translating`.

Depois de classificado:

- `creating`: consultar canon do shape antes de desenhar.
- `migrating`: mapear canon do shape antes de refatorar.
- `translating`: usar canon do shape como destino da tradução "genérico → Zattar".
- `governing`: inspecionar canons de shapes afetados para checar se o caso já é atendido.

### 10.3 Manutenção dos canons

Os canons não são fixos para sempre. Devem ser **re-avaliados empiricamente** a cada 2 meses (ou quando módulo canônico é alterado materialmente). O processo de re-avaliação roda as mesmas métricas de §10.1 e promove o vencedor. Qualquer mudança de canon atualiza **os 5 SKILL.md em PR único** — pertence ao workflow do próprio `governing`.

**Canon imaturo conhecido**: `partes` tem drift a corrigir (5 raw `<h*>`). A primeira iteração da meta-skill (provavelmente `migrating` em `notas`) deve agendar um PR de lift em `partes` para fechar o drift e tornar o canon nested FSD autoritativo.

---

## 11. Supporting files (detalhe)

| Arquivo | Conteúdo | Fonte |
|---|---|---|
| `zattar-glass/references/glass-vocabulary.md` | Lista curta e escaneável: 12 tokens semânticos mais usados, 3 depths com exemplos, 10 componentes shared mais utilizados, 8 anti-patterns | Extraído de `MASTER.md` + `ROADMAP.md` adoção top |
| `zattar-glass-creating/examples/widget-template.tsx` | Um widget novo exemplar (KPI simples) em TSX comentado — importa `GlassPanel`, `Heading`, `Text`, tokens. Copy-paste-ready. | Inspirado num widget da pasta `dashboard/widgets/` grade A |
| `zattar-glass-migrating/references/violation-taxonomy.md` | Tabela: `hex inline` → `bg-primary/...`; `bg-blue-500` → `bg-info/...`; `shadow-xl` → `glass-widget shadow-none`; `<h1>` → `<Heading level="page">`; etc. | Pulled from `audit:design-system` output format |
| `zattar-glass-translating/references/wipro-max-bridge.md` | Tabela de tradução: 96 palettes ui-ux-pro-max → namespace Zattar (só as 10 mais comuns mapeadas; resto vira "rejeitar e justificar"). Explicação de por que glassmorphism do ui-ux-pro-max ≠ Glass Briefing (opacidade, hue, depth) | Pulled de ambos os ui-ux-pro-max skill descriptions |
| `zattar-glass-governing/references/token-pr-checklist.md` | Checklist copy-paste-able para PR: (1) globals.css @theme+:root+.dark, (2) tokens.ts export, (3) token-registry.ts entry, (4) MASTER.md entry + changelog, (5) audit passa | Derivado de `GOVERNANCE.md §3.1` |

---

## 12. Cenários RED concretos (para baseline)

Antes de escrever cada SKILL.md, rodar um pressure scenario com subagent **sem a skill**, capturando rationalizations verbatim. Cenários escolhidos com base em dores reais do usuário:

| Sub-skill | Cenário RED | Pressões embutidas |
|---|---|---|
| `creating` | "Crie um widget de aging de prazos no dashboard — 5 faixas, glassmorphism, mostrando contagem por faixa" | Autoridade (usuário pede), sunk cost (já desenhou mental), tempo ("pra amanhã") |
| `migrating` (primário) | "Refatore o módulo `notas` para o Glass Briefing — está com hex e sem Heading" | Exaustão (módulo grande), tempo, autoridade, "é parecido com audiências" (tentação de copiar sem consultar canon) |
| `migrating` (teste de drift) | Aplicar skill retroativamente aos refactors já feitos (audiências, perícias, obrigações) e verificar se detecta as divergências atuais entre eles | Verifica que skill captura a Dor 2 de fato |
| `translating` | Passar output fictício do `ui-ux-pro-max` ("claymorphism dashboard com palette Sunset Oasis, font pairing Playfair + Lato") e pedir conversão | Autoridade (ui-ux-pro-max é "oficial"), tentação de adaptar em vez de rejeitar |
| `governing` | "Preciso de um token de cor para status de processo arquivado — não existe, faz rápido" | Tempo ("rápido"), escopo ("só uma cor"), tentação de adicionar só em globals.css |

Cada cenário precisa rodar antes do GREEN — sem baseline, o GREEN é chute.

---

## 13. Estratégia de teste (RED-GREEN-REFACTOR)

Padrão do `writing-skills`:

1. **RED**: rodar cenários §12 com subagent sem skill. Documentar rationalizations verbatim. Esperar violação em todos os 5 cenários.
2. **GREEN**: escrever SKILL.md mínimo fechando as rationalizations observadas. Rodar cenários com skill. Esperar compliance.
3. **REFACTOR**: identificar novas rationalizations que emergirem. Adicionar counters explícitos. Re-rodar até bulletproof.

**Critério de bulletproof para cada sub-skill**: 3 execuções consecutivas do mesmo cenário com subagents independentes produzindo:

1. **Mesma classificação de shape** (§10.1) — pré-requisito para convergência
2. **Mesmo canon consultado** (derivação direta do shape)
3. **Decisões estruturais idênticas**: nomes de componentes, levels de heading, depths, tokens escolhidos

Isso **testa determinismo em duas camadas** — classificação correta (shape) + derivação consistente (decisões). Ambas são a métrica real que resolve a Dor 2.

---

## 14. Sequência de build

Ordem sugerida para construção das skills (dependências e ROI):

1. **`zattar-glass` (hub)** — primeiro, porque estabelece vocabulário.
2. **`zattar-glass-migrating`** — segundo, porque ataca a Dor 2 primária e tem os RED mais concretos (notas, e-mail pendentes).
3. **`zattar-glass-creating`** — terceiro, workflow mais simples que migrating.
4. **`zattar-glass-governing`** — quarto, escopo bem delimitado.
5. **`zattar-glass-translating`** — quinto, depende das outras já estarem testadas (faz handoff para elas).

Cada skill passa pelo RED-GREEN-REFACTOR completo antes de passar para a próxima. **Não escrever as 5 em batch** — o `writing-skills` proíbe explicitamente isso.

---

## 15. Não-objetivos (YAGNI explícito)

Para evitar escopo inchado, a primeira versão da meta-skill **não** cobre:

- Acessibilidade aprofundada (a11y além do que `MASTER.md §16` já exige)
- Performance de render (lazy loading, Suspense boundaries — fica no nível arquitetural, não DS)
- Testes automatizados CI que exercitam visualmente componentes (Percy, Chromatic, etc)
- Integração com Figma tokens (DTCG sync)
- i18n/l10n de conteúdo
- Mobile nativo (RN/SwiftUI) — o Glass Briefing é web-only hoje
- Geração automática de componentes a partir de spec (codegen)
- Migração automática em massa (batch rewrite) — migrating faz commits atômicos manuais
- Skills para módulos minimal-intencionais listados em `docs/architecture/MINIMAL_MODULES.md`

Qualquer um desses pode virar skill futura se a dor aparecer — não agora.

---

## 16. Métricas de sucesso

Mensurável após a primeira onda de uso (notas + e-mail migrados):

- **Determinismo**: 3 subagents independentes refatorando o mesmo componente mock chegam às mesmas decisões estruturais (heading levels, depths, tokens).
- **Grade de módulo**: notas e e-mail saem de F/D para ≥B (via `audit:design-system`) após passarem pela `migrating`. Grade B segue a nomenclatura A/B/C/D/F estabelecida em `ROADMAP.md §1`.
- **Audit coverage**: `audit:design-system --ci` rodado em todo PR que toca UI — 0 regressões após ativação.
- **Divergence log crescimento controlado**: documento `docs/architecture/DIVERGENCE-LOG.md` cresce linearmente com casos reais, não explode (sinal de que divergências são exceção, não regra).
- **Baixa taxa de bypass**: Claude não acha loopholes — medido por revisão de 10 PRs subsequentes.

---

## 17. Open questions

Itens propositalmente deixados em aberto para o plano de implementação (`writing-plans`) ou fases subsequentes:

1. **O slash command `/zattar-glass`** — conteúdo exato do `.claude/commands/zattar-glass.md` (será um "/zattar-glass" que re-apresenta o hub? Ou chama sub-skill com argumento?). Resolvido em `writing-plans`.
2. **Formato exato do `DIVERGENCE-LOG.md`** — esqueleto fica em implementação; uma entrada por divergência com `{data, módulo, componente, decisão-canônica, decisão-tomada, justificativa}`.
3. **Integração com CI** — se `audit:design-system --ci` vira obrigatório em pre-push hook para paths de UI. Tratar em fase separada.
4. **Promoção de skill para plugin** — só se um segundo projeto adotar o mesmo DS. Backlog.
5. **Atualização automática da skill quando MASTER.md muda** — hoje é manual. Candidato a hook/automação futura.

---

## 18. Próximo passo

Após aprovação deste spec pelo usuário:

1. Invocar `superpowers:writing-plans` para produzir o plano executável (ordem dos arquivos, teste RED de cada um, conteúdo específico de cada SKILL.md).
2. Executar o plano com `superpowers:executing-plans` ou `superpowers:subagent-driven-development`.
3. Testar determinismo aplicando `zattar-glass-migrating` ao módulo **notas** primeiro (cenário RED mais concreto e de maior ROI).
