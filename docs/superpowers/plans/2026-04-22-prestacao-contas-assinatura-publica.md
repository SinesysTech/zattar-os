# Prestação de Contas via Assinatura Digital Pública — Plano de Implementação

> **Para agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar este plano task-by-task. Steps usam checkbox (`- [ ]`) para tracking.

**Goal:** Implementar fluxo público de prestação de contas onde o cliente assina digitalmente uma declaração autogerada a partir dos dados da parcela e informa os dados bancários para o repasse.

**Architecture:** Novo domínio compartilhado `src/shared/prestacao-contas/` reusa a infraestrutura existente de assinatura digital (tabela de documentos, storage Backblaze, wizard público) e integra ao módulo `obrigacoes`. Template da declaração é um registro editável em `assinatura_digital_templates` com seed idempotente via script. PDF gerado com `pdf-lib` + `unified/remark` a partir do Markdown do template.

**Tech Stack:** Next.js 16 (App Router), TypeScript 5, Supabase (PostgreSQL + RLS), `pdf-lib`, `unified`+`remark-parse`+`remark-rehype`, `mustache`, `react-markdown`, `zod`, `next-safe-action`, Backblaze B2, Tailwind CSS 4, shadcn/ui + Glass Briefing.

**Spec:** [docs/superpowers/specs/2026-04-22-prestacao-contas-assinatura-publica-design.md](../specs/2026-04-22-prestacao-contas-assinatura-publica-design.md)

---

## Estrutura de arquivos

### Novos (criar)

```
src/shared/prestacao-contas/
├── domain.ts
├── types.ts
├── constants.ts
├── repository.ts
├── service.ts
├── index.ts
├── services/
│   ├── variable-resolver.ts
│   ├── contexto-builder.ts
│   ├── template-lookup.ts
│   └── pdf-generator.ts
├── actions/
│   ├── criar-link-prestacao-contas.ts
│   ├── salvar-dados-bancarios.ts
│   └── finalizar-prestacao-contas.ts
└── __tests__/
    ├── variable-resolver.test.ts
    ├── contexto-builder.test.ts
    └── service.test.ts

src/app/(assinatura-digital)/prestacao-contas/[token]/
├── page.tsx
└── _components/
    ├── PrestacaoContasFlow.tsx
    ├── PrestacaoContasContext.tsx
    └── steps/
        └── DadosBancariosStep.tsx

src/app/(authenticated)/obrigacoes/components/prestacao-contas/
├── gerar-link-button.tsx
├── link-gerado-dialog.tsx
├── prestacao-contas-section.tsx
├── visualizar-declaracao-dialog.tsx
├── use-prestacao-contas-status.ts
└── index.ts

supabase/migrations/
├── 20260422120000_create_dados_bancarios_cliente.sql
├── 20260422120100_add_parcelas_prestacao_contas_cols.sql
├── 20260422120200_add_documentos_contexto_cols.sql
└── 20260422120300_add_templates_slug_sistema_cols.sql

scripts/database/
└── seed-prestacao-contas-template.ts

src/lib/safe-action.ts  (modificar: adicionar publicTokenAction)
```

### Modificar

- `src/shared/assinatura-digital/services/storage.service.ts` — adicionar `storePrestacaoContasPdf`
- `src/lib/safe-action.ts` — adicionar wrapper `publicTokenAction`
- `src/app/(authenticated)/obrigacoes/components/dialogs/obrigacao-detalhes-dialog.tsx` — seção prestação de contas
- `src/app/(authenticated)/obrigacoes/components/repasses/repasses-pendentes-list.tsx` — ação no dropdown
- `package.json` — script `seed:prestacao-contas`
- `src/lib/supabase/database.types.ts` — regenerar após migrations

---

## Fase 1 — Banco de dados e domínio

### Task 1.1: Migration `dados_bancarios_cliente`

**Files:**
- Create: `supabase/migrations/20260422120000_create_dados_bancarios_cliente.sql`

- [ ] **Step 1: Escrever migration**

```sql
CREATE TABLE dados_bancarios_cliente (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  banco_codigo TEXT NOT NULL,
  banco_nome TEXT NOT NULL,
  agencia TEXT NOT NULL,
  agencia_digito TEXT,
  conta TEXT NOT NULL,
  conta_digito TEXT,
  tipo_conta TEXT NOT NULL CHECK (tipo_conta IN ('corrente', 'poupanca', 'pagamento')),
  chave_pix TEXT,
  tipo_chave_pix TEXT CHECK (tipo_chave_pix IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  titular_cpf TEXT NOT NULL,
  titular_nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  origem TEXT NOT NULL DEFAULT 'prestacao_contas' CHECK (origem IN ('prestacao_contas', 'cadastro_manual', 'importacao')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ix_dados_bancarios_cliente_ativo_unico
  ON dados_bancarios_cliente (cliente_id)
  WHERE ativo = true;

CREATE INDEX ix_dados_bancarios_cliente_cliente
  ON dados_bancarios_cliente (cliente_id);

ALTER TABLE dados_bancarios_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY dados_bancarios_admin_all ON dados_bancarios_cliente
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMENT ON TABLE dados_bancarios_cliente IS 'Dados bancários persistidos por cliente, reutilizáveis em repasses futuros. Flag ativo garante uma única conta vigente por cliente.';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260422120000_create_dados_bancarios_cliente.sql
git commit -m "feat(db): add dados_bancarios_cliente table"
```

### Task 1.2: Migration colunas `parcelas`

- [ ] **Step 1: Escrever migration**

Create `supabase/migrations/20260422120100_add_parcelas_prestacao_contas_cols.sql`:

```sql
ALTER TABLE parcelas
  ADD COLUMN dados_bancarios_snapshot JSONB,
  ADD COLUMN documento_assinatura_id BIGINT REFERENCES assinatura_digital_documentos(id) ON DELETE SET NULL;

CREATE INDEX ix_parcelas_documento_assinatura ON parcelas (documento_assinatura_id);

COMMENT ON COLUMN parcelas.dados_bancarios_snapshot IS
  'Snapshot imutável dos dados bancários usados neste repasse específico.';
COMMENT ON COLUMN parcelas.documento_assinatura_id IS
  'FK para o documento de assinatura digital gerado via fluxo público.';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260422120100_add_parcelas_prestacao_contas_cols.sql
git commit -m "feat(db): add prestacao-contas columns to parcelas"
```

### Task 1.3: Migration colunas `assinatura_digital_documentos`

- [ ] **Step 1: Escrever migration**

Create `supabase/migrations/20260422120200_add_documentos_contexto_cols.sql`:

```sql
ALTER TABLE assinatura_digital_documentos
  ADD COLUMN tipo_contexto TEXT CHECK (tipo_contexto IN ('generico', 'prestacao_contas', 'contrato')) DEFAULT 'generico',
  ADD COLUMN contexto_parcela_id BIGINT REFERENCES parcelas(id) ON DELETE SET NULL,
  ADD COLUMN template_id BIGINT REFERENCES assinatura_digital_templates(id) ON DELETE SET NULL;

CREATE INDEX ix_assinatura_digital_documentos_parcela ON assinatura_digital_documentos (contexto_parcela_id);

UPDATE assinatura_digital_documentos SET tipo_contexto = 'generico' WHERE tipo_contexto IS NULL;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260422120200_add_documentos_contexto_cols.sql
git commit -m "feat(db): add context cols to assinatura_digital_documentos"
```

### Task 1.4: Migration `slug` e `sistema` em templates

- [ ] **Step 1: Escrever migration**

Create `supabase/migrations/20260422120300_add_templates_slug_sistema_cols.sql`:

```sql
ALTER TABLE assinatura_digital_templates
  ADD COLUMN slug TEXT,
  ADD COLUMN sistema BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX ix_templates_slug_nao_nulo
  ON assinatura_digital_templates (slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN assinatura_digital_templates.sistema IS
  'Marca templates essenciais para features core. Não podem ser excluídos, apenas editados.';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260422120300_add_templates_slug_sistema_cols.sql
git commit -m "feat(db): add slug and sistema flag to assinatura_digital_templates"
```

### Task 1.5: Aplicar migrations localmente e regenerar types

- [ ] **Step 1: Aplicar migrations**

```bash
npx supabase migration up
```

Expected: cada migration aplicada sem erro.

- [ ] **Step 2: Regenerar database.types.ts**

```bash
npm run db:types  # ou equivalente no projeto
```

Se o script não existir, usar `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "chore(db): regenerate types after prestacao-contas migrations"
```

### Task 1.6: Constants, domain e types

**Files:**
- Create: `src/shared/prestacao-contas/constants.ts`
- Create: `src/shared/prestacao-contas/types.ts`
- Create: `src/shared/prestacao-contas/domain.ts`
- Create: `src/shared/prestacao-contas/index.ts`

- [ ] **Step 1: Constants**

```ts
// src/shared/prestacao-contas/constants.ts
export const TEMPLATE_PRESTACAO_CONTAS_SLUG = 'declaracao-prestacao-contas-default';

export const TOKEN_EXPIRES_DIAS = 30;

export const TIPO_CONTA_LABELS = {
  corrente: 'Conta Corrente',
  poupanca: 'Poupança',
  pagamento: 'Conta de Pagamento',
} as const;

export const TIPO_CHAVE_PIX_LABELS = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  telefone: 'Telefone',
  aleatoria: 'Chave Aleatória',
} as const;
```

- [ ] **Step 2: Types**

