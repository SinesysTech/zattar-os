# Como Aplicar as Migrations do Sistema de Permissões

As migrations para o sistema de permissões e cargos foram criadas mas precisam ser aplicadas ao banco de dados.

## Migrations Criadas

1. **20250118120000_create_cargos.sql** - Cria tabela `cargos`
2. **20250118120100_create_permissoes.sql** - Cria tabela `permissoes`
3. **20250118120200_alter_usuarios_add_permissions_fields.sql** - Adiciona `cargo_id` e `is_super_admin` na tabela `usuarios`

## Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Para cada migration (na ordem):
   - Abra o arquivo em `supabase/migrations/`
   - Copie todo o conteúdo SQL
   - Cole no SQL Editor
   - Clique em "Run" para executar

## Opção 2: Via Supabase CLI

```bash
# 1. Verificar se Supabase está linkado ao projeto
npx supabase status

# 2. Se não estiver linkado, linkar
npx supabase link --project-ref SEU_PROJECT_REF

# 3. Aplicar todas as migrations
npx supabase db push
```

## Verificar se Migrations Foram Aplicadas

Você pode verificar se as migrations foram aplicadas executando este SQL no SQL Editor:

```sql
-- Verificar se tabela cargos existe
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'cargos';

-- Verificar se tabela permissoes existe
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'permissoes';

-- Verificar se coluna is_super_admin existe em usuarios
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'usuarios'
  AND column_name IN ('is_super_admin', 'cargo_id');
```

Se as queries retornarem resultados, as migrations foram aplicadas com sucesso.

## Criar Seu Primeiro Super Admin

Após aplicar as migrations, você pode promover seu usuário a super admin:

```sql
-- Substituir 'seu@email.com' pelo seu e-mail
UPDATE public.usuarios
SET is_super_admin = true
WHERE email_corporativo = 'seu@email.com';

-- Verificar
SELECT id, nome_exibicao, email_corporativo, is_super_admin
FROM public.usuarios
WHERE is_super_admin = true;
```

## Troubleshooting

### Erro: "column is_super_admin does not exist"
- As migrations não foram aplicadas
- Execute as migrations conforme instruções acima

### Erro: "relation permissoes does not exist"
- A tabela `permissoes` não foi criada
- Execute a migration `20250118120100_create_permissoes.sql`

### Erro 403 ao acessar /usuarios/[id]
- Seu usuário não tem a permissão `usuarios.visualizar`
- Opção 1: Promova-se a super admin (SQL acima)
- Opção 2: Adicione a permissão manualmente:

```sql
-- Adicionar permissão usuarios.visualizar ao seu usuário
INSERT INTO public.permissoes (usuario_id, recurso, operacao, permitido)
VALUES (
  (SELECT id FROM public.usuarios WHERE email_corporativo = 'seu@email.com'),
  'usuarios',
  'visualizar',
  true
);
```
