# Proposta: Refatoração do Schema de Audiências

## Why

A tabela `audiencias` possui inconsistências de modelagem identificadas durante análise:
- Colunas redundantes (`url` vs `url_audiencia_virtual`, `pauta_audiencia_horario_id`)
- Colunas inexistentes sendo referenciadas no código (`polo_ativo_cpf`, `polo_passivo_cnpj`)
- Falta de colunas importantes (`hora_inicio`, `hora_fim`, `modalidade`)
- Ausência de categorização automática de modalidade (virtual/presencial/híbrida)

## What Changes

### 1. **REMOVER** - Colunas redundantes/desnecessárias

| Coluna | Motivo |
|--------|--------|
| `url` | Não está sendo usada (0 registros). Coluna `url_audiencia_virtual` já existe e tem 43 registros. |
| `pauta_audiencia_horario_id` | Redundante - o ID é sempre igual ao ID da audiência. Os horários serão salvos diretamente. |

### 2. **ADICIONAR** - Novas colunas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `hora_inicio` | `time` | Hora de início da audiência (extraída de `pautaAudienciaHorario.horaInicial`) |
| `hora_fim` | `time` | Hora de fim da audiência (extraída de `pautaAudienciaHorario.horaFinal`) |
| `modalidade` | `enum('virtual', 'presencial', 'hibrida')` | Categorização da audiência |

### 3. **CRIAR** - Enum e Trigger

- **Enum `modalidade_audiencia`**: `virtual`, `presencial`, `hibrida`
- **Trigger `set_modalidade_audiencia`**: Define automaticamente a modalidade baseado em:
  - `virtual`: Se `url_audiencia_virtual` estiver preenchida OU se `tipo_audiencia.descricao` contém "videoconfer"
  - `presencial`: Se `endereco_presencial` estiver preenchido
  - `hibrida`: Definido manualmente pelo usuário (não automático)

### 4. **ATUALIZAR** - Serviço de Persistência

- Remover referências a `polo_ativo_cpf` e `polo_passivo_cnpj` (colunas não existem)
- Remover referência a `pauta_audiencia_horario_id`
- Adicionar mapeamento de `hora_inicio` e `hora_fim`

### 5. **ATUALIZAR** - Tipos TypeScript

- Remover campos inexistentes das interfaces
- Adicionar `hora_inicio`, `hora_fim`, `modalidade`

## Impact

### Specs Afetadas
- `openspec/specs/audiencias/spec.md` (se existir)

### Código Afetado
- `backend/captura/services/persistence/audiencias-persistence.service.ts`
- `backend/types/pje-trt/types.ts`
- `app/api/audiencias/[id]/endereco/route.ts`
- Componentes de frontend que listam/filtram audiências

### Dados Existentes
- 135 audiências existentes
- 43 com `url_audiencia_virtual` preenchida
- 0 com `url` preenchida (seguro remover)
- Migração irá popular `modalidade` automaticamente via trigger
