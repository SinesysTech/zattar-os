# Redesign do Fluxo Público de Assinatura Digital

- **Data**: 2026-04-16
- **Autor**: Jordan Medeiros (com Claude)
- **Status**: Spec aprovado, aguardando plano de implementação
- **Escopo**: `src/app/(assinatura-digital)/` + `src/shared/assinatura-digital/components/public-shell/` (novo)

## Contexto

As duas rotas públicas de assinatura digital — `/assinatura/[token]` (link recebido por e-mail) e `/formulario/[segmento]/[formulario]` (cliente preenche formulário e assina) — possuem shells duplicados, steppers divergentes e inconsistências visuais relevantes:

- A rota de token usa `PublicPageShell` + `Card` shadcn + `bg-muted` plano (não segue Glass Briefing).
- A rota de formulário usa `PublicFormShell` + `AmbientBackdrop` + `GlassPanel` (segue Glass Briefing parcialmente) mas tem 10-12 steps dedicados.

Este documento define o redesign unificado das duas rotas, aplicando o design system interno "Glass Briefing" (já consolidado na área autenticada), consolidando shell e reduzindo fricção do fluxo, com tema light-only.

## Objetivos

1. Criar um único `PublicWizardShell` consumido pelas duas rotas, eliminando `PublicPageShell`, `PublicFormShell`, `PublicStepLayout`, `FormStepLayout` e `step-progress.tsx`.
2. Reduzir o formulário dinâmico de 10-12 para 7 steps, mantendo conformidade MP 2.200-2/2001.
3. Alinhar visual das duas rotas ao Glass Briefing (AmbientBackdrop + GlassPanel + tokens OKLCH existentes).
4. Forçar tema light nas rotas públicas, independente da preferência do sistema do usuário.
5. Tornar a tela crítica de Assinar mobile-first real: canvas ≥220px, termos no footer sticky, selfie como sub-tela.
6. Sucesso celebratório glass com partículas estáticas, sem mudar tokens do design system.
7. Zero regressão funcional — todos os fluxos atuais continuam funcionando (draft persistido, contratos pendentes, geolocation, rubrica opcional, multi-PDF download, CPF validation).

## Não-objetivos

- Não muda a camada de store (`formulario-store` Zustand), domain, actions, repositories, validations, constants.
- Não muda o fluxo interno autenticado de "Novo documento → Configurar assinantes → Revisar".
- Não introduz nova autenticação (o token segue sendo o mecanismo público).
- Não migra rotas admin de `(authenticated)/assinatura-digital/` para sistema de permissões — esse é backlog arquitetural separado.
- Não adiciona feature-flag — rollback se faz via git revert.

## Decisões de design

### 1. Arquitetura: shell unificado

Criar `src/shared/assinatura-digital/components/public-shell/` com:

```
public-shell/
├── public-wizard-shell.tsx     # chassis completo: AmbientBackdrop + header + sidebar/header compacto + main + footer sticky
├── public-wizard-header.tsx    # BrandMark centralizado
├── public-wizard-progress.tsx  # Vertical (desktop sidebar) / Horizontal (mobile header)
├── public-step-card.tsx        # GlassPanel depth=1 com chip, title, description e slot
├── public-step-footer.tsx      # footer sticky com Voltar / Continuar
├── document-peek-card.tsx      # thumbnail PDF estilizado + metadata (reutilizável nas duas rotas)
├── selfie-capture-sheet.tsx    # overlay Radix Dialog modal=false, abre/fecha sobre AssinarStep
├── success-hero.tsx            # checkmark gradient glass + halo + partículas estáticas
└── index.ts
```

Cada componente tem responsabilidade isolada:
- `PublicWizardShell` — layout; depende de `AmbientBackdrop`, `BrandMark`, `PublicWizardProgress`.
- `PublicStepCard` — wrapper visual; depende de `GlassPanel`, `Heading`, `Text`.
- `PublicStepFooter` — botões e CTA; depende de `Button`.
- Os demais são subcomponentes especializados, sem dependência entre si.

