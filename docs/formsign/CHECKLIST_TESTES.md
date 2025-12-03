# Checklist de Testes - Assinatura Digital

## Índice
1. Testes End-to-End (E2E)
2. Testes de Responsividade Mobile
3. Testes de Acessibilidade (a11y)
4. Testes de Compatibilidade de Navegadores
5. Testes de Performance
6. Testes de Segurança

---

## 1. Testes End-to-End (E2E)

### Fluxo Admin: Criação de Template

- [ ] **Criar novo template**
  - [ ] Acessar `/assinatura-digital/admin/templates`
  - [ ] Clicar em "Novo Template"
  - [ ] Upload de PDF (drag-and-drop)
  - [ ] Upload de PDF (clique)
  - [ ] Validação: PDF inválido (não PDF)
  - [ ] Validação: PDF muito grande (> 10MB)
  - [ ] Validação: PDF muito pequeno (< 10KB)
  - [ ] Preencher nome (obrigatório)
  - [ ] Preencher descrição (opcional)
  - [ ] Salvar e abrir editor

- [ ] **Editor visual de templates**
  - [ ] PDF renderiza corretamente
  - [ ] Adicionar campo de texto
  - [ ] Adicionar campo de imagem
  - [ ] Adicionar campo de texto composto
  - [ ] Mover campo (drag)
  - [ ] Redimensionar campo (8 handles)
  - [ ] Selecionar campo (clique)
  - [ ] Desselecionar campo (Escape)
  - [ ] Deletar campo (Delete)
  - [ ] Deletar campo (context menu)
  - [ ] Duplicar campo (context menu)
  - [ ] Editar propriedades (popover)
  - [ ] Selecionar variável (autocomplete)
  - [ ] Alterar fonte e tamanho
  - [ ] Zoom in/out
  - [ ] Navegar entre páginas (multi-page PDF)
  - [ ] Autosave (aguardar 5s)
  - [ ] Indicador "Salvando..." / "Salvo"
  - [ ] Gerar preview de teste
  - [ ] Alternar entre original e preenchido
  - [ ] Editar metadados do template
  - [ ] Alterar status (rascunho → ativo)
  - [ ] Substituir PDF
  - [ ] Salvar manualmente
  - [ ] Cancelar (com alerta de mudanças não salvas)

- [ ] **Editar template existente**
  - [ ] Clicar em template na lista
  - [ ] Editor abre com campos existentes
  - [ ] Modificar campos
  - [ ] Salvar mudanças

- [ ] **Duplicar template**
  - [ ] Clicar em "Duplicar" no dropdown
  - [ ] Dialog abre com dados copiados
  - [ ] Alterar nome
  - [ ] Salvar
  - [ ] Verificar que campos foram copiados

- [ ] **Deletar template**
  - [ ] Clicar em "Deletar" no dropdown
  - [ ] Confirmação obrigatória
  - [ ] Template deletado
  - [ ] Lista atualizada

- [ ] **Busca e filtros**
  - [ ] Buscar por nome
  - [ ] Buscar por UUID
  - [ ] Buscar por descrição
  - [ ] Filtrar por status (ativo, inativo, rascunho)
  - [ ] Filtrar por ativo (sim/não)
  - [ ] Combinar busca + filtros
  - [ ] Paginação funciona
  - [ ] Exportar CSV (todos)
  - [ ] Exportar CSV (selecionados)
  - [ ] Deletar em lote

---

### Fluxo Admin: Criação de Formulário

- [ ] **Criar novo formulário**
  - [ ] Acessar `/assinatura-digital/admin/formularios`
  - [ ] Clicar em "Novo Formulário"
  - [ ] Preencher nome (obrigatório)
  - [ ] Slug gerado automaticamente
  - [ ] Selecionar segmento (obrigatório)
  - [ ] Multi-select de templates (opcional)
  - [ ] Preencher descrição (opcional)
  - [ ] Toggle foto necessária
  - [ ] Toggle geolocalização necessária
  - [ ] Toggle ativo
  - [ ] Salvar

