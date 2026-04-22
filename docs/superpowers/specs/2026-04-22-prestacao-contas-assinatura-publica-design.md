# Prestação de Contas via Assinatura Digital Pública

**Data:** 2026-04-22
**Autor:** Jordan Medeiros (com Claude)
**Status:** Draft — aguardando revisão

---

## 1. Contexto e problema

Hoje, no módulo de **Obrigações**, quando uma parcela de acordo/condenação é **recebida** e há valor de repasse ao cliente, o operador precisa anexar manualmente uma declaração de prestação de contas assinada pelo cliente antes de transferir o valor. O fluxo atual vive em `src/app/(authenticated)/obrigacoes/components/repasses/upload-declaracao-dialog.tsx` e é simulado — não há storage real, não há rastro de como a declaração foi produzida, e o cliente precisa assinar um PDF fora do sistema e reenviar.

Paralelamente, o ZattarOS já possui infraestrutura madura de **assinatura digital pública** em `src/app/(assinatura-digital)/` e `src/shared/assinatura-digital/`: wizard público com CPF, geolocalização, captura de foto, visualização de Markdown e PDF, assinatura manuscrita, termos de aceite, hash SHA-256, persistência em Backblaze B2 e audit trail. Este fluxo não está conectado ao módulo de obrigações.

**Este spec descreve a ponte entre os dois módulos**: um novo fluxo de geração de link público para o cliente assinar digitalmente uma declaração de prestação de contas gerada automaticamente com os dados da parcela, coletando também os dados bancários para o repasse, e finalizando com o PDF assinado anexado à parcela.

## 2. Resultado esperado

### 2.1 User stories

**Operador (escritório):**
- No detalhe de uma obrigação ou na lista de repasses pendentes, clico em "Gerar link de prestação de contas" para uma parcela recebida com valor de repasse.
- Recebo uma URL pública curta, copio e envio ao cliente pelo canal de minha escolha (WhatsApp, e-mail — fora do escopo automatizar).
- Quando o cliente finaliza, vejo no detalhe da parcela o status atualizado, o PDF assinado renderizável in-app, os dados bancários que ele informou, e a parcela pronta para eu efetuar a transferência.

**Cliente (público, sem login):**
- Abro o link, confirmo meu CPF.
- Informo (ou confirmo, se já tenho cadastro) meus dados bancários — banco, agência, conta, tipo de conta, opcionalmente PIX.
- Leio a declaração em Markdown (formato legível no celular) com meus dados e os valores da parcela automaticamente preenchidos.
- Se quiser, visualizo o PDF oficial da declaração (mesmo conteúdo) antes de assinar.
- Aceito os termos, desenho minha assinatura no touch, finalizo. Recebo confirmação.

### 2.2 Critérios de sucesso

- Zero regressão no fluxo manual atual de `UploadDeclaracaoDialog` (mantido como fallback).
- Parcela transiciona automaticamente de `statusRepasse = 'pendente_declaracao'` para `'pendente_transferencia'` ao final da assinatura.
- `parcelas.arquivo_declaracao_prestacao_contas` populado com URL do PDF gerado (mesmo campo que a versão manual usa — view de detalhes continua funcionando).
- Dados bancários do cliente persistidos em tabela dedicada para reuso em repasses futuros do mesmo cliente.
- Snapshot imutável dos dados bancários usados *naquele* repasse, gravado na própria parcela (auditoria).
- Template da declaração editável por admin pela UI existente de templates, sem necessidade de deploy.

## 3. Arquitetura

### 3.1 Colocação (FSD + shared)

O domínio de prestação de contas é consumido por duas rotas (público `(assinatura-digital)/` e admin `(authenticated)/obrigacoes/`), então o código compartilhado vive em `src/shared/prestacao-contas/` — seguindo a convenção já estabelecida para `src/shared/assinatura-digital/`.

```
src/shared/prestacao-contas/
├── domain.ts                              # Zod schemas: dados bancários, link request
├── service.ts                             # Orquestração de alto nível
├── repository.ts                          # Acesso a dados_bancarios_cliente, lookups
├── actions/
│   ├── criar-link-prestacao-contas.ts     # Action admin
│   ├── salvar-dados-bancarios.ts          # Action pública (via token)
│   └── finalizar-prestacao-contas.ts      # Action pública (via token)
├── services/
│   ├── variable-resolver.ts               # Resolve {{placeholders}} do template
│   ├── template-lookup.ts                 # Busca template de sistema ativo
│   └── pdf-generator.ts                   # Markdown → PDF (reusa infra existente)
├── types.ts                               # Interfaces TS
├── constants.ts                           # Slug do template de sistema, labels
└── index.ts                               # Barrel
```

