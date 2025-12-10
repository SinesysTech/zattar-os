# Guia de Início Rápido

## 📥 Instalação

### Pré-requisitos

- **Node.js** 20+ (recomendado: 20.11.0 LTS)
- **pnpm** 8+ (gerenciador de pacotes)
- **Docker** e **Docker Compose** (para desenvolvimento local)
- **Git**

### Clone do Repositório

```bash
git clone https://github.com/seu-usuario/sinesys.git
cd sinesys
```

### Instalação de Dependências

```bash
pnpm install
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo de exemplo e configure as variáveis:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-privada

# Redis
REDIS_URL=redis://localhost:6379

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sinesys

# Backblaze B2 (Storage)
B2_APPLICATION_KEY_ID=sua-key-id
B2_APPLICATION_KEY=sua-key
B2_BUCKET_NAME=seu-bucket
B2_BUCKET_ID=seu-bucket-id

# Autenticação 2FA (Opcional)
TWOFA_BASE_URL=https://seu-2fauth.com
TWOFA_API_KEY=sua-api-key

# CopilotKit (IA - Opcional)
COPILOT_CLOUD_PUBLIC_API_KEY=sua-chave-copilot
```

### 2. Banco de Dados

#### Supabase (Recomendado - Cloud)

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie as credenciais para `.env.local`
4. Execute as migrações:

```bash
pnpm supabase:migrate
```

#### PostgreSQL Local (Alternativa)

```bash
# Iniciar containers
docker-compose up -d postgres redis mongodb

# Executar migrações
pnpm db:migrate
```

### 3. Cache Redis

```bash
# Docker (recomendado)
docker run -d -p 6379:6379 redis:latest

# Ou via docker-compose
docker-compose up -d redis
```

### 4. MongoDB (Opcional - para Timelines)

```bash
docker-compose up -d mongodb
```

## 🚀 Execução

### Modo Desenvolvimento

```bash
pnpm dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Modo Produção

```bash
# Build
pnpm build

# Iniciar
pnpm start
```

### Docker (Produção)

```bash
# Build da imagem
docker build -t sinesys .

# Executar
docker run -p 3000:3000 sinesys
```

## 🔑 Primeiro Acesso

### Criar Usuário Admin

Execute o script de seed para criar o primeiro usuário:

```bash
pnpm db:seed
```

**Credenciais padrão:**

- Email: `admin@zattar.com`
- Senha: `Admin@2025`

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

### Acessar Dashboard

1. Acesse http://localhost:3000
2. Faça login com as credenciais padrão
3. Configure 2FA (recomendado)
4. Crie novos usuários em **Configurações → Usuários**

## 🔧 Troubleshooting

### Erro de Conexão com Supabase

```bash
# Verificar variáveis de ambiente
cat .env.local | grep SUPABASE

# Testar conexão
pnpm test:supabase
```

### Redis Não Conecta

```bash
# Verificar se Redis está rodando
redis-cli ping
# Deve retornar: PONG

# Ou via Docker
docker ps | grep redis
```

### Erro de Migração

```bash
# Resetar banco (CUIDADO: apaga dados!)
pnpm db:reset

# Executar migrações manualmente
pnpm db:migrate
```

### Porta 3000 em Uso

```bash
# Usar outra porta
PORT=3001 pnpm dev
```

## 📚 Próximos Passos

- 📖 [Arquitetura do Sistema](./arquitetura-sistema.md)
- 🏗️ [Guia de Desenvolvimento](./guia-desenvolvimento.md)
- 🔐 [Configuração de Permissões](./configuracao-permissoes.md)
- 🚢 [Deploy em Produção](./deploy.md)

## 💬 Suporte

- **Documentação Completa**: `/docs`
- **Issues**: GitHub Issues
- **Wiki**: GitHub Wiki