- [ ] **Editar schema de formulário**
  - [ ] Clicar em "Editar Schema" no dropdown
  - [ ] FormSchemaBuilder abre
  - [ ] Adicionar seção
  - [ ] Editar seção (nome, descrição)
  - [ ] Deletar seção
  - [ ] Arrastar campo da paleta para canvas
  - [ ] Reordenar campos (drag-and-drop)
  - [ ] Selecionar campo
  - [ ] Editar propriedades no painel:
    - [ ] ID, label, placeholder, descrição
    - [ ] Obrigatório
    - [ ] Largura (33%, 50%, 100%)
    - [ ] Validação (min, max, pattern)
    - [ ] Opções (select, radio, checkbox)
    - [ ] Condicional (mostrar se)
  - [ ] Duplicar campo
  - [ ] Deletar campo
  - [ ] Modo preview
  - [ ] Testar formulário no preview
  - [ ] Validações funcionam no preview
  - [ ] Campos condicionais aparecem/desaparecem
  - [ ] Voltar para modo edição
  - [ ] Salvar schema
  - [ ] Versão incrementada (1.0.0 → 1.1.0)
  - [ ] Importar JSON
  - [ ] Exportar JSON

- [ ] **Editar formulário existente**
  - [ ] Clicar em formulário na lista
  - [ ] Editar metadados
  - [ ] Alterar templates
  - [ ] Salvar mudanças

- [ ] **Duplicar formulário**
  - [ ] Clicar em "Duplicar" no dropdown
  - [ ] Dialog abre com dados copiados
  - [ ] Alterar nome e slug
  - [ ] Salvar
  - [ ] Verificar que schema foi copiado

- [ ] **Deletar formulário**
  - [ ] Clicar em "Deletar" no dropdown
  - [ ] Confirmação obrigatória
  - [ ] Formulário deletado
  - [ ] Lista atualizada

- [ ] **Busca e filtros**
  - [ ] Buscar por nome
  - [ ] Buscar por slug
  - [ ] Buscar por descrição
  - [ ] Filtrar por segmento (multi-select)
  - [ ] Filtrar por ativo
  - [ ] Filtrar por foto necessária
  - [ ] Filtrar por geolocalização necessária
  - [ ] Combinar busca + filtros
  - [ ] Paginação funciona
  - [ ] Exportar CSV
  - [ ] Deletar em lote

---

### Fluxo Admin: Gerenciamento de Segmentos

- [ ] **Criar novo segmento**
  - [ ] Acessar `/assinatura-digital/admin/segmentos`
  - [ ] Clicar em "Novo Segmento"
  - [ ] Preencher nome (obrigatório)
  - [ ] Slug gerado automaticamente
  - [ ] Preencher descrição (opcional)
  - [ ] Toggle ativo
  - [ ] Salvar

- [ ] **Editar segmento**
  - [ ] Clicar em segmento na lista
  - [ ] Editar nome, descrição, ativo
  - [ ] Slug não pode ser alterado
  - [ ] Salvar mudanças

- [ ] **Duplicar segmento**
  - [ ] Clicar em "Duplicar" no dropdown
  - [ ] Dialog abre com dados copiados
  - [ ] Alterar nome e slug
  - [ ] Salvar

- [ ] **Deletar segmento**
  - [ ] Clicar em "Deletar" no dropdown
  - [ ] Confirmação obrigatória
  - [ ] Se houver formulários vinculados: erro 409
  - [ ] Se não houver: segmento deletado
  - [ ] Lista atualizada

- [ ] **Busca e filtros**
  - [ ] Buscar por nome
  - [ ] Buscar por slug
  - [ ] Buscar por descrição
  - [ ] Filtrar por ativo
  - [ ] Paginação funciona
  - [ ] Exportar CSV
  - [ ] Deletar em lote

- [ ] **Contagem de formulários**
  - [ ] Badge mostra quantidade correta
  - [ ] Atualiza ao criar/deletar formulário

---

### Fluxo Público: Preenchimento de Formulário

- [ ] **Acessar formulário**
  - [ ] URL: `/formulario/[segmento]/[formulario]`
  - [ ] Página carrega
  - [ ] Metadata correto (title, description)
  - [ ] Slugs inválidos: 404
  - [ ] Formulário desativado: 404
  - [ ] Segmento desativado: 404