Componentes de UI ficam colocados nas rotas que os consomem:

```
src/app/(assinatura-digital)/prestacao-contas/[token]/
├── page.tsx                               # Rota pública dedicada (Server Component)
└── _components/
    ├── PrestacaoContasFlow.tsx            # Orquestrador do wizard
    ├── PrestacaoContasContext.tsx         # Context provider
    └── steps/
        └── DadosBancariosStep.tsx         # Step novo

src/app/(authenticated)/obrigacoes/components/prestacao-contas/
├── gerar-link-button.tsx                  # Botão primário (usado nos 2 locais)
├── link-gerado-dialog.tsx                 # Dialog pós-criação com URL/copiar/QR
├── prestacao-contas-section.tsx           # Seção que entra no obrigacao-detalhes-dialog
└── visualizar-declaracao-dialog.tsx       # Dialog de visualização do PDF assinado
```

### 3.2 Integração com `assinatura-digital` existente

Vamos **reusar** — não duplicar — a infraestrutura do novo fluxo de documentos:

- **Tabela `assinatura_digital_documentos`** — já tem tudo que precisamos (UUID público, status, hash). Adicionamos colunas de contexto para "saber de onde esse documento veio".
- **Tabela `assinatura_digital_documento_assinantes`** — já tem token público, `dados_snapshot` JSONB (onde entram os dados bancários), assinatura/rubrica/selfie, geolocalização, fingerprint.
- **`storePdf()` em [storage.service.ts](src/shared/assinatura-digital/services/storage.service.ts)** — wrapper do Backblaze B2. Adicionamos uma helper irmã `storePrestacaoContasPdf()`.
- **Wizard público de `(assinatura-digital)/_wizard/`** — reusado como biblioteca de componentes (steps como `TermosAceiteStep`, `AssinaturaManuscritaStep`, `VisualizacaoMarkdownStep`, `VisualizacaoPdfStep`, `Sucesso`). O orquestrador do fluxo de prestação de contas é novo (`PrestacaoContasFlow`) e monta só os steps relevantes.

### 3.3 Fluxo end-to-end

```
[ADMIN] Operador clica "Gerar link" em uma parcela
  ↓
actionCriarLinkPrestacaoContas(parcelaId)
  ↓
Valida: parcela recebida + valor repasse > 0 + sem link ativo
  ↓
Busca template de sistema (slug = 'declaracao-prestacao-contas-default')
  ↓
Cria assinatura_digital_documentos { 
  tipo_contexto: 'prestacao_contas',
  contexto_parcela_id: <id>,
  template_id: <id do sistema>,
  status: 'pronto'
}
  ↓
Cria assinatura_digital_documento_assinantes { 
  assinante_tipo: 'cliente',
  assinante_entidade_id: <cliente_id>,
  token: <uuid>,
  expires_at: now + 30 dias
}
  ↓
Retorna URL pública: /prestacao-contas/{token}
  ↓
[CLIENTE] Abre link
  ↓
Page SSR carrega: documento + assinante + parcela + acordo + processo + cliente + dados_bancarios_ativos
  ↓
Wizard público:
  1. Confirma CPF (contra cliente.cpf)
  2. Dados bancários (pre-fill se houver registro ativo, edit/new opcional)
  3. Termos + LGPD
  4. Visualização Markdown da declaração (variáveis resolvidas)
  5. Visualização PDF da declaração (mesmo conteúdo, overlay gerado)
  6. Assinatura manuscrita
  ↓
actionFinalizarPrestacaoContas(token, payload)
  ↓
- Persiste dados bancários em dados_bancarios_cliente (upsert, desativando conta anterior)
- Grava snapshot JSONB imutável em parcelas.dados_bancarios_snapshot
- Gera PDF a partir do Markdown renderizado + assinatura + dados
- Upload para Backblaze B2 (prefixo assinatura-digital/prestacao-contas/{parcelaId}/)
- Atualiza assinatura_digital_documentos { pdf_final_url, hash_final_sha256, status: 'concluido' }
- Atualiza parcelas { arquivo_declaracao_prestacao_contas, data_declaracao_anexada, status_repasse: 'pendente_transferencia' }
- Retorna sucesso
  ↓
Wizard mostra tela de sucesso
  ↓
[ADMIN] Vê em tempo real (via revalidatePath) a parcela pronta para transferência
```

