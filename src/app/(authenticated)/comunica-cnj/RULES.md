# Regras de Negocio - Comunica CNJ

## Contexto
Modulo proxy que fornece a rota `/comunica-cnj` para consulta de comunicacoes processuais do Diario Oficial via API do CNJ. Toda a logica de negocio vive no modulo `captura`.

## Estrutura
- `page.tsx` — Pagina client que renderiza `ComunicaCNJTabsContent` do modulo captura
- `layout.tsx` — Layout com PageShell
- `index.ts` — Barrel export com re-export de conveniencia

## Entidades Principais
Nenhuma propria. Utiliza entidades do modulo `captura`:
- **ComunicacaoCNJ**: Comunicacao processual capturada da API do CNJ
- **ConsultaCNJ**: Consulta realizada na API do CNJ

## Regras Principais
- **Modulo proxy**: Toda a logica (dominio, servico, repositorio, actions) vive em `captura`
- **Sem duplicacao**: Nao criar domain.ts/service.ts/repository.ts aqui — usar imports de `captura`
- **PageShell via layout**: Layout centralizado com PageShell

## Por que nao tem domain.ts/service.ts/repository.ts?
E apenas uma rota alternativa para uma feature de `captura`. Toda a logica e regras ja estao documentadas em `captura/RULES.md`. Duplicar codigo ou criar wrappers seria DRY-violation.

## Onde esta a logica real
- **Dominio + Service + Repository**: `src/app/(authenticated)/captura/`
- **Regras de negocio**: `captura/RULES.md` — secao "Comunica CNJ"
- **Componente exportado**: `ComunicaCNJTabsContent` em `captura/components/`

## Quando este modulo evoluiria
Se Comunica CNJ ganhar logica fundamentalmente diferente da captura PJE (ex: pipelines distintos, persistencia separada, regras proprias), faria sentido extrair para modulo proprio.
