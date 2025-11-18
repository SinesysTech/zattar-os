# 📋 Guia de Variáveis de Ambiente

## Diferença entre `NEXT_PUBLIC_SUPABASE_URL` e `DOMAIN`

Muitas pessoas confundem essas duas variáveis. Vamos esclarecer:

### `NEXT_PUBLIC_SUPABASE_URL` - URL do Supabase (Backend)

**O que é:**
- URL do serviço Supabase (seu backend/banco de dados)
- É um serviço externo fornecido pelo Supabase
- Formato: `https://[seu-projeto-id].supabase.co`

**Onde encontrar:**
1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie a **Project URL**

**Exemplo:**
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

**Uso:**
- Usado pela aplicação Next.js para se conectar ao Supabase
- Necessário para autenticação, banco de dados, storage, etc.

---

### `DOMAIN` - Domínio da Sua Aplicação (Frontend)

**O que é:**
- Domínio onde sua aplicação Next.js estará disponível
- É o endereço que os usuários usarão para acessar sua aplicação
- Usado pelo Traefik para roteamento e certificados SSL

**Exemplo:**
```
DOMAIN=zattaradvogados.sinesys.app
```

ou

```
DOMAIN=sinesys.app
```

**Uso:**
- Usado nas labels do Traefik para configurar o roteamento
- Usado para gerar certificados SSL automaticamente
- Define qual domínio o Traefik deve rotear para seu container

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────┐
│                    SEU SERVIDOR                          │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Traefik (Reverse Proxy)                       │    │
│  │  DOMAIN: zattaradvogados.sinesys.app           │    │
│  └─────────────────────────────────────────────────┘    │
│                        │                                  │
│                        ▼                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Container: sinesys                             │    │
│  │  Next.js Application                             │    │
│  │                                                   │    │
│  │  NEXT_PUBLIC_SUPABASE_URL ────────┐              │    │
│  │  = https://xxxxx.supabase.co      │              │    │
│  └────────────────────────────────────┼──────────────┘    │
│                                       │                    │
└───────────────────────────────────────┼────────────────────┘
                                        │
                                        ▼
                          ┌─────────────────────────┐
                          │   SUPABASE (Cloud)       │
                          │   Backend/Banco de Dados │
                          │   https://xxxxx.supabase.co│
                          └─────────────────────────┘
```

---

## 🔧 Configuração no Seu Caso

Baseado na sua pergunta, você mencionou:
- `NEXT_PUBLIC_SUPABASE_URL` vai ser `zattaradvogados.sinesys.app` ❌ **ERRADO**
- `DOMAIN` vai ser `zattaradvogados.sinesys.app` ou `sinesys.app` ✅ **CORRETO**

### Correção:

**`NEXT_PUBLIC_SUPABASE_URL`** deve ser:
```
https://[seu-projeto-id].supabase.co
```
(Exemplo: `https://abcdefghijklmnop.supabase.co`)

**`DOMAIN`** deve ser:
```
zattaradvogados.sinesys.app
```
ou
```
sinesys.app
```
(depende de qual domínio você quer usar)

---

## ✅ Checklist de Configuração

Antes de fazer o deploy, certifique-se de ter:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = URL do Supabase (formato: `https://xxxxx.supabase.co`)
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` = Chave pública do Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = Chave service_role do Supabase
- [ ] `DOMAIN` = Domínio da sua aplicação (ex: `zattaradvogados.sinesys.app`)

---

## 🆘 Ainda com Dúvidas?

Se ainda não tem certeza sobre qual valor usar:

1. **Para `NEXT_PUBLIC_SUPABASE_URL`**: 
   - Acesse o dashboard do Supabase
   - Vá em Settings > API
   - Copie a "Project URL"

2. **Para `DOMAIN`**:
   - Pergunte-se: "Qual endereço os usuários vão digitar no navegador?"
   - Se for `zattaradvogados.sinesys.app`, use esse
   - Se for `sinesys.app`, use esse
   - Deve ser o domínio que você configurou no DNS apontando para seu servidor