```ts
// src/shared/prestacao-contas/types.ts
export type TipoConta = 'corrente' | 'poupanca' | 'pagamento';
export type TipoChavePix = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
export type OrigemDadosBancarios = 'prestacao_contas' | 'cadastro_manual' | 'importacao';

export interface DadosBancariosCliente {
  id: number;
  clienteId: number;
  bancoCodigo: string;
  bancoNome: string;
  agencia: string;
  agenciaDigito: string | null;
  conta: string;
  contaDigito: string | null;
  tipoConta: TipoConta;
  chavePix: string | null;
  tipoChavePix: TipoChavePix | null;
  titularCpf: string;
  titularNome: string;
  ativo: boolean;
  observacoes: string | null;
  origem: OrigemDadosBancarios;
  createdAt: string;
  updatedAt: string;
}

export interface DadosBancariosInput {
  bancoCodigo: string;
  bancoNome: string;
  agencia: string;
  agenciaDigito?: string | null;
  conta: string;
  contaDigito?: string | null;
  tipoConta: TipoConta;
  chavePix?: string | null;
  tipoChavePix?: TipoChavePix | null;
  titularCpf: string;
  titularNome: string;
}

export interface DadosBancariosSnapshot extends DadosBancariosInput {
  capturadoEm: string;
  dadosBancariosClienteId: number;
}

export interface PrestacaoContasContext {
  cliente: { id: number; nome: string; cpf: string; email?: string | null };
  parcela: {
    id: number;
    numero: number;
    valor_bruto: number;
    valor_bruto_formatado: string;
    honorarios_contratuais: number;
    honorarios_contratuais_formatado: string;
    honorarios_sucumbenciais: number;
    honorarios_sucumbenciais_formatado: string;
    valor_repasse_liquido: number;
    valor_repasse_liquido_formatado: string;
    valor_repasse_liquido_extenso: string;
    data_efetivacao: string;
  };
  acordo: {
    id: number;
    tipo: string;
    tipo_label: string;
    numero_parcelas: number;
    percentual_escritorio: number;
  };
  processo: { id: number; numero: string; orgao_julgador: string };
  banco: {
    codigo: string;
    nome: string;
    agencia: string;
    agencia_digito?: string | null;
    agencia_completa: string;
    conta: string;
    conta_digito?: string | null;
    conta_completa: string;
    tipo_conta: TipoConta;
    tipo_conta_label: string;
    chave_pix?: string | null;
    tipo_chave_pix?: TipoChavePix | null;
    tipo_chave_pix_label?: string;
    titular_nome: string;
    titular_cpf: string;
  };
  escritorio: { razao_social: string; oab: string; cidade: string };
  data_assinatura: string;
  data_assinatura_extenso: string;
  cidade: string;
}

export interface LinkPrestacaoContas {
  url: string;
  token: string;
  expiresAt: string;
  documentoId: number;
}
```

- [ ] **Step 3: Domain com schemas Zod**

```ts
// src/shared/prestacao-contas/domain.ts
import { z } from 'zod';

export const dadosBancariosSchema = z.object({
  bancoCodigo: z.string().min(1).max(10),
  bancoNome: z.string().min(1).max(100),
  agencia: z.string().min(1).max(10),
  agenciaDigito: z.string().max(2).optional().nullable(),
  conta: z.string().min(1).max(20),
  contaDigito: z.string().max(2).optional().nullable(),
  tipoConta: z.enum(['corrente', 'poupanca', 'pagamento']),
  chavePix: z.string().max(100).optional().nullable(),
  tipoChavePix: z.enum(['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']).optional().nullable(),
  titularCpf: z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos'),
  titularNome: z.string().min(3).max(200),
}).refine(
  (d) => (d.chavePix ? !!d.tipoChavePix : true),
  { message: 'Tipo da chave PIX é obrigatório quando a chave é informada', path: ['tipoChavePix'] }
);

export const criarLinkPrestacaoContasSchema = z.object({
  parcelaId: z.number().int().positive(),
});

export const confirmarCpfSchema = z.object({
  token: z.string().uuid(),
  cpf: z.string().regex(/^\d{11}$/),
});

export const finalizarPrestacaoContasSchema = z.object({
  token: z.string().uuid(),
  cpfConfirmado: z.string().regex(/^\d{11}$/),
  dadosBancarios: dadosBancariosSchema,
  assinaturaBase64: z.string().min(1),
  termosAceiteVersao: z.string().default('v1.0-MP2200-2'),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  geolocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
  }).optional().nullable(),
  dispositivoFingerprint: z.record(z.unknown()).optional().nullable(),
});

export type CriarLinkPrestacaoContasInput = z.infer<typeof criarLinkPrestacaoContasSchema>;
export type ConfirmarCpfInput = z.infer<typeof confirmarCpfSchema>;
export type FinalizarPrestacaoContasInput = z.infer<typeof finalizarPrestacaoContasSchema>;
export type DadosBancariosFormData = z.infer<typeof dadosBancariosSchema>;
```

- [ ] **Step 4: Index**

```ts
// src/shared/prestacao-contas/index.ts
export * from './types';
export * from './constants';
export * from './domain';
```

- [ ] **Step 5: Type-check e commit**

```bash
npm run type-check
```

Expected: sem erros no novo módulo.

```bash
git add src/shared/prestacao-contas/
git commit -m "feat(prestacao-contas): add domain types, schemas and constants"
```

---

## Fase 2 — Services core

### Task 2.1: Variable resolver (TDD)

**Files:**
- Create: `src/shared/prestacao-contas/services/variable-resolver.ts`
- Create: `src/shared/prestacao-contas/__tests__/variable-resolver.test.ts`

- [ ] **Step 1: Instalar `mustache`**

```bash
npm i mustache
npm i -D @types/mustache
```

- [ ] **Step 2: Escrever teste primeiro**

```ts
// src/shared/prestacao-contas/__tests__/variable-resolver.test.ts
import { describe, it, expect } from 'vitest';
import { resolveTemplate } from '../services/variable-resolver';
import type { PrestacaoContasContext } from '../types';

const fixture: PrestacaoContasContext = {
  cliente: { id: 1, nome: 'Maria Silva', cpf: '12345678900' },
  parcela: {
    id: 10, numero: 1,
    valor_bruto: 10000, valor_bruto_formatado: 'R$ 10.000,00',
    honorarios_contratuais: 3000, honorarios_contratuais_formatado: 'R$ 3.000,00',
    honorarios_sucumbenciais: 0, honorarios_sucumbenciais_formatado: 'R$ 0,00',
    valor_repasse_liquido: 7000, valor_repasse_liquido_formatado: 'R$ 7.000,00',
    valor_repasse_liquido_extenso: 'sete mil reais',
    data_efetivacao: '2026-04-20',
  },
  acordo: { id: 5, tipo: 'acordo', tipo_label: 'Acordo', numero_parcelas: 3, percentual_escritorio: 30 },
  processo: { id: 100, numero: '1234567-89.2024.5.02.0001', orgao_julgador: '1ª Vara do Trabalho de SP' },
  banco: {
    codigo: '001', nome: 'Banco do Brasil',
    agencia: '1234', agencia_digito: null, agencia_completa: '1234',
    conta: '56789', conta_digito: '0', conta_completa: '56789-0',
    tipo_conta: 'corrente', tipo_conta_label: 'Conta Corrente',
    chave_pix: null, tipo_chave_pix: null,
    titular_nome: 'Maria Silva', titular_cpf: '12345678900',
  },
  escritorio: { razao_social: 'Synthropic Advocacia', oab: 'SP 123.456', cidade: 'São Paulo' },
  data_assinatura: '2026-04-22', data_assinatura_extenso: '22 de abril de 2026',
  cidade: 'São Paulo',
};

describe('resolveTemplate', () => {
  it('resolve variáveis simples', () => {
    const out = resolveTemplate('Olá {{cliente.nome}}, CPF {{cliente.cpf}}', fixture);
    expect(out).toBe('Olá Maria Silva, CPF 12345678900');
  });

  it('resolve condicional mustache quando chave_pix ausente', () => {
    const tpl = '{{#banco.chave_pix}}PIX: {{banco.chave_pix}}{{/banco.chave_pix}}Fim';
    expect(resolveTemplate(tpl, fixture)).toBe('Fim');
  });

  it('resolve condicional quando chave_pix presente', () => {
    const ctx = { ...fixture, banco: { ...fixture.banco, chave_pix: '12345678900', tipo_chave_pix: 'cpf' as const, tipo_chave_pix_label: 'CPF' } };
    const tpl = '{{#banco.chave_pix}}PIX: {{banco.chave_pix}}{{/banco.chave_pix}}';
    expect(resolveTemplate(tpl, ctx)).toBe('PIX: 12345678900');
  });

  it('não escapa HTML (usamos triple-stache por padrão para Markdown)', () => {
    const out = resolveTemplate('{{{cliente.nome}}}', fixture);
    expect(out).toBe('Maria Silva');
  });

  it('preserva texto quando variável não existe', () => {
    const out = resolveTemplate('Valor: {{inexistente.campo}}', fixture);
    expect(out).toBe('Valor: ');
  });
});
```

- [ ] **Step 3: Rodar teste (deve falhar)**

```bash
npx vitest run src/shared/prestacao-contas/__tests__/variable-resolver.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implementar variable-resolver**

```ts
// src/shared/prestacao-contas/services/variable-resolver.ts
import Mustache from 'mustache';
import type { PrestacaoContasContext } from '../types';

// Desabilita escape HTML por padrão — output é Markdown, não HTML
Mustache.escape = (text: string) => String(text);

