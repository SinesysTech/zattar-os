# Tasks: Mover Configurações de Tema para Tab Aparência

## 1. Preparação dos Componentes Seletores

### 1.1 Modificar PresetSelector para aceitar props customizados
- [ ] Adicionar interface `PresetSelectorProps` com `label` e `placeholder` opcionais
- [ ] Atualizar componente para usar props com valores padrão em inglês
- [ ] Testar que não quebra uso existente

**Arquivo**: `src/components/layout/header/theme-customizer/preset-selector.tsx`

**Critérios de Aceitação**:
- Props opcionais funcionam corretamente
- Valores padrão em inglês mantidos
- Funcionalidade existente não afetada

### 1.2 Modificar ColorModeSelector para aceitar props customizados
- [ ] Adicionar interface `ColorModeSelectorProps` com `label`, `lightLabel`, `darkLabel` opcionais
- [ ] Atualizar componente para usar props com valores padrão em inglês
- [ ] Testar que não quebra uso existente

**Arquivo**: `src/components/layout/header/theme-customizer/color-mode-selector.tsx`

**Critérios de Aceitação**:
- Props opcionais funcionam corretamente
- Valores padrão em inglês mantidos
- Funcionalidade existente não afetada

### 1.3 Modificar ThemeScaleSelector para aceitar props customizados
- [ ] Adicionar interface `ThemeScaleSelectorProps` com `label` opcional
- [ ] Atualizar componente para usar prop com valor padrão em inglês
- [ ] Testar que não quebra uso existente

**Arquivo**: `src/components/layout/header/theme-customizer/scale-selector.tsx`

**Critérios de Aceitação**:
- Prop opcional funciona corretamente
- Valor padrão em inglês mantido
- Funcionalidade existente não afetada

### 1.4 Modificar ThemeRadiusSelector para aceitar props customizados
- [ ] Adicionar interface `ThemeRadiusSelectorProps` com `label` opcional
- [ ] Atualizar componente para usar prop com valor padrão em inglês
- [ ] Testar que não quebra uso existente

**Arquivo**: `src/components/layout/header/theme-customizer/radius-selector.tsx`

**Critérios de Aceitação**:
- Prop opcional funciona corretamente
- Valor padrão em inglês mantido
- Funcionalidade existente não afetada

### 1.5 Modificar ContentLayoutSelector para aceitar props customizados
- [ ] Adicionar interface `ContentLayoutSelectorProps` com `label`, `fullLabel`, `centeredLabel` opcionais
- [ ] Atualizar componente para usar props com valores padrão em inglês
- [ ] Testar que não quebra uso existente

**Arquivo**: `src/components/layout/header/theme-customizer/content-layout-selector.tsx`

**Critérios de Aceitação**:
- Props opcionais funcionam corretamente
- Valores padrão em inglês mantidos
- Funcionalidade existente não afetada
- Classe `hidden lg:flex` mantida

### 1.6 Modificar SidebarModeSelector para aceitar props customizados
- [ ] Adicionar interface `SidebarModeSelectorProps` com `label`, `defaultLabel`, `iconLabel` opcionais
- [ ] Atualizar componente para usar props com valores padrão em inglês
- [ ] Testar que não quebra uso existente

**Arquivo**: `src/components/layout/header/theme-customizer/sidebar-mode-selector.tsx`

**Critérios de Aceitação**:
- Props opcionais funcionam corretamente
- Valores padrão em inglês mantidos
- Funcionalidade existente não afetada
- Classe `hidden lg:flex` mantida

### 1.7 Modificar ResetThemeButton para aceitar props customizados
- [ ] Adicionar interface `ResetThemeButtonProps` com `label` opcional
- [ ] Atualizar componente para usar prop com valor padrão em inglês
- [ ] Remover classe `mt-4` (será controlado pelo componente pai)
- [ ] Testar que não quebra uso existente

**Arquivo**: `src/components/layout/header/theme-customizer/reset-theme.tsx`

**Critérios de Aceitação**:
- Prop opcional funciona corretamente
- Valor padrão em inglês mantido
- Funcionalidade existente não afetada