### 2. Light-only

O `src/app/(assinatura-digital)/layout.tsx` (cria se não existir) injeta um script inline que força `className="light"` e `data-theme="light"` no `<html>` antes da hidratação, evitando flash. Toda a subtree pública ignora `prefers-color-scheme: dark`.

### 3. Fluxo reduzido

**Rota A · `/assinatura/[token]`** — 4 steps + opcional:

1. Boas-vindas
2. Confirmar dados
3. Revisar documento
4. Assinar (selfie sub-tela opcional, termos footer sticky)
5. Pronto

**Rota B · `/formulario/[segmento]/[formulario]`** — 7 steps:

1. Identificação (funde Welcome + VerificarCPF)
2. Dados pessoais (funde DadosIdentidade + DadosContatos)
3. Endereço
4. Formulário dinâmico (auto-skip se sem schema)
5. Revisar documento (orquestra PDF ou Markdown)
6. Assinar (funde TermosAceite + AssinaturaManuscrita + foto sub-tela)
7. Pronto

**Comportamentos globais** (fora do progress):
- Geolocation silenciosa via `useEffect` no shell.
- Contratos pendentes (Rota B) em Dialog glass após step 1.
- Selfie como sub-tela modal dentro de Assinar.

### 4. Tela crítica Assinar

- Canvas `CanvasAssinatura` existente com wrapper `border-2 border-dashed border-border rounded-xl bg-muted/40 p-1.5`.
- Altura mobile ≥220px, desktop 180-200px.
- Rubrica opcional inline abaixo.
- Footer-card glass sticky com checkbox MP 2.200-2 + CTA "Finalizar assinatura".
- Selfie (quando habilitada) abre `SelfieCaptureSheet` no mount do step; ao capturar, fecha com transição e revela canvas.

### 5. Sucesso celebratório

- `AmbientBackdrop tint="success"` (prop nova opcional, aditiva).
- Checkmark 72px com gradient `--success` + halo via `box-shadow`.
- Heading "Tudo pronto!" / "Documentos assinados!".
- Card glass listando PDFs com botão Baixar em cada.
- Alert info "Uma cópia será enviada para {email}".
- Collapsible "Detalhes técnicos" com hash SHA-256, IP, localização, timestamp.

### 6. Tipografia e tokens

Reuso estrito:
- `Heading` níveis `page` e `section`.
- `Text` variantes `overline`, `caption`, `micro-caption`.
- Cores apenas via CSS vars existentes: `--primary`, `--success`, `--info`, `--muted-foreground`, `--foreground`, `--outline-variant`, `--surface-*` (confirmadas em `src/app/globals.css` — `--success` na linha 323, `--info` na 327, `--outline-variant` na 357).
- Zero hardcode de cor (`bg-blue-500`, `#hex` proibidos).

## Arquivos a criar

```
src/shared/assinatura-digital/components/public-shell/
├── public-wizard-shell.tsx
├── public-wizard-header.tsx
├── public-wizard-progress.tsx
├── public-step-card.tsx
├── public-step-footer.tsx
├── document-peek-card.tsx
├── selfie-capture-sheet.tsx
├── success-hero.tsx
└── index.ts

src/app/(assinatura-digital)/layout.tsx   # light-only enforcement

src/app/(assinatura-digital)/_wizard/form/
├── dados-pessoais-step.tsx       # funde identidade + contatos
├── revisar-documento-step.tsx    # orquestra PDF ou Markdown
└── assinar-step.tsx              # funde termos + assinatura + selfie sub-tela
```

## Arquivos a deletar