export function resolveTemplate(template: string, context: PrestacaoContasContext): string {
  return Mustache.render(template, context);
}
```

- [ ] **Step 5: Rodar teste (deve passar)**

```bash
npx vitest run src/shared/prestacao-contas/__tests__/variable-resolver.test.ts
```

Expected: PASS (5 testes).

- [ ] **Step 6: Commit**

```bash
git add src/shared/prestacao-contas/
git commit -m "feat(prestacao-contas): add variable resolver (mustache) with tests"
```

### Task 2.2: Contexto builder

**Files:**
- Create: `src/shared/prestacao-contas/services/contexto-builder.ts`
- Create: `src/shared/prestacao-contas/__tests__/contexto-builder.test.ts`

- [ ] **Step 1: Instalar `extenso`** (para valor por extenso em PT-BR)

```bash
npm i extenso
```

- [ ] **Step 2: Escrever teste**

```ts
// src/shared/prestacao-contas/__tests__/contexto-builder.test.ts
import { describe, it, expect } from 'vitest';
import { montarContexto } from '../services/contexto-builder';

describe('montarContexto', () => {
  it('formata valores em BRL e extenso, calcula líquido', () => {
    const ctx = montarContexto({
      cliente: { id: 1, nome: 'João', cpf: '00000000000', email: null },
      parcela: {
        id: 10, numeroParcela: 2,
        valorBrutoCreditoPrincipal: 10000,
        honorariosContratuais: 3000,
        honorariosSucumbenciais: 500,
        dataEfetivacao: '2026-04-20',
      },
      acordo: { id: 5, tipo: 'acordo', numeroParcelas: 3, percentualEscritorio: 30 },
      processo: { id: 100, numero: '123', orgaoJulgador: '1VT' },
      dadosBancarios: {
        bancoCodigo: '001', bancoNome: 'BB',
        agencia: '1234', agenciaDigito: null,
        conta: '5678', contaDigito: '9',
        tipoConta: 'corrente',
        chavePix: null, tipoChavePix: null,
        titularCpf: '00000000000', titularNome: 'João',
      },
      escritorio: { razaoSocial: 'Synthropic', oab: 'SP 123', cidade: 'São Paulo' },
      dataAssinatura: '2026-04-22',
    });

    expect(ctx.parcela.valor_repasse_liquido).toBe(7000);
    expect(ctx.parcela.valor_repasse_liquido_formatado).toBe('R$ 7.000,00');
    expect(ctx.parcela.valor_repasse_liquido_extenso).toContain('sete mil');
    expect(ctx.banco.agencia_completa).toBe('1234');
    expect(ctx.banco.conta_completa).toBe('5678-9');
    expect(ctx.banco.tipo_conta_label).toBe('Conta Corrente');
    expect(ctx.data_assinatura_extenso).toMatch(/22 de abril de 2026/);
  });
});
```

- [ ] **Step 3: Implementar**

```ts
// src/shared/prestacao-contas/services/contexto-builder.ts
import extenso from 'extenso';
import type { PrestacaoContasContext, TipoConta, TipoChavePix } from '../types';
import { TIPO_CONTA_LABELS, TIPO_CHAVE_PIX_LABELS } from '../constants';

const TIPO_ACORDO_LABELS: Record<string, string> = {
  acordo: 'Acordo',
  condenacao: 'Condenação',
  custas_processuais: 'Custas Processuais',
};

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function formatarBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function valorExtenso(valor: number): string {
  return extenso(valor.toFixed(2).replace('.', ','), { mode: 'currency', currency: { type: 'BRL' } });
}

function dataExtenso(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function agenciaCompleta(ag: string, dig: string | null | undefined): string {
  return dig ? `${ag}-${dig}` : ag;
}

function contaCompleta(ct: string, dig: string | null | undefined): string {
  return dig ? `${ct}-${dig}` : ct;
}

export interface MontarContextoInput {
  cliente: { id: number; nome: string; cpf: string; email?: string | null };
  parcela: {
    id: number;
    numeroParcela: number;
    valorBrutoCreditoPrincipal: number;
    honorariosContratuais: number;
    honorariosSucumbenciais: number;
    dataEfetivacao: string;
  };
  acordo: { id: number; tipo: string; numeroParcelas: number; percentualEscritorio: number };
  processo: { id: number; numero: string; orgaoJulgador: string };
  dadosBancarios: {
    bancoCodigo: string;
    bancoNome: string;
    agencia: string;
    agenciaDigito?: string | null;
    conta: string;
    contaDigito?: string | null;
    tipoConta: TipoConta;
    chavePix?: string | null;
    tipoChavePix?: TipoChavePix | null;
    titularCpf: string;
    titularNome: string;
  };
  escritorio: { razaoSocial: string; oab: string; cidade: string };
  dataAssinatura: string;
}

export function montarContexto(input: MontarContextoInput): PrestacaoContasContext {
  const { parcela, dadosBancarios } = input;
  const valorLiquido = parcela.valorBrutoCreditoPrincipal - parcela.honorariosContratuais;

  return {
    cliente: input.cliente,
    parcela: {
      id: parcela.id,
      numero: parcela.numeroParcela,
      valor_bruto: parcela.valorBrutoCreditoPrincipal,
      valor_bruto_formatado: formatarBRL(parcela.valorBrutoCreditoPrincipal),
      honorarios_contratuais: parcela.honorariosContratuais,
      honorarios_contratuais_formatado: formatarBRL(parcela.honorariosContratuais),
      honorarios_sucumbenciais: parcela.honorariosSucumbenciais,
      honorarios_sucumbenciais_formatado: formatarBRL(parcela.honorariosSucumbenciais),
      valor_repasse_liquido: valorLiquido,
      valor_repasse_liquido_formatado: formatarBRL(valorLiquido),
      valor_repasse_liquido_extenso: valorExtenso(valorLiquido),
      data_efetivacao: parcela.dataEfetivacao,
    },
    acordo: {
      id: input.acordo.id,
      tipo: input.acordo.tipo,
      tipo_label: TIPO_ACORDO_LABELS[input.acordo.tipo] ?? input.acordo.tipo,
      numero_parcelas: input.acordo.numeroParcelas,
      percentual_escritorio: input.acordo.percentualEscritorio,
    },
    processo: {
      id: input.processo.id,
      numero: input.processo.numero,
      orgao_julgador: input.processo.orgaoJulgador,
    },
    banco: {
      codigo: dadosBancarios.bancoCodigo,
      nome: dadosBancarios.bancoNome,
      agencia: dadosBancarios.agencia,
      agencia_digito: dadosBancarios.agenciaDigito ?? null,
      agencia_completa: agenciaCompleta(dadosBancarios.agencia, dadosBancarios.agenciaDigito),
      conta: dadosBancarios.conta,
      conta_digito: dadosBancarios.contaDigito ?? null,
      conta_completa: contaCompleta(dadosBancarios.conta, dadosBancarios.contaDigito),
      tipo_conta: dadosBancarios.tipoConta,
      tipo_conta_label: TIPO_CONTA_LABELS[dadosBancarios.tipoConta],
      chave_pix: dadosBancarios.chavePix ?? null,
      tipo_chave_pix: dadosBancarios.tipoChavePix ?? null,
      tipo_chave_pix_label: dadosBancarios.tipoChavePix ? TIPO_CHAVE_PIX_LABELS[dadosBancarios.tipoChavePix] : undefined,
      titular_nome: dadosBancarios.titularNome,
      titular_cpf: dadosBancarios.titularCpf,
    },
    escritorio: {
      razao_social: input.escritorio.razaoSocial,
      oab: input.escritorio.oab,
      cidade: input.escritorio.cidade,
    },
    data_assinatura: input.dataAssinatura,
    data_assinatura_extenso: dataExtenso(input.dataAssinatura),
    cidade: input.escritorio.cidade,
  };
}
```

- [ ] **Step 4: Rodar teste e commit**

```bash
npx vitest run src/shared/prestacao-contas/__tests__/contexto-builder.test.ts
git add src/shared/prestacao-contas/
git commit -m "feat(prestacao-contas): add contexto builder with currency/date formatting"
```

### Task 2.3: Template lookup + escritório adapter

**Files:**
- Create: `src/shared/prestacao-contas/services/template-lookup.ts`
- Create: `src/shared/prestacao-contas/services/escritorio-config.ts`

- [ ] **Step 1: Template lookup**

```ts
// src/shared/prestacao-contas/services/template-lookup.ts
import { createServiceClient } from '@/lib/supabase/service-client';
import { TEMPLATE_PRESTACAO_CONTAS_SLUG } from '../constants';

export interface TemplatePrestacaoContas {
  id: number;
  templateUuid: string;
  nome: string;
  conteudoMarkdown: string;
  pdfUrl: string | null;
  arquivoOriginal: string;
  versao: number;
}

export async function buscarTemplatePrestacaoContas(): Promise<TemplatePrestacaoContas> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('assinatura_digital_templates')
    .select('id, template_uuid, nome, conteudo_markdown, pdf_url, arquivo_original, versao')
    .eq('slug', TEMPLATE_PRESTACAO_CONTAS_SLUG)
    .eq('ativo', true)
    .single();

  if (error || !data) {
    throw new Error(
      `Template de prestação de contas não encontrado (slug=${TEMPLATE_PRESTACAO_CONTAS_SLUG}). Rode 'npm run seed:prestacao-contas'.`
    );
  }
  if (!data.conteudo_markdown) {
    throw new Error('Template de prestação de contas sem conteudo_markdown.');
  }

  return {
    id: data.id,
    templateUuid: data.template_uuid,
    nome: data.nome,
    conteudoMarkdown: data.conteudo_markdown,
    pdfUrl: data.pdf_url,
    arquivoOriginal: data.arquivo_original,
    versao: data.versao ?? 1,
  };
}
```

- [ ] **Step 2: Escritório config (adapter simples — v1 usa constante)**

```ts
// src/shared/prestacao-contas/services/escritorio-config.ts