## 2. Criação do Componente AparenciaContent

### 2.1 Criar estrutura base do componente
- [ ] Criar arquivo `aparencia-content.tsx`
- [ ] Adicionar imports necessários (Card, seletores, ícones)
- [ ] Criar estrutura de grid responsivo
- [ ] Adicionar comentários JSDoc

**Arquivo**: `src/app/app/configuracoes/components/aparencia-content.tsx`

**Critérios de Aceitação**:
- Arquivo criado com estrutura correta
- Imports organizados
- Grid responsivo (1 coluna mobile, 2 colunas desktop)

### 2.2 Adicionar Card de Tema (Preset)
- [ ] Criar Card com título "Tema" e descrição
- [ ] Adicionar PresetSelector com label "Tema" e placeholder "Selecione um tema"
- [ ] Testar funcionamento

**Critérios de Aceitação**:
- Card renderiza corretamente
- PresetSelector funciona com labels em português
- Preview de cores visível

### 2.3 Adicionar Card de Modo de Cor
- [ ] Criar Card com título "Modo de Cor" e descrição
- [ ] Adicionar ColorModeSelector com labels "Modo de cor", "Claro", "Escuro"
- [ ] Testar funcionamento

**Critérios de Aceitação**:
- Card renderiza corretamente
- ColorModeSelector funciona com labels em português
- Alternância entre claro/escuro funciona

### 2.4 Adicionar Card de Escala
- [ ] Criar Card com título "Escala" e descrição
- [ ] Adicionar ThemeScaleSelector com label "Escala"
- [ ] Testar funcionamento

**Critérios de Aceitação**:
- Card renderiza corretamente
- ThemeScaleSelector funciona com label em português
- Opções None, XS, LG funcionam

### 2.5 Adicionar Card de Arredondamento
- [ ] Criar Card com título "Arredondamento" e descrição
- [ ] Adicionar ThemeRadiusSelector com label "Arredondamento"
- [ ] Testar funcionamento

**Critérios de Aceitação**:
- Card renderiza corretamente
- ThemeRadiusSelector funciona com label em português
- Opções None, SM, MD, LG, XL funcionam

### 2.6 Adicionar Card de Layout do Conteúdo
- [ ] Criar Card com título "Layout do Conteúdo" e descrição
- [ ] Adicionar ContentLayoutSelector com labels "Layout do conteúdo", "Completo", "Centralizado"
- [ ] Testar funcionamento

**Critérios de Aceitação**:
- Card renderiza corretamente
- ContentLayoutSelector funciona com labels em português
- Opções Completo/Centralizado funcionam
- Visível apenas em desktop (lg:)

### 2.7 Adicionar Card de Modo da Barra Lateral
- [ ] Criar Card com título "Modo da Barra Lateral" e descrição
- [ ] Adicionar SidebarModeSelector com labels "Modo da barra lateral", "Padrão", "Ícone"
- [ ] Testar funcionamento

**Critérios de Aceitação**:
- Card renderiza corretamente
- SidebarModeSelector funciona com labels em português
- Alternância entre Padrão/Ícone funciona
- Visível apenas em desktop (lg:)

### 2.8 Adicionar Card de Reset
- [ ] Criar Card separado para o botão de reset
- [ ] Adicionar ResetThemeButton com label "Restaurar Padrão"
- [ ] Testar funcionamento

**Critérios de Aceitação**:
- Card renderiza corretamente
- ResetThemeButton funciona com label em português
- Reset restaura todas as configurações para padrão

### 2.9 Adicionar estilos e responsividade
- [ ] Verificar espaçamento entre cards (`gap-6`)
- [ ] Verificar grid responsivo (`md:grid-cols-2`)
- [ ] Testar em mobile (375px)
- [ ] Testar em tablet (768px)
- [ ] Testar em desktop (1440px)

**Critérios de Aceitação**:
- Layout responsivo funciona corretamente
- Espaçamento consistente
- Sem overflow horizontal

## 3. Integração na Página de Configurações

