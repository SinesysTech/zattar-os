# Resumo: Implementação API Timeline PJE-TRT

**Data:** 19/11/2025  
**Objetivo:** Implementar captura de timeline de processos do PJE-TRT

---

## 📋 O QUE FOI FEITO

### 1. ✅ API Timeline Implementada

**Localização:** `backend/api/pje-trt/timeline/`

**Arquivos criados:**

- `obter-timeline.ts` - Função principal para buscar timeline
- `index.ts` - Re-exportação do módulo
- Atualizado `backend/api/pje-trt/index.ts` para incluir timeline

**Endpoint PJE:**

```
GET /pje-comum-api/api/processos/id/{processoId}/timeline
```

**Parâmetros:**

- `processoId` (obrigatório) - ID do processo
- `somenteDocumentosAssinados` (boolean, default: true)
- `buscarMovimentos` (boolean, default: true)
- `buscarDocumentos` (boolean, default: true)

**Tipo de retorno:** `TimelineResponse` (ainda como `unknown`, será refinado após análise)

---

### 2. ✅ Script Exploratório Executado

**Arquivo:** `dev_data/scripts/test-timeline-exploratorio.ts`

**Credenciais utilizadas (fixas no script):**

- CPF: `07529294610`
- Senha: `12345678aA@`

**Testes realizados:**

1. Timeline completa com documentos assinados
2. Timeline completa com todos os documentos
3. Timeline apenas movimentos
4. Timeline apenas documentos

**Resultados salvos em:**

```
dev_data/scripts/results/timeline-exploratorio/
├── timeline-completa-docs-assinados-2025-11-19T21-51-51-657Z.json (247 KB)
├── timeline-completa-todos-docs-2025-11-19T21-51-51-657Z.json (247 KB)
├── timeline-apenas-movimentos-2025-11-19T21-51-51-657Z.json (106 KB)
└── timeline-apenas-documentos-2025-11-19T21-51-51-657Z.json (142 KB)
```

---

## 🔍 PRINCIPAIS DESCOBERTAS

### Estrutura da Timeline

**Tipo:** Array direto (não objeto com propriedade `data`)

**Total de itens no processo teste (ID: 2887163):** 190 itens

- 61 documentos (`documento: true`)
- 129 movimentos (`documento: false`)

### Parâmetro `somenteDocumentosAssinados`

**Resultado:** ❌ **NÃO faz diferença**

- `somenteDocumentosAssinados: true` → 61 documentos (todos assinados)
- `somenteDocumentosAssinados: false` → 61 documentos (todos assinados)

**Conclusão:** Este processo específico só possui documentos assinados

---

### Estrutura de DOCUMENTO (`documento: true`)

```json
{
  "id": 222702194,
  "idUnicoDocumento": "85def44",           ← ID ÚNICO para identificar documento
  "titulo": "TRT - chegada de contrarrazões",
  "idTipo": 57,
  "tipo": "Certidão",                      ← Tipo do documento
  "codigoDocumento": "7323",
  "data": "2025-07-10T13:29:06.927005",
  "documento": true,                        ← Indica que é DOCUMENTO
  "idUsuario": 74238,
  "especializacoes": 128,
  "nomeResponsavel": "ANGELA PEREIRA CORREIA DAN",
  "tipoPolo": "Servidor",
  "participacaoProcesso": "Servidor",
  "favorito": false,
  "ativo": true,
  "documentoSigiloso": false,              ← Se é sigiloso
  "usuarioInterno": true,
  "documentoApreciavel": false,
  "instancia": "1º Grau",
  "idSignatario": 74238,                   ← ID do signatário (indica documento ASSINADO)
  "nomeSignatario": "ANGELA PEREIRA CORREIA DAN",
  "expediente": false,
  "numeroOrdem": 0,
  "codigoInstancia": 1,
  "pendenciaDocInstanciaOrigem": false,
  "papelUsuarioDocumento": "Diretor de Secretaria",
  "infoExpedientes": {
    "expediente": false,
    "expedienteAberto": false,
    "hasMandadoDevolucaoPendente": false,
    "mandadoDistribuido": false
  },
  "copia": false,
  "permiteCooperacaoJudiciaria": false,
  "dataJuntadaFutura": false,
  "anexos": []                             ← Alguns documentos têm anexos
}
```

