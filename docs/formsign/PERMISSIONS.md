# Formsign Admin - Sistema de Permissões

## Visão Geral

O módulo de Assinatura Digital (Formsign) utiliza o sistema de permissões granulares do Sinesys, baseado no recurso `formsign_admin`.

## Recurso e Operações

### Recurso: `formsign_admin`

Controla acesso às funcionalidades administrativas de assinatura digital.

**Operações disponíveis:**

| Operação | Descrição | Onde é usada |
|----------|-----------|-------------|
| `listar` | Visualizar listas de templates, formulários e segmentos | Páginas de listagem |
| `visualizar` | Ver detalhes de um item específico | APIs de detalhes (GET /templates/:id) |
| `criar` | Criar novos templates, formulários e segmentos | Botão "Novo", dialogs de criação, duplicação |
| `editar` | Modificar templates, formulários e segmentos existentes | Botão "Editar", páginas de edição, editor de templates, editor de schemas |
| `deletar` | Remover templates, formulários e segmentos | Botão "Deletar", exclusão em lote |

## Páginas e Permissões Necessárias

### 1. Lista de Templates (`/assinatura-digital/admin/templates`)

**Permissão mínima:** `formsign_admin.listar`

**Ações condicionais:**
- Botão "Novo Template": requer `criar`
- Botão "Editar" (dropdown): requer `editar`
- Botão "Duplicar" (dropdown): requer `criar`
- Botão "Deletar" (dropdown e bulk): requer `deletar`
- Exportar CSV: sem permissão adicional (parte de `listar`)

### 2. Editor de Templates (`/assinatura-digital/admin/templates/:id/edit`)

**Permissão mínima:** `formsign_admin.editar`

**Comportamento:**
- Verifica permissão no carregamento da página
- Exibe mensagem de "Acesso negado" se não tiver permissão
- Backend valida novamente ao salvar (PUT /templates/:id)

### 3. Lista de Formulários (`/assinatura-digital/admin/formularios`)

**Permissão mínima:** `formsign_admin.listar`

**Ações condicionais:**
- Botão "Novo Formulário": requer `criar`
- Botão "Editar Schema" (dropdown): requer `editar`
- Botão "Duplicar" (dropdown): requer `criar`
- Botão "Deletar" (dropdown e bulk): requer `deletar`
- Exportar CSV: sem permissão adicional

### 4. Editor de Schemas (`/assinatura-digital/admin/formularios/:id/schema`)

**Permissão mínima:** `formsign_admin.editar`

**Comportamento:**
- Verifica permissão no carregamento da página
- Exibe mensagem de "Acesso negado" se não tiver permissão
- Backend valida novamente ao salvar (PUT /formularios/:id/schema)

### 5. Lista de Segmentos (`/assinatura-digital/admin/segmentos`)

**Permissão mínima:** `formsign_admin.listar`

**Ações condicionais:**
- Botão "Novo Segmento": requer `criar`
- Botão "Editar" (dropdown): requer `editar`
- Botão "Duplicar" (dropdown): requer `criar`
- Botão "Deletar" (dropdown e bulk): requer `deletar`
- Exportar CSV: sem permissão adicional

## Como Atribuir Permissões

### Via Interface (Gestão de Usuários)

1. Acesse **Usuários** no menu admin
2. Selecione o usuário desejado
3. Clique em "Gerenciar Permissões"
4. Localize o recurso **Administração de assinatura digital (Formsign)**
5. Marque as operações desejadas:
   - ☑️ Listar
   - ☑️ Visualizar
   - ☑️ Criar
   - ☑️ Editar
   - ☑️ Deletar
6. Salve as alterações

### Via API

**Endpoint:** `POST /api/permissoes/usuarios/:usuarioId/atribuir`

**Exemplo - Conceder todas as permissões:**
```json
{
  "permissoes": [
    { "recurso": "formsign_admin", "operacao": "listar", "permitido": true },
    { "recurso": "formsign_admin", "operacao": "visualizar", "permitido": true },
    { "recurso": "formsign_admin", "operacao": "criar", "permitido": true },
    { "recurso": "formsign_admin", "operacao": "editar", "permitido": true },
    { "recurso": "formsign_admin", "operacao": "deletar", "permitido": true }
  ]
}
```

**Exemplo - Permissão somente leitura:**
```json
{
  "permissoes": [
    { "recurso": "formsign_admin", "operacao": "listar", "permitido": true },
    { "recurso": "formsign_admin", "operacao": "visualizar", "permitido": true }
  ]
}
```

## Super Admins

Usuários com flag `is_super_admin = true` têm **todas as permissões automaticamente**, incluindo `formsign_admin`. Não é necessário atribuir permissões individualmente.

## Cenários Comuns

### 1. Administrador Completo de Formsign
**Perfil:** Gerente de RH que cria e gerencia todos os formulários

**Permissões:**
- ✅ `formsign_admin.listar`
- ✅ `formsign_admin.visualizar`
- ✅ `formsign_admin.criar`
- ✅ `formsign_admin.editar`
- ✅ `formsign_admin.deletar`

### 2. Editor de Formulários
**Perfil:** Assistente que ajusta templates e schemas, mas não cria/deleta

**Permissões:**
- ✅ `formsign_admin.listar`
- ✅ `formsign_admin.visualizar`
- ✅ `formsign_admin.editar`
- ❌ `formsign_admin.criar`
- ❌ `formsign_admin.deletar`

### 3. Visualizador
**Perfil:** Auditor que apenas consulta configurações

**Permissões:**
- ✅ `formsign_admin.listar`
- ✅ `formsign_admin.visualizar`
- ❌ `formsign_admin.criar`
- ❌ `formsign_admin.editar`
- ❌ `formsign_admin.deletar`

## Segurança

### Camadas de Proteção

1. **Frontend (UX):** Oculta botões/ações que o usuário não pode executar
2. **Backend (Segurança):** Valida permissões em todas as rotas API
3. **Cache:** Permissões são cacheadas por 5 minutos para performance

### Importante

⚠️ **O backend é a fonte de verdade para segurança.** Mesmo que o frontend oculte botões, todas as APIs validam permissões independentemente.

✅ **Invalidação de cache:** Ao alterar permissões de um usuário, o cache é automaticamente invalidado.

## Troubleshooting

### Usuário não vê botões de ação

**Causa:** Falta de permissões ou cache desatualizado

**Solução:**
1. Verifique as permissões do usuário em **Usuários > Gerenciar Permissões**
2. Confirme que as operações necessárias estão marcadas
3. Peça ao usuário para fazer logout/login (limpa cache do frontend)
4. Se persistir, verifique logs do backend para erros de autenticação

### Erro 403 ao tentar acessar página

**Causa:** Usuário não tem permissão `listar` ou `editar`

**Solução:**
1. Verifique se o usuário tem `formsign_admin.listar` (para páginas de lista)
2. Verifique se o usuário tem `formsign_admin.editar` (para páginas de edição)
3. Confirme que o usuário não está desativado (`ativo = false`)

### Botões aparecem mas API retorna 403

**Causa:** Dessincronia entre cache do frontend e permissões reais

**Solução:**
1. Aguarde 5 minutos (TTL do cache)
2. Ou force logout/login do usuário
3. Verifique se as permissões foram realmente salvas no banco

## Referências

- **Tipos de permissões:** `backend/types/permissoes/types.ts`
- **Middleware de autorização:** `backend/auth/authorization.ts`
- **Hook frontend:** `app/_lib/hooks/use-minhas-permissoes.ts`
- **API de permissões:** `app/api/permissoes/minhas/route.ts`