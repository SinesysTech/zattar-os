# Scripts de Desenvolvimento do Sinesys

Este diretório contém **scripts standalone** para desenvolvimento, manutenção e testes do sistema Sinesys. **Nenhum destes scripts é usado diretamente pelo aplicativo em produção** - são ferramentas de desenvolvimento, testes de API, sincronização de dados e utilitários de manutenção.

## 📋 Índice

- [Estrutura](#estrutura)
- [Como Usar](#como-usar)
- [Categorias de Scripts](#categorias-de-scripts)
- [Requisitos](#requisitos)

## 🗂️ Estrutura

```
scripts/
├── captura/             # Testes de captura de dados PJE/TRT
│   ├── acervo-geral/   # Captura de acervo geral
│   ├── arquivados/     # Captura de processos arquivados
│   ├── audiencias/     # Captura de audiências
│   ├── partes/         # Captura de partes
│   ├── pendentes/      # Captura de pendentes de manifestação
│   └── timeline/       # Captura de timeline e documentos
├── database/            # Scripts de banco de dados
│   ├── migrations/     # Aplicação e gestão de migrations
│   └── population/     # População e seeding de dados
├── sincronizacao/       # Scripts de sincronização de dados
│   ├── usuarios/       # Sincronização de usuários
│   ├── entidades/      # Sincronização de entidades (partes, endereços)
│   └── processos/      # Sincronização de processos e partes
├── storage/             # Configuração de armazenamento (Backblaze B2)
├── dev-tools/           # Ferramentas de desenvolvimento
│   ├── design/         # Análise e validação de design system
│   └── build/          # Análise de build e memória
└── results/             # Resultados de execução de scripts (gitignored)
```

## 🚀 Como Usar

### Pré-requisitos Globais

```bash
# Instalar dependências do projeto
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

### Executar um Script

A maioria dos scripts usa `tsx` para execução TypeScript direta:

```bash
# Formato geral
npx tsx scripts/{categoria}/{subcategoria}/{nome-do-script}.ts [opções]

# Exemplo: Testar API de acervo geral
npx tsx scripts/captura/acervo-geral/test-api-acervo-geral.ts

# Exemplo com opções
npx tsx scripts/sincronizacao/processos/sincronizar-partes-processos.ts --dry-run --limit 100
```

### Scripts via package.json

Alguns scripts têm atalhos configurados em `package.json`:

```bash
npm run validate:design-system
npm run sincronizar-usuarios
npm run check:pwa
```

## 📚 Categorias de Scripts

### 🎯 Captura de Dados (`captura/`)

Scripts para testar e executar capturas de dados dos sistemas PJE/TRT.

**Principais diretórios:**

- **`acervo-geral/`** - Captura de processos do acervo geral
- **`arquivados/`** - Captura de processos arquivados
- **`audiencias/`** - Captura de audiências agendadas
- **`partes/`** - Captura de partes dos processos
- **`pendentes/`** - Captura de pendentes de manifestação
- **`timeline/`** - Captura de timeline e documentos dos processos
- **`test-captura-oab.ts`** - Teste de captura por OAB (Comunica CNJ)
- **`test-comunica-cnj-api.ts`** - Teste completo da API Comunica CNJ

**Características comuns:**

- ✅ Testam endpoints da API REST (`/api/captura/trt/*`)
- ✅ Salvam resultados em `scripts/results/`
- ✅ Suportam filtros (TRT, grau, limite)
- ✅ Requerem autenticação (SERVICE_API_KEY)

**Exemplo de uso:**

```bash
# Testar captura de audiências do TRT3
npx tsx scripts/captura/audiencias/test-api-audiencias.ts
```

### 💾 Database (`database/`)

Scripts de gestão e manutenção do banco de dados PostgreSQL (Supabase).

**Principais scripts:**

- **`migrations/`**

  - `apply-migrations-via-supabase-sdk.ts` - Aplica migrations via SDK
  - `apply-migrations-manual.ts` - Aplica migrations manualmente
  - `check-applied-migrations.ts` - Verifica migrations aplicadas
  - `apply-locks-migration.ts` - Aplica migration de locks
  - `apply-rls-simple.ts` - Aplica Row Level Security
  - `organize-migrations.ts` - Organiza migrations em aplicadas/não-aplicadas

- **`population/`**
  - `populate-database.ts` - Popula banco com resultados de capturas
  - `populate-tabelas-auxiliares-audiencias.ts` - Popula tabelas auxiliares

**Exemplo de uso:**

```bash
# Verificar migrations aplicadas
npx tsx scripts/database/migrations/check-applied-migrations.ts

# Popular banco com dados de teste
npx tsx scripts/database/population/populate-database.ts
```

### 🔄 Sincronização (`sincronizacao/`)

Scripts para sincronizar e corrigir dados entre diferentes fontes.

**Principais scripts:**

- **`usuarios/`**

  - `sincronizar-usuarios.ts` - Sincroniza auth.users → public.usuarios

- **`entidades/`**

  - `corrigir-entidades-polo.ts` - Corrige polo das entidades

- **`processos/`**
  - `sincronizar-partes-processos.ts` - Correlaciona partes com processos
  - `sincronizar-partes-processos-avancado.ts` - Versão avançada com recaptura
  - `reprocessar-partes-acervo.ts` - Re-captura partes do acervo

**Características comuns:**

- ✅ Modo `--dry-run` para simulação
- ✅ Opção `--limit` para processar lotes
- ✅ Logs detalhados com `--verbose`
- ✅ Salvam resultados em JSON

**Exemplo de uso:**

```bash
# Simular sincronização de 100 processos
npx tsx scripts/sincronizacao/processos/sincronizar-partes-processos.ts --dry-run --limit 100

# Sincronizar usuários
npm run sincronizar-usuarios
```

### 📦 Storage (`storage/`)

Scripts de configuração e gestão do Backblaze B2.

**Principais scripts:**

- `configure-backblaze-bucket.ts` - Configura bucket (CORS, permissões)
- `make-bucket-public.ts` - Torna bucket público
- `test-backblaze-connection.ts` - Testa conexão com B2

**Exemplo de uso:**

```bash
npx tsx scripts/storage/configure-backblaze-bucket.ts
```

### 🛠️ Dev Tools (`dev-tools/`)

Ferramentas de desenvolvimento, análise e validação.

**Principais scripts:**

- **`design/`**

  - `analyze-typography.ts` - Analisa uso de tipografia
  - `validate-design-system.ts` - Valida conformidade com design system

- **`build/`**
  - `check-build-memory.sh` - Verifica memória durante build
  - `run-analyze.js` - Analisa bundle do build
  - `run-build-debug-memory.js` - Debug de memória no build
  - `check-mcp-fetch.sh` - Verifica configuração MCP
  - `setup-mcp-fetch.sh` - Configura integração MCP

**Exemplo de uso:**

```bash
# Validar design system
npm run validate:design-system

# Analisar tipografia
npx tsx scripts/dev-tools/design/analyze-typography.ts

# Verificar PWA
npm run check:pwa
```

## ⚙️ Requisitos

### Variáveis de Ambiente

A maioria dos scripts requer configuração em `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=


# Redis (para scripts que usam cache)
REDIS_URL=

# API (para scripts de teste de API)
SERVICE_API_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3000

# Backblaze B2 (para scripts de storage)
B2_ENDPOINT=
B2_REGION=
B2_KEY_ID=
B2_APPLICATION_KEY=
B2_BUCKET=
```

### Dependências

Todos os scripts usam as mesmas dependências do projeto principal. Principais:

- `tsx` - Execução TypeScript
- `dotenv` - Variáveis de ambiente
- `@supabase/supabase-js` - Cliente Supabase
- `ioredis` - Cliente Redis

## 📝 Notas Importantes

### Modo Dry Run

Muitos scripts suportam `--dry-run` para simulação segura:

```bash
npx tsx scripts/sincronizacao/processos/sincronizar-partes-processos.ts --dry-run
```

### Resultados

Scripts de captura salvam resultados em `scripts/results/` (gitignored):

```
scripts/results/
├── api-acervo-geral/
├── api-audiencias/
├── api-partes/
└── reprocessamento/
```

### Logs

Scripts complexos geram logs detalhados. Use `--verbose` para mais informações:

```bash
npx tsx scripts/sincronizacao/processos/sincronizar-partes-processos.ts --verbose
```

## 🔍 Encontrar Scripts

### Por Funcionalidade

| Funcionalidade        | Localização                                 |
| --------------------- | ------------------------------------------- |
| Testar API de captura | `scripts/captura/{tipo}/test-api-{tipo}.ts` |
| Sincronizar dados     | `scripts/sincronizacao/{entidade}/`         |
| Aplicar migrations    | `scripts/database/migrations/`              |
| Popular banco         | `scripts/database/population/`              |
| Configurar storage    | `scripts/storage/`                          |
| Validar código        | `scripts/dev-tools/`                        |

### Por Nome de Script

Use `find` para localizar scripts:

```bash
# Encontrar todos os scripts relacionados a "partes"
find scripts -name "*partes*"

# Encontrar scripts de teste
find scripts -name "test-*"

# Listar todos os scripts TypeScript
find scripts -name "*.ts" -type f
```

## 🆘 Ajuda

A maioria dos scripts suporta `--help`:

```bash
npx tsx scripts/sincronizacao/processos/sincronizar-partes-processos.ts --help
```

## 📚 Documentação Adicional

- [Arquitetura do Sistema](../docs/arquitetura-sistema.md)
- [Guia de Desenvolvimento](../docs/guia-desenvolvimento.md)
- [Feature-Sliced Design](../AGENTS.md)
- [OpenSpec](../openspec/project.md)

---

**Nota**: Este diretório contém apenas ferramentas de desenvolvimento. O código de produção está em `src/`, `backend/` e `supabase/`.
