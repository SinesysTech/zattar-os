# Distribuição Inicial de Processos, Expedientes e Audiências

## 📋 Objetivo

Realizar a distribuição inicial dos processos do **acervo geral** entre 4 usuários, organizados por região geográfica, e propagar essa atribuição para expedientes e audiências relacionados.

## 👥 Distribuição por Região

### **SUDESTE** (1.747 processos)
- **Guido Licursi Neto** (ID: 21) → ~873 processos
- **Tamiris Neres Gouveia** (ID: 22) → ~874 processos

**TRTs:** TRT1 (RJ), TRT2 (SP), TRT3 (MG), TRT15 (Campinas), TRT17 (ES)

### **OUTRAS REGIÕES** (2.064 processos)
- **Ister Zimar Ferreira Ramos** (ID: 24) → ~1.032 processos
- **Tiago Marins Amaral** (ID: 20) → ~1.032 processos

**TRTs:**
- **Nordeste:** TRT5, TRT6, TRT7, TRT13, TRT16, TRT19, TRT20, TRT21, TRT22
- **Sul:** TRT4, TRT9, TRT12
- **Norte:** TRT8, TRT11, TRT14
- **Centro-Oeste:** TRT10, TRT18, TRT23, TRT24

## 🚀 Ordem de Execução

Execute os scripts **NESTA ORDEM**:

### 1️⃣ **Processos** (obrigatório primeiro)
```bash
# Via psql
psql "postgresql://postgres.qggifqpqgjjgobcqbfgo:Zattar2024%40@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" -f scripts/distribuicao-inicial-processos.sql

# OU via Supabase SQL Editor
# Copie e cole o conteúdo de: scripts/distribuicao-inicial-processos.sql
```

### 2️⃣ **Expedientes** (após processos)
```bash
# Via psql
psql "postgresql://postgres.qggifqpqgjjgobcqbfgo:Zattar2024%40@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" -f scripts/distribuicao-inicial-expedientes.sql

# OU via Supabase SQL Editor
# Copie e cole o conteúdo de: scripts/distribuicao-inicial-expedientes.sql
```

### 3️⃣ **Audiências** (após processos)
```bash
# Via psql
psql "postgresql://postgres.qggifqpqgjjgobcqbfgo:Zattar2024%40@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" -f scripts/distribuicao-inicial-audiencias.sql

# OU via Supabase SQL Editor
# Copie e cole o conteúdo de: scripts/distribuicao-inicial-audiencias.sql
```

## ⚙️ Como Funciona

### Processos
- **Critério de divisão:** `MOD(id, 2)` (ID ímpar vs ID par)
- **Sudeste:** IDs ímpares → Guido, IDs pares → Tamiris
- **Outras regiões:** IDs ímpares → Ister, IDs pares → Tiago
- **Resultado:** Distribuição equilibrada de ~50% para cada pessoa por região

### Expedientes
- **Lógica:** `UPDATE pendentes_manifestacao SET responsavel_id = acervo.responsavel_id`
- **Vínculo:** `pendentes_manifestacao.processo_id = acervo.id`
- **Regra:** Expediente herda o responsável do processo

### Audiências
- **Lógica:** `UPDATE audiencias SET responsavel_id = acervo.responsavel_id`
- **Vínculo:** `audiencias.processo_id = acervo.id`
- **Regra:** Audiência herda o responsável do processo

## 📊 Verificações Incluídas

Cada script inclui queries de verificação que mostram:

### Processos
✅ Total de processos atribuídos vs não atribuídos
✅ Distribuição por responsável (processos únicos)
✅ Distribuição por região e responsável
✅ Detalhamento por TRT

### Expedientes
✅ Total de expedientes atribuídos vs não atribuídos
✅ Distribuição por responsável (pendentes vs baixados)
✅ Distribuição por região e responsável
✅ Expedientes sem processo vinculado

### Audiências
✅ Total de audiências atribuídas vs não atribuídas
✅ Distribuição por responsável (designadas/realizadas/canceladas)
✅ Distribuição por região e responsável
✅ Audiências futuras (próximos 30 dias)

## ⚠️ Observações Importantes

### Processos Multi-Grau
Processos com o mesmo `numero_processo` mas em graus diferentes (ex: 1º e 2º grau) **podem ficar com responsáveis diferentes**, pois cada registro na tabela `acervo` é tratado como uma instância independente.

**Exemplo:**
- Processo `0101450-28.2025.5.01.0431` - 1º grau → Guido (ID ímpar)
- Processo `0101450-28.2025.5.01.0431` - 2º grau → Tamiris (ID par)

Se isso for um problema, será necessário ajustar a lógica para unificar por `numero_processo`.

### Expedientes e Audiências Órfãos
Expedientes ou audiências **sem `processo_id` vinculado** não serão atribuídos por esses scripts. Verifique os relatórios de verificação para identificar esses casos.

### Novos Registros
Esses scripts tratam apenas da **distribuição inicial**. Novos processos, expedientes ou audiências criados no futuro precisarão de:
1. **Trigger no banco de dados** (automático), OU
2. **Lógica no backend** (serviço de atribuição)

## 🔄 Rollback (Em Caso de Erro)

Se precisar desfazer a distribuição:

```sql
-- Remover todas as atribuições do acervo geral
UPDATE acervo
SET responsavel_id = NULL, updated_at = NOW()
WHERE origem = 'acervo_geral'
  AND responsavel_id IN (21, 22, 24, 20);

-- Remover atribuições de expedientes
UPDATE pendentes_manifestacao
SET responsavel_id = NULL, updated_at = NOW()
WHERE responsavel_id IN (21, 22, 24, 20);

-- Remover atribuições de audiências
UPDATE audiencias
SET responsavel_id = NULL, updated_at = NOW()
WHERE responsavel_id IN (21, 22, 24, 20);
```

## 📝 Logs de Auditoria

As alterações **NÃO geram logs automáticos** na tabela `logs_alteracao` porque são `UPDATE` diretos no banco.

Se precisar de auditoria, considere:
1. Usar a função RPC existente `atribuir_responsavel_acervo()`
2. Executar um script de logging manual após a distribuição
3. Implementar trigger de auditoria antes da distribuição

## 🎯 Resultado Esperado

### Processos
- **Total:** 3.811 processos únicos distribuídos
- **Guido:** ~873 processos (Sudeste)
- **Tamiris:** ~874 processos (Sudeste)
- **Ister:** ~1.032 processos (Outras regiões)
- **Tiago:** ~1.032 processos (Outras regiões)

### Expedientes e Audiências
- Quantidade proporcional aos processos de cada responsável
- Vinculação automática baseada no `processo_id`

## 📞 Dúvidas?

Em caso de problemas:
1. Verifique os resultados das queries de verificação
2. Compare com os números esperados acima
3. Execute o rollback se necessário
4. Ajuste os scripts conforme necessário

---

**Data de criação:** 2025-01-24
**Versão:** 1.0
**Status:** Pronto para execução
