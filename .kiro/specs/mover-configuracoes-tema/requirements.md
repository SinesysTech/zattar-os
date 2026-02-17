# Requisitos: Mover Configurações de Tema para Tab Aparência

## 1. Visão Geral

Atualmente, as configurações de tema (Theme preset, Scale, Radius, Color mode, Content layout, Sidebar mode) estão acessíveis através de um botão "Settings" (ícone de engrenagem) na header da aplicação. Este requisito visa mover essas configurações para uma nova tab "Aparência" dentro da página de Configurações (`/app/configuracoes`) e remover o botão da header.

## 2. Objetivos

- Centralizar todas as configurações da aplicação em um único local
- Melhorar a organização e descoberta das configurações de tema
- Traduzir todas as opções de tema para português
- Manter a funcionalidade existente de personalização de tema
- Seguir o padrão de tabs já estabelecido na página de Configurações

## 3. User Stories

### US-1: Como usuário, quero acessar as configurações de tema através da página de Configurações
**Critérios de Aceitação:**
- 3.1. Uma nova tab "Aparência" deve estar disponível na página `/app/configuracoes`
- 3.2. A tab deve aparecer junto com as tabs existentes (Métricas, Segurança, Autenticador, Integrações)
- 3.3. A URL deve refletir a tab ativa: `/app/configuracoes?tab=aparencia`
- 3.4. A navegação entre tabs deve ser fluida sem recarregar a página

### US-2: Como usuário, quero visualizar todas as opções de tema em português
**Critérios de Aceitação:**
- 3.5. Todos os labels e opções devem estar traduzidos para português
- 3.6. As traduções devem ser claras e consistentes com o resto da aplicação
- 3.7. Os seguintes termos devem ser traduzidos:
  - "Theme preset" → "Tema"
  - "Scale" → "Escala"
  - "Radius" → "Arredondamento"
  - "Color mode" → "Modo de cor"
  - "Content layout" → "Layout do conteúdo"
  - "Sidebar mode" → "Modo da barra lateral"
  - "Light" → "Claro"
  - "Dark" → "Escuro"
  - "Full" → "Completo"
  - "Centered" → "Centralizado"
  - "Default" → "Padrão"
  - "Icon" → "Ícone"
  - "Reset to Default" → "Restaurar Padrão"

### US-3: Como usuário, quero configurar o tema da aplicação
**Critérios de Aceitação:**
- 3.8. Todas as opções de personalização devem estar disponíveis:
  - Seleção de preset de tema (dropdown com preview de cores)
  - Seleção de escala (None, XS, LG)
  - Seleção de arredondamento (None, SM, MD, LG, XL)
  - Seleção de modo de cor (Claro/Escuro)
  - Seleção de layout do conteúdo (Completo/Centralizado)
  - Seleção de modo da barra lateral (Padrão/Ícone)
- 3.9. As mudanças devem ser aplicadas imediatamente ao selecionar uma opção
- 3.10. O botão "Restaurar Padrão" deve resetar todas as configurações para os valores padrão

### US-4: Como usuário, não quero mais ver o botão Settings na header
**Critérios de Aceitação:**
- 3.11. O botão Settings (ícone de engrenagem) deve ser removido da header
- 3.12. O componente `ThemeCustomizerPanel` não deve mais ser renderizado no layout
- 3.13. A remoção não deve afetar outros elementos da header (notificações, autenticador, menu do usuário)

## 4. Requisitos Funcionais

### RF-1: Nova Tab Aparência
- A tab "Aparência" deve ser adicionada ao componente `ConfiguracoesTabsContent`
- Deve seguir o mesmo padrão das tabs existentes (ícone + texto)
- Deve usar o ícone `Palette` do lucide-react
- Deve ser a quinta tab na ordem: Métricas | Segurança | Autenticador | Integrações | Aparência

### RF-2: Componente de Configurações de Aparência
- Criar um novo componente `AparenciaContent` que contenha todas as opções de tema
- O componente deve reutilizar os seletores existentes:
  - `PresetSelector`
  - `ThemeScaleSelector`
  - `ThemeRadiusSelector`
  - `ColorModeSelector`
  - `ContentLayoutSelector`
  - `SidebarModeSelector`
  - `ResetThemeButton`
- Todos os componentes devem ser traduzidos para português