```
src/app/(assinatura-digital)/_wizard/public-form-shell.tsx
src/app/(assinatura-digital)/_wizard/step-progress.tsx
src/app/(assinatura-digital)/_wizard/form/form-step-layout.tsx
src/app/(assinatura-digital)/_wizard/form/dados-identidade.tsx
src/app/(assinatura-digital)/_wizard/form/dados-contatos.tsx
src/app/(assinatura-digital)/_wizard/form/visualizacao-pdf-step.tsx
src/app/(assinatura-digital)/_wizard/form/visualizacao-markdown-step.tsx
src/app/(assinatura-digital)/_wizard/form/termos-aceite-step.tsx
src/app/(assinatura-digital)/_wizard/form/assinatura-manuscrita-step.tsx
src/app/(assinatura-digital)/_wizard/capture/geolocation-step.tsx
src/app/(assinatura-digital)/_wizard/capture/captura-foto-step.tsx   # vira sub-tela
src/app/(assinatura-digital)/assinatura/[token]/_components/layout/PublicPageShell.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/layout/PublicStepLayout.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/layout/PublicStepIndicator.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/shared/PublicProgressBar.tsx
```

## Arquivos a modificar

```
src/app/(assinatura-digital)/_wizard/form/formulario-container.tsx
  - Reescrever buildStepConfigs com nova topologia de 7 steps
  - Usar PublicWizardShell em vez de PublicFormShell
  - Remover GeolocationStep/CapturaFotoStep/TermosAceiteStep da árvore de decisão

src/app/(assinatura-digital)/_wizard/form/verificar-cpf.tsx
  - Renomear conceitualmente para IdentificacaoStep
  - Adicionar hero glass + chip overline

src/app/(assinatura-digital)/_wizard/form/dados-endereco.tsx
  - Rewrapear em PublicStepCard + PublicStepFooter

src/app/(assinatura-digital)/_wizard/form/dynamic-form-step.tsx
  - Rewrapear em PublicStepCard + PublicStepFooter

src/app/(assinatura-digital)/_wizard/form/sucesso.tsx
  - Substituir UI por SuccessHero + card glass de PDFs + collapsible técnico

src/app/(assinatura-digital)/assinatura/[token]/_components/PublicSignatureFlow.tsx
  - Substituir PublicPageShell por PublicWizardShell
  - Mover Selfie de step próprio para sub-tela dentro de SignatureStep
  - Atualizar steps array (remover selfie como step)

src/app/(assinatura-digital)/assinatura/[token]/_components/steps/WelcomeStep.tsx
  - Aplicar novo hero glass (opção B da decisão visual)
  - Usar DocumentPeekCard

src/app/(assinatura-digital)/assinatura/[token]/_components/steps/ConfirmDetailsStep.tsx
  - Rewrapear em PublicStepCard

src/app/(assinatura-digital)/assinatura/[token]/_components/steps/ReviewDocumentStep.tsx
  - Rewrapear em PublicStepCard

src/app/(assinatura-digital)/assinatura/[token]/_components/steps/SignatureStep.tsx
  - Canvas altura maior, termos para footer sticky
  - Integrar SelfieCaptureSheet como sub-tela

src/app/(assinatura-digital)/assinatura/[token]/_components/steps/SuccessStep.tsx
  - Substituir por SuccessHero + card glass

src/components/shared/ambient-backdrop.tsx
  - Adicionar prop opcional tint?: "default" | "success" (aditiva, não-breaking)

src/shared/assinatura-digital/store/formulario-store.ts
  - Em hydrateContext, validar etapaAtual contra stepConfigs novo; se out-of-range, reset para 0

src/shared/assinatura-digital/index.ts
  - Exportar os novos componentes do public-shell
  - Remover exports obsoletos
```

## Error handling

