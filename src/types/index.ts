export * from './result';
// NOTA: Não re-exportar módulos de feature aqui. `@/types` deve conter apenas
// tipos globais (Result, PaginatedResponse, etc). Reexportar um barrel de feature
// via `export *` viola o encapsulamento de camadas e arrasta components/hooks
// runtime para o bundle cliente de qualquer arquivo que importe de `@/types`.
// Se precisar de tipos de contratos, importe direto de `@/app/(authenticated)/contratos`.
