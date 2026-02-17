# Aplicar Migration - Tabela Integrações

## ⚠️ IMPORTANTE: Correção Aplicada

A migration foi corrigida para usar `auth_user_id` ao invés de `id` na comparação com `auth.uid()`.

## Passo 1: Acessar SQL Editor

Acesse: https://supabase.com/dashboard/project/cxxdivtgeslrujpfpivs/sql/new

## Passo 2: Copiar e Executar SQL

Copie todo o conteúdo do arquivo abaixo e execute no SQL Editor:

`supabase/migrations/20260216212759_create_integracoes_table.sql`

✅ **A migration agora está corrigida e deve funcionar sem erros!**

## Passo 3: Migrar Dados do .env.local

Após criar a tabela, execute este SQL para migrar a configuração atual:

```sql
INSERT INTO public.integracoes (tipo, nome, descricao, ativo, configuracao)
VALUES (
  'twofauth',
  '2FAuth Principal',
  'Servidor de autenticação de dois fatores',
  true,
  jsonb_build_object(
    'api_url', 'https://authenticator.service.sinesys.app/api/v1',
    'api_token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiOWQ1ZGVkNmQ2NzI0YTQxY2M2NGM0YWU1NDAxOWUxNTdhYTJlZDE5YWM1MWU4NTQyOGRmNjlhMGYyZjFiODgyYTIyMDhmODQzZjhkNWMyNGYiLCJpYXQiOjE3NjMzMDkwNTguNjUxNjY5LCJuYmYiOjE3NjMzMDkwNTguNjUxNjczLCJleHAiOjE3OTQ4NDUwNTguNjQ0NzU1LCJzdWIiOiIyIiwic2NvcGVzIjpbXX0.gcS8F-UfI4WjriM5RSv-FWczIAt8Nr9oXemPwyr7tCBm72Ad85vfuIqBc-ZbfogiiehGY_R8glsdrC_5YPD72E_l2M61td8yh6SH5zssIcMXqNExUpCvdHojHKVhlwKDG9euTTM0RTClUfRq9mVCocikcHTIZS8cbuhOqPIfruVBTHj6kxslgpw04wMM2JbnopoGEbr9RgRKc1jsxcMrxATKS4JvdrNLzPVJQZyi2-ePWWhArBLviedx5erM9l6Maazbu-t_knCNoVfDOtyvE_oqsJJLxd4FLGZPE_RDCwy16MtaVbYX0jL-sO8USxtDrBlZF9DoB5JMRO8Ap6sXvdi3K_Hy18UIt-E4fTqt_S7w0SLc6BWwgIFJ3AHKd_UaTOltnKe5rg1p4xW9evntcajMJGWWTrrOL0j8_X-mO3Vw4EikzclUB4TRFvGRX1RIM11sSXyG35Qcyc_FCFlxkt8JJW1_j5ixj1WyGy2GtjJhOnAjEsIW1dfGfiTFBMHmp8SnnMc6RZn3eivqcoCnJoouhQfg03uiy6OJjANpbidUjD1pb8ECydZxvjRLJQNzUNyJZofWFrZn0G4sJ39tmm3rt-T0BKJqNeafCk_D5J2m7iDKY3S1KLXG8pICIDP0zndJNLn56F11dDl9MIRMJZTgl0KhA3HuRD1slexdYwU',
    'account_id', 3
  )
)
ON CONFLICT (tipo, nome) DO UPDATE SET
  configuracao = EXCLUDED.configuracao,
  ativo = EXCLUDED.ativo,
  updated_at = now();
```

## Passo 4: Verificar

Execute para verificar se foi criado:

```sql
SELECT * FROM public.integracoes WHERE tipo = 'twofauth';
```

## Passo 5: Testar na Interface

1. Acesse: http://localhost:3000/app/configuracoes?tab=integracoes
2. Clique no card "2FAuth"
3. Verifique se a configuração está carregada
4. Teste a conexão

## Passo 6: Remover do .env.local (Opcional)

Após confirmar que funciona, você pode remover estas linhas do `.env.local`:

```bash
TWOFAUTH_API_URL=https://authenticator.service.sinesys.app/api/v1
TWOFAUTH_API_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
TWOFAUTH_ACCOUNT_ID=3
```

O sistema continuará funcionando pois o `config-loader.ts` faz fallback para as variáveis de ambiente se não encontrar no banco.