### RF-3: Tradução dos Componentes
- Criar versões traduzidas dos seletores ou adicionar suporte a i18n
- Manter a mesma funcionalidade dos componentes originais
- Garantir que os valores internos (usados no código) permaneçam em inglês

### RF-4: Remoção do Botão Settings
- Remover a importação e uso de `ThemeCustomizerPanel` em `src/app/app/layout.tsx`
- Manter os arquivos dos componentes de seleção para reutilização na nova tab

## 5. Requisitos Não-Funcionais

### RNF-1: Performance
- As mudanças de tema devem ser aplicadas instantaneamente (< 100ms)
- A navegação entre tabs não deve causar lag perceptível

### RNF-2: Responsividade
- O layout das configurações de aparência deve ser responsivo
- Em mobile, as opções devem ser empilhadas verticalmente
- Em desktop, pode usar grid de 2 colunas quando apropriado

### RNF-3: Acessibilidade
- Todos os controles devem ser acessíveis via teclado
- Labels devem estar associados aos inputs correspondentes
- Deve manter o suporte a leitores de tela

### RNF-4: Compatibilidade
- Deve funcionar em todos os navegadores suportados pela aplicação
- As configurações devem persistir entre sessões (cookies)
- Não deve quebrar funcionalidades existentes

## 6. Restrições Técnicas

- Deve seguir o padrão Feature-Sliced Design (FSD) do projeto
- Deve usar os componentes do shadcn/ui
- Deve manter a compatibilidade com o sistema de temas existente
- Não deve modificar a lógica de aplicação de temas (apenas a UI)

## 7. Dependências

- Componentes existentes em `src/components/layout/header/theme-customizer/`
- Sistema de temas em `src/components/layout/theme/`
- Página de configurações em `src/app/app/configuracoes/`
- Componentes UI do shadcn/ui (Tabs, Card, Label, Select, ToggleGroup)

## 8. Critérios de Sucesso

- ✅ Nova tab "Aparência" visível e funcional em `/app/configuracoes?tab=aparencia`
- ✅ Todas as opções de tema disponíveis e funcionando
- ✅ Todas as labels e opções traduzidas para português
- ✅ Botão Settings removido da header
- ✅ Mudanças de tema aplicadas imediatamente
- ✅ Layout responsivo em mobile e desktop
- ✅ Testes passando sem erros
- ✅ Sem regressões em funcionalidades existentes

## 9. Fora do Escopo

- Adicionar novos temas ou presets
- Modificar a lógica de persistência de temas
- Adicionar animações complexas nas transições de tema
- Criar sistema de i18n completo para toda a aplicação
- Modificar outras partes da página de Configurações

## 10. Notas Técnicas

### Estrutura de Arquivos Afetados

**Arquivos a Modificar:**
- `src/app/app/layout.tsx` - Remover ThemeCustomizerPanel
- `src/app/app/configuracoes/components/configuracoes-tabs-content.tsx` - Adicionar tab Aparência

**Arquivos a Criar:**
- `src/app/app/configuracoes/components/aparencia-content.tsx` - Novo componente com configurações de tema
- Versões traduzidas dos seletores (ou modificar os existentes para aceitar labels customizados)

**Arquivos a Reutilizar:**
- Todos os componentes em `src/components/layout/header/theme-customizer/`

### Mapeamento de Traduções

```typescript
const translations = {
  // Labels principais
  "Theme preset": "Tema",
  "Scale": "Escala",
  "Radius": "Arredondamento",
  "Color mode": "Modo de cor",
  "Content layout": "Layout do conteúdo",
  "Sidebar mode": "Modo da barra lateral",
  
  // Opções
  "Light": "Claro",
  "Dark": "Escuro",
  "Full": "Completo",
  "Centered": "Centralizado",
  "Default": "Padrão",
  "Icon": "Ícone",
  
  // Ações
  "Reset to Default": "Restaurar Padrão",
  "Select a theme": "Selecione um tema"
};
```

## 11. Referências

- Página de Configurações atual: `src/app/app/configuracoes/`
- Sistema de temas: `src/components/layout/theme/`
- Componentes de tema: `src/components/layout/header/theme-customizer/`
- Padrão de tabs: Já implementado em `ConfiguracoesTabsContent`
