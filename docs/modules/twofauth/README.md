# Módulo: TwoFAuth

**Status:** Initial

## Visão Geral

Módulo focado na integração com 2FAuth para consulta e gerenciamento de contas/grupos de autenticação de dois fatores no contexto administrativo do sistema.

## Arquitetura (Feature-Sliced Design)

- [ ] Domain (Entidades e Tipos)
- [ ] Service (Regras de Negócio)
- [ ] Repository (Acesso a Dados)
- [ ] Server Actions
- [x] UI Components
- [ ] Regras de Negócio (AI Context)

## Principais arquivos

- `src/features/twofauth/index.ts`
- `src/features/twofauth/components/twofauth-config-content.tsx`
- `src/features/twofauth/hooks/use-twofauth-accounts.ts`
- `src/features/twofauth/hooks/use-twofauth-groups.ts`

## Observações

- Estrutura atual é orientada a componentes e hooks.
- Próximo passo recomendado: formalizar camadas `domain/service/repository` e incluir `actions/` para consistência com FSD.
