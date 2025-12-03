# Troubleshooting - Assinatura Digital

## Índice
1. Problemas Comuns - Admin
2. Problemas Comuns - Usuário Final
3. Erros de API
4. Problemas de Performance
5. Problemas de Integração
6. Logs e Debugging

## 1. Problemas Comuns - Admin

### Não consigo ver o módulo de Assinatura Digital

**Sintomas:**
- Menu "Assinatura Digital" não aparece
- Erro 403 ao acessar `/assinatura-digital`

**Causas:**
- Falta de permissões
- Usuário desativado

**Soluções:**
1. Verifique se você tem permissão `assinatura_digital.listar`
2. Peça a um super admin para atribuir permissões
3. Verifique se sua conta está ativa
4. Faça logout/login para atualizar cache de permissões

**Como verificar permissões:**
```sql
-- No Supabase SQL Editor
SELECT * FROM permissoes_usuarios
WHERE usuario_id = [SEU_ID]
AND recurso = 'assinatura_digital';
```

---

### Botões de ação não aparecem

**Sintomas:**
- Não vejo botão "Novo Template"
- Não vejo botão "Editar" no dropdown
- Não vejo botão "Deletar"

**Causas:**
- Falta de permissões específicas
- Cache de permissões desatualizado

**Soluções:**
1. Verifique permissões:
   - "Novo": requer `criar`
   - "Editar": requer `editar`
   - "Deletar": requer `deletar`
2. Faça logout/login
3. Aguarde 5 minutos (TTL do cache)
4. Limpe cache do navegador

---

### Editor de templates não carrega

**Sintomas:**
- Tela branca ao abrir editor
- Loading infinito
- Erro no console

**Causas:**
- PDF muito grande (> 10MB)
- PDF corrompido
- Erro de rede
- Problema com pdfjs-dist

**Soluções:**
1. Verifique tamanho do PDF (máximo 10MB)
2. Tente outro PDF
3. Verifique console do navegador (F12)
4. Recarregue a página (Ctrl+R)
5. Limpe cache do navegador
6. Tente outro navegador

**Logs úteis:**
```javascript
// Console do navegador
Error loading PDF: ...
Failed to load PDF.js worker: ...
```

---

### Campos não aparecem no PDF

**Sintomas:**
- Adicionei campos mas não vejo no canvas
- Campos desaparecem ao mudar de página

**Causas:**
- Campos fora da área visível
- Campos em página diferente
- Zoom muito baixo

**Soluções:**
1. Verifique se está na página correta
2. Aumente o zoom (100% ou mais)
3. Verifique propriedades do campo (X, Y, página)
4. Use "Ajustar à tela" no zoom

---

### Autosave não funciona

**Sintomas:**
- Mudanças não são salvas
- Indicador "Salvando..." não aparece
- Perco mudanças ao recarregar

**Causas:**
- Erro de rede
- Erro de permissão
- Timeout

**Soluções:**
1. Verifique conexão com internet
2. Verifique se tem permissão `editar`
3. Salve manualmente (botão "Salvar")
4. Verifique console para erros
5. Recarregue e tente novamente

**Logs úteis:**
```javascript
// Console do navegador
Autosave error: ...
Failed to save template: ...
```

---

### Preview de teste não gera

**Sintomas:**
- Botão "Gerar Preview" não faz nada
- Loading infinito
- Erro ao gerar

**Causas:**
- Template sem campos
- Variáveis incorretas
- PDF original inacessível
- Erro no backend

**Soluções:**
1. Verifique se há campos adicionados
2. Verifique se variáveis estão corretas (ex: `{{cliente.nome}}`)
3. Verifique se PDF original está acessível
4. Verifique logs do backend
5. Tente novamente em alguns segundos

**Logs úteis:**
```javascript
// Console do navegador
Preview generation failed: ...

// Backend logs
Error generating PDF: ...
Template not found: ...
```

---

### Schema builder não salva

**Sintomas:**
- Botão "Salvar" não funciona
- Erro ao salvar schema
- Schema não persiste

**Causas:**
- Schema inválido
- Campos duplicados
- Erro de validação

