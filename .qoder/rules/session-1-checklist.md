# Checklist de Verificação - Sessão 1: Fundação do Design System

## Configuração Global
- [ ] `app/globals.css` contém comentários de orientação para agentes
- [ ] Variáveis OKLCH estão mapeadas corretamente (light + dark mode)
- [ ] Fontes (Inter, Montserrat, Geist_Mono) estão configuradas em `app/layout.tsx`
- [ ] ThemeProvider está ativo e troca temas sem "flashes"

## Documentação de Regras
- [ ] `.qoder/rules/design-system-foundation.md` existe e está completo
- [ ] `.qoder/rules/component-structure.md` documenta estrutura de pastas
- [ ] `components/shared/README.md` documenta padrões de componentes

## Utilitários
- [ ] `lib/formatters.ts` contém formatadores brasileiros (CPF, CNPJ, BRL)
- [ ] `lib/utils.ts` contém função `cn()` para merge de classes
- [ ] `components.json` tem aliases para `@/shared` e `@/formatters`

## Testes Visuais
- [ ] Sidebar aparece escura em light mode e dark mode
- [ ] Títulos usam fonte Montserrat (font-heading)
- [ ] Corpo de texto usa fonte Inter (font-sans)
- [ ] Números em tabelas usam `tabular-nums`
- [ ] Cards têm borda fina (`border border-border`) em vez de sombra pesada

## Validação de Tokens
- [ ] Botão primário usa `bg-primary text-primary-foreground`
- [ ] Labels usam `text-muted-foreground`
- [ ] Inputs têm `border-input` e `ring-ring` no foco
- [ ] Nenhum valor OKLCH direto no código (apenas variáveis CSS)
- [ ] Rodar `npm run validate:design-system` não retorna erros (verificar conformidade com regras críticas)
  - **Nota:** Considerar integrar `npm run validate:design-system` em pipelines de CI/CD para garantir validação contínua.
