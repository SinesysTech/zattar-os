# Relatório: Arquivos e Pastas com Nomes Referenciando TJ(UF)

**Data da Busca:** 2026-01-03  
**Objetivo:** Encontrar arquivos e pastas que tenham no nome referências a tribunais de justiça (TJMG, TJSP, TJRJ, etc.)

## 📋 Resumo Executivo

**Não foram encontrados arquivos ou pastas** com nomes contendo diretamente códigos de tribunais de justiça (TJMG, TJSP, TJRJ, etc.) no histórico do Git ou na estrutura atual do repositório.

## 🔍 Buscas Realizadas

### 1. Busca na Estrutura Atual
- Busca por arquivos/pastas com padrão `*TJ*` no nome
- **Resultado:** Nenhum arquivo ou pasta encontrado

### 2. Busca no Histórico do Git
- Busca por commits que adicionaram arquivos com nomes contendo TJ+UF
- Busca por commits que deletaram arquivos com nomes contendo TJ+UF
- Busca por commits que renomearam arquivos com nomes contendo TJ+UF
- **Resultado:** Nenhum arquivo encontrado no histórico

### 3. Busca por Referências no Conteúdo
Encontrados **20 arquivos** que mencionam TJ+UF no **conteúdo** (não no nome):

## 📊 Arquivos que Mencionam TJ+UF no Conteúdo

### 1. Design System e Componentes UI
- `src/lib/design-system/variants.ts`
  - Mapeamento de variantes de badges para tribunais
  - Referências: TJSP, TJMG
- `src/components/ui/semantic-badge.tsx`
  - Documentação sobre badges de tribunais
- `src/components/ui/tribunal-badge.tsx`
  - Componente para exibir badges de tribunais
- `docs/design-system-usage.md`
  - Exemplos de uso de badges de tribunais
- `docs/design-system-audit-report.md`
  - Auditoria do design system incluindo TJMG

### 2. Scripts e Testes
- `scripts/pangea/playwright-probe.ts`
  - Lista completa de todos os TJs em array (linha 17):
    ```typescript
    'TJAC','TJAL','TJAP','TJAM','TJBA','TJCE','TJDF','TJES','TJGO',
    'TJMA','TJMT','TJMG','TJPA','TJPB','TJPR','TJPE','TJPI','TJRJ',
    'TJRN','TJRS','TJRO','TJRR','TJSC','TJSP','TJSE','TJTO'
    ```
  - Script de diagnóstico para API Pangea que trabalha com todos os tribunais
- `src/features/pangea/service.ts`
  - Serviço relacionado à API Pangea que trabalha com tribunais
- `src/features/pangea/__tests__/unit/pangea.service.test.ts`
  - Testes do serviço Pangea

### 3. Captura e Scraping
- `src/features/captura/services/persistence/tribunal-config-persistence.service.ts`
  - Serviço de persistência de configuração de tribunais
  - Menciona TJSP como exemplo em comentários
- `src/features/captura/drivers/factory.ts`
  - Factory para drivers de captura de tribunais
  - Menciona TJSP como exemplo em comentários

### 4. Banco de Dados e Schemas
- `supabase/schemas/13_tribunais.sql`
  - Schema da tabela de tribunais
  - Comentário: "Código do tribunal (ex: TRT1, TJSP)"
- `supabase/schemas/19_cadastros_pje.sql`
  - Schema de cadastros PJE
  - Comentários mencionando TJMG, TJSP como exemplos
- `supabase/migrations/20251128000001_create_cadastros_pje.sql`
  - Migration criando tabela de cadastros PJE
  - Comentários mencionando TJMG
- `supabase/migrations/20251204140000_add_comunica_cnj_integration.sql`
  - Migration de integração Comunica CNJ
  - Comentário: "Sigla do tribunal (TRT1, TJSP, etc.)"

### 5. Documentação
- `docs/pangea-api.md`
  - Documentação da API Pangea
  - Exemplos JSON com TJSP, TJMG
- `openspec/specs/comunica-cnj/spec.md`
  - Especificação de integração Comunica CNJ
  - Menciona TJSP como exemplo
- `openspec/changes/archive/2025-12-05-add-comunica-cnj-integration/specs/comunica-cnj/spec.md`
  - Especificação arquivada
- `openspec/changes/archive/2025-12-04-add-cadastros-pje-table/design.md`
  - Design de tabela de cadastros PJE
  - Menciona TJMG como exemplo

## 🎯 Conclusão

### Arquivos com Nomes Contendo TJ+UF
**Nenhum arquivo ou pasta** foi encontrado com nomes contendo diretamente códigos de tribunais de justiça (TJMG, TJSP, etc.).

### Arquivos que Mencionam TJ+UF no Conteúdo
Foram encontrados **20 arquivos** que mencionam tribunais de justiça no **conteúdo**, mas não no nome do arquivo. Esses arquivos estão principalmente relacionados a:

1. **Design System** - Mapeamento de cores e componentes UI
2. **Scripts de Teste** - Scripts que trabalham com API Pangea
3. **Captura de Dados** - Serviços e drivers de captura
4. **Banco de Dados** - Schemas e migrations
5. **Documentação** - Documentação técnica e especificações

## 📝 Observações Importantes

1. **Padrão de Nomenclatura:**
   - O projeto **não usa** nomes de arquivos específicos por tribunal
   - Em vez disso, usa configuração dinâmica via banco de dados (`tribunais`, `tribunais_config`)
   - Os códigos de tribunais são **dados**, não parte da estrutura de arquivos

2. **Mapeamento Completo de TJs:**
   - O arquivo `src/lib/design-system/variants.ts` contém mapeamento completo de **todos os 27 tribunais de justiça**:
     - TJAC, TJAL, TJAP, TJAM, TJBA, TJCE, TJDF, TJES, TJGO, TJMA, TJMG, TJMS, TJMT, TJPA, TJPB, TJPE, TJPI, TJPR, TJRJ, TJRN, TJRO, TJRR, TJRS, TJSC, TJSE, TJSP, TJTO
   - Cada tribunal tem uma variante de cor associada (success, info, warning, destructive, accent, neutral)

2. **Abordagem Adotada:**
   - Configuração de tribunais via tabela `tribunais` no banco
   - Configuração de acesso via `tribunais_config`
   - Código genérico que funciona com qualquer tribunal via configuração

3. **Scripts de Raspagem:**
   - Scripts estão em `scripts/captura/` (estrutura atual)
   - Anteriormente em `scripts/api-*/` (antes de dez/2025)
   - Scripts são genéricos e funcionam com qualquer tribunal via parâmetros/configuração

## 🔍 Próximos Passos Sugeridos

Se você está procurando por código específico relacionado a tribunais de justiça:

1. **Verificar a tabela `tribunais` no banco de dados**
   - Contém todos os tribunais cadastrados
   - SQL: `supabase/schemas/13_tribunais.sql`

2. **Verificar a tabela `tribunais_config`**
   - Contém configurações de acesso para cada tribunal
   - SQL: `supabase/schemas/13_tribunais.sql`

3. **Verificar os scripts de captura**
   - `scripts/captura/` - Scripts genéricos que funcionam com qualquer tribunal
   - Recebem código do tribunal como parâmetro

4. **Verificar serviços de captura**
   - `src/features/captura/` - Código da aplicação
   - `backend/captura/` - Serviços backend (se existir)

---

**Conclusão:** O projeto não usa arquivos/pastas com nomes específicos de tribunais. Em vez disso, usa uma abordagem genérica baseada em configuração via banco de dados.

