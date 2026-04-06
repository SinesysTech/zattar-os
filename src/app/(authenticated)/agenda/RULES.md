# Regras de Negocio - Agenda

## Contexto
Modulo de agenda/calendario para gerenciamento de eventos do escritorio. Permite criar, editar e excluir eventos com suporte a periodos, dia inteiro e responsaveis. Tambem alimenta o calendario unificado (`calendar`) como uma das fontes de dados.

## Entidades Principais
- **AgendaEvento**: Evento da agenda com `id`, `titulo`, `descricao`, `dataInicio`, `dataFim`, `diaInteiro`, `local`, `cor`, `responsavelId`, `criadoPor`, `createdAt`, `updatedAt`

## Regras de Validacao
- `titulo`: obrigatorio, 1-200 caracteres
- `descricao`: opcional, max 2000 caracteres
- `dataInicio` e `dataFim`: obrigatorios; `dataFim` nao pode ser anterior a `dataInicio`
- `diaInteiro`: booleano obrigatorio
- `local`: opcional, max 500 caracteres
- `cor`: obrigatoria (string livre)
- `responsavelId`: opcional, inteiro positivo
- Na atualizacao, todos os campos sao opcionais exceto `id`
- Na listagem, `startAt` e `endAt` sao obrigatorios e formam um intervalo valido

## Regras de Negocio
- Listagem por periodo: filtra eventos que se sobrepoem ao intervalo `[startAt, endAt]` (data_inicio <= endAt AND data_fim >= startAt)
- Exclusao logica (soft delete): campo `deletado_em` preenchido com timestamp
- Todas as queries filtram registros com `deletado_em IS NULL`
- `criadoPor` e preenchido automaticamente com o usuario autenticado
- Ordenacao por `data_inicio` ascendente na listagem

## Tabelas
- `agenda_eventos` (tabela principal, com soft delete via `deletado_em`)

## Restricoes de Acesso
- Todas as actions usam `authenticatedAction` (requer usuario autenticado)
- `criarEvento` injeta `user.id` como `criadoPor`

## Integracoes
- Exporta `AgendaEvento` para o modulo `calendar` (calendario unificado)
- Repository e importado diretamente por `calendar/repository.ts`

## Revalidacao de Cache
- Nenhuma revalidatePath configurada nas actions (modulo opera via client-side)
