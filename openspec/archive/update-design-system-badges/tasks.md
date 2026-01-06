## 1. Specification / Design
- [x] 1.1 Definir matriz de categorias -> (variante, intensidade)
- [x] 1.2 Definir regras de borda/contorno e contraste minimo

## 2. Implementation
- [x] 2.1 Atualizar `Badge` base com prop `tone` (solid/soft)
- [x] 2.2 Atualizar `SemanticBadge` com `toneOverride: 'soft' | 'solid'`
- [x] 2.3 Atualizar `getSemanticBadgeVariant` para retornar (variant + tone)
- [x] 2.4 Ajustar componentes para usar SemanticBadge (10+ arquivos migrados)

## 3. Enforcement
- [ ] 3.1 Adicionar regra ESLint (nice-to-have, nao bloqueante)
- [x] 3.2 Documentar padroes de uso

## 4. Documentation / Sandbox
- [x] 4.1 Atualizar design-system page com secao "Badge Styles" (soft vs solid)
- [x] 4.2 Adicionar exemplos por categoria
- [x] 4.3 Demonstrar variantes solid e soft

## 5. Validation
- [x] 5.1 Lint passa
- [x] 5.2 Build passa
- [x] 5.3 Visual validado em telas principais

> **STATUS FINAL**: 90% implementado. Core features completas.
> Pendente: regra ESLint (nice-to-have).