### 3.1 Atualizar tipo ConfiguracoesTab
- [ ] Adicionar 'aparencia' ao tipo `ConfiguracoesTab`
- [ ] Atualizar `VALID_TABS` para incluir 'aparencia'

**Arquivo**: `src/app/app/configuracoes/components/configuracoes-tabs-content.tsx`

**Critérios de Aceitação**:
- Tipo atualizado corretamente
- TypeScript não apresenta erros

### 3.2 Adicionar imports necessários
- [ ] Importar ícone `Palette` do lucide-react
- [ ] Importar componente `AparenciaContent`

**Arquivo**: `src/app/app/configuracoes/components/configuracoes-tabs-content.tsx`

**Critérios de Aceitação**:
- Imports adicionados corretamente
- Sem erros de importação

### 3.3 Adicionar TabTrigger para Aparência
- [ ] Atualizar `grid-cols-4` na TabsList
- [ ] Atualizar largura da TabsList para `lg:w-[800px]`
- [ ] Adicionar TabTrigger com ícone Palette e texto "Aparência"

**Arquivo**: `src/app/app/configuracoes/components/configuracoes-tabs-content.tsx`

**Critérios de Aceitação**:
- Tab "Aparência" visível na lista
- Ícone Palette renderizado
- Layout das tabs não quebrado

### 3.4 Adicionar TabsContent para Aparência
- [ ] Adicionar TabsContent com value="aparencia"
- [ ] Renderizar componente AparenciaContent
- [ ] Adicionar classe `space-y-4`

**Arquivo**: `src/app/app/configuracoes/components/configuracoes-tabs-content.tsx`

**Critérios de Aceitação**:
- TabsContent renderiza quando tab ativa
- AparenciaContent exibido corretamente
- Espaçamento consistente com outras tabs

### 3.5 Testar navegação entre tabs
- [ ] Testar clique em cada tab
- [ ] Verificar que URL atualiza corretamente
- [ ] Verificar que conteúdo muda sem reload
- [ ] Testar navegação direta via URL (`?tab=aparencia`)

**Critérios de Aceitação**:
- Navegação fluida entre todas as tabs
- URL reflete tab ativa
- Sem recarregamento de página
- Deep linking funciona

## 4. Remoção do Botão Settings da Header

### 4.1 Remover import do ThemeCustomizerPanel
- [ ] Remover linha de import do ThemeCustomizerPanel

**Arquivo**: `src/app/app/layout.tsx`

**Critérios de Aceitação**:
- Import removido
- Sem erros de compilação

### 4.2 Remover componente do JSX
- [ ] Remover `<ThemeCustomizerPanel />` do DashboardHeader
- [ ] Verificar que outros elementos da header não foram afetados

**Arquivo**: `src/app/app/layout.tsx`

**Critérios de Aceitação**:
- ThemeCustomizerPanel não renderizado
- AuthenticatorPopover, Notifications, AiSphere, HeaderUserMenu funcionando
- Layout da header mantido

### 4.3 Testar header em diferentes resoluções
- [ ] Testar em mobile (375px)
- [ ] Testar em tablet (768px)
- [ ] Testar em desktop (1440px)
- [ ] Verificar espaçamento entre elementos

**Critérios de Aceitação**:
- Header responsiva
- Todos os elementos visíveis e funcionais
- Espaçamento adequado

## 5. Testes

### 5.1 Testes Unitários - Seletores
- [ ] Testar PresetSelector com e sem props
- [ ] Testar ColorModeSelector com e sem props
- [ ] Testar ThemeScaleSelector com e sem props
- [ ] Testar ThemeRadiusSelector com e sem props
- [ ] Testar ContentLayoutSelector com e sem props
- [ ] Testar SidebarModeSelector com e sem props
- [ ] Testar ResetThemeButton com e sem props

**Critérios de Aceitação**:
- Todos os testes passando
- Cobertura de código adequada
- Props opcionais testados

### 5.2 Testes Unitários - AparenciaContent
- [ ] Testar renderização de todos os cards
- [ ] Testar que props corretos são passados aos seletores
- [ ] Testar layout responsivo

