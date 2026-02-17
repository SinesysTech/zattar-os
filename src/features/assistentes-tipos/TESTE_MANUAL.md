# 🧪 Guia de Teste Manual - Geração Automática de Peças

## ✅ Checklist de Validação

### 1. **Verificar Compilação** ✓

```bash
# Verificar se não há erros de TypeScript
npm run build
# ou
npx tsc --noEmit
```

**Status:** ✅ Sem erros de compilação

---

### 2. **Acessar Interface de Configuração**

1. Iniciar servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

2. Fazer login como administrador

3. Navegar para: `/admin/assistentes-tipos`

**Resultado Esperado:**

- Página carrega sem erros
- Formulário de criação aparece
- Lista de configurações (vazia ou com itens) é exibida

---

### 3. **Criar Configuração**

1. Na página `/admin/assistentes-tipos`:
   - Selecionar um **Assistente Dify** do dropdown
   - Selecionar um **Tipo de Expediente** do dropdown
   - Clicar em **"Criar Configuração"**

**Resultado Esperado:**

- Mensagem de sucesso aparece
- Nova configuração aparece na lista
- Badge "Ativo" verde é exibido

**Consulta SQL para verificar:**

```sql
SELECT
  ate.id,
  a.nome as assistente,
  te.tipo_expediente,
  ate.ativo
FROM assistentes_tipos_expedientes ate
JOIN assistentes a ON ate.assistente_id = a.id
JOIN tipos_expedientes te ON ate.tipo_expediente_id = te.id
ORDER BY ate.created_at DESC
LIMIT 5;
```

---

### 4. **Testar Geração Automática**

1. Identificar o `tipo_expediente_id` configurado

2. Criar um novo expediente com esse tipo:
   - Ir para página de criação de expedientes
   - Preencher campos obrigatórios
   - **Selecionar o tipo de expediente configurado**
   - Salvar

**Resultado Esperado:**

- Expediente é criado com sucesso
- **Após alguns segundos**, documento é gerado automaticamente
- Campo `id_documento` do expediente é preenchido

**Logs do Console (Server Side):**

```
🤖 [AUTO-GEN] Verificando geração automática para expediente 123
✅ [AUTO-GEN] Peça gerada automaticamente: documento 456
```

**Consulta SQL para verificar:**

```sql
-- Verificar se documento foi criado e vinculado
SELECT
  e.id as expediente_id,
  e.numero_processo,
  e.id_documento,
  d.titulo as documento_titulo,
  d.created_at as documento_criado_em
FROM expedientes e
LEFT JOIN documentos d ON e.id_documento = d.id
WHERE e.tipo_expediente_id = [SEU_TIPO_ID]
ORDER BY e.created_at DESC
LIMIT 5;
```

---

### 5. **Verificar Documento Gerado**

1. Abrir o expediente criado
2. Verificar se há link/botão para o documento
3. Abrir documento gerado

**Resultado Esperado:**

- Documento existe e pode ser acessado
- Conteúdo foi gerado pelo Dify
- Formato Plate.js está correto
- Tags incluem "gerado-automaticamente" e "dify"

**Consulta SQL:**

```sql
SELECT
  id,
  titulo,
  conteudo::text,
  tags,
  criado_por,
  created_at
FROM documentos
WHERE tags @> ARRAY['gerado-automaticamente']
ORDER BY created_at DESC
LIMIT 3;
```

---

### 6. **Testar Ativar/Desativar**

1. Na lista de configurações, clicar em **"Desativar"**

**Resultado Esperado:**

- Badge muda para "Inativo" (cinza)
- Mensagem de sucesso aparece

2. Criar outro expediente do mesmo tipo

**Resultado Esperado:**

- Documento **NÃO** é gerado automaticamente
- Log mostra: `ℹ️ [AUTO-GEN] Geração não executada: Nenhum assistente configurado`

3. Clicar em **"Ativar"** novamente

**Resultado Esperado:**

- Badge volta para "Ativo" (verde)
- Gerações automáticas voltam a funcionar

---

### 7. **Testar Múltiplas Configurações**

1. Criar configuração para outro tipo de expediente
2. Criar expedientes de ambos os tipos

**Resultado Esperado:**

- Cada expediente gera documento com o assistente correto
- Documentos têm conteúdos diferentes (conforme assistente)

---

## 🐛 Debugging

### Ver Logs do Servidor

```bash
# Terminal onde o dev server está rodando
# Procurar por linhas com [AUTO-GEN]
```

### Verificar Metadados do Assistente

```sql
SELECT
  id,
  nome,
  tipo,
  jsonb_pretty(metadata->'parameters'->'user_input_form') as form_fields
FROM assistentes
WHERE id = [ID_DO_ASSISTENTE];
```

### Verificar se Hook Está Ativo

```bash
# Procurar em src/features/expedientes/actions.ts
grep -A 20 "🤖 Geração Automática" src/features/expedientes/actions.ts
```

---

## 📊 Cenários de Teste

### Cenário 1: Fluxo Feliz ✅

1. Configuração ativa existe
2. Expediente criado com tipo configurado
3. Assistente Dify responde corretamente
4. Documento criado e vinculado

### Cenário 2: Sem Configuração ℹ️

1. Nenhuma configuração para o tipo
2. Expediente criado
3. Log: "Nenhum assistente configurado"
4. Expediente criado sem documento

### Cenário 3: Configuração Inativa ℹ️

1. Configuração existe mas `ativo = false`
2. Expediente criado
3. Log: "Nenhum assistente configurado"
4. Expediente criado sem documento

### Cenário 4: Erro no Dify ❌

1. Configuração ativa
2. Dify retorna erro (API key inválida, etc)
3. Log: "Erro ao gerar peça"
4. Expediente criado, mas sem documento

### Cenário 5: Tipo sem Expediente ID ⏭️

1. Expediente criado sem `tipo_expediente_id`
2. Hook não dispara
3. Expediente criado normalmente

---

## 🎯 Critérios de Aceitação

- [ ] Interface de configuração carrega sem erros
- [ ] Criar configuração funciona
- [ ] Ativar/desativar funciona
- [ ] Deletar configuração funciona
- [ ] Expediente com tipo configurado gera documento automaticamente
- [ ] Documento é vinculado ao expediente (`id_documento`)
- [ ] Conteúdo do documento vem do Dify
- [ ] Formato Plate.js está correto
- [ ] Tags corretas no documento
- [ ] Logs aparecem no console do servidor
- [ ] Configuração inativa não gera documento
- [ ] Expediente sem tipo não dispara hook
- [ ] Múltiplas configurações funcionam independentemente

---

## 🚀 Próximos Passos

Após validação:

1. Configurar assistentes Dify para casos de uso reais
2. Criar templates de prompts otimizados
3. Ajustar mapeamento de campos se necessário
4. Documentar prompts e campos esperados
5. Treinar usuários na configuração

---

## 📝 Notas

- A geração acontece **após** criação do expediente (não bloqueia)
- Erros na geração **não afetam** criação do expediente
- Apenas um assistente ativo por tipo de expediente
- Suporta assistentes tipo "chat" e "workflow"
- Metadata Dify deve ter `parameters.user_input_form`

---

**Última atualização:** 2026-02-17
