# Testes de Funcionalidades de IA no Document Editor

## Objetivo
Validar o comportamento do Document Editor ao usar recursos de IA em cenários com e sem a variável `AI_GATEWAY_API_KEY` configurada.

## Pré-requisitos
- Aplicação em execução localmente
- Acesso ao arquivo `.env.local`
- Usuário autenticado no sistema
- Documento criado no módulo de documentos

---

## Cenário 1: IA Configurada Corretamente

### Setup
```bash
# Certifique-se de que AI_GATEWAY_API_KEY está configurada no .env.local
AI_GATEWAY_API_KEY=your_gateway_api_key_here
```

### Testes

#### 1.1 - Comando Generate
**Passos:**
1. Abrir um documento existente
2. Posicionar o cursor em uma linha vazia
3. Pressionar `Cmd+J` (Mac) ou `Ctrl+J` (Windows/Linux)
4. Digitar: "Redija uma cláusula de confidencialidade"
5. Pressionar Enter

**Resultado Esperado:**
- ✅ Menu AI deve abrir
- ✅ Comando deve ser enviado
- ✅ Loading indicator deve aparecer ("Thinking..." → "Writing...")
- ✅ Texto deve ser gerado e inserido no documento
- ✅ Auto-save deve funcionar normalmente após inserção

#### 1.2 - Comando Edit
**Passos:**
1. Selecionar um parágrafo de texto existente
2. Pressionar `Cmd+J` (Mac) ou `Ctrl+J` (Windows/Linux)
3. Selecionar opção "Improve writing"

**Resultado Esperado:**
- ✅ Menu AI deve abrir
- ✅ Comando deve ser enviado
- ✅ Texto selecionado deve ser editado
- ✅ Opções "Accept", "Discard", "Try again" devem aparecer
- ✅ Auto-save deve funcionar após aceitar alterações

#### 1.3 - Comando Comment
**Passos:**
1. Selecionar um trecho de texto
2. Pressionar `Cmd+J` (Mac) ou `Ctrl+J` (Windows/Linux)
3. Selecionar opção "Comment"

**Resultado Esperado:**
- ✅ Menu AI deve abrir
- ✅ Comando deve ser enviado
- ✅ Comentários devem ser gerados e marcados no texto
- ✅ Opções "Accept", "Reject" devem aparecer
- ✅ Documento não deve sofrer alterações até aceitar/rejeitar

---

## Cenário 2: IA Não Configurada (Sem API Key)

### Setup
```bash
# Remover ou comentar AI_GATEWAY_API_KEY no .env.local
# AI_GATEWAY_API_KEY=
```

**IMPORTANTE:** Reiniciar o servidor após modificar `.env.local`

### Testes

#### 2.1 - Comando Generate sem API Key
**Passos:**
1. Abrir um documento existente
2. Posicionar o cursor em uma linha vazia
3. Pressionar `Cmd+J` (Mac) ou `Ctrl+J` (Windows/Linux)
4. Digitar: "Redija uma cláusula de confidencialidade"
5. Pressionar Enter

**Resultado Esperado:**
- ✅ Menu AI deve abrir normalmente
- ✅ Toast de erro deve aparecer: "IA indisponível"
- ✅ Mensagem deve indicar: "O recurso de IA não está configurado no servidor. A edição de documentos continua funcionando normalmente."
- ✅ Menu AI deve mostrar mensagem de erro visual
- ✅ **CRÍTICO:** Editor de documentos deve permanecer funcional
- ✅ **CRÍTICO:** Auto-save deve continuar funcionando
- ✅ **CRÍTICO:** Colaboração em tempo real deve continuar funcionando
- ✅ **CRÍTICO:** Exportação (PDF/DOCX) deve continuar funcionando

#### 2.2 - Comando Edit sem API Key
**Passos:**
1. Selecionar um parágrafo de texto existente
2. Pressionar `Cmd+J` (Mac) ou `Ctrl+J` (Windows/Linux)
3. Selecionar opção "Improve writing"

**Resultado Esperado:**
- ✅ Menu AI deve abrir normalmente
- ✅ Toast de erro deve aparecer: "IA indisponível"
- ✅ Mensagem clara sobre indisponibilidade
- ✅ **CRÍTICO:** Texto original não deve ser alterado
- ✅ **CRÍTICO:** Editor deve permanecer funcional

#### 2.3 - Comando Comment sem API Key
**Passos:**
1. Selecionar um trecho de texto
2. Pressionar `Cmd+J` (Mac) ou `Ctrl+J` (Windows/Linux)
3. Selecionar opção "Comment"