**Critérios de Aceitação**:
- Componente renderiza corretamente
- Todos os seletores presentes
- Props em português aplicados

### 5.3 Testes de Integração - Navegação
- [ ] Testar mudança de tab via clique
- [ ] Testar mudança de tab via URL
- [ ] Testar que URL atualiza ao clicar
- [ ] Testar que conteúdo correto é exibido

**Critérios de Aceitação**:
- Navegação funciona corretamente
- URL sincronizada com tab ativa
- Sem recarregamento de página

### 5.4 Testes de Integração - Persistência
- [ ] Testar que mudanças são salvas em cookies
- [ ] Testar que configurações são carregadas ao reabrir
- [ ] Testar que reset restaura valores padrão
- [ ] Testar persistência entre sessões

**Critérios de Aceitação**:
- Configurações persistem corretamente
- Cookies salvos e lidos
- Reset funciona

### 5.5 Testes E2E - Fluxo Completo
- [ ] Acessar /app/configuracoes
- [ ] Clicar na tab "Aparência"
- [ ] Mudar preset de tema
- [ ] Mudar modo de cor
- [ ] Mudar escala
- [ ] Mudar arredondamento
- [ ] Mudar layout do conteúdo
- [ ] Mudar modo da barra lateral
- [ ] Clicar em "Restaurar Padrão"
- [ ] Verificar que todas as mudanças foram aplicadas

**Critérios de Aceitação**:
- Fluxo completo funciona sem erros
- Todas as mudanças aplicadas imediatamente
- Reset restaura tudo

### 5.6 Testes de Responsividade
- [ ] Testar em mobile (375px)
- [ ] Testar em tablet (768px)
- [ ] Testar em desktop (1024px)
- [ ] Testar em desktop large (1440px)
- [ ] Verificar que ContentLayoutSelector e SidebarModeSelector ocultos em mobile

**Critérios de Aceitação**:
- Layout responsivo em todas as resoluções
- Sem overflow horizontal
- Elementos ocultos corretamente em mobile

### 5.7 Testes de Acessibilidade
- [ ] Testar navegação por teclado (Tab, Enter, Setas)
- [ ] Testar com leitor de tela
- [ ] Verificar que labels estão associados aos inputs
- [ ] Verificar contraste de cores
- [ ] Verificar foco visível

**Critérios de Aceitação**:
- Navegação por teclado funciona
- Leitor de tela anuncia corretamente
- Labels associados
- Contraste adequado (WCAG AA)
- Foco visível

## 6. Validação e Documentação

### 6.1 Validar traduções
- [ ] Revisar todas as traduções para português
- [ ] Verificar consistência de termos
- [ ] Verificar que não há typos
- [ ] Validar com usuários nativos se possível

**Critérios de Aceitação**:
- Traduções corretas e naturais
- Termos consistentes
- Sem erros ortográficos

### 6.2 Executar type-check
- [ ] Executar `npm run type-check`
- [ ] Corrigir erros de TypeScript se houver

**Critérios de Aceitação**:
- Sem erros de TypeScript
- Tipos corretos em todos os componentes

### 6.3 Executar linter
- [ ] Executar `npm run lint`
- [ ] Corrigir warnings e erros

**Critérios de Aceitação**:
- Sem erros de lint
- Código segue padrões do projeto

### 6.4 Executar todos os testes
- [ ] Executar `npm test`
- [ ] Verificar que todos os testes passam
- [ ] Verificar cobertura de código

**Critérios de Aceitação**:
- Todos os testes passando
- Cobertura adequada (≥80%)

### 6.5 Testar build de produção
- [ ] Executar `npm run build`
- [ ] Verificar que build completa sem erros
- [ ] Testar aplicação buildada

**Critérios de Aceitação**:
- Build completa com sucesso
- Aplicação funciona em produção

### 6.6 Atualizar documentação
- [ ] Adicionar comentários JSDoc aos novos componentes
- [ ] Atualizar README se necessário
- [ ] Documentar mudanças no CHANGELOG

**Critérios de Aceitação**:
- Código bem documentado
- Documentação atualizada