## 4. Banco de dados

### 4.1 Migration 1 — tabela `dados_bancarios_cliente`

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

-- Admin autenticado: leitura/escrita completa (respeitando política do escritório)
CREATE POLICY dados_bancarios_admin_all ON dados_bancarios_cliente
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role (usado pelas actions públicas via token): escrita permitida
-- Não criamos policy para anon — acesso público só via service role com validação de token
```

### 4.2 Migration 2 — novas colunas em `parcelas`

```sql
ALTER TABLE parcelas
  ADD COLUMN dados_bancarios_snapshot JSONB,
  ADD COLUMN documento_assinatura_id BIGINT REFERENCES assinatura_digital_documentos(id) ON DELETE SET NULL;

CREATE INDEX ix_parcelas_documento_assinatura ON parcelas (documento_assinatura_id);

COMMENT ON COLUMN parcelas.dados_bancarios_snapshot IS
  'Snapshot imutável dos dados bancários usados neste repasse específico (banco, agência, conta, PIX, titular, timestamp). Preenchido pelo fluxo de prestação de contas pública; independente de mudanças futuras em dados_bancarios_cliente.';

COMMENT ON COLUMN parcelas.documento_assinatura_id IS
  'FK para o documento de assinatura digital gerado via fluxo público de prestação de contas. NULL quando declaração foi anexada manualmente pelo operador.';
```

### 4.3 Migration 3 — colunas de contexto em `assinatura_digital_documentos`

```sql
ALTER TABLE assinatura_digital_documentos
  ADD COLUMN tipo_contexto TEXT CHECK (tipo_contexto IN ('generico', 'prestacao_contas', 'contrato')),
  ADD COLUMN contexto_parcela_id BIGINT REFERENCES parcelas(id) ON DELETE SET NULL,
  ADD COLUMN template_id BIGINT REFERENCES assinatura_digital_templates(id) ON DELETE SET NULL;

CREATE INDEX ix_assinatura_digital_documentos_parcela ON assinatura_digital_documentos (contexto_parcela_id);