- [ ] **Step 1: Verificar CPF**
  - [ ] Digitar CPF (apenas números)
  - [ ] Digitar CPF (formatado)
  - [ ] Validação: CPF inválido
  - [ ] CPF válido: prossegue
  - [ ] Cliente existe: dados carregados
  - [ ] Cliente não existe: prossegue para cadastro

- [ ] **Step 2: Dados Pessoais**
  - [ ] Campos preenchidos (se cliente existe)
  - [ ] Preencher todos os campos obrigatórios
  - [ ] CEP: auto-preenche endereço
  - [ ] CEP inválido: erro
  - [ ] Telefone: máscara aplicada
  - [ ] E-mail: validação
  - [ ] Data de nascimento: validação
  - [ ] Salvar cliente (novo ou atualização)
  - [ ] Prosseguir

- [ ] **Step 3: Formulário Dinâmico**
  - [ ] Campos renderizados conforme schema
  - [ ] Campos obrigatórios validados
  - [ ] Campos condicionais aparecem/desaparecem
  - [ ] Validações customizadas funcionam
  - [ ] CEP: auto-preenche endereço
  - [ ] Selects, radios, checkboxes funcionam
  - [ ] Prosseguir

- [ ] **Step 4: Captura de Foto (se necessário)**
  - [ ] Solicita permissão de câmera
  - [ ] Webcam renderiza
  - [ ] Capturar foto
  - [ ] Preview da foto
  - [ ] Tirar novamente
  - [ ] Validação: foto não vazia
  - [ ] Validação: tamanho < 5MB
  - [ ] Prosseguir

- [ ] **Step 5: Geolocalização (se necessário)**
  - [ ] Solicita permissão de localização
  - [ ] Captura coordenadas automaticamente
  - [ ] Exibe precisão
  - [ ] Tentar novamente (se precisão ruim)
  - [ ] Validação: precisão < 100m
  - [ ] Prosseguir

- [ ] **Step 6: Visualização de PDF**
  - [ ] PDFs gerados (um por template)
  - [ ] PDFs renderizados corretamente
  - [ ] Todos os campos preenchidos
  - [ ] Imagens (assinatura, foto) renderizadas
  - [ ] Múltiplas páginas (se aplicável)
  - [ ] Voltar para editar
  - [ ] Prosseguir

- [ ] **Step 7: Assinatura Manuscrita**
  - [ ] Canvas de assinatura renderiza
  - [ ] Assinar com mouse (desktop)
  - [ ] Assinar com dedo (mobile)
  - [ ] Limpar assinatura
  - [ ] Validação: assinatura não vazia
  - [ ] Métricas capturadas (pontos, traços, tempo)
  - [ ] Finalizar
  - [ ] Loading durante geração

- [ ] **Step 8: Sucesso**
  - [ ] Mensagem de sucesso
  - [ ] Lista de PDFs gerados
  - [ ] Baixar PDF individual
  - [ ] Baixar todos (ZIP)
  - [ ] ZIP contém todos os PDFs
  - [ ] Nomes de arquivo corretos
  - [ ] Preencher novo formulário

- [ ] **Navegação entre steps**
  - [ ] Botão "Voltar" funciona
  - [ ] Botão "Continuar" funciona
  - [ ] Progress bar atualiza
  - [ ] Dados persistem ao voltar
  - [ ] Não pode pular steps

---

## 2. Testes de Responsividade Mobile

### Breakpoints a testar:
- [ ] **Mobile Small (320px)**
- [ ] **Mobile Medium (375px)**
- [ ] **Mobile Large (425px)**
- [ ] **Tablet (768px)**
- [ ] **Desktop (1024px+)**

### Páginas Admin

- [ ] **Lista de Templates**
  - [ ] Tabela responsiva (scroll horizontal ou cards)
  - [ ] Toolbar compacto
  - [ ] Filtros em dialog/drawer
  - [ ] Botões acessíveis
  - [ ] Paginação funciona

