/**
 * SINESYS CORE - Backend Desacoplado
 *
 * Este módulo contém toda a lógica de negócio do sistema, independente de framework.
 *
 * REGRAS FUNDAMENTAIS:
 * 1. PROIBIDO importar React, Next.js, ou qualquer código de UI
 * 2. Toda comunicação com banco passa pelo módulo common/db
 * 3. Serviços retornam Result<T> para tratamento de erros
 * 4. Validação de input feita com Zod nos services
 *
 * ESTRUTURA:
 * src/core/
 * ├── common/          # Tipos e utilitários compartilhados
 * │   ├── types.ts     # Result<T>, AppError, etc.
 * │   └── db.ts        # Cliente Supabase desacoplado
 * │
 * ├── _template/       # Módulo de referência (blueprint)
 * │   ├── domain.ts    # Entidades e Zod schemas
 * │   ├── repository.ts # Funções de banco
 * │   └── service.ts   # Regras de negócio
 * │
 * └── [modulo]/        # Módulos de domínio real
 *     ├── domain.ts
 *     ├── repository.ts
 *     └── service.ts
 */

// Re-export common utilities
export * from './common';

// Não exportar _template - é apenas referência para desenvolvedores
// Módulos reais serão adicionados aqui conforme migração:
// export * as processos from './processos';
// export * as audiencias from './audiencias';
// export * as acordos from './acordos';