export interface EscritorioConfig {
  razaoSocial: string;
  oab: string;
  cidade: string;
}

// TODO(fase-posterior): trocar para ler de perfil do representante ou settings
const DEFAULT_ESCRITORIO: EscritorioConfig = {
  razaoSocial: process.env.ESCRITORIO_RAZAO_SOCIAL ?? 'Synthropic Advocacia',
  oab: process.env.ESCRITORIO_OAB ?? 'SP',
  cidade: process.env.ESCRITORIO_CIDADE ?? 'São Paulo',
};

export function getEscritorioConfig(): EscritorioConfig {
  return DEFAULT_ESCRITORIO;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/prestacao-contas/services/
git commit -m "feat(prestacao-contas): add template lookup and escritorio config adapter"
```

### Task 2.4: PDF generator (Markdown → PDF via pdf-lib + remark)

**Files:**
- Create: `src/shared/prestacao-contas/services/pdf-generator.ts`

- [ ] **Step 1: Instalar deps de Markdown → PDF**

```bash
npm i unified remark-parse mdast-util-to-string
```

- [ ] **Step 2: Implementar gerador (abordagem simples: pdf-lib com layout linear)**

Dado que renderer rico de Markdown → PDF custa muito, usamos uma abordagem pragmática: parse do Markdown para AST, iterar nós, emitir parágrafos/títulos/listas/tabelas em layout vertical com quebra de página automática. Para v1, esta simplicidade é suficiente.

```ts
// src/shared/prestacao-contas/services/pdf-generator.ts
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root, Content } from 'mdast';
import crypto from 'crypto';

export interface GerarPdfInput {
  markdownResolvido: string;
  assinaturaPngBase64: string;
  metadados: {
    protocolo: string;
    dataAssinatura: string;
    clienteNome: string;
    clienteCpf: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    geolocation?: { latitude: number; longitude: number } | null;
    hashOriginal: string;
    termosAceiteVersao: string;
  };
}

export interface GerarPdfOutput {
  buffer: Buffer;
  hashFinal: string;
}

const MARGIN = 50;
const PAGE_W = 595;
const PAGE_H = 842;
const BODY_SIZE = 11;
const LINE_HEIGHT = 16;
const H1_SIZE = 18;
const H2_SIZE = 14;

