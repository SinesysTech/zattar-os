# Regras de Negocio - Pangea (BNP)

## Contexto
Modulo de busca no Banco Nacional de Precedentes (BNP) do CNJ. Permite consultar sumulas, sumulas vinculantes, repercussao geral, IAC, IRDR e outros precedentes judiciais brasileiros atraves da API publica do CNJ.

> Estrutura FSD aninhada em `feature/`. Consultar `feature/RULES.md` para documentacao detalhada de entidades, validacoes, regras de negocio e integracoes.

## Estrutura
- `page.tsx` — Server Component que renderiza `PangeaPageContent`
- `layout.tsx` — PageShell wrapper
- `index.ts` — Barrel export (API publica)
- `feature/` — Camada FSD completa (domain, service, repository, actions, components)

## Restricoes de Acesso
- Requer autenticacao
- Sem permissoes granulares — qualquer usuario autenticado pode buscar

## Integracoes
- **API Pangea/BNP do CNJ**: `http://pangeabnp.pdpj.jus.br/`
- **Supabase**: Consultas auxiliares (lista de orgaos disponiveis)