- [ ] **Editor de Templates**
  - [ ] Toolbar horizontal (mobile)
  - [ ] Toolbar vertical (desktop)
  - [ ] Canvas responsivo
  - [ ] Zoom funciona
  - [ ] Campos arrastáveis (touch)
  - [ ] Propriedades em drawer
  - [ ] Teclado virtual não sobrepõe campos

- [ ] **Lista de Formulários**
  - [ ] Tabela responsiva
  - [ ] Toolbar compacto
  - [ ] Filtros acessíveis

- [ ] **Schema Builder**
  - [ ] Paleta em drawer (mobile)
  - [ ] Canvas responsivo
  - [ ] Propriedades em drawer
  - [ ] Drag-and-drop funciona (touch)

- [ ] **Lista de Segmentos**
  - [ ] Tabela responsiva
  - [ ] Toolbar compacto

### Fluxo Público

- [ ] **Todas as etapas**
  - [ ] Layout responsivo
  - [ ] Campos de input acessíveis
  - [ ] Botões grandes o suficiente (min 44x44px)
  - [ ] Teclado virtual não sobrepõe campos
  - [ ] Progress bar visível

- [ ] **Captura de Foto**
  - [ ] Webcam responsiva
  - [ ] Botões acessíveis
  - [ ] Preview legível

- [ ] **Assinatura**
  - [ ] Canvas responsivo
  - [ ] Assinatura com dedo funciona
  - [ ] Botões acessíveis

- [ ] **Visualização de PDF**
  - [ ] PDF responsivo
  - [ ] Zoom funciona
  - [ ] Scroll funciona

---

## 3. Testes de Acessibilidade (a11y)

### Ferramentas:
- [ ] **Lighthouse** (Chrome DevTools)
- [ ] **axe DevTools** (extensão)
- [ ] **WAVE** (extensão)
- [ ] **Screen reader** (NVDA, JAWS, VoiceOver)

### Critérios WCAG 2.1 Nível AA

#### Perceptível

- [ ] **Alternativas de texto**
  - [ ] Imagens têm `alt` descritivo
  - [ ] Ícones têm `aria-label` ou `sr-only`
  - [ ] Botões sem texto têm `aria-label`

- [ ] **Conteúdo adaptável**
  - [ ] Estrutura semântica (headings, landmarks)
  - [ ] Ordem de leitura lógica
  - [ ] Informação não depende apenas de cor

- [ ] **Distinguível**
  - [ ] Contraste de cores ≥ 4.5:1 (texto normal)
  - [ ] Contraste de cores ≥ 3:1 (texto grande)
  - [ ] Foco visível em todos os elementos interativos
  - [ ] Texto redimensionável até 200%

#### Operável

- [ ] **Acessível por teclado**
  - [ ] Todos os elementos interativos acessíveis via Tab
  - [ ] Ordem de foco lógica
  - [ ] Atalhos de teclado funcionam (Delete, Escape, Arrows)
  - [ ] Sem armadilhas de teclado

- [ ] **Tempo suficiente**
  - [ ] Sem limites de tempo (ou ajustáveis)
  - [ ] Autosave não interrompe usuário

- [ ] **Convulsões**
  - [ ] Sem flashes (< 3 por segundo)

- [ ] **Navegável**
  - [ ] Títulos de página descritivos
  - [ ] Ordem de foco lógica
  - [ ] Propósito do link claro
  - [ ] Múltiplas formas de navegação
  - [ ] Breadcrumbs (se aplicável)

#### Compreensível

- [ ] **Legível**
  - [ ] Idioma da página definido (`lang="pt-BR"`)
  - [ ] Termos técnicos explicados

- [ ] **Previsível**
  - [ ] Navegação consistente
  - [ ] Identificação consistente
  - [ ] Mudanças de contexto apenas com ação do usuário

- [ ] **Assistência de entrada**
  - [ ] Erros identificados claramente
  - [ ] Labels e instruções fornecidas
  - [ ] Sugestões de correção de erros
  - [ ] Prevenção de erros (confirmações)

#### Robusto

