# Regras de Negocio - Repasses

## Contexto
Modulo proxy/minimal que oferece a rota `/repasses` para visualizacao de repasses pendentes. Toda logica de negocio (dominio, servico, repositorio, actions) vive no modulo `obrigacoes`. Este modulo existe apenas como ponto de entrada de UI.

## Entidades Principais
- **RepassePendente**: Re-exportado de `obrigacoes` — parcela de obrigacao com repasse pendente
- **FiltrosRepasses**: Re-exportado de `obrigacoes` — filtros para listagem

## Regras de Negocio
Todas as regras de negocio de repasses estao documentadas em `obrigacoes/RULES.md`, secoes de parcelas e repasses.

## Componentes
- `RepassesPageContent`: Orquestra `RepassesPendentesList`, `UploadDeclaracaoDialog` e `UploadComprovanteDialog` (todos de `obrigacoes`)

## Restricoes de Acesso
- Herda restricoes do modulo `obrigacoes`
- Requer autenticacao

## Integracoes
- **obrigacoes**: Consome componentes, hooks e tipos via barrel export

## Revalidacao de Cache
- Delegada ao modulo `obrigacoes`
