# Regras de Negocio - Acervo

## Contexto
Modulo de gestao do acervo processual capturado dos tribunais (PJE/TRT). Armazena processos com suas instancias, timeline de movimentacoes e documentos, permitindo visualizacao unificada por numero de processo.

## Entidades Principais
- **Acervo**: Registro de instancia processual capturada do PJE
- **ProcessoUnificado**: Agrupamento de instancias pelo mesmo numero_processo
- **TimelineJSONB**: Timeline de movimentacoes armazenada em JSONB (documentos + movimentos)
- **ProcessoClienteCpfRow**: Processo vinculado a cliente via CPF (para consulta IA)

## Enums e Tipos

### Origem
- `acervo_geral`: Processos ativos
- `arquivado`: Processos arquivados

### Grau
- `primeiro_grau`: 1a instancia
- `segundo_grau`: 2a instancia

### Status (derivado de codigo_status_processo)
| Codigo | Status |
|--------|--------|
| A / ATIVO | ATIVO |
| S / SUSPENSO | SUSPENSO |
| ARQ / ARQUIVADO | ARQUIVADO |
| E / EXTINTO | EXTINTO |
| B / BAIXADO | BAIXADO |
| P / PENDENTE | PENDENTE |
| R / RECURSO | EM_RECURSO |
| (outros) | OUTRO |

### Timeline Status
- `disponivel`: Timeline carregada
- `sincronizando`: Captura em andamento
- `indisponivel`: Sem timeline
- `erro`: Falha na captura

## Regras de Validacao

### Listagem (listarAcervoParamsSchema)
- `pagina`: inteiro positivo (opcional)
- `limite`: inteiro positivo, max 2000 (opcional, default 50)
- `origem`: enum ['acervo_geral', 'arquivado']
- `grau`: enum ['primeiro_grau', 'segundo_grau']
- `ordenar_por`: enum de campos (data_autuacao, numero_processo, etc.)
- `agrupar_por`: enum (trt, grau, origem, responsavel_id, classe_judicial, etc.)

### Atribuir Responsavel
- `processoIds`: array de numeros, min 1
- `responsavelId`: numero ou null (para remover)

## Regras de Negocio

### Listagem Polimorfica
1. Se `agrupar_por` presente: retorna agrupamentos com contagem
2. Se `unified=true` (default): agrupa instancias pelo numero_processo via VIEW materializada `acervo_unificado`
3. Se `unified=false`: retorna instancias separadas

### Atribuicao de Responsavel
1. Validar que todos os processos existem
2. Validar que responsavel existe e esta ativo (se nao null)
3. Validar que usuario executor esta ativo
4. Propagar atribuicao para TODAS instancias do mesmo numero_processo
5. Invalidar cache Redis apos mutacao

### Busca por CPF (para Agente IA)
1. Normalizar CPF (remover pontuacao)
2. Validar 11 digitos
3. Buscar cliente na tabela `clientes`
4. Buscar participacoes em `processo_partes`
5. Buscar processos no acervo
6. Agrupar por numero_processo (unificar instancias)
7. Formatar timeline de cada instancia
8. Disparar sincronizacao em background para processos sem timeline
9. Ordenar por ultima movimentacao (mais recente primeiro)
10. Retornar resumo estatistico (total processos, com audiencia proxima)

### Recaptura de Timeline
1. Buscar todas instancias do mesmo numero_processo
2. Para cada instancia (em paralelo):
   - Capturar timeline via PJE
   - Capturar partes via PJE
   - Atualizar nomes de partes (polo ativo/passivo)
   - Persistir partes e criar vinculos
   - Buscar e atualizar dados de capa do painel PJE
3. Sempre fechar browser apos captura

## Otimizacao de Colunas
- `getAcervoColumnsBasic()`: Exclui timeline_jsonb (para listagens)
- `getAcervoColumnsFull()`: Inclui timeline_jsonb (para detalhe)
- `getAcervoColumnsClienteCpf()`: Colunas minimas + timeline (para busca CPF)

## Filtros Disponiveis
- **Origem**: origem (acervo_geral, arquivado)
- **Tribunal**: trt (TRT1-24)
- **Grau**: grau (primeiro_grau, segundo_grau)
- **Responsavel**: responsavel_id, sem_responsavel
- **Busca textual**: numero_processo, nome_parte_autora, nome_parte_re, orgao_julgador, classe_judicial
- **Booleanos**: segredo_justica, juizo_digital, tem_associacao, tem_proxima_audiencia
- **Datas**: data_autuacao, data_arquivamento, data_proxima_audiencia (inicio/fim)
- **Agrupamento**: trt, grau, origem, responsavel_id, classe_judicial, codigo_status_processo, orgao_julgador, mes_autuacao, ano_autuacao

## Cache
- TTL: 15 minutos (ACERVO_TTL = 900s)
- Cache por ID: `acervo:id:{id}`
- Cache de lista: chave gerada via `getAcervoListKey(params)`
- Cache de agrupamento: chave gerada via `getAcervoGroupKey(params)`
- Invalidacao: `invalidateAcervoCache()` apos mutacoes

## Revalidacao de Cache
Apos mutacoes, revalidar:
- `/app/processos` - Lista de processos
- `/app/processos/{id}` - Detalhe do processo
- `/app/processos/{id}/timeline` - Timeline do processo