**Soluções:**
1. Verifique se todos os campos têm IDs únicos
2. Verifique se campos obrigatórios estão preenchidos
3. Verifique console para erros de validação
4. Exporte JSON e verifique estrutura
5. Tente importar JSON válido

**Validações comuns:**
- IDs devem ser únicos
- Labels não podem estar vazios
- Opções de select/radio devem ter pelo menos 1 item
- Condicionais devem referenciar campos existentes

---

### Slug já existe

**Sintomas:**
- Erro ao criar segmento/formulário
- "Slug já existe"

**Causas:**
- Slug duplicado
- Slug reservado

**Soluções:**
1. Use outro nome (slug é gerado automaticamente)
2. Adicione sufixo (ex: "trabalhista-2")
3. Verifique se não há segmento/formulário com mesmo slug

**Como verificar:**
```sql
-- Segmentos
SELECT * FROM assinatura_digital_segmentos WHERE slug = 'seu-slug';

-- Formulários
SELECT * FROM assinatura_digital_formularios WHERE slug = 'seu-slug';
```

---

## 2. Problemas Comuns - Usuário Final

### Página não encontrada (404)

**Sintomas:**
- "Página não encontrada"
- URL não funciona

**Causas:**
- Link incorreto
- Formulário desativado
- Segmento desativado
- Slug alterado

**Soluções:**
1. Verifique se o link está correto
2. Confirme com quem te enviou o link
3. Verifique se formulário está ativo (admin)
4. Verifique se segmento está ativo (admin)

---

### CPF inválido

**Sintomas:**
- "CPF inválido" ao digitar
- Não consigo prosseguir

**Causas:**
- CPF digitado incorretamente
- CPF com dígitos verificadores errados

**Soluções:**
1. Verifique se digitou corretamente
2. Use apenas números (sem pontos ou traço)
3. Ou use formato completo (123.456.789-00)
4. Verifique se CPF é válido (calculadora online)

---

### CEP não preenche endereço

**Sintomas:**
- Digitei CEP mas endereço não preencheu
- "CEP não encontrado"

**Causas:**
- CEP incorreto
- CEP não existe
- Erro na API ViaCEP

**Soluções:**
1. Verifique se CEP está correto
2. Use formato com ou sem traço (ambos funcionam)
3. Aguarde 1-2 segundos após digitar
4. Se não funcionar, preencha manualmente
5. Tente novamente em alguns segundos

---

### Câmera não funciona

**Sintomas:**
- "Câmera não encontrada"
- "Permissão negada"
- Tela preta

**Causas:**
- Permissão negada
- Câmera em uso por outro app
- Navegador não suporta
- Dispositivo sem câmera

**Soluções:**
1. Clique em "Permitir" quando o navegador pedir
2. Feche outros apps que usam câmera (Zoom, Teams, etc.)
3. Recarregue a página
4. Tente outro navegador (Chrome recomendado)
5. Verifique se dispositivo tem câmera
6. Verifique configurações de privacidade do sistema

**Navegadores suportados:**
- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari (iOS 11+)
- ❌ Internet Explorer

---

### Geolocalização não funciona

**Sintomas:**
- "Localização não disponível"
- "Permissão negada"
- Timeout

**Causas:**
- Permissão negada
- GPS desativado
- Sinal fraco
- Navegador não suporta

**Soluções:**
1. Clique em "Permitir" quando o navegador pedir
2. Ative GPS/localização no dispositivo
3. Aguarde alguns segundos (pode demorar)
4. Tente em local aberto (melhor sinal)
5. Recarregue a página
6. Tente outro navegador

**Precisão:**
- Boa: < 50m
- Aceitável: 50-100m
- Ruim: > 100m (tente novamente)

---

### PDF não gera

**Sintomas:**
- Loading infinito na visualização
- Erro ao gerar PDF
- PDF em branco

**Causas:**
- Dados incompletos
- Erro no servidor
- Template inválido

**Soluções:**
1. Volte e verifique se todos os campos estão preenchidos
2. Recarregue a página
3. Tente novamente
4. Se persistir, contate o suporte

---

### Não consigo baixar PDF

**Sintomas:**
- Botão de download não funciona
- PDF não abre
- Erro ao baixar

