# Feature Template

Este diretório contém a estrutura padrão para novas features no Sinesys.

## Estrutura

- `api.ts`: Definições de API (Payloads, Responses)
- `domain.ts`: Regras de negócio, Zod Schemas e Tipos de Domínio
- `repository.ts`: Acesso a dados (Supabase, APIs externas)
- `service.ts`: Orquestração da lógica de negócio
- `actions/`: Server Actions do Next.js
- `components/`: Componentes React específicos da feature
- `hooks/`: Hooks específicos da feature
- `types.ts` ou `index.ts`: Barrel exports

## Como usar

1. Copie esta estrutura para `src/features/[nome-da-feature]`.
2. Renomeie os tipos e funções.
3. Implemente os testes em `__tests__/`.