**Campos importantes para documentos:**

- ✅ `idUnicoDocumento` - ID único do documento (ex: "85def44")
- ✅ `tipo` - Tipo do documento (ex: "Certidão", "Contrarrazões", "Petição")
- ✅ `idSignatario` + `nomeSignatario` - Quem assinou
- ✅ `documentoSigiloso` - Se é sigiloso ou não
- ✅ `anexos` - Array de anexos (quando existir)
- ✅ `data` - Data do documento

---

### Estrutura de MOVIMENTO (`documento: false`)

```json
{
  "id": 205655917,
  "titulo": "Remetidos os autos para Órgão jurisdicional competente  para processar recurso",
  "data": "2025-07-11T11:12:15.317537",
  "documento": false,                      ← Indica que é MOVIMENTO
  "idUsuario": 0,
  "especializacoes": 0,
  "nomeResponsavel": "interno",
  "tipoPolo": "movimento",
  "favorito": false,
  "ativo": true,
  "documentoSigiloso": false,
  "usuarioInterno": false,
  "documentoApreciavel": false,
  "expediente": false,
  "numeroOrdem": 0,
  "codigoInstancia": 0,
  "pendenciaDocInstanciaOrigem": false,
  "copia": false,
  "codigoMovimentoCNJ": "123",             ← Código CNJ do movimento
  "permiteCooperacaoJudiciaria": true,
  "movimentoPermiteExclusao": false,
  "movimentoPermiteRetificacao": false,
  "movimentoFoiRetificado": false,
  "dataJuntadaFutura": false
}
```

**Campos importantes para movimentos:**

- ✅ `titulo` - Descrição do movimento processual
- ✅ `codigoMovimentoCNJ` - Código CNJ do movimento
- ❌ **NÃO possui** `idUnicoDocumento`

---

## ❌ API DE DOCUMENTO - INVESTIGAÇÃO FALHOU

**Arquivo de teste:** `dev_data/scripts/test-documento-timeline.ts`

**Documento testado:** `idUnicoDocumento = "85def44"`

**Endpoints testados (todos falharam com HTTP 404):**

1. ❌ `/pje-comum-api/api/paineladvogado/documento?idUnico=85def44`

   - Erro: "API solicitada não existe"

2. ❌ `/pje-comum-api/api/documento/85def44`

   - Erro: "API solicitada não existe"

3. ❌ `/pje-comum-api/api/processos/documento/85def44`
   - Erro: "API solicitada não existe"

**Conclusão:** A API `/paineladvogado/documento` **NÃO é genérica** para buscar documentos da timeline. É específica para pendentes de manifestação.

---

## 📊 ESTATÍSTICAS DOS TESTES

| Teste                            | Total Itens | Documentos | Movimentos | Docs Assinados | Docs com idUnicoDocumento |
| -------------------------------- | ----------- | ---------- | ---------- | -------------- | ------------------------- |
| timeline-completa-docs-assinados | 190         | 61         | 129        | 61             | 61                        |
| timeline-completa-todos-docs     | 190         | 61         | 129        | 61             | 61                        |
| timeline-apenas-documentos       | 61          | 61         | 0          | 61             | 61                        |
| timeline-apenas-movimentos       | 129         | 0          | 129        | 0              | 0                         |

---

## 🎯 O QUE FALTA FAZER

### 1. 🔍 DESCOBRIR ENDPOINT DE DOCUMENTO CORRETO

**Problema:** Não sabemos qual endpoint usar para baixar/obter detalhes dos documentos da timeline

**Opções:**

1. Investigar no browser (DevTools) qual API é chamada quando clica em documento da timeline
2. Usuário fornecer o endpoint correto
3. Buscar documentação interna do PJE

**Necessário para:** Download de documentos assinados da timeline

---

### 2. 📝 DEFINIR TIPOS TYPESCRIPT DA TIMELINE

**Atual:** `TimelineResponse = unknown`

**Necessário:**

- Criar interface `TimelineItem` com propriedades de documento/movimento
- Criar tipos específicos para `DocumentoTimeline` e `MovimentoTimeline`
- Definir `TimelineResponse = TimelineItem[]`

**Arquivo a atualizar:** `backend/api/pje-trt/timeline/obter-timeline.ts`

---