-- Valor padrão retroativo para registros existentes
UPDATE assinatura_digital_documentos SET tipo_contexto = 'generico' WHERE tipo_contexto IS NULL;
```

### 4.4 Migration 4 — `slug` e flag `sistema` em `assinatura_digital_templates`

```sql
ALTER TABLE assinatura_digital_templates
  ADD COLUMN slug TEXT,
  ADD COLUMN sistema BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX ix_templates_slug_nao_nulo
  ON assinatura_digital_templates (slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN assinatura_digital_templates.sistema IS
  'Flag que marca templates criados via seed e essenciais para features core. Não podem ser excluídos, apenas editados pelo admin.';
```

Nota: a tabela tem `arquivo_original` e `arquivo_nome` como `NOT NULL`. Por isso o registro seed **não é inserido nesta migration** — seria necessário valor placeholder para `arquivo_original` antes de existir a URL B2 real. O seed fica no script do §8.3, que primeiro gera e faz upload do PDF e depois faz o INSERT já com URL correta. A migration deixa a tabela pronta, o script completa o seed.

## 5. Resolvedor de variáveis

### 5.1 Contrato do resolvedor

`src/shared/prestacao-contas/services/variable-resolver.ts`:

```ts
export interface PrestacaoContasContext {
  cliente: { id: number; nome: string; cpf: string; email?: string | null };
  parcela: {
    id: number;
    numero: number;
    valor_bruto: number;
    honorarios_contratuais: number;
    honorarios_sucumbenciais: number;
    valor_repasse_liquido: number;
    data_efetivacao: string;
  };
  acordo: {
    id: number;
    tipo: TipoObrigacao;
    tipo_label: string;
    numero_parcelas: number;
    percentual_escritorio: number;
  };
  processo: { id: number; numero: string; orgao_julgador: string };
  banco: {
    codigo: string;
    nome: string;
    agencia: string;
    agencia_digito?: string;
    agencia_completa: string;
    conta: string;
    conta_digito?: string;
    conta_completa: string;
    tipo_conta: 'corrente' | 'poupanca' | 'pagamento';
    tipo_conta_label: string;
    chave_pix?: string;
    tipo_chave_pix?: string;
    tipo_chave_pix_label?: string;
    titular_nome: string;
    titular_cpf: string;
  };
  escritorio: { razao_social: string; oab: string; cidade: string };
  data_assinatura: string;                 // ISO
  data_assinatura_extenso: string;         // "22 de abril de 2026"
  cidade: string;
}

export function resolveTemplate(markdown: string, ctx: PrestacaoContasContext): string;
```

- Motor de substituição simples baseado em Mustache (`{{var}}` + `{{#var}}...{{/var}}` para condicional) para evitar dependência complexa de Handlebars. Usar `mustache` (lib minúscula já comum no stack Node/Next).
- Valores monetários pré-formatados no contexto (BRL, R$ 1.234,56) e também por extenso (`{{valor}}_extenso` via lib `extenso` já presente ou similar).

### 5.2 Montagem do contexto

`src/shared/prestacao-contas/services/contexto-builder.ts`:

```ts
export async function buildPrestacaoContasContext(
  parcelaId: number,
  dadosBancarios: DadosBancariosInput
): Promise<PrestacaoContasContext>;
```

- Busca parcela + acordo + processo + cliente via repository (uma query com joins).
- Calcula valores derivados (`valor_repasse_liquido` = `valor_bruto - honorarios_contratuais`).
- Busca config do escritório (razão social, OAB, cidade). Fonte exata a confirmar na Fase 1 do plano — candidatos: perfil do representante (`src/lib/domain/profiles` tem `oab_principal`) ou nova constante em `src/shared/config/escritorio.ts`. Por enquanto, tratar como interface `EscritorioConfig` com uma implementação padrão; trocar a fonte depois é troca de adaptador.
- Retorna objeto imutável pronto para resolver e para snapshot.

## 6. Storage e geração de PDF

### 6.1 Nova helper em storage.service.ts

Adicionar em [src/shared/assinatura-digital/services/storage.service.ts](src/shared/assinatura-digital/services/storage.service.ts):

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

Prefixo separado `prestacao-contas/` para permitir políticas de retenção e billing segregadas no futuro.

### 6.2 Geração do PDF

`src/shared/prestacao-contas/services/pdf-generator.ts`:

```ts
export async function gerarPdfPrestacaoContas(
  markdownResolvido: string,
  assinatura: { base64: string; dataUrl: string },
  metadados: {
    ipAddress?: string;
    userAgent?: string;
    geolocation?: { latitude: number; longitude: number; accuracy?: number };
    hashOriginal: string;
    dataAssinatura: string;
    cliente: { nome: string; cpf: string };
    protocolo: string;
  }
): Promise<{ buffer: Buffer; hashFinal: string }>;
```

Estratégia: usar **`pdf-lib`** (confirmado no `package.json`, já usado em `template-pdf.service.ts`). Não introduzimos dependência nova.

Dois caminhos de geração, decididos em runtime:

- **Caminho A (Markdown → PDF)** — quando o template tem apenas `conteudo_markdown` (caso do seed default). Pipeline: `unified` + `remark-parse` + `remark-rehype` → HTML sanitizado → layout em `pdf-lib` usando fontes e tamanhos fixos (Helvetica para body, negrito para títulos). Assinatura embedada no final como imagem PNG via `doc.embedPng()`. Metadados de auditoria impressos no rodapé.
- **Caminho B (PDF base + overlay)** — quando o template tem `pdf_url` customizado (admin subiu um PDF próprio com campos posicionados). Reusa `src/app/(authenticated)/assinatura-digital/components/editor/utils/pdf-helpers.ts` para sobrepor valores resolvidos e assinatura.

Decisão: `if (template.pdf_url && template.campos_posicionados) → Caminho B; else → Caminho A`.

Se Caminho A precisa de `unified/remark` e a lib não está instalada, adicionar como dependência (`npm i unified remark-parse remark-rehype rehype-stringify`).

## 7. Actions e serviços

### 7.1 Action admin — criar link

`src/shared/prestacao-contas/actions/criar-link-prestacao-contas.ts`:

```ts
export const actionCriarLinkPrestacaoContas = authenticatedAction
  .schema(z.object({ parcelaId: z.number().int().positive() }))
  .action(async ({ parsedInput: { parcelaId }, ctx: { user } }) => {
    return await service.criarLinkPrestacaoContas(parcelaId, user.id);
  });
```

Service valida:
- Parcela existe, status `recebida`, `statusRepasse` em `['pendente_declaracao']`.
- `valorRepasseCliente > 0`.
- Não há documento de prestação de contas ativo para essa parcela (evitar duplicação). Se houver, retornar URL existente em vez de criar novo.

Retorna `{ url: string; token: string; expiresAt: string }`.

### 7.2 Action pública — salvar dados bancários (step intermediário)

Permite o wizard salvar dados bancários antes de finalizar, para resiliência a refreshes.

```ts
export const actionSalvarDadosBancarios = publicTokenAction
  .schema(dadosBancariosSchema)
  .action(async ({ parsedInput, token }) => {
    return await service.salvarDadosBancarios(token, parsedInput);
  });
```

`publicTokenAction` é um novo wrapper em `src/lib/safe-action.ts` análogo a `authenticatedAction`, mas que valida token de assinante em vez de sessão de usuário.

### 7.3 Action pública — finalizar

```ts
export const actionFinalizarPrestacaoContas = publicTokenAction
  .schema(finalizarPrestacaoContasSchema)
  .action(async ({ parsedInput, token }) => {
    return await service.finalizarPrestacaoContas(token, parsedInput);
  });
```

Transação:
1. Valida token, confere CPF (deve bater com `cliente.cpf`).
2. Upsert em `dados_bancarios_cliente` (desativa conta ativa anterior se diferente, insere nova como ativa).
3. Monta snapshot JSONB.
4. Gera PDF.
5. Upload para B2.
6. Update `parcelas`: `arquivo_declaracao_prestacao_contas`, `data_declaracao_anexada`, `dados_bancarios_snapshot`, `documento_assinatura_id`, `statusRepasse = 'pendente_transferencia'`.
7. Update `assinatura_digital_documentos`: `status = 'concluido'`, `pdf_final_url`, `hash_final_sha256`.
8. Update `assinatura_digital_documento_assinantes`: `status = 'concluido'`, `concluido_em`, `assinatura_url`, `ip_address`, `geolocation`, `fingerprint`.

Se qualquer passo falhar entre 4 e 7, rollback e retornar erro claro. Idempotência por verificação de `documentos.status`.

## 8. UI

### 8.1 Admin — dois pontos de entrada (ambos confirmados)

**A) `obrigacao-detalhes-dialog.tsx` — seção "Prestação de contas"**

Renderizada quando a obrigação é do tipo `parcela` com `valorRepasseCliente > 0`. Três estados:

| Estado da parcela | Conteúdo da seção |
|---|---|
| Sem link ativo, `statusRepasse = 'pendente_declaracao'` | Botão primário "Gerar link de prestação de contas" + texto explicando que o cliente receberá o link para assinar digitalmente |
| Link ativo, pendente de assinatura | Badge "Aguardando assinatura", URL copiável, QR code opcional, botão "Reenviar" (gera nova URL com mesmo token), botão secundário "Cancelar link" |
| Assinado | Timeline com data/hora da assinatura, nome do cliente, IP, geo, botão "Ver declaração assinada" (abre `VisualizarDeclaracaoDialog` com PDF), resumo dos dados bancários, botão "Ver dados bancários completos" |

O `UploadDeclaracaoDialog` manual continua disponível como "Anexar manualmente" (fallback, escondido atrás de um dropdown "Mais opções") — garantindo zero regressão.

**B) `repasses-pendentes-list.tsx` — ação na linha**

Cada linha de repasse pendente ganha um botão de ação (dropdown "Ações") com:
- "Gerar link de prestação de contas" (se sem link ou link expirado)
- "Ver link ativo" (se link ativo)
- "Ver declaração assinada" (se assinado)
- "Anexar manualmente" (fallback)

O componente do botão (`GerarLinkButton`) é compartilhado entre A e B. A lógica do estado é encapsulada em um hook `usePrestacaoContasStatus(parcelaId)`.

### 8.2 Público — rota `/prestacao-contas/[token]`

Server Component carrega dados e delega ao `PrestacaoContasFlow` client:

```
PrestacaoContasFlow
├── Step 0: VerificarCPF         (reutiliza src/app/(assinatura-digital)/_wizard/form/verificar-cpf.tsx)
├── Step 1: DadosBancariosStep   (novo — src/app/(assinatura-digital)/prestacao-contas/[token]/_components/steps/)
├── Step 2: TermosAceiteStep     (reutiliza)
├── Step 3: VisualizacaoMarkdownStep (reutiliza, passando markdown resolvido)
├── Step 4: VisualizacaoPdfStep  (reutiliza, passando PDF preview com overlay)
└── Step 5: AssinaturaManuscritaStep (reutiliza)
                ↓ finaliza
              Sucesso
```

Design do `DadosBancariosStep`:
- Se cliente já tem `dados_bancarios_cliente` com `ativo=true`: mostra card com os dados + botão primário "Usar esta conta" + link "Cadastrar outra conta".
- Se não: form aberto com campos (banco via `combobox` carregando lista de bancos BR, agência + dígito, conta + dígito, tipo de conta em radio group, PIX opcional com tipo de chave em select).
- Validação: dígitos numéricos, tipos coerentes. Não validar algoritmo de dígito verificador por banco (escopo excessivo para v1).
- Usa `GlassPanel depth={1}`, `Heading level="section"`, `Text variant="label"` — conforme design system Glass Briefing.

### 8.3 Script de seed do template

`scripts/database/seed-prestacao-contas-template.ts` (dir `scripts/database/` já existe):

1. Monta o Markdown canônico da Declaração de Prestação de Contas (string TypeScript no próprio script — fonte da verdade textual).
2. Renderiza PDF de exemplo usando `pdf-generator.ts` (Caminho A, Markdown → PDF), com contexto mock que preserva os `{{placeholders}}` visíveis (admin entende quais variáveis estão disponíveis ao abrir o template na UI).
3. Upload do PDF para Backblaze B2 em `assinatura-digital/prestacao-contas/templates/declaracao-default.pdf`.
4. `INSERT ... ON CONFLICT (slug) DO UPDATE` no registro com `slug = 'declaracao-prestacao-contas-default'`:
   - `arquivo_original = <url B2>`
   - `pdf_url = <url B2>`
   - `arquivo_nome = 'declaracao-prestacao-contas-default.pdf'`
   - `arquivo_tamanho = <bytes>`
   - `conteudo_markdown = <markdown canônico do passo 1>`
   - `sistema = true`, `ativo = true`, `status = 'ativo'`, `versao = 1`, `tipo_template = 'prestacao_contas'`
   - `nome = 'Declaração de Prestação de Contas'`
   - `descricao = 'Template padrão... (variáveis disponíveis: ...)'`

Idempotente: o `ON CONFLICT (slug)` garante que rodar múltiplas vezes não cria duplicatas. Registrado em `package.json` como `"seed:prestacao-contas": "tsx scripts/database/seed-prestacao-contas-template.ts"` e documentado no README para rodar após `supabase db push` no deploy.

O Markdown canônico de referência que o script usa:

```markdown
# Declaração de Prestação de Contas

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
```

## 9. Segurança, LGPD e auditoria

- **Token público**: UUID v4 com `expires_at = now + 30 dias` (configurável). Expiração clara, sem refresh automático.
- **CPF como segundo fator**: token identifica o assinante, CPF confirma pessoa — defesa em profundidade.
- **Dados bancários**: tabela com RLS estrita (só authenticated + service role). Não logar dados completos em nenhum ponto; mascarar agência/conta em logs (`ag: ****1234`).
- **Snapshot imutável em parcela**: LGPD exige base legal para guardar dados bancários; a base é execução de contrato (repasse acordado), o snapshot é necessário para auditoria do pagamento.
- **Hash do PDF final**: SHA-256 armazenado em `assinatura_digital_documentos.hash_final_sha256`. Permite verificar integridade do PDF depois.
- **Audit trail completo**: IP, user agent, geolocalização, fingerprint de dispositivo, timestamp — tudo armazenado em `assinatura_digital_documento_assinantes` (já suportado).
- **MP 2.200-2/2001**: mantém o padrão atual do módulo (`termos_aceite_versao = 'v1.0-MP2200-2'`).

## 10. Testes

### 10.1 Unit

- `variable-resolver.test.ts` — casos: todas variáveis presentes, PIX ausente (condicional mustache), números formatados corretamente, extenso correto, pt-BR.
- `contexto-builder.test.ts` — mock de parcela/acordo/processo/cliente, validar derivações.
- `pdf-generator.test.ts` — snapshot visual do PDF gerado (via `pdf-parse` + comparação de texto).
- `service.test.ts` — validações de estado da parcela, idempotência de criação de link, transação de finalização.

### 10.2 Integration

- `prestacao-contas-flow.integration.test.ts` — cenário completo com Supabase de teste: criar link → preencher dados bancários → finalizar → validar transição de estado, snapshot, PDF no B2 mock.

### 10.3 E2E (Playwright)

- `prestacao-contas.spec.ts` em `src/app/(assinatura-digital)/__tests__/e2e/` — fluxo público completo incluindo CPF, dados bancários (reuso + novo), assinatura, verificação no detalhe da obrigação.
- `gerar-link-prestacao-contas.spec.ts` em `src/app/(authenticated)/obrigacoes/__tests__/e2e/` — operador gera link pelos dois pontos de entrada (A e B).

## 11. Fora de escopo

- Envio automatizado do link via WhatsApp/e-mail — operador copia e envia manualmente.
- Edição inline do template de declaração no fluxo público — admin edita pela UI de templates existente.
- Suporte a múltiplas contas bancárias ativas simultâneas por cliente — v1 tem apenas uma ativa; mudar significa desativar a anterior.
- Dígito verificador algorítmico por banco (Mod 11 etc.) — só validação de formato.
- Configuração editável do escritório (razão social, OAB, cidade) via UI — usa o que já existir em perfil de representante ou constante temporária (Fase 1 decide).
- Versionamento de template (histórico de edições) — o template é mutável; registro do Markdown exato usado em uma declaração já é implícito pelo PDF gerado e arquivado.
- Migração do fluxo manual existente — `UploadDeclaracaoDialog` continua funcionando como fallback; depreciação gradual em spec futuro.

## 12. Impacto em módulos existentes

| Módulo | Mudança | Tipo |
|---|---|---|
| `obrigacoes` | Seção nova em `obrigacao-detalhes-dialog.tsx`; botão em `repasses-pendentes-list.tsx`; nova coluna `dados_bancarios_snapshot` e `documento_assinatura_id` em `parcelas` | Aditivo |
| `assinatura-digital` | Colunas `tipo_contexto`, `contexto_parcela_id`, `template_id` em `assinatura_digital_documentos`; `slug`, `sistema` em `assinatura_digital_templates`; seed de template | Aditivo |
| `clientes` | Referenciada por nova tabela `dados_bancarios_cliente` | Somente FK |
| `(assinatura-digital)/_wizard/` | Nenhuma mudança nos componentes existentes — reusados como biblioteca | Zero |
| `storage.service.ts` | Nova função `storePrestacaoContasPdf` | Aditivo |
| `safe-action.ts` | Novo wrapper `publicTokenAction` | Aditivo |

## 13. Fases de implementação (alto nível)

O plano detalhado virá no artifact seguinte (writing-plans). Esboço:

1. **Fase 1 — Banco + domínio**: migrations (1-4), seed do template, types gerados, schemas Zod.
2. **Fase 2 — Services core**: `variable-resolver`, `contexto-builder`, `pdf-generator`, `template-lookup`.
3. **Fase 3 — Actions + `publicTokenAction`**: criar link, salvar dados bancários, finalizar.
4. **Fase 4 — Wizard público**: rota `/prestacao-contas/[token]`, `DadosBancariosStep`, orquestrador.
5. **Fase 5 — UI admin**: botão compartilhado, seção no dialog, ação na lista de repasses, dialog de visualização.
6. **Fase 6 — Testes E2E + ajustes de acessibilidade/responsividade**.

## 14. Decisões registradas

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Tabela `dados_bancarios_cliente` + snapshot JSONB | Reuso em repasses futuros + imutabilidade para auditoria |
| 2 | Confirmação de CPF no link público | Defesa em profundidade; token não carrega CPF |
| 3 | Storage no Backblaze B2 via `storePdf` existente | Stack já estabelecida, bucket/prefixo segregado |
| 4 | Template editável no banco (não em arquivo) | Padrão do sistema, admin edita sem deploy, flag `sistema=true` protege contra exclusão |
| 5 | Markdown + PDF coexistem como steps | UX dual: Markdown mais legível no celular, PDF como documento formal — padrão do wizard |
| 6 | Dois pontos de entrada (detalhe + lista de repasses) | Operador alcança a ação pelo fluxo que já está usando |
