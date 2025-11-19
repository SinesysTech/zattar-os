# Tarefas de Implementação

## 1. Fundação do Sistema de Tipografia
- [x] 1.1 Criar classes CSS tipográficas no `app/globals.css` seguindo especificação shadcn/ui
- [x] 1.2 Validar classes em diferentes temas (light/dark) e garantir contraste adequado
- [x] 1.3 Testar hierarquia visual das classes em contexto real

## 2. Componentes de Tipografia (Opcional)
- [x] 2.1 Criar componente `components/ui/typography.tsx` com subcomponentes (H1, H2, H3, H4, P, Lead, etc.)
- [x] 2.2 Adicionar tipos TypeScript para props dos componentes
- [x] 2.3 Implementar lógica de composição de classes (permitir className customizado)
- [x] 2.4 Adicionar suporte a variantes polimórficas (as="h1" | "h2" | etc.)

## 3. Documentação e Exemplos
- [x] 3.1 Criar página de exemplos em `app/docs/typography` ou similar
- [x] 3.2 Documentar todas as variantes tipográficas com código de exemplo
- [x] 3.3 Adicionar guidelines de quando usar cada variante
- [x] 3.4 Documentar padrões de hierarquia (h1 > h2 > h3, etc.)

## 4. Testes e Validação
- [x] 4.1 Validar legibilidade em diferentes tamanhos de tela (mobile, tablet, desktop)
- [x] 4.2 Testar acessibilidade (contraste de cores, tamanhos de fonte mínimos)
- [x] 4.3 Validar funcionamento em diferentes navegadores
- [x] 4.4 Verificar que classes não conflitam com Tailwind ou outras customizações

## 5. Migração Gradual (Opcional - Fase 2)
- [ ] 5.1 Identificar componentes prioritários para migração (headers, cards, dialogs)
- [ ] 5.2 Criar script de análise para encontrar uso inconsistente de tipografia
- [ ] 5.3 Migrar componentes de alta visibilidade primeiro
- [ ] 5.4 Atualizar guidelines para que novos componentes usem sistema tipográfico
