# Change: Refatorar Configurações de Tribunais para Usar Banco de Dados

## Why

Atualmente, todas as configurações de tribunais para captura do PJE-TRT (URLs de login, base URLs, API URLs e timeouts) estão hardcoded no arquivo `backend/captura/services/trt/config.ts`. Isso dificulta:
- Adicionar novos tribunais sem modificar código
- Ajustar URLs quando tribunais mudam seus endereços
- Customizar timeouts específicos por tribunal/grau
- Auditar alterações de configuração

Já existe uma tabela `TribunalConfig` no banco de dados (herdada do projeto anterior) que contém exatamente essas configurações, mas ela não está sendo utilizada e usa nomenclatura camelCase inconsistente com as novas tabelas.

## What Changes

- Renomear tabela `TribunalConfig` para `tribunais_config` (snake_case)
- Adicionar comentários descritivos nas colunas seguindo padrão das novas tabelas
- Atualizar campo `grau` para usar o tipo enum `grau_tribunal` (primeiro_grau/segundo_grau) em vez de '1g'/'2g'
- Criar serviço de persistência para buscar configurações do banco
- Refatorar `config.ts` para buscar dados do banco em vez de retornar objetos hardcoded
- Manter função `getTribunalConfig()` com mesma assinatura para compatibilidade
- Remover objetos de configuração hardcoded (array `tribunaisConfig`)
- Atualizar testes e documentação

## Impact

- **Affected specs**: `captura-trt`
- **Affected code**:
  - `backend/captura/services/trt/config.ts` (mudança principal)
  - Todos os serviços que usam `getTribunalConfig()`:
    - `backend/captura/services/scheduler/executar-agendamento.service.ts`
    - `backend/captura/services/trt/acervo-geral.service.ts`
    - `backend/captura/services/trt/audiencias.service.ts`
    - `backend/captura/services/trt/arquivados.service.ts`
    - `backend/captura/services/trt/pendentes-manifestacao.service.ts`
- **Database**: Migration para renomear tabela e ajustar tipos
- **Breaking**: Nenhum - API pública (`getTribunalConfig()`) mantém mesma assinatura
- **Benefits**:
  - Flexibilidade para adicionar/editar tribunais via interface administrativa futura
  - Timeouts customizáveis por tribunal sem deploy
  - Histórico de alterações via `updated_at`
  - Redução de código hardcoded

## Migration Strategy

1. Criar migration SQL para renomear tabela e ajustar colunas
2. Atualizar dados existentes (converter '1g' → 'primeiro_grau', '2g' → 'segundo_grau')
3. Implementar serviço de persistência com cache em memória (5 min TTL)
4. Refatorar `config.ts` para usar serviço de persistência (remover array hardcoded diretamente)
5. Atualizar todos os consumers para usar `await`
6. Testar todos os fluxos de captura