- [ ] **Compatível**
  - [ ] HTML válido
  - [ ] ARIA usado corretamente
  - [ ] Status messages com `role="status"`
  - [ ] Dialogs com `role="dialog"` e `aria-labelledby`

### Testes com Screen Reader

- [ ] **Navegação**
  - [ ] Headings anunciados corretamente
  - [ ] Landmarks identificados
  - [ ] Links descritivos

- [ ] **Formulários**
  - [ ] Labels associados a inputs
  - [ ] Erros anunciados
  - [ ] Campos obrigatórios indicados
  - [ ] Instruções lidas

- [ ] **Interações**
  - [ ] Botões anunciados com propósito
  - [ ] Dialogs anunciados
  - [ ] Mudanças de estado anunciadas
  - [ ] Loading states anunciados

---

## 4. Testes de Compatibilidade de Navegadores

### Navegadores Desktop

- [ ] **Chrome (últimas 2 versões)**
  - [ ] Todas as funcionalidades
  - [ ] Câmera funciona
  - [ ] Geolocalização funciona
  - [ ] PDFs renderizam
  - [ ] Drag-and-drop funciona

- [ ] **Firefox (últimas 2 versões)**
  - [ ] Todas as funcionalidades
  - [ ] Câmera funciona
  - [ ] Geolocalização funciona
  - [ ] PDFs renderizam
  - [ ] Drag-and-drop funciona

- [ ] **Safari (últimas 2 versões)**
  - [ ] Todas as funcionalidades
  - [ ] Câmera funciona
  - [ ] Geolocalização funciona
  - [ ] PDFs renderizam
  - [ ] Drag-and-drop funciona

- [ ] **Edge (últimas 2 versões)**
  - [ ] Todas as funcionalidades
  - [ ] Câmera funciona
  - [ ] Geolocalização funciona
  - [ ] PDFs renderizam
  - [ ] Drag-and-drop funciona

### Navegadores Mobile

- [ ] **Chrome Mobile (Android)**
  - [ ] Todas as funcionalidades
  - [ ] Câmera funciona
  - [ ] Geolocalização funciona
  - [ ] PDFs renderizam
  - [ ] Touch funciona

- [ ] **Safari Mobile (iOS)**
  - [ ] Todas as funcionalidades
  - [ ] Câmera funciona
  - [ ] Geolocalização funciona
  - [ ] PDFs renderizam
  - [ ] Touch funciona

- [ ] **Firefox Mobile**
  - [ ] Todas as funcionalidades
  - [ ] Câmera funciona
  - [ ] Geolocalização funciona
  - [ ] PDFs renderizam
  - [ ] Touch funciona

### Funcionalidades Específicas

- [ ] **Câmera**
  - [ ] Permissão solicitada corretamente
  - [ ] Webcam renderiza
  - [ ] Captura funciona
  - [ ] Preview funciona

- [ ] **Geolocalização**
  - [ ] Permissão solicitada corretamente
  - [ ] Coordenadas capturadas
  - [ ] Precisão exibida

- [ ] **PDF Rendering**
  - [ ] PDFs carregam
  - [ ] Múltiplas páginas funcionam
  - [ ] Zoom funciona
  - [ ] Scroll funciona

- [ ] **Drag-and-Drop**
  - [ ] Mouse drag funciona
  - [ ] Touch drag funciona
  - [ ] Drop zones funcionam
  - [ ] Feedback visual funciona

---

## 5. Testes de Performance

### Métricas (Lighthouse)

- [ ] **Performance Score ≥ 90**
- [ ] **First Contentful Paint (FCP) < 1.8s**
- [ ] **Largest Contentful Paint (LCP) < 2.5s**
- [ ] **Time to Interactive (TTI) < 3.8s**
- [ ] **Total Blocking Time (TBT) < 200ms**
- [ ] **Cumulative Layout Shift (CLS) < 0.1**

### Páginas a testar:

- [ ] **Lista de Templates**
  - [ ] Carrega em < 2s
  - [ ] Paginação rápida
  - [ ] Busca responsiva (< 500ms)

- [ ] **Editor de Templates**
  - [ ] Carrega em < 3s
  - [ ] Drag-and-drop fluido (60fps)
  - [ ] Autosave não trava UI
  - [ ] Preview gera em < 5s

