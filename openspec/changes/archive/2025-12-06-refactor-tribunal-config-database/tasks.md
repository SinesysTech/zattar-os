# Implementation Tasks

## 1. Database Migration

- [x] 1.1 Criar migration SQL que renomeia tabela `TribunalConfig` → `tribunais_config`
- [x] 1.2 Renomear colunas para snake_case (tribunalId → tribunal_id, urlBase → url_base, etc)
- [x] 1.3 Adicionar comentários descritivos em todas as colunas (seguindo padrão das tabelas novas)
- [x] 1.4 Adicionar nova coluna `grau_enum` do tipo `grau_tribunal`
- [x] 1.5 Migrar dados: converter '1g' → 'primeiro_grau' e '2g' → 'segundo_grau'
- [x] 1.6 Remover coluna antiga `grau` e renomear `grau_enum` → `grau`
- [x] 1.7 Validar que todos os 48 registros (24 TRTs × 2 graus) foram migrados corretamente
- [x] 1.8 Testar migration em banco local antes de aplicar

## 2. Persistence Service

- [x] 2.1 Criar `backend/captura/services/persistence/tribunal-config-persistence.service.ts`
- [x] 2.2 Implementar função `getConfigByTribunalAndGrau(codigo: CodigoTRT, grau: GrauTRT): Promise<TribunalConfigDb>`
- [x] 2.3 Implementar função `listAllConfigs(): Promise<TribunalConfigDb[]>`
- [x] 2.4 Criar query com JOIN entre `tribunais_config` e `tribunais` para obter código e nome
- [x] 2.5 Implementar validação de `custom_timeouts` JSONB (verificar estrutura esperada)
- [x] 2.6 Implementar tratamento de erro quando configuração não encontrada
- [x] 2.7 Adicionar tipos TypeScript para retorno do banco (`TribunalConfigDb`)

## 3. Config Service Refactor

- [x] 3.1 Adicionar cache em memória no `backend/captura/services/trt/config.ts`
- [x] 3.2 Implementar `Map<string, { config: ConfigTRT, timestamp: number }>` para cache
- [x] 3.3 Implementar função `getCachedConfig(key: string): ConfigTRT | null` com validação de TTL (5 min)
- [x] 3.4 Implementar função `setCachedConfig(key: string, config: ConfigTRT): void`
- [x] 3.5 Implementar função `clearConfigCache(trtCodigo?: CodigoTRT, grau?: GrauTRT): void` para invalidação
- [x] 3.6 Refatorar `getTribunalConfig()` para ser assíncrona:
  - Verificar cache primeiro
  - Se cache miss, buscar do banco via persistence service
  - Cachear resultado antes de retornar
  - Mapear campos do banco (url_base → baseUrl, url_login_seam → loginUrl, etc)
- [x] 3.7 Implementar `listTribunalCodes(): Promise<CodigoTRT[]>` buscando do banco
- [x] 3.8 Implementar `isValidTribunalCode(codigo: string): Promise<boolean>` verificando no banco
- [x] 3.9 Remover array hardcoded `tribunaisConfig` completamente
- [x] 3.10 Adicionar tratamento de erro com log detalhado (tribunal/grau não configurado)

## 4. Update Consumers

- [x] 4.1 Atualizar `backend/captura/services/scheduler/executar-agendamento.service.ts`:
  - Adicionar `await` na chamada de `getTribunalConfig()`
  - Linha 65
- [x] 4.2 Atualizar `backend/captura/services/trt/acervo-geral.service.ts`:
  - Verificar se já usa config do parâmetro (sim, usa `params.config`)
  - Nenhuma mudança necessária (config vem do scheduler)
- [x] 4.3 Atualizar `backend/captura/services/trt/audiencias.service.ts`:
  - Verificar se já usa config do parâmetro (sim, usa `params.config`)
  - Nenhuma mudança necessária
- [x] 4.4 Atualizar `backend/captura/services/trt/arquivados.service.ts`:
  - Verificar se já usa config do parâmetro (sim, usa `params.config`)
  - Nenhuma mudança necessária
- [x] 4.5 Atualizar `backend/captura/services/trt/pendentes-manifestacao.service.ts`:
  - Verificar se já usa config do parâmetro (sim, usa `params.config`)
  - Nenhuma mudança necessária
- [x] 4.6 Buscar outros arquivos que possam usar `getTribunalConfig()` diretamente:
  - `rg "getTribunalConfig" --type ts -g '!node_modules'`
  - Atualizar todos com `await`

## 5. Types Update

- [x] 5.1 Criar tipo `TribunalConfigDb` em `backend/types/captura/trt-types.ts` para representar dados do banco
- [x] 5.2 Criar tipo `CustomTimeouts` para estrutura de timeouts customizados
- [x] 5.3 Atualizar tipo `ConfigTRT` se necessário (adicionar `customTimeouts?: CustomTimeouts`)
- [x] 5.4 Garantir que `GrauTRT` aceita 'primeiro_grau' e 'segundo_grau' (já aceita)

## 6. Testing

- [x] 6.1 Adicionar testes unitários para `tribunal-config-persistence.service.ts`:
  - Mock do Supabase client
  - Testar `getConfigByTribunalAndGrau()` com sucesso
  - Testar erro quando config não encontrada
  - Testar validação de `custom_timeouts`
- [x] 6.2 Adicionar testes para cache em `config.ts`:
  - Testar cache hit (não faz query ao banco)
  - Testar cache miss (busca do banco)
  - Testar expiração de cache após TTL
  - Testar `clearConfigCache()`
- [x] 6.3 Testes de integração:
  - Rodar captura de acervo geral para TRT1 primeiro grau
  - Rodar captura de audiências para TRT2 segundo grau
  - Validar que configurações vieram do banco (verificar logs)
- [x] 6.4 Testar com tribunal que não existe (deve retornar erro claro)
- [x] 6.5 Testar com `custom_timeouts` inválido (deve usar defaults)

## 7. Documentation

- [x] 7.1 Atualizar comentários em `config.ts` explicando que configs vêm do banco
- [x] 7.2 Adicionar JSDoc em `getTribunalConfig()` documentando que é assíncrona
- [x] 7.3 Atualizar `CLAUDE.md` (se mencionar configurações hardcoded) para referenciar banco
- [x] 7.4 Adicionar comentários no SQL da migration explicando mudanças

## 8. Deployment & Validation

- [x] 8.1 Rodar migration em banco de desenvolvimento e validar
- [x] 8.2 Rodar aplicação localmente e testar capturas
- [x] 8.3 Verificar logs: nenhum erro de config, cache funcionando
- [x] 8.4 Fazer smoke test: capturar de 3-4 TRTs diferentes
- [x] 8.5 Validar que todos os tipos de captura funcionam (acervo, audiências, pendentes, arquivados)