**Causas:**
- Bloqueador de pop-ups
- Permissão de download negada
- Erro de rede

**Soluções:**
1. Desative bloqueador de pop-ups
2. Permita downloads no navegador
3. Clique com botão direito → "Salvar como"
4. Tente outro navegador
5. Verifique espaço em disco

---

### Perdi meus dados

**Sintomas:**
- Fechei a aba e perdi tudo
- Recarreguei e voltou ao início

**Causas:**
- Fechou aba/navegador
- Recarregou página
- Sessão expirou

**Soluções:**
- Infelizmente, precisa preencher novamente
- **Dica:** Não feche a aba até finalizar!
- **Dica:** Não recarregue a página!

---

## 3. Erros de API

### 401 Unauthorized

**Causa:** Não autenticado ou token expirado

**Solução:**
1. Faça login novamente
2. Verifique se sessão não expirou
3. Limpe cookies e faça login

---

### 403 Forbidden

**Causa:** Sem permissão para acessar recurso

**Solução:**
1. Verifique se tem permissões necessárias
2. Contate administrador para atribuir permissões
3. Verifique se conta está ativa

---

### 404 Not Found

**Causa:** Recurso não existe

**Solução:**
1. Verifique se ID/UUID está correto
2. Verifique se recurso não foi deletado
3. Verifique se slug está correto

---

### 409 Conflict

**Causa:** Conflito de dados (ex: slug duplicado)

**Solução:**
1. Use outro nome/slug
2. Verifique se recurso já existe
3. Delete recurso duplicado

---

### 422 Unprocessable Entity

**Causa:** Dados inválidos

**Solução:**
1. Verifique mensagem de erro
2. Corrija dados inválidos
3. Verifique validações (CPF, e-mail, etc.)

---

### 500 Internal Server Error

**Causa:** Erro no servidor

**Solução:**
1. Tente novamente em alguns segundos
2. Verifique logs do backend
3. Contate suporte técnico

---

## 4. Problemas de Performance

### Editor lento

**Sintomas:**
- Lag ao mover campos
- Delay ao redimensionar
- Interface travando

**Causas:**
- Muitos campos (> 50)
- PDF muito grande
- Navegador lento
- Memória insuficiente

**Soluções:**
1. Reduza número de campos
2. Use PDF menor (< 5MB)
3. Feche outras abas
4. Aumente zoom (menos renderização)
5. Use navegador mais rápido (Chrome)
6. Aumente RAM do computador

---

### Listagens lentas

**Sintomas:**
- Demora para carregar lista
- Paginação lenta
- Busca lenta

**Causas:**
- Muitos registros (> 1000)
- Busca sem índice
- Rede lenta

**Soluções:**
1. Use filtros para reduzir resultados
2. Aumente limite de paginação (50 → 100)
3. Verifique conexão com internet
4. Contate suporte para otimização de índices

---

### PDF demora para gerar

**Sintomas:**
- Loading de 10+ segundos
- Timeout

**Causas:**
- Template complexo
- Muitos campos
- Imagens grandes
- Servidor sobrecarregado

**Soluções:**
1. Simplifique template (menos campos)
2. Reduza tamanho de imagens
3. Aguarde (pode demorar até 30s)
4. Tente novamente
5. Contate suporte se persistir

---

## 5. Problemas de Integração

### ViaCEP não funciona

**Sintomas:**
- CEP não preenche endereço
- Erro ao buscar CEP

**Causas:**
- API ViaCEP fora do ar
- Rate limit excedido
- Rede bloqueando

**Soluções:**
1. Aguarde alguns minutos
2. Preencha endereço manualmente
3. Verifique status da API: https://viacep.com.br/
4. Verifique firewall/proxy

---

### Supabase Storage não funciona

**Sintomas:**
- Erro ao fazer upload de PDF
- PDFs não carregam
- Erro ao baixar PDF

**Causas:**
- Bucket não existe
- Políticas RLS incorretas
- Quota excedida

