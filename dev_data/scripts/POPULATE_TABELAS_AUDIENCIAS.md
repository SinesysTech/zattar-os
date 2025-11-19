# Script de População de Tabelas Auxiliares de Audiências

## Objetivo

Popular as tabelas normalizadas (`classe_judicial`, `tipo_audiencia`, `sala_audiencia`, `orgao_julgador`) com dados históricos dos arquivos JSON de captura de audiências.

## Pré-requisitos

✅ **VERIFICADO**: Migration `create_classe_judicial_tipo_sala_audiencia` já foi aplicada no banco de dados.

## Como Executar

```bash
npm run populate:tabelas-audiencias
```

## O que o script faz

1. **Lê todos os arquivos JSON** em `dev_data/scripts/results/api-audiencias/`
2. **Extrai sub-objetos** de cada audiência:

   - `processo.classeJudicial` → tabela `classe_judicial`
   - `processo.orgaoJulgador` → tabela `orgao_julgador`
   - `tipo` → tabela `tipo_audiencia`
   - `salaAudiencia` → tabela `sala_audiencia`

3. **Persiste com verificação**:

   - ✅ Se não existe → **Insere**
   - 🔄 Se existe e diferente → **Atualiza**
   - ⏭️ Se existe e idêntico → **Descarta** (não atualiza)

4. **Mantém estrutura TRT + Grau** conforme migrations

## Estatísticas Exibidas

Ao final, o script mostra:

- 📄 Arquivos JSON processados
- 📦 Total de audiências processadas
- 📚 Classes judiciais (inseridas/atualizadas/descartadas/erros)
- 🏛️ Órgãos julgadores (inseridos/atualizados/descartados/erros)
- 📋 Tipos de audiência (inseridos/atualizados/descartados/erros)
- 🚪 Salas de audiência (inseridas/atualizadas/descartadas/erros)

## Exemplo de Saída

```
🚀 Iniciando população de tabelas auxiliares de audiências

📂 Diretório de resultados: .../dev_data/scripts/results/api-audiencias

📋 Diretórios encontrados: 18
📋 TRTs: trt1, trt10, trt12, ..., trt9

================================================================================
[1/18] Processando TRT1
================================================================================

📄 Processando: resultado-2025-11-17T01-05-41-886Z.json
  📊 TRT: TRT3 | Grau: primeiro_grau | Audiências: 50
  ✅ Arquivo processado com sucesso

...

================================================================================
📊 RESUMO FINAL
================================================================================

📄 Arquivos processados: 18
📦 Audiências processadas: 900

📚 CLASSES JUDICIAIS:
  ✅ Inseridas: 45
  🔄 Atualizadas: 2
  ⏭️  Descartadas (idênticas): 853
  ❌ Erros: 0

🏛️ ÓRGÃOS JULGADORES:
  ✅ Inseridos: 120
  🔄 Atualizados: 0
  ⏭️  Descartados (existentes): 780
  ❌ Erros: 0

📋 TIPOS DE AUDIÊNCIA:
  ✅ Inseridos: 30
  🔄 Atualizados: 1
  ⏭️  Descartados (idênticos): 869
  ❌ Erros: 0

🚪 SALAS DE AUDIÊNCIA:
  ✅ Inseridas: 200
  🔄 Atualizadas: 0
  ⏭️  Descartadas (idênticas): 700
  ❌ Erros: 0

✅ Nenhum erro encontrado!

✅ População de tabelas concluída com sucesso!
```

## Observações

- O script **NÃO afeta** os dados existentes nas tabelas de audiências
- Apenas **popula as tabelas auxiliares** que antes não existiam
- Usa os **mesmos serviços de persistência** da captura normal
- **Seguro para executar múltiplas vezes** (verifica antes de inserir/atualizar)
