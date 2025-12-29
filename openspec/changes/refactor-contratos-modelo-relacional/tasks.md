## 1. Proposta e validação
- [ ] 1.1 Criar delta spec de contratos (OpenSpec) cobrindo: modelo relacional de partes, histórico de status, renome de data_contratacao → cadastrado_em e migração
- [ ] 1.2 Escrever design.md com decisões, alternativas e plano de migração/rollback
- [ ] 1.3 Rodar `openspec validate refactor-contratos-modelo-relacional --strict` e corrigir erros

## 2. Banco de dados (Supabase)
- [ ] 2.1 Criar tabela `contrato_partes` (N:N) com `papel_contratual` (autora/re) e tipo de entidade (cliente/parte_contraria)
- [ ] 2.2 Criar tabela `contrato_status_historico` para registrar transições e reversões de status
- [ ] 2.3 Renomear `contratos.data_contratacao` → `contratos.cadastrado_em`
- [ ] 2.3.1 Backfill: setar `contratos.segmento_id` para o segmento trabalhista (referência por `segmentos.slug='trabalhista'`)
- [ ] 2.3.2 Renomear/depreciar `contratos.polo_cliente` (hoje enum `polo_processual`) para um campo de papel do cliente no contrato (`autora`/`re`)
- [ ] 2.4 Remover colunas legadas de partes em `contratos` (JSONB `parte_autora`, `parte_re`, contadores, e `parte_contraria_id` se ficar redundante)
- [ ] 2.5 Remover colunas legadas de datas por estágio em `contratos` (data_assinatura, data_distribuicao, data_desistencia) após migração para histórico
- [ ] 2.5.1 Implementar sistema de tags unificado:
  - [ ] 2.5.1.1 Criar tabela `tags`
  - [ ] 2.5.1.2 Criar tabela de relação `contrato_tags`
  - [ ] 2.5.1.3 Criar tabela de relação `processo_tags`
  - [ ] 2.5.1.4 Criar função/trigger para propagar tags contrato→processos vinculados (via `contrato_processos`)
- [ ] 2.6 Escrever migração de dados:
  - [ ] 2.6.1 Backfill de `contrato_partes` a partir de `cliente_id`/papel do cliente no contrato e `parte_contraria_id`
  - [ ] 2.6.2 Backfill de `contrato_status_historico` a partir do status atual e datas existentes
  - [ ] 2.6.3 Backfill de tags em processos já vinculados (se houver) após criação das tabelas
- [ ] 2.7 Ajustar/Adicionar índices e RLS policies para as novas tabelas

## 3. Backend (feature contratos)
- [ ] 3.1 Atualizar `domain.ts` e tipos para refletir novo modelo (partes via join table, status via histórico)
- [ ] 3.2 Atualizar `repository.ts` para ler/escrever em `contrato_partes` e `contrato_status_historico`
- [ ] 3.3 Atualizar `service.ts` para regras de transição de status e reversões
- [ ] 3.4 Atualizar `actions/*` para persistir partes múltiplas e registrar eventos de status

## 4. Integração contrato↔processo
- [ ] 4.1 Confirmar uso de `contrato_processos` e criar API/service para vincular/desvincular processos
- [ ] 4.2 Definir mecanismo de sincronização automática (job/fila) baseado em cliente (CPF/CNPJ) e data_autuacao, sem trigger pesada

## 5. UI (contratos)
- [ ] 5.1 Ajustar formulário para múltiplas partes (autoras/rés) com base em `contrato_partes`
- [ ] 5.2 Ajustar listagem e detalhes para exibir múltiplas partes e histórico de status
- [ ] 5.3 Ajustar labels: “Data de Contratação” → “Cadastrado em”

## 6. Qualidade
- [ ] 6.1 Atualizar `database.types.ts` (geração/ajuste) para refletir novas tabelas
- [ ] 6.2 Ajustar testes/fixtures se necessário
