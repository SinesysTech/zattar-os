# Change: Refatorar modelo de dados de Contratos para relacional

## Why
O modelo atual de contratos mistura FKs singulares (cliente_id, parte_contraria_id) com campos JSONB (parte_autora, parte_re) e datas por estágio (data_assinatura, data_distribuicao, data_desistencia), o que gera inconsistência, falta de histórico de status e dificulta suportar múltiplas partes por polo de forma confiável.

## What Changes
- **BREAKING**: Remodelar as partes do contrato para uma tabela de relacionamento N:N (`contrato_partes`) com suporte real a múltiplas partes autoras e rés.
  - Em contratos, usar a nomenclatura **papel/qualificação contratual**: `autora` | `re` (imutável).
  - Evitar o termo **polo** em contratos para não confundir com **polo processual** (ativo/passivo), que pode mudar por grau no PJe.
- **BREAKING**: Renomear/depreciar o campo legado `contratos.polo_cliente` (enum `polo_processual`) para um campo de **papel do cliente no contrato** (`autora` | `re`).
- **BREAKING**: Substituir datas por estágio e ausência de histórico por uma tabela de histórico/eventos de status (`contrato_status_historico`).
- **BREAKING**: Ajustar semântica de datas do contrato:
  - Renomear `contratos.data_contratacao` para `contratos.cadastrado_em` (data de cadastro/registro do contrato no contexto de negócio).
  - Manter `contratos.created_at` como auditoria (timestamp de inserção no banco).
- Atualizar migração para garantir `segmento_id` preenchido em contratos legados (setar para o segmento trabalhista, referência por `segmentos.slug='trabalhista'`).
- Manter e evoluir o relacionamento contrato↔processos já previsto em `contrato_processos`.
- Definir estratégia de sincronização/associação automática de processos a contratos baseada em cliente (CPF/CNPJ) e datas, evitando triggers pesadas (preferência por fila + função).
- Adicionar sistema unificado de tags para contratos e processos:
  - Cadastro/gestão de tags (criar novas tags via UI)
  - Tags aplicadas a contratos devem ser visíveis/aplicáveis aos processos vinculados ao contrato

## Impact
- Affected specs:
  - `openspec/specs/contratos/spec.md`
  - `openspec/specs/acervo/spec.md`
- Affected database:
  - `public.contratos`
  - `public.contrato_processos` (já existe)
  - **Novas tabelas**: `public.contrato_partes`, `public.contrato_status_historico`
  - **Novas tabelas (tags)**: `public.tags`, `public.contrato_tags`, `public.processo_tags` (e/ou view para tags herdadas)
  - (Opcional) fila de sync para associação automática contrato↔processo
- Affected code:
  - `src/features/contratos/domain.ts`
  - `src/features/contratos/repository.ts`
  - `src/features/contratos/service.ts`
  - `src/features/contratos/actions/*`
  - UI de contratos (listagem, detalhes e formulário) para consumir o novo modelo
