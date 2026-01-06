## Contexto

Existe um módulo de notas em `src/app/(dashboard)/notas` com UI pronta (busca, modo masonry/list, editor rich text, etiquetas, arquivamento e notas com imagem/checklist). No banco, já existe `public.notas` em `supabase/schemas/23_dashboard.sql`, porém com um modelo simples (título, conteúdo, cor, fixada).

## Objetivos

- Persistir notas/etiquetas por usuário, mantendo o contrato do front atual.
- Adotar o padrão arquitetural já usado em `kanban/` e `tarefas/` dentro do próprio `app/(dashboard)/notas`:
  - domain → repository → service → server actions
- Garantir segurança (ownership por usuário) e previsibilidade (tipagem e validação).

## Decisões

### Decisão: evoluir `public.notas` (em vez de criar uma tabela nova)

**Motivo**: a tabela já existe e segue o naming do projeto. Vamos manter compatibilidade e apenas adicionar colunas necessárias **no final da definição** para minimizar diffs.

### Modelo proposto (alto nível)

- `public.notas` (dono: `usuario_id`)
  - manter: `titulo`, `conteudo`, `cor`, `fixada`
  - adicionar:
    - `tipo` (text; check constraint: `text|checklist|image`)
    - `is_archived` (boolean)
    - `items` (jsonb) para checklist
    - `image_url` (text) para notas com imagem
- `public.nota_etiquetas` (labels do usuário)
  - `id` identity, `usuario_id`, `titulo`, `cor`
- `public.nota_etiqueta_vinculos` (join)
  - `nota_id` → `public.notas.id`
  - `etiqueta_id` → `public.nota_etiquetas.id`

### Imagens (escopo inicial)

Para manter a entrega enxuta e consistente com o front atual, no v1 o back-end persistirá **apenas `image_url`** (string). A implementação de upload para Supabase Storage (bucket + policies) pode ser adicionada em um change posterior, caso o time confirme o comportamento desejado (tamanho máximo, formatos, estrutura de path, cache-busting).

## Riscos / Trade-offs

- Guardar `image_url` sem upload integrado limita o fluxo “upload direto” no modal, mas mantém o backend e o CRUD completos e evita decisões irreversíveis de storage/policies.
- Se futuramente houver necessidade de versão/auditoria de notas, podemos adicionar `updated_by`, `archived_at`, etc.


