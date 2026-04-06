# Regras de Negocio - Perfil

## Contexto
Pagina de visualizacao e edicao do perfil do usuario autenticado. Reutiliza o tipo `Usuario` do modulo de usuarios.

## Estrutura
- `domain.ts` — Re-exporta `Usuario` de `@/app/(authenticated)/usuarios`
- `components/perfil-view.tsx` — Exibicao de dados pessoais, contato, endereco, OAB
- `components/perfil-edit-sheet.tsx` — Sheet lateral para edicao do perfil
- `components/alterar-senha-dialog.tsx` — Dialog para troca de senha
- `hooks/use-perfil.ts` — Hook client-side que chama `actionObterPerfil`
- `actions/` — Server Actions do perfil

## Regras Principais
- **Tipo compartilhado**: Usa `Usuario` do modulo `usuarios`, nao define tipo proprio
- **Formatadores reutilizados**: CPF, telefone, OAB, data, endereco e genero vem de `usuarios/utils`
- **Avatar**: Usa `AvatarEditDialog` importado de `@/app/(authenticated)/usuarios`
- **Alteracao de senha**: Nao dispara refetch apos sucesso (nao afeta dados exibidos)
- **PageShell**: Pagina usa `PageShell` como wrapper padrao