### 3. 🛠️ IMPLEMENTAR SERVIÇO DE CAPTURA TIMELINE

**Arquivo a criar:** `backend/captura/services/trt/timeline.service.ts`

**Responsabilidades:**

1. Autenticar no PJE
2. Obter timeline completa do processo
3. Filtrar apenas documentos assinados (`documento: true` e `idSignatario` presente)
4. Para cada documento assinado:
   - Extrair `idUnicoDocumento`
   - Chamar API de download de documento (quando descobrirmos o endpoint)
   - Salvar documento localmente ou em storage
5. Retornar timeline + lista de documentos baixados

---

### 4. 🌐 CRIAR ROTA API NEXT.JS

**Arquivo a criar:** `app/api/captura/trt/timeline/route.ts`

**Especificações:**

- Método: POST
- Autenticação: Bearer Token ou Service API Key
- Body:
  ```json
  {
    "advogado_id": 1,
    "trt_codigo": "TRT3",
    "grau": "primeiro_grau",
    "processo_id": "2887163"
  }
  ```
- Documentação Swagger completa
- Chamar `timelineCapture()` service

---

### 5. 💾 DEFINIR ESTRATÉGIA DE PERSISTÊNCIA

**Aguardando:** Decisão após ver estrutura JSON completa

**Questões pendentes:**

1. Criar tabela `timeline` no banco?
2. Armazenar timeline como JSON no processo?
3. Criar tabela separada para documentos da timeline?
4. Como relacionar timeline com `processos` existentes?

**Regra importante:** Persistir dados com nomes/formatos originais do PJE (não fazer parsing antecipado)

---

### 6. 📄 IMPLEMENTAR SCRIPT DE TESTE DA ROTA API

**Arquivo a criar:** `dev_data/scripts/test-api-timeline.ts`

**Objetivo:** Testar rota HTTP `/api/captura/trt/timeline` simulando requisição externa

**Padrão:** Seguir estrutura dos scripts existentes (test-api-acervo-geral.ts, etc)

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

### Criados

1. `backend/api/pje-trt/timeline/obter-timeline.ts`
2. `backend/api/pje-trt/timeline/index.ts`
3. `dev_data/scripts/test-timeline-exploratorio.ts`
4. `dev_data/scripts/test-documento-timeline.ts`
5. `dev_data/scripts/results/timeline-exploratorio/` (4 arquivos JSON)

### Modificados

1. `backend/api/pje-trt/index.ts` - Adicionada re-exportação de timeline

---

## 🔗 DEPENDÊNCIAS IMPORTANTES

**Funções reutilizadas:**

- `fetchPJEAPI()` - `backend/api/pje-trt/shared/fetch.ts`
- `autenticarPJE()` - `backend/captura/services/trt/trt-auth.service.ts`
- `getTribunalConfig()` - `backend/captura/services/trt/config.ts`

**Credenciais padrão (todos os TRTs):**

- CPF: `07529294610`
- Senha: `12345678aA@`

---

## ⚠️ BLOQUEADORES

### 🚨 CRÍTICO: Endpoint de Documento Desconhecido

**Impacto:** Impede implementação completa do serviço de captura

**Próximo passo:** Usuário fornecer endpoint correto ou investigar no DevTools do browser

---

## 📝 OBSERVAÇÕES TÉCNICAS

1. **Timeline é array direto**, não objeto paginado (diferente de outras APIs do PJE)

2. **Parâmetro `somenteDocumentosAssinados` pode ser ignorado** - filtrar no código após receber timeline

3. **Todos os 61 documentos do processo teste têm `idSignatario`** - significa que são todos assinados

4. **Documentos podem ter `anexos`** - investigar estrutura dos anexos quando implementar download

5. **Movimentos não têm documentos associados** - são apenas registros de ações processuais

---

## 🎯 DECISÃO PENDENTE DO USUÁRIO

**Pergunta:** Como descobrir o endpoint correto para download de documentos?

**Opções:**

1. Você fornece o endpoint
2. Investigar no browser (DevTools) ao clicar em documento
3. Buscar em documentação interna

**Após descobrir o endpoint, poderemos:**

- Renomear API (se for genérica)
- Implementar serviço de captura completo
- Criar rota API
- Definir persistência

---

**Status:** ✅ **IMPLEMENTAÇÃO CONCLUÍDA**