- [ ] **Schema Builder**
  - [ ] Carrega em < 2s
  - [ ] Drag-and-drop fluido
  - [ ] Preview renderiza em < 1s

- [ ] **Fluxo Público**
  - [ ] Cada step carrega em < 1s
  - [ ] Transições suaves
  - [ ] PDF gera em < 10s
  - [ ] Finalização em < 15s

### Otimizações

- [ ] **Code Splitting**
  - [ ] Componentes pesados carregados dinamicamente
  - [ ] Rotas code-splitted

- [ ] **Lazy Loading**
  - [ ] Imagens lazy-loaded
  - [ ] PDFs lazy-loaded

- [ ] **Caching**
  - [ ] Templates cacheados
  - [ ] Schemas cacheados
  - [ ] Permissões cacheadas

- [ ] **Minificação**
  - [ ] JS minificado
  - [ ] CSS minificado
  - [ ] HTML minificado

---

## 6. Testes de Segurança

### Autenticação e Autorização

- [ ] **Rotas Admin**
  - [ ] Requerem autenticação
  - [ ] Requerem permissões corretas
  - [ ] Token JWT validado
  - [ ] Sessão expira após inatividade

- [ ] **Rotas Públicas**
  - [ ] Sem autenticação necessária
  - [ ] Validação de dados
  - [ ] Rate limiting (TODO)

### Validação de Dados

- [ ] **Backend**
  - [ ] Todos os inputs validados com Zod
  - [ ] Strings sanitizadas
  - [ ] Tipos validados (CPF, e-mail, etc.)
  - [ ] Tamanhos validados (arquivos, strings)

- [ ] **Frontend**
  - [ ] Validação em tempo real
  - [ ] Máscaras aplicadas
  - [ ] Erros exibidos claramente

### XSS e Injection

- [ ] **Markdown**
  - [ ] Sanitizado com rehype-sanitize
  - [ ] Tags perigosas removidas
  - [ ] Scripts bloqueados

- [ ] **SQL**
  - [ ] Prepared statements usados
  - [ ] Sem concatenação de strings

- [ ] **PDF**
  - [ ] Campos escapados
  - [ ] Caracteres especiais tratados

### CSRF

- [ ] **Formulários**
  - [ ] Tokens CSRF presentes
  - [ ] Validados no backend

### Permissões

- [ ] **Frontend**
  - [ ] Botões ocultos sem permissão
  - [ ] Rotas protegidas

- [ ] **Backend**
  - [ ] Todas as rotas validam permissões
  - [ ] Erros 403 retornados corretamente

### Uploads

- [ ] **PDFs**
  - [ ] Tipo validado (application/pdf)
  - [ ] Tamanho validado (10KB - 10MB)
  - [ ] Conteúdo validado (é PDF válido)
  - [ ] Armazenado com nome seguro (UUID)

- [ ] **Fotos**
  - [ ] Tamanho validado (< 5MB)
  - [ ] Formato validado (JPEG)
  - [ ] Redimensionado (500x500px)

### Logs e Auditoria

- [ ] **Sessões**
  - [ ] IP registrado
  - [ ] User-agent registrado
  - [ ] Timestamp registrado
  - [ ] Geolocalização registrada
  - [ ] Métricas de assinatura registradas

- [ ] **Ações Admin**
  - [ ] Criações logadas
  - [ ] Edições logadas
  - [ ] Deleções logadas

---

## Como Usar Este Checklist

1. **Antes de cada release:**
   - Execute todos os testes marcados como críticos
   - Execute testes de regressão em áreas modificadas

2. **Testes automatizados:**
   - Configure Playwright/Cypress para E2E
   - Configure Jest para testes unitários
   - Configure Lighthouse CI para performance

3. **Testes manuais:**
   - Execute checklist completo antes de releases maiores
   - Execute checklist parcial para releases menores

4. **Documentação:**
   - Anote bugs encontrados
   - Crie issues no GitHub
   - Atualize este checklist conforme necessário

---

**Última atualização:** 2024-01-15