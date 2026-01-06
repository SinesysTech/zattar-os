## 1. Proposta e validacao
- [x] 1.1 Criar delta spec de contratos cobrindo: modelo relacional de partes, historico de status
- [x] 1.2 Escrever design.md com decisoes e plano de migracao
- [x] 1.3 Validar proposta

## 2. Banco de dados (Supabase)
- [x] 2.1 Criar tabela `contrato_partes` (N:N) com `papel_contratual` (autora/re)
- [x] 2.2 Criar tabela `contrato_status_historico` para registrar transicoes
- [x] 2.3 Renomear `contratos.data_contratacao` -> `contratos.cadastrado_em`
- [x] 2.3.1 Backfill: setar `contratos.segmento_id` para segmento trabalhista
- [x] 2.3.2 Remover/depreciar `contratos.polo_cliente`
- [x] 2.4 Remover colunas legadas de partes (JSONB `parte_autora`, `parte_re`)
- [x] 2.5 Remover colunas legadas de datas por estagio
- [x] 2.5.1 Implementar sistema de tags unificado:
  - [x] 2.5.1.1 Criar tabela `tags`
  - [x] 2.5.1.2 Criar tabela de relacao `contrato_tags`
  - [x] 2.5.1.3 Criar tabela de relacao `processo_tags`
  - [x] 2.5.1.4 Criar funcao para propagar tags contrato->processos
- [x] 2.6 Escrever migracao de dados (backfill executado)
- [x] 2.7 Ajustar indices e RLS policies

## 3. Backend (feature contratos)
- [x] 3.1 Atualizar `domain.ts` com `ContratoStatusHistorico` e novo modelo
- [x] 3.2 Atualizar `repository.ts` para ler/escrever novas tabelas
- [x] 3.3 Atualizar `service.ts` para regras de transicao de status
- [x] 3.4 Atualizar `actions/*` para persistir partes multiplas

## 4. Integracao contrato<->processo
- [x] 4.1 Confirmar uso de `contrato_processos`
- [ ] 4.2 Mecanismo de sincronizacao automatica (backlog - baixa prioridade)

## 5. UI (contratos)
- [x] 5.1 Ajustar formulario para multiplas partes
- [x] 5.2 Ajustar listagem e detalhes
- [x] 5.3 Ajustar labels: "Data de Contratacao" -> "Cadastrado em"

## 6. Qualidade
- [x] 6.1 Atualizar `database.types.ts`
- [x] 6.2 Ajustar testes/fixtures

> **STATUS FINAL (2026-01-06)**: 95% implementado. Banco de dados migrado, backend atualizado, UI ajustada.
> Task pendente: sincronizacao automatica contrato<->processo (backlog).