## 7. Code Review e Deploy

### 7.1 Preparar Pull Request
- [ ] Criar branch feature/mover-configuracoes-tema
- [ ] Commit com mensagens descritivas
- [ ] Push para repositório
- [ ] Criar Pull Request com descrição detalhada

**Critérios de Aceitação**:
- Branch criado
- Commits organizados
- PR criado com descrição

### 7.2 Code Review
- [ ] Solicitar review de pelo menos 2 desenvolvedores
- [ ] Endereçar comentários e sugestões
- [ ] Fazer ajustes necessários

**Critérios de Aceitação**:
- Review aprovado
- Comentários endereçados
- Código aprovado para merge

### 7.3 Deploy em Staging
- [ ] Fazer merge para branch de staging
- [ ] Deploy em ambiente de staging
- [ ] Executar testes de aceitação
- [ ] Validar com stakeholders

**Critérios de Aceitação**:
- Deploy em staging bem-sucedido
- Testes de aceitação passando
- Aprovação dos stakeholders

### 7.4 Deploy em Produção
- [ ] Fazer merge para branch main
- [ ] Deploy em produção
- [ ] Monitorar logs e métricas
- [ ] Verificar que não há erros

**Critérios de Aceitação**:
- Deploy em produção bem-sucedido
- Sem erros em produção
- Funcionalidade disponível para usuários

### 7.5 Monitoramento Pós-Deploy
- [ ] Monitorar uso da nova tab
- [ ] Verificar feedback de usuários
- [ ] Monitorar erros no Sentry/similar
- [ ] Coletar métricas de uso

**Critérios de Aceitação**:
- Sem erros críticos
- Feedback positivo de usuários
- Métricas de uso coletadas

## Resumo de Arquivos Afetados

### Arquivos a Modificar (7)
1. `src/components/layout/header/theme-customizer/preset-selector.tsx`
2. `src/components/layout/header/theme-customizer/color-mode-selector.tsx`
3. `src/components/layout/header/theme-customizer/scale-selector.tsx`
4. `src/components/layout/header/theme-customizer/radius-selector.tsx`
5. `src/components/layout/header/theme-customizer/content-layout-selector.tsx`
6. `src/components/layout/header/theme-customizer/sidebar-mode-selector.tsx`
7. `src/components/layout/header/theme-customizer/reset-theme.tsx`
8. `src/app/app/configuracoes/components/configuracoes-tabs-content.tsx`
9. `src/app/app/layout.tsx`

### Arquivos a Criar (1)
1. `src/app/app/configuracoes/components/aparencia-content.tsx`

### Arquivos a Manter (1)
1. `src/components/layout/header/theme-customizer/panel.tsx` (não usado, mas mantido)

## Estimativa de Tempo

- **Fase 1 - Preparação dos Seletores**: 2-3 horas
- **Fase 2 - Criação do AparenciaContent**: 2-3 horas
- **Fase 3 - Integração na Página**: 1-2 horas
- **Fase 4 - Remoção da Header**: 30 minutos
- **Fase 5 - Testes**: 3-4 horas
- **Fase 6 - Validação e Documentação**: 1-2 horas
- **Fase 7 - Code Review e Deploy**: 2-3 horas

**Total Estimado**: 12-18 horas de desenvolvimento

## Dependências

- Nenhuma dependência externa nova
- Usa componentes e hooks existentes
- Compatível com versão atual do Next.js e React

## Notas Importantes

1. **Manter compatibilidade**: Todos os seletores devem continuar funcionando com valores padrão em inglês
2. **Não quebrar header**: Remover ThemeCustomizerPanel sem afetar outros elementos
3. **Responsividade**: Testar extensivamente em diferentes resoluções
4. **Acessibilidade**: Manter suporte a teclado e leitores de tela
5. **Persistência**: Garantir que configurações continuam sendo salvas em cookies
6. **Performance**: Mudanças devem ser aplicadas instantaneamente
7. **Traduções**: Revisar com cuidado para garantir naturalidade
8. **Testes**: Cobertura adequada para evitar regressões
