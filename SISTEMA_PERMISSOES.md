# Sistema de Permissões Granulares e Cargos - Sinesys

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Matriz de Permissões](#matriz-de-permissões)
4. [Como Usar](#como-usar)
5. [API Endpoints](#api-endpoints)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O sistema de permissões do Sinesys é **granular** e baseado em **usuários** (não em papéis/roles). Cada usuário pode ter permissões específicas para executar operações em diferentes recursos do sistema.

### Características Principais:

✅ **81 permissões granulares** distribuídas em 13 recursos
✅ **Super Admin**: Bypass total de permissões
✅ **Cargos**: Organização interna (sem relação com permissões)
✅ **Cache in-memory**: TTL de 5 minutos para performance
✅ **Logs de auditoria**: Todas as mudanças são registradas

---

## Arquitetura

### Tabelas do Banco de Dados

#### 1. `cargos`
```sql
- id (bigint, PK)
- nome (text, unique)
- descricao (text, nullable)
- ativo (boolean, default true)
- created_by (bigint, FK usuarios)
- created_at, updated_at
```

#### 2. `permissoes`
```sql
- id (bigint, PK)
- usuario_id (bigint, FK usuarios, ON DELETE CASCADE)
- recurso (text)
- operacao (text)
- permitido (boolean, default true)
- created_at, updated_at
- UNIQUE(usuario_id, recurso, operacao)
```

#### 3. `usuarios` (campos adicionados)
```sql
- cargo_id (bigint, FK cargos, nullable, ON DELETE SET NULL)
- is_super_admin (boolean, default false)
```

### Fluxo de Verificação

```
Requisição → Autenticação → Autorização → Lógica de Negócio
                ↓                ↓
          authenticateRequest  checkPermission
                                ↓
                         1. Super admin? → true
                         2. Cache hit? → cached result
                         3. Query DB → result + cache
```

---

## Matriz de Permissões

### Recursos e Operações (81 permissões)

| # | Recurso | Operações | Total |
|---|---------|-----------|-------|
| 1 | **advogados** | listar, visualizar, criar, editar, deletar | 5 |
| 2 | **credenciais** | listar, visualizar, criar, editar, deletar, ativar_desativar | 6 |
| 3 | **acervo** | listar, visualizar, editar, atribuir_responsavel, desatribuir_responsavel, transferir_responsavel | 6 |
| 4 | **audiencias** | listar, visualizar, editar, atribuir_responsavel, desatribuir_responsavel, transferir_responsavel, editar_url_virtual | 7 |
| 5 | **pendentes** | listar, visualizar, atribuir_responsavel, desatribuir_responsavel, transferir_responsavel, baixar_expediente, reverter_baixa, editar_tipo_descricao | 8 |
| 6 | **usuarios** | listar, visualizar, criar, editar, deletar, ativar_desativar, gerenciar_permissoes, sincronizar | 8 |
| 7 | **clientes** | listar, visualizar, criar, editar, deletar | 5 |
| 8 | **partes_contrarias** | listar, visualizar, criar, editar, deletar | 5 |
| 9 | **contratos** | listar, visualizar, criar, editar, deletar, associar_processo, desassociar_processo | 7 |
| 10 | **agendamentos** | listar, visualizar, criar, editar, deletar, executar, ativar_desativar | 7 |
| 11 | **captura** | executar_acervo_geral, executar_arquivados, executar_audiencias, executar_pendentes, visualizar_historico, gerenciar_credenciais | 6 |
| 12 | **tipos_expedientes** | listar, visualizar, criar, editar, deletar | 5 |
| 13 | **cargos** | listar, visualizar, criar, editar, deletar, ativar_desativar | 6 |

**TOTAL: 81 permissões**

---

## Como Usar

### 1. Criar um Cargo

```bash
POST /api/cargos
Content-Type: application/json

{
  "nome": "Advogado Sênior",
  "descricao": "Advogado com 10+ anos de experiência",
  "ativo": true
}
```

### 2. Atribuir Cargo a um Usuário

```bash
PUT /api/usuarios/1
Content-Type: application/json

{
  "cargoId": 1
}
```

### 3. Promover Usuário a Super Admin

```bash
PUT /api/usuarios/1
Content-Type: application/json

{
  "isSuperAdmin": true
}
```

### 4. Atribuir Permissões (Batch)

```bash
POST /api/permissoes/usuarios/1
Content-Type: application/json

[
  {"recurso": "contratos", "operacao": "criar"},
  {"recurso": "contratos", "operacao": "editar"},
  {"recurso": "contratos", "operacao": "deletar"},
  {"recurso": "audiencias", "operacao": "listar"},
  {"recurso": "audiencias", "operacao": "visualizar"}
]
```

### 5. Substituir Todas as Permissões

```bash
PUT /api/permissoes/usuarios/1
Content-Type: application/json

[
  {"recurso": "acervo", "operacao": "listar"},
  {"recurso": "acervo", "operacao": "visualizar"}
]
```

### 6. Verificar Permissões de um Usuário

```bash
GET /api/permissoes/usuarios/1
```

**Resposta (Super Admin):**
```json
{
  "success": true,
  "data": {
    "usuario_id": 1,
    "is_super_admin": true,
    "permissoes": [
      // ... todas as 81 permissões
    ]
  }
}
```

**Resposta (Usuário Normal):**
```json
{
  "success": true,
  "data": {
    "usuario_id": 2,
    "is_super_admin": false,
    "permissoes": [
      {"recurso": "contratos", "operacao": "criar", "permitido": true},
      {"recurso": "contratos", "operacao": "editar", "permitido": true}
    ]
  }
}
```

### 7. Consultar Matriz Completa

```bash
GET /api/permissoes/recursos
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "matriz": [
      {
        "recurso": "advogados",
        "operacoes": ["listar", "visualizar", "criar", "editar", "deletar"]
      },
      // ... outros recursos
    ],
    "totalRecursos": 13,
    "totalPermissoes": 81
  }
}
```

---

## API Endpoints

### Cargos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/cargos` | Listar cargos (paginado) |
| POST | `/api/cargos` | Criar cargo |
| GET | `/api/cargos/[id]` | Buscar cargo por ID |
| PUT | `/api/cargos/[id]` | Atualizar cargo |
| DELETE | `/api/cargos/[id]` | Deletar cargo (valida associações) |
| GET | `/api/cargos/[id]/usuarios` | Listar usuários de um cargo |

### Permissões

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/permissoes/recursos` | Matriz completa de recursos/operações |
| GET | `/api/permissoes/usuarios/[id]` | Listar permissões de um usuário |
| POST | `/api/permissoes/usuarios/[id]` | Atribuir permissões (batch) |
| PUT | `/api/permissoes/usuarios/[id]` | Substituir todas as permissões |

---

## Exemplos Práticos

### Código TypeScript

#### Verificar Permissão em uma Rota

```typescript
import { checkPermission } from '@/backend/utils/auth/authorization';

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated || !authResult.usuarioId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar permissão
  const hasPermission = await checkPermission(
    authResult.usuarioId,
    'contratos',
    'criar'
  );

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Continuar...
}
```

#### Invalidar Cache

```typescript
import { invalidarCacheUsuario } from '@/backend/utils/auth/authorization';

// Após atribuir permissões
await atribuirPermissoesBatch(usuarioId, permissoes);
invalidarCacheUsuario(usuarioId);
```

---

## Troubleshooting

### ❌ Permissão negada mesmo tendo permissão

**Causa**: Cache desatualizado

**Solução**:
```typescript
import { invalidarCacheUsuario } from '@/backend/utils/auth/authorization';
await invalidarCacheUsuario(usuarioId);
```

### ❌ Super admin não consegue executar operação

**Causa**: Verificação de permissão não implementada na rota

**Solução**: Integrar `checkPermission` na rota (ver exemplos)

### ❌ Erro ao deletar cargo

**Causa**: Cargo está associado a usuários

**Solução**:
1. Remover cargo dos usuários: `PUT /api/usuarios/[id]` com `cargoId: null`
2. Depois deletar cargo: `DELETE /api/cargos/[id]`

### ❌ Performance lenta ao verificar permissões

**Causa**: Cache não está funcionando

**Solução**: Verificar estatísticas do cache:
```typescript
import { getCacheStats } from '@/backend/utils/auth/authorization';
console.log(getCacheStats());
```

---

## Logs de Auditoria

Todas as operações de permissões são registradas em `logs_alteracao`:

| Evento | tipo_evento |
|--------|-------------|
| Atribuir permissão | `permissao_atribuida` |
| Revogar permissão | `permissao_revogada` |
| Atribuir em lote | `permissoes_atribuidas_lote` |
| Substituir permissões | `permissoes_substituidas` |
| Promover super admin | `promovido_super_admin` |
| Remover super admin | `removido_super_admin` |
| Mudar cargo | `mudanca_cargo` |

**Consultar logs:**
```sql
SELECT * FROM logs_alteracao
WHERE tipo_entidade = 'usuarios'
  AND tipo_evento LIKE '%permiss%'
ORDER BY created_at DESC;
```

---

## Segurança

🔒 **Super admins devem ser usados com moderação**
🔒 **Sempre validar permissões no backend (server-side)**
🔒 **RLS habilitado em todas as tabelas**
🔒 **Logs de auditoria não podem ser deletados**

---

## Status de Integração

### ✅ Rotas com Permissões Integradas

As seguintes rotas já estão protegidas com o sistema de permissões:

#### Cargos
- `GET /api/cargos` - Requer `cargos.listar`
- `POST /api/cargos` - Requer `cargos.criar`
- `GET /api/cargos/[id]` - Requer `cargos.visualizar`
- `PUT /api/cargos/[id]` - Requer `cargos.editar`
- `DELETE /api/cargos/[id]` - Requer `cargos.deletar`

#### Permissões
- `GET /api/permissoes/recursos` - Requer autenticação (sem permissão específica)
- `GET /api/permissoes/usuarios/[id]` - Requer `usuarios.visualizar`
- `POST /api/permissoes/usuarios/[id]` - Requer `usuarios.gerenciar_permissoes`
- `PUT /api/permissoes/usuarios/[id]` - Requer `usuarios.gerenciar_permissoes`

#### Audiências (Exemplos)
- `PATCH /api/audiencias/[id]/url-virtual` - Requer `audiencias.editar_url_virtual`
- `PATCH /api/audiencias/[id]/responsavel` - Requer `audiencias.atribuir_responsavel`

### 🔄 Rotas Pendentes de Integração

As seguintes rotas ainda usam apenas autenticação (`authenticateRequest`) e podem ser atualizadas para usar `requirePermission`:

- **Advogados**: `/api/advogados/*` - Permissões: listar, visualizar, criar, editar, deletar
- **Credenciais**: `/api/credenciais/*` - Permissões: listar, visualizar, criar, editar, deletar, ativar_desativar
- **Acervo**: `/api/acervo/*` - Permissões: listar, visualizar, editar, atribuir_responsavel, desatribuir_responsavel, transferir_responsavel
- **Audiências**: Outras rotas além dos exemplos já integrados
- **Pendentes**: `/api/pendentes/*` - Permissões: listar, visualizar, atribuir_responsavel, desatribuir_responsavel, transferir_responsavel, baixar_expediente, reverter_baixa, editar_tipo_descricao
- **Usuários**: `/api/usuarios/*` - Permissões: listar, visualizar, criar, editar, deletar, ativar_desativar, gerenciar_permissoes, sincronizar
- **Clientes**: `/api/clientes/*` - Permissões: listar, visualizar, criar, editar, deletar
- **Partes Contrárias**: `/api/partes-contrarias/*` - Permissões: listar, visualizar, criar, editar, deletar
- **Contratos**: `/api/contratos/*` - Permissões: listar, visualizar, criar, editar, deletar, associar_processo, desassociar_processo
- **Agendamentos**: `/api/agendamentos/*` - Permissões: listar, visualizar, criar, editar, deletar, executar, ativar_desativar
- **Captura**: `/api/captura/*` - Permissões: executar_acervo_geral, executar_arquivados, executar_audiencias, executar_pendentes, visualizar_historico, gerenciar_credenciais
- **Tipos de Expedientes**: `/api/tipos-expedientes/*` - Permissões: listar, visualizar, criar, editar, deletar

### 📖 Como Integrar Permissões em Rotas Existentes

Veja [EXEMPLO_INTEGRACAO_PERMISSOES.md](backend/utils/auth/EXEMPLO_INTEGRACAO_PERMISSOES.md) para exemplos completos de integração.

**Padrão rápido:**
```typescript
import { requirePermission } from '@/backend/utils/auth/require-permission';

export async function POST(request: NextRequest) {
  // Verifica autenticação + autorização em uma chamada
  const authOrError = await requirePermission(request, 'recurso', 'operacao');

  if (authOrError instanceof NextResponse) {
    return authOrError; // 401 ou 403
  }

  const { usuarioId } = authOrError;
  // ... continuar com a lógica
}
```

---

## Próximos Passos (Frontend)

1. Criar página de gerenciamento de cargos
2. Criar interface de matriz de permissões (checkboxes)
3. Adicionar indicador visual de super admin
4. Criar filtros por cargo na listagem de usuários

---

**Documentação completa do OpenSpec:** `openspec/changes/add-permissions-and-cargos-system/`