**Resultado Esperado:**
- ✅ Menu AI deve abrir normalmente
- ✅ Toast de erro deve aparecer: "IA indisponível"
- ✅ **CRÍTICO:** Nenhum comentário deve ser adicionado
- ✅ **CRÍTICO:** Documento deve permanecer inalterado

---

## Cenário 3: Erro Temporário do Servidor (500)

### Setup
Para simular este cenário, você pode temporariamente modificar a rota API para retornar erro 500.

### Testes

#### 3.1 - Comando com Erro 500
**Passos:**
1. Simular erro 500 na API
2. Tentar usar qualquer comando de IA

**Resultado Esperado:**
- ✅ Toast de erro deve aparecer: "Erro temporário na IA"
- ✅ Mensagem deve indicar: "Não foi possível processar sua solicitação. Tente novamente em alguns instantes."
- ✅ **CRÍTICO:** Editor deve permanecer funcional
- ✅ **CRÍTICO:** Auto-save não deve ser afetado

---

## Cenário 4: Funcionalidades Básicas sem IA

### Testes a realizar com API Key desabilitada

#### 4.1 - Edição de Texto
**Passos:**
1. Digitar texto normalmente
2. Formatar com negrito, itálico, etc.
3. Criar listas, tabelas, headings

**Resultado Esperado:**
- ✅ Todas funcionalidades de edição devem funcionar normalmente

#### 4.2 - Auto-save
**Passos:**
1. Fazer alterações no documento
2. Aguardar 2 segundos
3. Verificar badge "Salvando..."

**Resultado Esperado:**
- ✅ Auto-save deve funcionar normalmente
- ✅ Alterações devem ser persistidas

#### 4.3 - Salvar Manualmente
**Passos:**
1. Fazer alterações no documento
2. Clicar no botão "Salvar"

**Resultado Esperado:**
- ✅ Salvamento manual deve funcionar
- ✅ Toast de sucesso deve aparecer

#### 4.4 - Colaboração em Tempo Real
**Passos:**
1. Abrir mesmo documento em duas abas/navegadores
2. Editar em uma aba
3. Verificar atualização na outra aba

**Resultado Esperado:**
- ✅ Colaboração deve funcionar normalmente
- ✅ Avatares de colaboradores devem aparecer

#### 4.5 - Exportação
**Passos:**
1. Criar documento com conteúdo formatado
2. Exportar como PDF
3. Exportar como DOCX

**Resultado Esperado:**
- ✅ Ambas exportações devem funcionar
- ✅ Formatação deve ser preservada

---

## Checklist de Validação

### Sem API Key Configurada
- [ ] Editor de documentos permanece totalmente funcional
- [ ] Auto-save continua funcionando
- [ ] Salvamento manual continua funcionando
- [ ] Colaboração em tempo real não é afetada
- [ ] Exportação PDF funciona
- [ ] Exportação DOCX funciona
- [ ] Toast de erro aparece ao tentar usar IA
- [ ] Mensagem de erro é clara e informativa
- [ ] Menu AI mostra indicador visual de erro
- [ ] Nenhuma funcionalidade crítica é quebrada

### Com API Key Configurada
- [ ] Comando Generate funciona
- [ ] Comando Edit funciona
- [ ] Comando Comment funciona
- [ ] Loading indicators aparecem corretamente
- [ ] Conteúdo é gerado corretamente
- [ ] Auto-save funciona após uso da IA

---

## Notas de Implementação

### Tratamento de Erros Implementado

1. **No frontend (`use-chat.ts`):**
   - Detecta erro 401 (API key não configurada)
   - Detecta erro 500 (erro do servidor)
   - Exibe toasts informativos
   - Não quebra o fluxo do editor

2. **No menu AI (`ai-menu.tsx`):**
   - Mostra indicador visual quando há erro
   - Mantém funcionalidade do editor

3. **No backend (`route.ts`):**
   - Retorna 401 com código `MISSING_API_KEY`
   - Retorna mensagem clara de erro
   - Não expõe detalhes técnicos sensíveis

### Comportamento Esperado em Produção

- Se `AI_GATEWAY_API_KEY` não estiver configurada, os recursos de IA ficam desabilitados
- Todas as outras funcionalidades do editor continuam operacionais
- Usuários recebem feedback claro sobre a indisponibilidade
- Nenhum erro é registrado no console do navegador (apenas warnings informativos)
- Sistema permanece estável e utilizável

---

## Execução dos Testes

### Manual
Execute os cenários acima manualmente seguindo os passos descritos.

### Automatizado (Futuro)
Estes testes podem ser automatizados usando Playwright/Cypress:
- Mock da API para simular cenários de erro
- Verificação de toasts e mensagens
- Validação de funcionalidades críticas