| Estado | Tratamento |
|--------|-----------|
| Loading inicial | LoadingState centralizado no shell |
| Erro de rede | ErrorState com botão "Tentar novamente" |
| Token inválido/expirado (Rota A) | ErrorState "Link expirado · entre em contato com o remetente" |
| Documento não pronto (Rota A) | DocumentNotReadyState (igual atual, rewrapeado) |
| Cliente já assinou (Rota A) | Atalho para SuccessHero |
| Draft de outro formulário (Rota B) | Reset silencioso + toast "Iniciando novo formulário" |
| Template não encontrado (Rota B) | ErrorState inline com botão Voltar |
| Geolocation recusada | Prossegue silenciosamente |
| Câmera negada (Selfie) | Botão "Pular" discreto |
| Termos não aceitos | Botão Finalizar desabilitado (sem alert intrusivo) |

## Testes

**Preservar e rewrapear:**
- `__tests__/e2e/public-form-flow.spec.ts`
- `__tests__/e2e/public-signature-flow.spec.ts`
- `__tests__/e2e/viewport-fit.spec.ts`
- `__tests__/e2e/helpers/mocks.ts`

Atualizar seletores para novos steps fundidos.

**Novos testes:**
- `public-wizard-shell.test.tsx`
- `public-step-card.test.tsx`
- `selfie-capture-sheet.test.tsx`
- `success-hero.test.tsx`
- `__tests__/e2e/light-mode-forced.spec.ts`
- `__tests__/e2e/draft-stepconfig-migration.spec.ts` (valida reset quando etapaAtual apontar para step extinto)

**Deletar testes dos arquivos removidos:**
- `public-form-shell.test.tsx`
- `step-progress.test.tsx`
- `form-step-layout.test.tsx`

## Estratégia de migração (4 fases)

1. **Scaffolding** — criar public-shell, subcomponentes, layout.tsx light-only, testes novos.
2. **Rota A migração** — reescrever PublicSignatureFlow e steps, deletar legacy.
3. **Rota B migração** — novos steps consolidados, nova topologia em formulario-container, deletar legacy, validar draft migration.
4. **Cleanup** — remover shells antigos, rodar `check:architecture`, `validate:exports`, `test`, `test:e2e`, smoke manual em mobile real.

Rollback: `git revert` do commit de cada fase.

## Riscos e mitigações

- **Draft persistido apontando para step extinto**: `hydrateContext` valida `etapaAtual` contra novo `stepConfigs`; se inválido, reset para 0.
- **Selfie overlay + ScrollArea**: usar Radix Dialog com `modal={false}` e `z-index` acima do footer sticky.
- **Footer sticky + teclado mobile (iOS)**: aplicar `padding-bottom: env(keyboard-inset-height, 0)` no footer.
- **AmbientBackdrop tint success em light**: validar saturação visual; se muito forte, reduzir opacidade para `0.08`.
- **CSS var ausente (`--success`, `--info`)**: já validado — presentes em `globals.css` com override `.dark`.

## Sucesso do projeto

- [ ] Zero imports cross-group (público ↔ authenticated) ou cross-deep (entre módulos)
- [ ] `npm run check:architecture` sem warnings novos
- [ ] `npm run validate:exports` OK
- [ ] Todos os E2E de fluxo público passando
- [ ] Lighthouse mobile (iPhone SE emulado) ≥95 acessibilidade
- [ ] Canvas legível em 375px de largura (mínimo 220px de altura)
- [ ] Light-only verificado com `prefers-color-scheme: dark` do browser
- [ ] Tela Assinar testada em iPhone SE e Pixel 6 real
- [ ] Nenhum hardcode de cor novo (validado via grep)
- [ ] Nenhum CSS custom novo em `globals.css` (só tokens e classes já existentes)

## Referências

- Design System Glass Briefing: `src/app/globals.css`, `src/lib/design-system/tokens.ts`
- Checklist visual: `docs/architecture/VISUAL-REVIEW-CHECKLIST.md`
- Benchmarks UX: Dropbox Sign (simplicidade mobile), Clicksign/ZapSign/Autentique (mobile-first Brasil com WhatsApp-native), DocuSign (rigor B2B)
- Conformidade legal: MP 2.200-2/2001 (preservada sem mudança)