**Soluções:**
1. Verifique se bucket `assinatura-digital-pdfs` existe
2. Verifique políticas RLS:
   ```sql
   -- Templates: leitura pública
   CREATE POLICY "Public read templates"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'assinatura-digital-pdfs' AND (storage.foldername(name))[1] = 'templates');

   -- Sessões: leitura com sessao_uuid
   CREATE POLICY "Read sessoes with uuid"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'assinatura-digital-pdfs' AND (storage.foldername(name))[1] = 'sessoes');
   ```
3. Verifique quota do Supabase
4. Contate suporte Supabase

---

## 6. Logs e Debugging

### Logs do Frontend

**Console do navegador (F12):**
```javascript
// Erros comuns
Error loading PDF: ...
Failed to save template: ...
Autosave error: ...
Preview generation failed: ...
Validation error: ...

// Warnings
Warning: Field outside canvas bounds
Warning: Unsaved changes
```

**Como acessar:**
1. Pressione F12
2. Aba "Console"
3. Filtre por "Error" ou "Warning"

---

### Logs do Backend

**Supabase Logs:**
1. Acesse Supabase Dashboard
2. Projeto → Logs
3. Filtre por:
   - API Logs (erros de API)
   - Database Logs (erros de query)
   - Storage Logs (erros de upload/download)

**Logs úteis:**
```
[ERROR] Failed to generate PDF: ...
[ERROR] Template not found: ...
[ERROR] Invalid schema: ...
[ERROR] Permission denied: ...
[ERROR] Database error: ...
```

---

### Debugging de Permissões

**Query para verificar permissões:**
```sql
SELECT 
  u.id,
  u.nome,
  u.email,
  pu.recurso,
  pu.operacao,
  pu.permitido
FROM usuarios u
LEFT JOIN permissoes_usuarios pu ON u.id = pu.usuario_id
WHERE u.id = [SEU_ID]
AND pu.recurso = 'assinatura_digital';
```

---

### Debugging de Formulários

**Query para verificar formulário:**
```sql
SELECT 
  f.id,
  f.nome,
  f.slug,
  f.ativo,
  s.nome as segmento_nome,
  s.slug as segmento_slug,
  s.ativo as segmento_ativo,
  f.template_ids,
  f.form_schema
FROM assinatura_digital_formularios f
JOIN assinatura_digital_segmentos s ON f.segmento_id = s.id
WHERE f.slug = 'seu-slug'
AND s.slug = 'seu-segmento-slug';
```

---

### Debugging de Templates

**Query para verificar template:**
```sql
SELECT 
  id,
  template_uuid,
  nome,
  status,
  ativo,
  arquivo_original,
  campos,
  conteudo_markdown
FROM assinatura_digital_templates
WHERE template_uuid = 'seu-uuid';
```

---

### Debugging de Sessões

**Query para verificar sessão:**
```sql
SELECT 
  s.id,
  s.sessao_uuid,
  s.criado_em,
  f.nome as formulario_nome,
  c.nome_completo as cliente_nome,
  c.cpf,
  s.pdfs_gerados,
  s.ip_address,
  s.user_agent
FROM assinatura_digital_assinaturas s
JOIN assinatura_digital_formularios f ON s.formulario_id = f.id
JOIN clientes c ON s.cliente_id = c.id
WHERE s.sessao_uuid = 'seu-uuid';
```

---

### Ferramentas de Debugging

**React DevTools:**
- Instale extensão do navegador
- Inspecione componentes
- Verifique props e state

**Zustand DevTools:**
- Instale extensão Redux DevTools
- Inspecione store
- Veja histórico de ações

**Network Tab:**
- F12 → Network
- Veja requisições HTTP
- Verifique payloads e respostas
- Filtre por "XHR" ou "Fetch"

---

## Contato de Suporte

Se nenhuma solução funcionou:

1. **Anote:**
   - O que você estava fazendo
   - Mensagem de erro exata
   - Navegador e versão
   - Sistema operacional
   - Prints de tela

2. **Colete logs:**
   - Console do navegador (F12)
   - Network tab (requisições falhadas)
   - Supabase logs (se admin)

3. **Entre em contato:**
   - E-mail: suporte@seudominio.com
   - Ticket: https://suporte.seudominio.com
   - Telefone: (XX) XXXX-XXXX

---

**Última atualização:** 2024-01-15