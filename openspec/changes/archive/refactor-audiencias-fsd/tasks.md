# Tasks: Refatorar Módulo Audiências para FSD

## Preparação

- [x] Explorar estrutura atual do módulo audiências
- [x] Mapear todos os arquivos a serem migrados
- [x] Criar proposta OpenSpec

## Migração

- [ ] Criar estrutura de diretórios `src/features/audiencias/`
- [ ] Migrar types e interfaces para `features/audiencias/types/`
- [ ] Migrar hooks para `features/audiencias/hooks/`
- [ ] Migrar server actions para `features/audiencias/actions/`
- [ ] Migrar componentes de `src/components/modules/audiencias/` para `features/audiencias/components/`
- [ ] Migrar componentes de `src/app/(dashboard)/audiencias/components/` para `features/audiencias/components/`
- [ ] Criar arquivo `index.ts` com exports públicos

## Atualização de Páginas

- [ ] Atualizar `src/app/(dashboard)/audiencias/page.tsx`
- [ ] Atualizar `src/app/(dashboard)/audiencias/semana/page.tsx`
- [ ] Atualizar `src/app/(dashboard)/audiencias/mes/page.tsx`
- [ ] Atualizar `src/app/(dashboard)/audiencias/ano/page.tsx`
- [ ] Atualizar `src/app/(dashboard)/audiencias/lista/page.tsx`

## Validação

- [ ] Executar type-check para garantir que não há erros de tipo
- [ ] Testar navegação entre as visualizações (semana, mês, ano, lista)
- [ ] Testar criação de nova audiência
- [ ] Testar filtros de audiências
- [ ] Testar detalhes de audiência

## Limpeza

- [ ] Remover `src/components/modules/audiencias/`
- [ ] Remover `src/app/_lib/hooks/use-audiencias.ts`
- [ ] Remover `src/app/_lib/hooks/use-tipos-audiencias.ts`
- [ ] Remover `src/app/_lib/types/audiencias.ts`
- [ ] Remover `src/app/actions/audiencias.ts`
- [ ] Remover `src/app/(dashboard)/audiencias/components/`

## Documentação

- [ ] Atualizar CLAUDE.md se necessário
- [ ] Arquivar proposta OpenSpec após conclusão
