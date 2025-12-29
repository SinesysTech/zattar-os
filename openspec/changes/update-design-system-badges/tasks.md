## 1. Specification / Design
- [ ] 1.1 Definir matriz de categorias → (variante, intensidade)
- [ ] 1.2 Definir regras de borda/contorno e contraste mínimo

## 2. Implementation
- [ ] 2.1 Atualizar `Badge` base para reduzir contorno forte por default
- [ ] 2.2 Atualizar `SemanticBadge` para suportar intensidade (ex.: `solid` vs `soft`)
- [ ] 2.3 Atualizar `getSemanticBadgeVariant` (ou criar `getSemanticBadgeStyle`) para retornar (variant + intensity)
- [ ] 2.4 Ajustar componentes que usam badges fora do padrão (migrar para `SemanticBadge` quando aplicável)

## 3. Enforcement
- [ ] 3.1 Adicionar regra ESLint para restringir import direto de `Badge` fora de `src/components/ui/*` e páginas de sandbox
- [ ] 3.2 Documentar exceções (quando `Badge` direto é permitido)

## 4. Documentation / Sandbox
- [ ] 4.1 Atualizar `src/app/design-system/page.tsx` com seção "Badge Styles" (soft vs solid)
- [ ] 4.2 Adicionar exemplos por categoria (status/polo/tribunal/tipo_contrato/tipo_cobranca etc)
- [ ] 4.3 Adicionar DO/DON'T com snippets

## 5. Validation
- [ ] 5.1 Rodar `npm run lint`
- [ ] 5.2 Rodar `npm run build`
- [ ] 5.3 Smoke-check visual em telas-chave (Processos, Audiências, Expedientes, Contratos)
