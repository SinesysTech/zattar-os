# Design: Reorganização do Fluxo de Captura

## Context
O sistema atual de captura possui redundâncias na interface e viola a arquitetura de camadas ao permitir acesso direto do frontend ao Supabase. Cada credencial já contém tribunal e grau, mas o sistema ainda permite seleção redundante desses campos. Além disso, capturas podem levar vários minutos e precisam de um sistema de histórico assíncrono.

## Goals / Non-Goals

### Goals
- Estabelecer hierarquia lógica: Advogado → Credenciais → Captura
- Remover redundância de seleção de tribunal/grau (já estão na credencial)
- Criar serviços backend completos para gerenciar advogados e credenciais
- Adaptar endpoints de captura para usar `credencial_id` ao invés de `trt_codigo` + `grau`
- Implementar sistema de histórico de capturas para operações assíncronas
- Manter separação de camadas: frontend não acessa banco diretamente

### Non-Goals
- Não implementar fila de jobs assíncronos nesta fase (usar polling simples)
- Não implementar WebSockets para atualização em tempo real (futuro)
- Não modificar estrutura de tabelas existentes (apenas adicionar `capturas_log`)

## Decisions

### Decision: Usar `credencial_id` ao invés de `trt_codigo` + `grau`
**Rationale**: Cada credencial já contém tribunal e grau. Usar `credencial_id` simplifica a API e remove redundância. O backend recupera tribunal e grau da credencial antes de executar a captura.

**Alternatives considered**:
- Manter `trt_codigo` + `grau`: Mantém redundância e não resolve o problema
- Usar apenas `advogado_id` + `trt_codigo` + `grau`: Ainda redundante, credencial já tem essa info

### Decision: Criar serviços backend completos de CRUD
**Rationale**: O sistema precisa gerenciar advogados e credenciais de forma centralizada. Atualmente só existe helper para buscar/criar advogado por CPF, mas não há CRUD completo.

**Alternatives considered**:
- Manter apenas helpers: Não permite gerenciamento completo via API
- Usar Supabase diretamente no frontend: Viola arquitetura de camadas

### Decision: Resposta assíncrona simples (sem fila de jobs)
**Rationale**: Para MVP, usar resposta imediata com status "in_progress" e polling do histórico é suficiente. Filas de jobs podem ser adicionadas depois se necessário.

**Alternatives considered**:
- Implementar fila de jobs (BullMQ): Complexidade desnecessária para MVP
- Processamento síncrono: Bloqueia requisição por vários minutos, não escalável

### Decision: Enviar `advogado_cpf` opcionalmente junto com `credencial_ids`
**Rationale**: Otimização - backend pode validar CPF sem buscar advogado novamente, mas ainda busca senha pela credencial_id.

**Alternatives considered**:
- Apenas `credencial_ids`: Backend precisa buscar advogado para obter CPF
- Enviar senha também: Inseguro, senha nunca deve sair do backend

## Risks / Trade-offs

### Risk: Breaking change nos endpoints de captura
**Mitigation**: Manter compatibilidade temporária ou documentar claramente a mudança. Frontend será atualizado simultaneamente.

### Risk: Capturas longas podem timeout
**Mitigation**: Implementar resposta assíncrona imediata e sistema de histórico para verificar status.

### Risk: Múltiplas credenciais selecionadas podem gerar muitas requisições
**Mitigation**: Processar em paralelo mas com limite razoável. Considerar batching futuro.

## Migration Plan

### Phase 1: Backend Services (Não breaking)
- Criar serviços de advogados e credenciais
- Criar endpoints API
- Frontend antigo continua funcionando

### Phase 2: Adaptar Captura (Breaking)
- Modificar endpoints de captura
- Atualizar frontend simultaneamente
- Remover código antigo após validação

### Phase 3: Histórico (Adição)
- Criar tabela e serviço de histórico
- Adicionar página de histórico no frontend
- Não afeta funcionalidade existente

### Rollback
- Manter endpoints antigos temporariamente com deprecation warning
- Reverter frontend para usar endpoints antigos se necessário

## Open Questions
- Deve haver limite máximo de credenciais selecionadas por captura?
- Como tratar capturas que falham parcialmente (algumas credenciais funcionam, outras não)?
- Deve haver retry automático para capturas que falham?

