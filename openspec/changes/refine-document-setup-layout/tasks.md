# Tasks: Refinar Layout do Fluxo de Configuração de Documento

## 1. Análise e Preparação

- [x] 1.1 Mapear diferenças entre protótipo e implementação atual
- [x] 1.2 Identificar componentes reutilizáveis vs. específicos
- [x] 1.3 Definir tokens de design (cores, espaçamentos, tipografia)

## 2. Componentes Base

- [x] 2.1 Criar componente `ProTip` para dicas contextuais
- [x] 2.2 Refatorar `SignerCard` com novo layout (avatar colorido, indicador "You", actions on-hover)
- [x] 2.3 Refatorar `FieldPaletteCard` para suportar grid 2x2 com ícones e descrições
- [x] 2.4 Criar componente `SectionHeader` para labels uppercase com ações

## 3. Página de Edição

- [x] 3.1 Adicionar barra de contexto no header (nome do documento, timestamp relativo)
- [x] 3.2 Reestruturar `FloatingSidebar`:
  - [x] 3.2.1 Seção "QUEM VAI ASSINAR?" com SectionHeader e botão "+ Adicionar"
  - [x] 3.2.2 Lista de SignerCards refatorados
  - [x] 3.2.3 Separator visual
  - [x] 3.2.4 Seção "ARRASTE OS CAMPOS" com grid 2x2
  - [x] 3.2.5 Adicionar ProTip sobre Shift+Select
  - [x] 3.2.6 Footer fixo com botão "Revisar e Enviar"
- [x] 3.3 Ajustar layout para suportar novo header
- [x] 3.4 Garantir responsividade mobile (Sheet drawer)

## 4. Página de Revisão

- [x] 4.1 Layout em grid 2 colunas - mantido
- [x] 4.2 Card de informações do documento - mantido
- [x] 4.3 Atualizar cores para usar tokens do design system (chart-*)
- [x] 4.4 Preview do PDF - mantido
- [x] 4.5 CTAs - mantidos

## 5. Refinamentos Visuais

- [x] 5.1 Aplicar cores de signatário usando tokens chart-* do design system
- [x] 5.2 Ajustar tipografia (labels uppercase via SectionHeader)
- [x] 5.3 Padronizar espaçamentos (p-6 para containers, gap-3 para listas)
- [x] 5.4 Dark mode funcional via tokens semânticos

## 6. Testes e Validação

- [x] 6.1 TypeScript: sem erros
- [x] 6.2 ESLint: sem erros
- [ ] 6.3 Testar fluxo completo manualmente
- [ ] 6.4 Validar responsividade em diferentes viewports