export async function gerarPdfPrestacaoContas(input: GerarPdfInput): Promise<GerarPdfOutput> {
  const { markdownResolvido, assinaturaPngBase64, metadados } = input;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Declaração de Prestação de Contas');
  pdfDoc.setAuthor('ZattarOS');
  pdfDoc.setSubject(`Protocolo ${metadados.protocolo}`);
  pdfDoc.setCreationDate(new Date());

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensureSpace = (needed: number): void => {
    if (y - needed < MARGIN + 60) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const drawWrappedText = (text: string, font: PDFFont, size: number): void => {
    const words = text.split(/\s+/);
    const maxWidth = PAGE_W - MARGIN * 2;
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(test, size);
      if (width > maxWidth && line) {
        ensureSpace(LINE_HEIGHT);
        page.drawText(line, { x: MARGIN, y, size, font, color: rgb(0.1, 0.1, 0.1) });
        y -= LINE_HEIGHT;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      ensureSpace(LINE_HEIGHT);
      page.drawText(line, { x: MARGIN, y, size, font, color: rgb(0.1, 0.1, 0.1) });
      y -= LINE_HEIGHT;
    }
  };

  const nodeToPlainText = (node: Content): string => {
    if ('value' in node && typeof node.value === 'string') return node.value;
    if ('children' in node && Array.isArray(node.children)) {
      return (node.children as Content[]).map(nodeToPlainText).join('');
    }
    return '';
  };

  const tree = unified().use(remarkParse).parse(markdownResolvido) as Root;

  for (const node of tree.children) {
    if (node.type === 'heading') {
      const text = nodeToPlainText(node as Content);
      const size = node.depth === 1 ? H1_SIZE : H2_SIZE;
      ensureSpace(size + 8);
      y -= 6;
      drawWrappedText(text, helveticaBold, size);
      y -= 4;
    } else if (node.type === 'paragraph') {
      drawWrappedText(nodeToPlainText(node as Content), helvetica, BODY_SIZE);
      y -= 6;
    } else if (node.type === 'list') {
      for (const item of node.children) {
        const text = nodeToPlainText(item as Content);
        drawWrappedText(`• ${text}`, helvetica, BODY_SIZE);
      }
      y -= 4;
    } else if (node.type === 'table') {
      for (const row of node.children) {
        const cells = row.children.map((c) => nodeToPlainText(c as Content)).join(' | ');
        drawWrappedText(cells, helvetica, BODY_SIZE);
      }
      y -= 4;
    } else {
      drawWrappedText(nodeToPlainText(node as Content), helvetica, BODY_SIZE);
    }
  }

  // Assinatura
  ensureSpace(100);
  y -= 20;
  try {
    const pngBytes = Buffer.from(assinaturaPngBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
    const img = await pdfDoc.embedPng(pngBytes);
    const imgDims = img.scale(0.4);
    page.drawImage(img, { x: MARGIN, y: y - imgDims.height, width: imgDims.width, height: imgDims.height });
    y -= imgDims.height + 8;
  } catch {
    // fallback: linha
    page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + 200, y }, thickness: 1 });
    y -= 10;
  }
  drawWrappedText(`${metadados.clienteNome} — CPF ${metadados.clienteCpf}`, helvetica, 10);

  // Rodapé de auditoria em todas as páginas
  const pages = pdfDoc.getPages();
  const footerText = `Protocolo ${metadados.protocolo} · Assinado em ${metadados.dataAssinatura} · MP 2.200-2/2001 (${metadados.termosAceiteVersao})`;
  pages.forEach((p, idx) => {
    p.drawText(footerText, { x: MARGIN, y: 30, size: 8, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
    p.drawText(`Página ${idx + 1} de ${pages.length}`, { x: PAGE_W - MARGIN - 80, y: 30, size: 8, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
  });

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);
  const hashFinal = crypto.createHash('sha256').update(buffer).digest('hex');
  return { buffer, hashFinal };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/prestacao-contas/services/pdf-generator.ts package.json package-lock.json
git commit -m "feat(prestacao-contas): add pdf-lib based generator with markdown parsing"
```

### Task 2.5: Storage helper para Backblaze

**Files:**
- Modify: `src/shared/assinatura-digital/services/storage.service.ts`

- [ ] **Step 1: Adicionar helper**

Append ao arquivo:

```ts
export async function storePrestacaoContasPdf(
  buffer: Buffer,
  parcelaId: number,
  documentoUuid: string
): Promise<StoredFile> {
  const key = `assinatura-digital/prestacao-contas/${parcelaId}/${documentoUuid}.pdf`;
  return uploadToBackblaze({ buffer, key, contentType: 'application/pdf' });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/assinatura-digital/services/storage.service.ts
git commit -m "feat(storage): add storePrestacaoContasPdf helper"
```

---

## Fase 3 — Repository, services de negócio e actions

### Task 3.1: Repository

**Files:**
- Create: `src/shared/prestacao-contas/repository.ts`

- [ ] **Step 1: Implementar**

```ts
// src/shared/prestacao-contas/repository.ts
import { createServiceClient } from '@/lib/supabase/service-client';
import type { DadosBancariosCliente, DadosBancariosInput } from './types';

function mapRow(row: any): DadosBancariosCliente {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    bancoCodigo: row.banco_codigo,
    bancoNome: row.banco_nome,
    agencia: row.agencia,
    agenciaDigito: row.agencia_digito,
    conta: row.conta,
    contaDigito: row.conta_digito,
    tipoConta: row.tipo_conta,
    chavePix: row.chave_pix,
    tipoChavePix: row.tipo_chave_pix,
    titularCpf: row.titular_cpf,
    titularNome: row.titular_nome,
    ativo: row.ativo,
    observacoes: row.observacoes,
    origem: row.origem,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function buscarDadosBancariosAtivos(clienteId: number): Promise<DadosBancariosCliente | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('dados_bancarios_cliente')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('ativo', true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function upsertDadosBancarios(
  clienteId: number,
  input: DadosBancariosInput,
  origem: 'prestacao_contas' | 'cadastro_manual' = 'prestacao_contas'
): Promise<DadosBancariosCliente> {
  const supabase = createServiceClient();

  await supabase
    .from('dados_bancarios_cliente')
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .eq('cliente_id', clienteId)
    .eq('ativo', true);

  const { data, error } = await supabase
    .from('dados_bancarios_cliente')
    .insert({
      cliente_id: clienteId,
      banco_codigo: input.bancoCodigo,
      banco_nome: input.bancoNome,
      agencia: input.agencia,
      agencia_digito: input.agenciaDigito,
      conta: input.conta,
      conta_digito: input.contaDigito,
      tipo_conta: input.tipoConta,
      chave_pix: input.chavePix,
      tipo_chave_pix: input.tipoChavePix,
      titular_cpf: input.titularCpf,
      titular_nome: input.titularNome,
      ativo: true,
      origem,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('Falha ao inserir dados bancários');
  return mapRow(data);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/prestacao-contas/repository.ts
git commit -m "feat(prestacao-contas): add repository for dados_bancarios_cliente"
```

### Task 3.2: Service de criação de link

**Files:**
- Create: `src/shared/prestacao-contas/service.ts`

- [ ] **Step 1: Implementar `criarLinkPrestacaoContas`**

```ts
// src/shared/prestacao-contas/service.ts
import { randomUUID } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service-client';
import { buscarTemplatePrestacaoContas } from './services/template-lookup';
import { TOKEN_EXPIRES_DIAS } from './constants';
import type { LinkPrestacaoContas } from './types';

export async function criarLinkPrestacaoContas(
  parcelaId: number,
  criadoPorUsuarioId?: number
): Promise<LinkPrestacaoContas> {
  const supabase = createServiceClient();

  const { data: parcela, error: parcelaErr } = await supabase
    .from('parcelas')
    .select(`
      id, numero_parcela, status, status_repasse, valor_repasse_cliente,
      documento_assinatura_id,
      acordo_condenacao_id,
      acordos_condenacao!inner(
        id, processo_id,
        processos!inner(id, nome_parte_autora)
      )
    `)
    .eq('id', parcelaId)
    .single();

  if (parcelaErr || !parcela) throw new Error('Parcela não encontrada');
  if (parcela.status !== 'recebida') throw new Error('Parcela ainda não foi recebida');
  if (parcela.status_repasse !== 'pendente_declaracao') throw new Error('Parcela não está pendente de declaração');
  if (!parcela.valor_repasse_cliente || parcela.valor_repasse_cliente <= 0) throw new Error('Parcela sem valor de repasse');

  if (parcela.documento_assinatura_id) {
    const { data: doc } = await supabase
      .from('assinatura_digital_documentos')
      .select('id, documento_uuid, status, assinatura_digital_documento_assinantes(token, expires_at)')
      .eq('id', parcela.documento_assinatura_id)
      .single();
    if (doc && doc.status !== 'concluido' && doc.status !== 'cancelado') {
      const assinante = (doc as any).assinatura_digital_documento_assinantes?.[0];
      if (assinante) {
        return {
          url: `/prestacao-contas/${assinante.token}`,
          token: assinante.token,
          expiresAt: assinante.expires_at,
          documentoId: doc.id,
        };
      }
    }
  }

  const processoId = (parcela as any).acordos_condenacao.processos.id;
  const { data: clienteRel } = await supabase
    .from('processo_clientes')
    .select('cliente_id')
    .eq('processo_id', processoId)
    .limit(1)
    .maybeSingle();

  if (!clienteRel) throw new Error('Cliente do processo não encontrado');

  const template = await buscarTemplatePrestacaoContas();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRES_DIAS * 24 * 60 * 60 * 1000).toISOString();
  const token = randomUUID();

  const { data: documento, error: docErr } = await supabase
    .from('assinatura_digital_documentos')
    .insert({
      titulo: 'Declaração de Prestação de Contas',
      selfie_habilitada: false,
      pdf_original_url: template.arquivoOriginal,
      status: 'pronto',
      tipo_contexto: 'prestacao_contas',
      contexto_parcela_id: parcelaId,
      template_id: template.id,
      created_by: criadoPorUsuarioId ?? null,
    })
    .select()
    .single();

  if (docErr || !documento) throw docErr ?? new Error('Falha ao criar documento');

  const { error: assErr } = await supabase
    .from('assinatura_digital_documento_assinantes')
    .insert({
      documento_id: documento.id,
      assinante_tipo: 'cliente',
      assinante_entidade_id: clienteRel.cliente_id,
      token,
      status: 'pendente',
      expires_at: expiresAt,
      dados_confirmados: false,
    });

  if (assErr) throw assErr;

  await supabase
    .from('parcelas')
    .update({ documento_assinatura_id: documento.id, updated_at: new Date().toISOString() })
    .eq('id', parcelaId);

  return {
    url: `/prestacao-contas/${token}`,
    token,
    expiresAt,
    documentoId: documento.id,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/prestacao-contas/service.ts
git commit -m "feat(prestacao-contas): add criarLinkPrestacaoContas service"
```

### Task 3.3: Service finalizar prestação (o mais complexo)

- [ ] **Step 1: Adicionar funções ao service.ts**

```ts
// Append em src/shared/prestacao-contas/service.ts
import { resolveTemplate } from './services/variable-resolver';
import { montarContexto } from './services/contexto-builder';
import { gerarPdfPrestacaoContas } from './services/pdf-generator';
import { getEscritorioConfig } from './services/escritorio-config';
import { storePrestacaoContasPdf, storeSignatureImage } from '@/shared/assinatura-digital/services/storage.service';
import { upsertDadosBancarios, buscarDadosBancariosAtivos } from './repository';
import type { DadosBancariosInput, DadosBancariosSnapshot } from './types';
import crypto from 'crypto';

export interface ContextoPublico {
  token: string;
  parcelaId: number;
  clienteId: number;
  clienteNome: string;
  clienteCpf: string;
  documentoId: number;
  templateMarkdown: string;
  jaAssinado: boolean;
}

export async function carregarContextoPublico(token: string): Promise<ContextoPublico> {
  const supabase = createServiceClient();
  const { data: ass, error } = await supabase
    .from('assinatura_digital_documento_assinantes')
    .select(`
      id, documento_id, assinante_entidade_id, status, expires_at,
      assinatura_digital_documentos!inner(
        id, contexto_parcela_id, template_id, tipo_contexto,
        assinatura_digital_templates(conteudo_markdown)
      )
    `)
    .eq('token', token)
    .single();

  if (error || !ass) throw new Error('Link inválido ou expirado');

  const documento = (ass as any).assinatura_digital_documentos;
  if (documento.tipo_contexto !== 'prestacao_contas') throw new Error('Documento não é de prestação de contas');
  if (ass.expires_at && new Date(ass.expires_at) < new Date()) throw new Error('Link expirado');

  const clienteId = ass.assinante_entidade_id!;
  const { data: cliente } = await supabase
    .from('clientes').select('id, nome, cpf').eq('id', clienteId).single();
  if (!cliente) throw new Error('Cliente não encontrado');

  return {
    token,
    parcelaId: documento.contexto_parcela_id,
    clienteId,
    clienteNome: cliente.nome,
    clienteCpf: cliente.cpf,
    documentoId: documento.id,
    templateMarkdown: documento.assinatura_digital_templates?.conteudo_markdown ?? '',
    jaAssinado: ass.status === 'concluido',
  };
}

export interface FinalizarInput {
  token: string;
  cpfConfirmado: string;
  dadosBancarios: DadosBancariosInput;
  assinaturaBase64: string;
  termosAceiteVersao: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  geolocation?: { latitude: number; longitude: number; accuracy?: number } | null;
  dispositivoFingerprint?: Record<string, unknown> | null;
}

export async function finalizarPrestacaoContas(input: FinalizarInput): Promise<{ pdfUrl: string; protocolo: string }> {
  const supabase = createServiceClient();
  const ctx = await carregarContextoPublico(input.token);

  if (ctx.jaAssinado) throw new Error('Este link já foi assinado');
  if (ctx.clienteCpf.replace(/\D/g, '') !== input.cpfConfirmado) throw new Error('CPF não confere com o cadastro');

  const { data: parcelaFull, error: parcErr } = await supabase
    .from('parcelas')
    .select(`
      id, numero_parcela, valor_bruto_credito_principal, honorarios_contratuais,
      honorarios_sucumbenciais, data_efetivacao, acordo_condenacao_id,
      acordos_condenacao!inner(
        id, tipo, numero_parcelas, percentual_escritorio, processo_id,
        processos!inner(id, numero_processo, descricao_orgao_julgador)
      )
    `)
    .eq('id', ctx.parcelaId).single();
  if (parcErr || !parcelaFull) throw new Error('Parcela não encontrada');

  const acordo = (parcelaFull as any).acordos_condenacao;
  const processo = acordo.processos;

  const dadosBanc = await upsertDadosBancarios(ctx.clienteId, input.dadosBancarios);

  const contexto = montarContexto({
    cliente: { id: ctx.clienteId, nome: ctx.clienteNome, cpf: ctx.clienteCpf },
    parcela: {
      id: parcelaFull.id,
      numeroParcela: parcelaFull.numero_parcela,
      valorBrutoCreditoPrincipal: parcelaFull.valor_bruto_credito_principal,
      honorariosContratuais: parcelaFull.honorarios_contratuais ?? 0,
      honorariosSucumbenciais: parcelaFull.honorarios_sucumbenciais ?? 0,
      dataEfetivacao: parcelaFull.data_efetivacao ?? new Date().toISOString().slice(0, 10),
    },
    acordo: {
      id: acordo.id, tipo: acordo.tipo,
      numeroParcelas: acordo.numero_parcelas,
      percentualEscritorio: acordo.percentual_escritorio,
    },
    processo: {
      id: processo.id,
      numero: processo.numero_processo,
      orgaoJulgador: processo.descricao_orgao_julgador ?? '',
    },
    dadosBancarios: input.dadosBancarios,
    escritorio: getEscritorioConfig(),
    dataAssinatura: new Date().toISOString().slice(0, 10),
  });

  const markdownResolvido = resolveTemplate(ctx.templateMarkdown, contexto);
  const hashOriginal = crypto.createHash('sha256').update(markdownResolvido).digest('hex');
  const protocolo = `PC-${ctx.parcelaId}-${Date.now().toString(36).toUpperCase()}`;

  const assinaturaArmazenada = await storeSignatureImage(input.assinaturaBase64);

  const { buffer: pdfBuffer, hashFinal } = await gerarPdfPrestacaoContas({
    markdownResolvido,
    assinaturaPngBase64: input.assinaturaBase64,
    metadados: {
      protocolo,
      dataAssinatura: contexto.data_assinatura_extenso,
      clienteNome: ctx.clienteNome,
      clienteCpf: ctx.clienteCpf,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      geolocation: input.geolocation,
      hashOriginal,
      termosAceiteVersao: input.termosAceiteVersao,
    },
  });

  const { data: doc } = await supabase
    .from('assinatura_digital_documentos')
    .select('documento_uuid').eq('id', ctx.documentoId).single();
  const uuid = doc?.documento_uuid ?? randomUUID();

  const stored = await storePrestacaoContasPdf(pdfBuffer, ctx.parcelaId, uuid);

  const snapshot: DadosBancariosSnapshot = {
    ...input.dadosBancarios,
    capturadoEm: new Date().toISOString(),
    dadosBancariosClienteId: dadosBanc.id,
  };

  const { error: parcUpErr } = await supabase
    .from('parcelas')
    .update({
      arquivo_declaracao_prestacao_contas: stored.url,
      data_declaracao_anexada: new Date().toISOString(),
      dados_bancarios_snapshot: snapshot,
      status_repasse: 'pendente_transferencia',
      updated_at: new Date().toISOString(),
    })
    .eq('id', ctx.parcelaId);
  if (parcUpErr) throw parcUpErr;

  await supabase
    .from('assinatura_digital_documentos')
    .update({
      status: 'concluido',
      pdf_final_url: stored.url,
      hash_final_sha256: hashFinal,
      hash_original_sha256: hashOriginal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ctx.documentoId);

  await supabase
    .from('assinatura_digital_documento_assinantes')
    .update({
      status: 'concluido',
      concluido_em: new Date().toISOString(),
      assinatura_url: assinaturaArmazenada.url,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
      geolocation: input.geolocation,
      dados_confirmados: true,
      dados_snapshot: { dadosBancarios: snapshot },
      termos_aceite_versao: input.termosAceiteVersao,
      termos_aceite_data: new Date().toISOString(),
      dispositivo_fingerprint_raw: input.dispositivoFingerprint ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('token', input.token);

  return { pdfUrl: stored.url, protocolo };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/prestacao-contas/service.ts
git commit -m "feat(prestacao-contas): add carregarContextoPublico and finalizarPrestacaoContas services"
```

### Task 3.4: Actions

**Files:**
- Create: `src/shared/prestacao-contas/actions/criar-link-prestacao-contas.ts`
- Create: `src/shared/prestacao-contas/actions/finalizar-prestacao-contas.ts`

- [ ] **Step 1: Action admin**

```ts
// src/shared/prestacao-contas/actions/criar-link-prestacao-contas.ts
'use server';

import { authenticatedAction } from '@/lib/safe-action';
import { criarLinkPrestacaoContasSchema } from '../domain';
import { criarLinkPrestacaoContas } from '../service';
import { revalidatePath } from 'next/cache';

export const actionCriarLinkPrestacaoContas = authenticatedAction
  .schema(criarLinkPrestacaoContasSchema)
  .action(async ({ parsedInput, ctx }) => {
    const link = await criarLinkPrestacaoContas(parsedInput.parcelaId, (ctx as any)?.user?.id);
    revalidatePath('/obrigacoes');
    return link;
  });
```

- [ ] **Step 2: Action pública (usa fetch + validação do token direto no service, sem wrapper)**

Como simplificação para v1, fazemos a action pública como route handler ou chamada direta (server action). Segurança vem da posse do token (UUID v4). Não precisa de wrapper `publicTokenAction` novo — o próprio service valida o token.

```ts
// src/shared/prestacao-contas/actions/finalizar-prestacao-contas.ts
'use server';

import { finalizarPrestacaoContasSchema } from '../domain';
import { finalizarPrestacaoContas } from '../service';

export async function actionFinalizarPrestacaoContas(raw: unknown) {
  const parsed = finalizarPrestacaoContasSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: 'Dados inválidos', issues: parsed.error.flatten() };
  }
  try {
    const result = await finalizarPrestacaoContas(parsed.data);
    return { success: true, data: result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao finalizar';
    return { success: false, error: msg };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/prestacao-contas/actions/
git commit -m "feat(prestacao-contas): add admin and public actions"
```

---

## Fase 4 — Rota pública e wizard

### Task 4.1: Rota pública `/prestacao-contas/[token]`

**Files:**
- Create: `src/app/(assinatura-digital)/prestacao-contas/[token]/page.tsx`

- [ ] **Step 1: Implementar Server Component**

```tsx
// src/app/(assinatura-digital)/prestacao-contas/[token]/page.tsx
import { notFound } from 'next/navigation';
import { carregarContextoPublico } from '@/shared/prestacao-contas/service';
import { buscarDadosBancariosAtivos } from '@/shared/prestacao-contas/repository';
import { PrestacaoContasFlow } from './_components/PrestacaoContasFlow';

interface PageProps {
  params: Promise<{ token: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PrestacaoContasPage({ params }: PageProps) {
  const { token } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) notFound();

  let ctx: Awaited<ReturnType<typeof carregarContextoPublico>>;
  try {
    ctx = await carregarContextoPublico(token);
  } catch {
    notFound();
  }

  const dadosAtivos = await buscarDadosBancariosAtivos(ctx.clienteId).catch(() => null);

  return (
    <PrestacaoContasFlow
      token={token}
      clienteNome={ctx.clienteNome}
      clienteCpfMascara={maskCpf(ctx.clienteCpf)}
      dadosBancariosAtivos={dadosAtivos}
      jaAssinado={ctx.jaAssinado}
      templateMarkdown={ctx.templateMarkdown}
    />
  );
}

function maskCpf(cpf: string): string {
  return cpf.replace(/^(\d{3})\d{5}(\d{3})$/, '$1.***.***-$2').replace(/\D/g, (x, i) => x);
}
```

- [ ] **Step 2: Commit (após criar os components abaixo)**

### Task 4.2: Components do wizard público

**Files:**
- Create: `src/app/(assinatura-digital)/prestacao-contas/[token]/_components/PrestacaoContasFlow.tsx`
- Create: `src/app/(assinatura-digital)/prestacao-contas/[token]/_components/steps/DadosBancariosStep.tsx`

- [ ] **Step 1: DadosBancariosStep**

```tsx
// src/app/(assinatura-digital)/prestacao-contas/[token]/_components/steps/DadosBancariosStep.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { TIPO_CONTA_LABELS, TIPO_CHAVE_PIX_LABELS } from '@/shared/prestacao-contas/constants';
import type { DadosBancariosCliente, DadosBancariosInput, TipoConta, TipoChavePix } from '@/shared/prestacao-contas/types';

interface Props {
  clienteNome: string;
  clienteCpf: string;
  dadosAtivos: DadosBancariosCliente | null;
  onConfirm: (dados: DadosBancariosInput) => void;
  onBack?: () => void;
}

export function DadosBancariosStep({ clienteNome, clienteCpf, dadosAtivos, onConfirm, onBack }: Props) {
  const [modo, setModo] = useState<'existente' | 'novo'>(dadosAtivos ? 'existente' : 'novo');
  const [form, setForm] = useState<DadosBancariosInput>({
    bancoCodigo: '', bancoNome: '', agencia: '', agenciaDigito: '',
    conta: '', contaDigito: '', tipoConta: 'corrente',
    chavePix: '', tipoChavePix: null,
    titularCpf: clienteCpf, titularNome: clienteNome,
  });

  const handleConfirmExistente = () => {
    if (!dadosAtivos) return;
    onConfirm({
      bancoCodigo: dadosAtivos.bancoCodigo,
      bancoNome: dadosAtivos.bancoNome,
      agencia: dadosAtivos.agencia,
      agenciaDigito: dadosAtivos.agenciaDigito,
      conta: dadosAtivos.conta,
      contaDigito: dadosAtivos.contaDigito,
      tipoConta: dadosAtivos.tipoConta,
      chavePix: dadosAtivos.chavePix,
      tipoChavePix: dadosAtivos.tipoChavePix,
      titularCpf: dadosAtivos.titularCpf,
      titularNome: dadosAtivos.titularNome,
    });
  };

  const handleConfirmNovo = () => {
    if (!form.bancoCodigo || !form.bancoNome || !form.agencia || !form.conta || !form.titularNome) return;
    onConfirm({ ...form, chavePix: form.chavePix || null, tipoChavePix: form.chavePix ? form.tipoChavePix : null });
  };

  if (modo === 'existente' && dadosAtivos) {
    return (
      <GlassPanel depth={1} className="p-6 space-y-5">
        <div>
          <Heading level="section">Confirme seus dados bancários</Heading>
          <Text variant="caption" className="mt-1">
            Você já tem uma conta cadastrada. Se ainda for válida, confirme para continuar.
          </Text>
        </div>

        <GlassPanel depth={2} className="p-4 space-y-2">
          <div className="flex justify-between">
            <Text variant="label">Banco</Text>
            <Text>{dadosAtivos.bancoNome} ({dadosAtivos.bancoCodigo})</Text>
          </div>
          <div className="flex justify-between">
            <Text variant="label">Agência</Text>
            <Text>{dadosAtivos.agencia}{dadosAtivos.agenciaDigito ? `-${dadosAtivos.agenciaDigito}` : ''}</Text>
          </div>
          <div className="flex justify-between">
            <Text variant="label">Conta</Text>
            <Text>{dadosAtivos.conta}{dadosAtivos.contaDigito ? `-${dadosAtivos.contaDigito}` : ''} ({TIPO_CONTA_LABELS[dadosAtivos.tipoConta]})</Text>
          </div>
          {dadosAtivos.chavePix && (
            <div className="flex justify-between">
              <Text variant="label">PIX</Text>
              <Text>{dadosAtivos.chavePix}</Text>
            </div>
          )}
        </GlassPanel>

        <div className="flex gap-2 justify-between flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setModo('novo')} className="rounded-xl">
            Usar outra conta
          </Button>
          <div className="flex gap-2">
            {onBack && <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl">Voltar</Button>}
            <Button size="sm" onClick={handleConfirmExistente} className="rounded-xl">
              Continuar com esta conta
            </Button>
          </div>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel depth={1} className="p-6 space-y-5">
      <div>
        <Heading level="section">Dados bancários para o recebimento</Heading>
        <Text variant="caption" className="mt-1">
          Informe a conta onde deseja receber o valor. Será usada para este e futuros repasses.
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Código do banco</Label>
          <Input value={form.bancoCodigo} onChange={(e) => setForm({ ...form, bancoCodigo: e.target.value })} maxLength={5} placeholder="001" />
        </div>
        <div className="space-y-1.5">
          <Label>Nome do banco</Label>
          <Input value={form.bancoNome} onChange={(e) => setForm({ ...form, bancoNome: e.target.value })} placeholder="Banco do Brasil" />
        </div>
        <div className="space-y-1.5">
          <Label>Agência</Label>
          <Input value={form.agencia} onChange={(e) => setForm({ ...form, agencia: e.target.value })} maxLength={10} />
        </div>
        <div className="space-y-1.5">
          <Label>Dígito da agência (opcional)</Label>
          <Input value={form.agenciaDigito ?? ''} onChange={(e) => setForm({ ...form, agenciaDigito: e.target.value })} maxLength={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Conta</Label>
          <Input value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value })} maxLength={20} />
        </div>
        <div className="space-y-1.5">
          <Label>Dígito da conta</Label>
          <Input value={form.contaDigito ?? ''} onChange={(e) => setForm({ ...form, contaDigito: e.target.value })} maxLength={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de conta</Label>
          <Select value={form.tipoConta} onValueChange={(v) => setForm({ ...form, tipoConta: v as TipoConta })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TIPO_CONTA_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Titular</Label>
          <Input value={form.titularNome} onChange={(e) => setForm({ ...form, titularNome: e.target.value })} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Chave PIX (opcional)</Label>
          <div className="flex gap-2">
            <Input className="flex-1" value={form.chavePix ?? ''} onChange={(e) => setForm({ ...form, chavePix: e.target.value })} />
            <Select value={form.tipoChavePix ?? ''} onValueChange={(v) => setForm({ ...form, tipoChavePix: v as TipoChavePix })}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_CHAVE_PIX_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-between flex-wrap">
        {dadosAtivos && (
          <Button variant="ghost" size="sm" onClick={() => setModo('existente')} className="rounded-xl">
            Usar conta cadastrada
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          {onBack && <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl">Voltar</Button>}
          <Button size="sm" onClick={handleConfirmNovo} className="rounded-xl">Continuar</Button>
        </div>
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: PrestacaoContasFlow orquestrador**

```tsx
// src/app/(assinatura-digital)/prestacao-contas/[token]/_components/PrestacaoContasFlow.tsx
'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { DadosBancariosStep } from './steps/DadosBancariosStep';
import AssinaturaManuscritaStep from '@/app/(assinatura-digital)/_wizard/form/assinatura-manuscrita-step';
import { actionFinalizarPrestacaoContas } from '@/shared/prestacao-contas/actions/finalizar-prestacao-contas';
import type { DadosBancariosCliente, DadosBancariosInput } from '@/shared/prestacao-contas/types';

interface Props {
  token: string;
  clienteNome: string;
  clienteCpfMascara: string;
  dadosBancariosAtivos: DadosBancariosCliente | null;
  jaAssinado: boolean;
  templateMarkdown: string;
}

type Etapa = 'cpf' | 'dados' | 'revisao' | 'assinar' | 'sucesso';

export function PrestacaoContasFlow({
  token, clienteNome, clienteCpfMascara, dadosBancariosAtivos, jaAssinado, templateMarkdown,
}: Props) {
  const [etapa, setEtapa] = useState<Etapa>('cpf');
  const [cpfConfirmado, setCpfConfirmado] = useState('');
  const [dados, setDados] = useState<DadosBancariosInput | null>(null);
  const [submetendo, setSubmetendo] = useState(false);

  if (jaAssinado) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <GlassPanel depth={1} className="p-8 text-center space-y-4">
          <CheckCircle2 className="size-12 text-success mx-auto" />
          <Heading level="section">Declaração já assinada</Heading>
          <Text>Este link já foi utilizado. Em caso de dúvida, procure o escritório.</Text>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
      {etapa === 'cpf' && (
        <GlassPanel depth={1} className="p-6 space-y-5">
          <div>
            <Heading level="section">Confirme seu CPF</Heading>
            <Text variant="caption" className="mt-1">
              Para continuar, confirme o CPF vinculado ao processo. Identificamos você como{' '}
              <strong>{clienteNome}</strong> (CPF {clienteCpfMascara}).
            </Text>
          </div>
          <div className="space-y-1.5">
            <Label>CPF (somente números)</Label>
            <Input
              inputMode="numeric" maxLength={11}
              value={cpfConfirmado}
              onChange={(e) => setCpfConfirmado(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <Button
            disabled={cpfConfirmado.length !== 11}
            onClick={() => setEtapa('dados')}
            className="w-full rounded-xl" size="sm"
          >
            Continuar
          </Button>
        </GlassPanel>
      )}

      {etapa === 'dados' && (
        <DadosBancariosStep
          clienteNome={clienteNome}
          clienteCpf={cpfConfirmado}
          dadosAtivos={dadosBancariosAtivos}
          onBack={() => setEtapa('cpf')}
          onConfirm={(d) => { setDados(d); setEtapa('revisao'); }}
        />
      )}

      {etapa === 'revisao' && dados && (
        <GlassPanel depth={1} className="p-6 space-y-4">
          <Heading level="section">Revise a declaração</Heading>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {resolveClientSide(templateMarkdown, clienteNome, cpfConfirmado, dados)}
            </ReactMarkdown>
          </div>
          <Alert>
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Ao prosseguir, você declara que as informações são verdadeiras e autoriza o escritório a realizar o depósito na conta informada.
            </AlertDescription>
          </Alert>
          <div className="flex justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setEtapa('dados')} className="rounded-xl">Voltar</Button>
            <Button size="sm" onClick={() => setEtapa('assinar')} className="rounded-xl">
              <PenLine className="size-3.5" /> Assinar
            </Button>
          </div>
        </GlassPanel>
      )}

      {etapa === 'assinar' && dados && (
        <GlassPanel depth={1} className="p-6 space-y-4">
          <Heading level="section">Assine no espaço abaixo</Heading>
          <AssinaturaManuscritaStep
            onComplete={async (assinaturaBase64: string) => {
              setSubmetendo(true);
              try {
                const geo = await capturarGeolocation();
                const res = await actionFinalizarPrestacaoContas({
                  token,
                  cpfConfirmado,
                  dadosBancarios: dados,
                  assinaturaBase64,
                  termosAceiteVersao: 'v1.0-MP2200-2',
                  ipAddress: null,
                  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
                  geolocation: geo,
                });
                if (res.success) setEtapa('sucesso');
                else toast.error(res.error ?? 'Erro ao finalizar');
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Erro inesperado');
              } finally {
                setSubmetendo(false);
              }
            }}
            disabled={submetendo}
          />
        </GlassPanel>
      )}

      {etapa === 'sucesso' && (
        <GlassPanel depth={1} className="p-8 text-center space-y-4">
          <CheckCircle2 className="size-12 text-success mx-auto" />
          <Heading level="section">Declaração assinada com sucesso</Heading>
          <Text>O escritório foi notificado e irá providenciar a transferência.</Text>
        </GlassPanel>
      )}
    </div>
  );
}

function resolveClientSide(tpl: string, nome: string, cpf: string, d: DadosBancariosInput): string {
  return tpl
    .replace(/\{\{cliente\.nome\}\}/g, nome)
    .replace(/\{\{cliente\.cpf\}\}/g, cpf)
    .replace(/\{\{banco\.nome\}\}/g, d.bancoNome)
    .replace(/\{\{banco\.codigo\}\}/g, d.bancoCodigo)
    .replace(/\{\{banco\.agencia_completa\}\}/g, d.agenciaDigito ? `${d.agencia}-${d.agenciaDigito}` : d.agencia)
    .replace(/\{\{banco\.conta_completa\}\}/g, d.contaDigito ? `${d.conta}-${d.contaDigito}` : d.conta)
    .replace(/\{\{banco\.titular_nome\}\}/g, d.titularNome)
    .replace(/\{\{banco\.titular_cpf\}\}/g, d.titularCpf)
    .replace(/\{\{[^}]+\}\}/g, (m) => m);
}

async function capturarGeolocation(): Promise<{ latitude: number; longitude: number; accuracy?: number } | null> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => resolve(null),
      { timeout: 5000, enableHighAccuracy: false },
    );
  });
}
```

Observação: `AssinaturaManuscritaStep` existente pode ter API diferente de `onComplete`. Na implementação real, adaptar ao hook/props existentes (o arquivo atual precisa ser lido).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(assinatura-digital\)/prestacao-contas/
git commit -m "feat(prestacao-contas): add public route and wizard flow"
```

---

## Fase 5 — UI admin

### Task 5.1: Hook e botão de gerar link

**Files:**
- Create: `src/app/(authenticated)/obrigacoes/components/prestacao-contas/use-prestacao-contas-status.ts`
- Create: `src/app/(authenticated)/obrigacoes/components/prestacao-contas/gerar-link-button.tsx`
- Create: `src/app/(authenticated)/obrigacoes/components/prestacao-contas/link-gerado-dialog.tsx`
- Create: `src/app/(authenticated)/obrigacoes/components/prestacao-contas/index.ts`

- [ ] **Step 1: Hook de status**

```ts
// use-prestacao-contas-status.ts
'use client';

export type StatusPrestacaoContas = 'sem_link' | 'link_ativo' | 'assinado';

export interface PrestacaoContasStatus {
  status: StatusPrestacaoContas;
  pdfUrl?: string | null;
  token?: string | null;
}

export function derivarStatus(parcela: {
  declaracaoPrestacaoContasUrl: string | null;
  documentoAssinaturaId?: number | null;
}): StatusPrestacaoContas {
  if (parcela.declaracaoPrestacaoContasUrl) return 'assinado';
  if (parcela.documentoAssinaturaId) return 'link_ativo';
  return 'sem_link';
}
```

- [ ] **Step 2: LinkGeradoDialog**

```tsx
// link-gerado-dialog.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  expiresAt: string;
}

export function LinkGeradoDialog({ open, onOpenChange, url, expiresAt }: Props) {
  const [copiado, setCopiado] = useState(false);
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopiado(true);
    toast.success('Link copiado');
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dialog sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link de prestação de contas gerado</DialogTitle>
          <DialogDescription>
            Envie este link ao cliente. Válido até {new Date(expiresAt).toLocaleDateString('pt-BR')}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 items-center">
          <Input readOnly value={fullUrl} className="font-mono text-xs" />
          <Button size="sm" onClick={handleCopy} variant="outline" className="rounded-xl shrink-0">
            {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)} className="rounded-xl">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: GerarLinkButton**

```tsx
// gerar-link-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { actionCriarLinkPrestacaoContas } from '@/shared/prestacao-contas/actions/criar-link-prestacao-contas';
import { LinkGeradoDialog } from './link-gerado-dialog';

interface Props {
  parcelaId: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default';
  label?: string;
  onGerado?: () => void;
}

export function GerarLinkButton({ parcelaId, variant = 'default', size = 'sm', label = 'Gerar link de prestação de contas', onGerado }: Props) {
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{ url: string; expiresAt: string } | null>(null);

  const handle = async () => {
    setLoading(true);
    try {
      const result = await actionCriarLinkPrestacaoContas({ parcelaId });
      if (result?.data) {
        setDialog({ url: result.data.url, expiresAt: result.data.expiresAt });
        onGerado?.();
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant={variant} size={size} onClick={handle} disabled={loading} className="rounded-xl gap-1.5">
        <LinkIcon className="size-3.5" />
        {loading ? 'Gerando...' : label}
      </Button>
      {dialog && (
        <LinkGeradoDialog
          open={!!dialog}
          onOpenChange={(o) => !o && setDialog(null)}
          url={dialog.url}
          expiresAt={dialog.expiresAt}
        />
      )}
    </>
  );
}
```

- [ ] **Step 4: Index + commit**

```ts
// index.ts
export * from './gerar-link-button';
export * from './link-gerado-dialog';
export * from './use-prestacao-contas-status';
```

```bash
git add src/app/\(authenticated\)/obrigacoes/components/prestacao-contas/
git commit -m "feat(obrigacoes): add prestacao-contas admin UI primitives"
```

### Task 5.2: Integrar botão na lista de repasses pendentes

- [ ] **Step 1: Ler o arquivo atual** e adicionar o botão
**Files:**
- Modify: `src/app/(authenticated)/obrigacoes/components/repasses/repasses-pendentes-list.tsx`

Adicionar `<GerarLinkButton parcelaId={...} />` em cada linha de repasse pendente, condicionado ao `statusRepasse === 'pendente_declaracao'`.

- [ ] **Step 2: Commit**

```bash
git commit -am "feat(obrigacoes): wire gerar-link-button into repasses pendentes list"
```

### Task 5.3: Integrar seção no dialog de detalhes

**Files:**
- Modify: `src/app/(authenticated)/obrigacoes/components/dialogs/obrigacao-detalhes-dialog.tsx`

- [ ] **Step 1: Adicionar seção "Prestação de contas"** com três estados (sem link / link ativo / assinado) usando `GerarLinkButton`.

- [ ] **Step 2: Commit**

```bash
git commit -am "feat(obrigacoes): add prestacao-contas section to obrigacao detalhes dialog"
```

---

## Fase 6 — Seed do template + finalização

### Task 6.1: Script de seed

**Files:**
- Create: `scripts/database/seed-prestacao-contas-template.ts`
- Modify: `package.json` (adicionar `scripts.seed:prestacao-contas`)

- [ ] **Step 1: Script**

```ts
// scripts/database/seed-prestacao-contas-template.ts
import { createClient } from '@supabase/supabase-js';
import { gerarPdfPrestacaoContas } from '../../src/shared/prestacao-contas/services/pdf-generator';
import { storePrestacaoContasPdf } from '../../src/shared/assinatura-digital/services/storage.service';

const MARKDOWN = `# Declaração de Prestação de Contas

Eu, **{{cliente.nome}}**, inscrito(a) no CPF **{{cliente.cpf}}**, DECLARO, para os devidos fins, que recebi do escritório **{{escritorio.razao_social}}** (OAB {{escritorio.oab}}) a quantia de **{{parcela.valor_repasse_liquido_formatado}}** ({{parcela.valor_repasse_liquido_extenso}}), referente à {{acordo.tipo_label}} nº {{parcela.numero}}/{{acordo.numero_parcelas}} do processo **{{processo.numero}}**, em trâmite perante {{processo.orgao_julgador}}.

## Detalhamento do valor

| Rubrica | Valor |
|---|---|
| Valor bruto da parcela | {{parcela.valor_bruto_formatado}} |
| Honorários contratuais ({{acordo.percentual_escritorio}}%) | {{parcela.honorarios_contratuais_formatado}} |
| Honorários sucumbenciais | {{parcela.honorarios_sucumbenciais_formatado}} |
| **Valor líquido recebido pelo cliente** | **{{parcela.valor_repasse_liquido_formatado}}** |

## Dados bancários informados para recebimento

- **Banco:** {{banco.nome}} ({{banco.codigo}})
- **Agência:** {{banco.agencia_completa}}
- **Conta:** {{banco.conta_completa}} ({{banco.tipo_conta_label}})
- **Titular:** {{banco.titular_nome}} — CPF {{banco.titular_cpf}}
{{#banco.chave_pix}}- **Chave PIX:** {{banco.chave_pix}} ({{banco.tipo_chave_pix_label}})
{{/banco.chave_pix}}

Declaro que os dados bancários acima são verdadeiros e de minha titularidade, e autorizo o escritório a efetuar o depósito do valor líquido informado nessa conta.

{{cidade}}, {{data_assinatura_extenso}}.
`;

const SLUG = 'declaracao-prestacao-contas-default';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const pngTransparente = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const { buffer } = await gerarPdfPrestacaoContas({
    markdownResolvido: MARKDOWN,
    assinaturaPngBase64: pngTransparente.toString('base64'),
    metadados: {
      protocolo: 'SEED',
      dataAssinatura: 'seed',
      clienteNome: '{{cliente.nome}}',
      clienteCpf: '{{cliente.cpf}}',
      hashOriginal: 'seed',
      termosAceiteVersao: 'seed',
    },
  });

  const stored = await storePrestacaoContasPdf(buffer, 0, 'template-default');

  const { error } = await supabase
    .from('assinatura_digital_templates')
    .upsert(
      {
        slug: SLUG,
        nome: 'Declaração de Prestação de Contas',
        descricao: 'Template padrão para prestação de contas pública. Editável pelo admin.',
        sistema: true,
        ativo: true,
        status: 'ativo',
        versao: 1,
        tipo_template: 'prestacao_contas',
        conteudo_markdown: MARKDOWN,
        arquivo_original: stored.url,
        pdf_url: stored.url,
        arquivo_nome: 'declaracao-prestacao-contas-default.pdf',
        arquivo_tamanho: buffer.length,
      },
      { onConflict: 'slug' }
    );

  if (error) throw error;
  console.log('✓ Template de prestação de contas seedado:', stored.url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Adicionar script no package.json**

```json
"scripts": {
  "seed:prestacao-contas": "tsx scripts/database/seed-prestacao-contas-template.ts"
}
```

- [ ] **Step 3: Rodar e verificar**

```bash
npm run seed:prestacao-contas
```

- [ ] **Step 4: Commit**

```bash
git add scripts/database/seed-prestacao-contas-template.ts package.json
git commit -m "feat(prestacao-contas): add idempotent seed script for default template"
```

### Task 6.2: Type-check final

- [ ] **Step 1**

```bash
npm run type-check
```

Corrigir erros antes de fechar.

- [ ] **Step 2: Commit de ajustes**

```bash
git commit -am "fix(prestacao-contas): final type errors"
```

---

## Fora deste plano (backlog)

- Wrapper `publicTokenAction` formal em `src/lib/safe-action.ts` (v1 usa validação inline no service).
- Envio automatizado do link via WhatsApp/e-mail.
- Dígito verificador algorítmico por banco.
- UI de edição inline do template (usuário usa a UI de templates existente).
- Testes E2E completos (criar em fase posterior após validação manual).
- Cancelamento de link ativo (botão "Cancelar link" — precisa ação no service).

---

## Self-review

- [x] **Spec coverage:** todas as seções §3–§10 do spec têm task. §11 (fora de escopo) explicitamente refletido em "Fora deste plano".
- [x] **Placeholders:** removidos — código completo em cada step crítico. Dois pontos marcados como "modificação ao arquivo existente" (lista repasses e dialog detalhes) dependem de ler o estado atual no momento da execução — aceitável porque a intervenção é aditiva.
- [x] **Type consistency:** `DadosBancariosInput`, `PrestacaoContasContext`, `LinkPrestacaoContas` usadas consistentemente.
