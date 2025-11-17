# Serviços de Persistência - Sistema de Comparação e Auditoria

## Visão Geral

Os serviços de persistência foram refatorados para implementar comparação inteligente antes de atualizar registros, evitando atualizações desnecessárias e mantendo histórico completo de mudanças.

## Funcionalidades Implementadas

### 1. Comparação Antes de Atualizar
- Cada registro capturado é comparado com o registro existente no banco
- Se os dados forem idênticos, o registro não é atualizado
- Se houver diferenças, o registro é atualizado e o estado anterior é salvo

### 2. Auditoria Completa
- Campo `dados_anteriores` (JSONB) armazena o estado anterior antes da atualização
- Permite rastrear todas as mudanças feitas em cada registro
- Null quando o registro foi inserido ou quando não houve mudanças

### 3. Logs Estruturados
- Sistema de logs que registra:
  - Registros inseridos (novos)
  - Registros atualizados (com mudanças)
  - Registros não atualizados (sem mudanças)
  - Erros durante a persistência

## Arquivos Criados

### `comparison.util.ts`
Utilitários para comparação de objetos:
- `compararObjetos()`: Compara dois objetos e retorna campos alterados
- `removerCamposControle()`: Remove campos de controle para armazenar em auditoria

### `capture-log.service.ts`
Serviço de logs estruturado:
- `logInserido()`: Registra inserção de novo registro
- `logAtualizado()`: Registra atualização com campos alterados
- `logNaoAtualizado()`: Registra registro não atualizado (sem mudanças)
- `logErro()`: Registra erros durante persistência
- `imprimirResumo()`: Imprime estatísticas dos logs

## Serviços Refatorados

### `acervo-persistence.service.ts`
- Compara processos antes de atualizar
- Salva estado anterior em `dados_anteriores`
- Retorna contadores: `inseridos`, `atualizados`, `naoAtualizados`, `erros`

### `audiencias-persistence.service.ts`
- Compara audiências antes de atualizar
- Salva estado anterior em `dados_anteriores`
- Retorna contadores: `inseridos`, `atualizados`, `naoAtualizados`, `erros`

### `pendentes-persistence.service.ts`
- Compara processos pendentes antes de atualizar
- Salva estado anterior em `dados_anteriores`
- Retorna contadores: `inseridos`, `atualizados`, `naoAtualizados`, `erros`

## Migration SQL

Execute o arquivo `supabase/migrations/add_dados_anteriores_auditoria.sql` no dashboard do Supabase para adicionar a coluna `dados_anteriores` nas três tabelas.

## Uso

Os serviços de captura (`acervo-geral.service.ts`, `arquivados.service.ts`, `pendentes-manifestacao.service.ts`, `audiencias.service.ts`) foram atualizados para:
- Exibir estatísticas completas (inseridos, atualizados, não atualizados, erros)
- Imprimir resumo dos logs após cada captura

## Exemplo de Saída

```
✅ Processos salvos no banco: {
  total: 100,
  inseridos: 5,
  atualizados: 10,
  naoAtualizados: 85,
  erros: 0
}

📊 Resumo da persistência: {
  inseridos: 5,
  atualizados: 10,
  naoAtualizados: 85,
  erros: 0,
  total: 100
}
```

## Benefícios

1. **Performance**: Evita atualizações desnecessárias no banco
2. **Auditoria**: Histórico completo de mudanças em cada registro
3. **Rastreabilidade**: Logs estruturados para análise e debugging
4. **Eficiência**: `updated_at` só é atualizado quando há mudanças reais

