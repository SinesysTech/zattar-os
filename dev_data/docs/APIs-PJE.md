# 📡 APIs do PJE

Documentação completa das APIs REST do PJE implementadas no sistema.

**Última atualização**: 2025-11-16  
**Versão da API**: PJE 2.15.2 - COPAÍBA

## 🔐 Autenticação

O PJE usa autenticação via SSO (Single Sign-On) com cookies de sessão.

### Fluxo de Login Detalhado

**Passo 1: Acesso inicial**
- URL: `https://pje.trt3.jus.br/primeirograu/login.seam`
- Ação: Página carrega com botões de login

**Passo 2: Click em SSO PDPJ**
- Seletor: `#btnSsoPdpj`
- Ação: Clicar no botão "Entrar com PDPJ"
- Resultado: Redirecionamento para SSO

**Passo 3: Redirect para SSO**
- URL destino: `https://sso.cloud.pje.jus.br/auth/realms/pje/...`
- Domínio: `sso.cloud.pje.jus.br` (não é o domínio PJE)

**Passo 4: Preenchimento de credenciais**
- Campo CPF: `#username`
- Campo Senha: `#password`
- Botão Submit: `#kc-login`
- Ação: Preencher CPF e senha, depois clicar em submit

**Passo 5: OTP (se necessário)**
- Campo OTP: `#otp` ou `input[name="otp"]`
- Botão Submit: `#kc-login` (mesmo botão)
- Ação: Preencher OTP obtido do 2FAuth, depois clicar em submit
- **Nota**: OTP pode ser necessário dependendo da configuração da conta
- **Validade**: OTP expira em 30 segundos
- **Retry Logic**: Sistema tenta até 3 vezes se OTP expirar
- **Detecção de erro**: Verifica mensagens de erro na página após submit

**Passo 6: Redirect para authenticateSSO.seam**
- URL: `https://pje.trt3.jus.br/primeirograu/authenticateSSO.seam?...`
- **Importante**: É aqui que o cookie `access_token` é criado
- Domínio: `pje.trt3.jus.br` (já está no domínio PJE)

**Passo 7: Redirect final para pjekz**
- URL: `https://pje.trt3.jus.br/pjekz`
- Ação: Página Angular carrega
- **Status**: Cookie `access_token` já está disponível

**Passo 8: Cookie disponível**
- Nome: `access_token`
- Domínio: `.pje.trt3.jus.br` (com ponto inicial)
- Path: `/`
- HttpOnly: `true`
- Secure: `true`
- Formato: JWT (3 partes separadas por ponto)

### Cookies da Sessão

#### Cookie `access_token`

**Propriedades:**
- **Nome**: `access_token`
- **Domínio**: `.pje.trt3.jus.br` (com ponto inicial, permite subdomínios)
- **Path**: `/`
- **HttpOnly**: `true` (não acessível via JavaScript)
- **Secure**: `true` (apenas HTTPS)
- **Formato**: JWT (JSON Web Token)

**Estrutura do JWT:**
```
header.payload.signature
```

**Payload (decodificado) contém:**
- `id`: ID do advogado (idAdvogado)
- `idUsuario`: ID do usuário
- `exp`: Timestamp de expiração
- `iat`: Timestamp de criação
- Outros campos de permissão e perfil

**Como extrair (implementado em `auth-helpers.ts`):**
```typescript
const cookies = await page.context().cookies();
const accessToken = cookies.find(c => 
  c.name === 'access_token' && 
  c.domain.includes('pje.trt3.jus.br')
);

// Decodificar payload (base64)
const parts = accessToken.value.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
const idAdvogado = payload.id;
```

#### Cookie `Xsrf-Token`

**Propriedades:**
- **Nome**: `Xsrf-Token`
- **Uso**: Proteção CSRF para requisições POST/PUT/DELETE
- **Opcional**: Não sempre presente, mas recomendado incluir quando disponível

**Como usar:**
```typescript
headers['X-XSRF-Token'] = xsrfTokenCookie.value;
```

### OTP Retry Logic (Implementado)

O sistema possui lógica de retry para OTP expirado:

**Configuração:**
- **Tentativas máximas**: 3
- **Validade do token**: 30 segundos
- **Detecção de erro**: Busca por mensagens como "inválido", "invalid", "código", "incorreto" na página

**Fluxo:**
1. Obtém OTP do 2FAuth
2. Preenche e submete
3. Aguarda 5 segundos
4. Verifica se há mensagem de erro
5. Se erro E tentativas < 3: obtém novo OTP e tenta novamente
6. Se sucesso OU tentativas >= 3: continua ou falha

**Implementação:** [lib/services/pje/auth-helpers.ts](../../lib/services/pje/auth-helpers.ts) - Função `handlePDPJLogin()`

### Timeouts Esperados

O fluxo completo de autenticação e scraping tem tempos típicos:

| Etapa | Tempo Normal | Tempo Máximo |
|-------|-------------|--------------|
| Login SSO | 30-60s | 120s |
| OTP (se necessário) | 10-20s | 60s (até 3 tentativas) |
| Redirects SSO | 20-40s | 90s |
| Carregamento pjekz | 10-20s | 60s |
| Chamada API | 5-10s | 30s |
| **Total** | **75-150s** | **5-8 minutos** |

**Nota**: Com problemas de rede, latência alta ou bloqueios do CloudFront, o tempo total pode chegar a 5-8 minutos.

**Recomendação**: Configure timeout de pelo menos 600 segundos (10 minutos) para garantir que o fluxo completo tenha tempo suficiente.

## 📊 APIs Principais

### 1. Totalizadores do Painel

Retorna a contagem de processos por categoria.

**Endpoint:**
```
GET /pje-comum-api/api/paineladvogado/{idAdvogado}/totalizadores?tipoPainelAdvogado=0
```

**Parâmetros:**
- `idAdvogado`: ID do perfil do advogado (obtido da API de perfis)
- `tipoPainelAdvogado`: Tipo do painel (0 = padrão)

**Resposta:**
```json
[
  {
    "quantidadeProcessos": 1279,
    "idAgrupamentoProcessoTarefa": 1,
    "nomeAgrupamentoTarefa": "Acervo Geral",
    "ordem": 1,
    "destaque": false
  },
  {
    "quantidadeProcessos": 107,
    "idAgrupamentoProcessoTarefa": 2,
    "nomeAgrupamentoTarefa": "Pendentes de Manifestação",
    "ordem": 2,
    "destaque": false
  },
  {
    "quantidadeProcessos": 8769,
    "idAgrupamentoProcessoTarefa": 5,
    "nomeAgrupamentoTarefa": "Arquivados",
    "ordem": 3,
    "destaque": false
  }
]
```

### 2. Lista de Processos (Paginada)

Retorna lista paginada de processos de um agrupamento específico.

**Endpoint:**
```
GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos
```

**Parâmetros Obrigatórios:**
- `idAdvogado`: ID do perfil do advogado (obtido do JWT após autenticação)
- `idAgrupamentoProcessoTarefa`: ID do agrupamento
  - `1` = Acervo Geral
  - `2` = Pendentes de Manifestação
  - `5` = Arquivados
- `pagina`: Número da página (começa em 1)
- `tamanhoPagina`: Registros por página (máximo: 100)

**Parâmetros Opcionais (específicos para Pendentes de Manifestação):**
- `agrupadorExpediente`: Filtro de prazo para expedientes pendentes
  - `'I'` = Sem prazo (expedientes sem data final)
  - `'N'` = No prazo (expedientes com data final)
- `tipoPainelAdvogado`: Tipo do painel (usar `2` para Pendentes de Manifestação)
- `idPainelAdvogadoEnum`: ID do painel (usar `2` para Pendentes de Manifestação)
- `ordenacaoCrescente`: Ordenação crescente/decrescente (`false` = mais recentes primeiro)

**Resposta:**
```json
{
  "pagina": 1,
  "tamanhoPagina": 100,
  "qtdPaginas": 13,
  "totalRegistros": 1279,
  "resultado": [
    {
      "id": 2887163,
      "descricaoOrgaoJulgador": "22ª VARA DO TRABALHO DE BELO HORIZONTE",
      "classeJudicial": "ATOrd",
      "numero": 10014,
      "numeroProcesso": "0010014-94.2025.5.03.0022",
      "segredoDeJustica": false,
      "codigoStatusProcesso": "DISTRIBUIDO",
      "prioridadeProcessual": 8,
      "nomeParteAutora": "DRIELLE TAMARA RAMOS DE OLIVEIRA PIRES",
      "qtdeParteAutora": 1,
      "nomeParteRe": "TIM S A",
      "qtdeParteRe": 1,
      "dataAutuacao": "2025-01-10T13:03:15.862",
      "juizoDigital": true,
      "dataArquivamento": "2025-07-11T11:12:15.261",
      "dataProximaAudiencia": null,
      "temAssociacao": false
    }
  ]
}
```

### 3. Pauta de Audiências

Retorna lista paginada de audiências marcadas para o advogado em um período específico.

**Endpoint:**
```
GET /pje-comum-api/api/pauta-usuarios-externos
```

**Parâmetros Obrigatórios:**
- `dataInicio`: Data inicial do período de busca (formato: `YYYY-MM-DD`)
- `dataFim`: Data final do período de busca (formato: `YYYY-MM-DD`)
- `numeroPagina`: Número da página (inicia em 1)
- `tamanhoPagina`: Quantidade de registros por página (máximo: 100)

**Parâmetros Opcionais:**
- `codigoSituacao`: Código da situação da audiência
  - `'M'` = Marcada/Designada (agendada)
  - `'R'` = Realizada
  - `'C'` = Cancelada
  - Padrão: `'M'`
- `ordenacao`: Ordenação dos resultados
  - `'asc'` = Crescente (mais antigas primeiro)
  - `'desc'` = Decrescente (mais recentes primeiro)
  - Padrão: `'asc'`

**Resposta:**
```json
{
  "pagina": 1,
  "tamanhoPagina": 19,
  "qtdPaginas": 0,
  "totalRegistros": 19,
  "resultado": [
    {
      "id": 5380993,
      "dataInicio": "2025-11-19T09:00:00",
      "dataFim": "2025-11-19T10:00:00",
      "salaAudiencia": {
        "nome": "72ª Vara do Trabalho do Rio de Janeiro",
        "id": 123
      },
      "status": "M",
      "processo": {
        "id": 3071219,
        "numero": "0101182-81.2025.5.01.0072",
        "classeJudicial": {
          "id": 989,
          "descricao": "Reclamação Trabalhista"
        },
        "orgaoJulgador": {
          "id": 234,
          "nome": "72ª Vara do Trabalho do Rio de Janeiro"
        }
      },
      "tipo": {
        "id": 46,
        "descricao": "Una"
      },
      "poloAtivo": {
        "nome": "JOÃO DA SILVA",
        "cpf": "123.456.789-00"
      },
      "poloPassivo": {
        "nome": "EMPRESA LTDA",
        "cnpj": "12.345.678/0001-00"
      },
      "urlAudienciaVirtual": "https://trt1-jus-br.zoom.us/j/85739445124",
      "pautaAudienciaHorario": {
        "horaInicial": "09:00:00",
        "horaFinal": "10:00:00"
      }
    }
  ]
}
```

**Nota sobre Paginação:**
- Quando todos os resultados cabem em uma única página (`tamanhoPagina >= totalRegistros`), a API pode retornar `qtdPaginas: 0`
- Neste caso, verifique o campo `resultado` para obter os dados, mesmo que `qtdPaginas` seja 0

### 4. Lista de Processos Arquivados

Retorna lista paginada de processos arquivados.

**Endpoint:**
```
GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos
```

**Parâmetros Obrigatórios:**
- `idAdvogado`: ID do perfil do advogado (obtido do JWT após autenticação)
- `idAgrupamentoProcessoTarefa`: ID do agrupamento (usar `5` para Arquivados)
- `pagina`: Número da página (começa em 1)
- `tamanhoPagina`: Registros por página (máximo: 100)

**Parâmetros Opcionais (específicos para Arquivados):**
- `tipoPainelAdvogado`: Tipo do painel (usar `5` para Arquivados)
- `ordenacaoCrescente`: Ordenação crescente/decrescente (`false` = mais recentes primeiro)
- `data`: Timestamp atual (para cache/controle de versão)

**Resposta:**
```json
{
  "pagina": 1,
  "tamanhoPagina": 100,
  "qtdPaginas": 4,
  "totalRegistros": 357,
  "resultado": [
    {
      "id": 1742759,
      "descricaoOrgaoJulgador": "1ª Vara do Trabalho de Macaé",
      "classeJudicial": "ATOrd",
      "numero": 1679,
      "numeroProcesso": "0001679-78.2012.5.01.0481",
      "segredoDeJustica": false,
      "codigoStatusProcesso": "DISTRIBUIDO",
      "prioridadeProcessual": 0,
      "nomeParteAutora": "RAFAELLA PIRES PASSOS",
      "qtdeParteAutora": 1,
      "nomeParteRe": "SCHLUMBERGER SERVICOS DE PETROLEO LTDA",
      "qtdeParteRe": 1,
      "dataAutuacao": "2012-10-17T00:00:00",
      "juizoDigital": false,
      "dataArquivamento": "2021-01-21T10:07:27.055",
      "temAssociacao": false
    }
  ]
}
```

**Nota:** A estrutura de dados retornada é idêntica à de Acervo Geral. A diferença está apenas no agrupamento (`idAgrupamentoProcessoTarefa=5`) e nos parâmetros adicionais (`tipoPainelAdvogado=5`).

## 🔄 Fluxo Completo de Raspagem

```
1. Login no PJE
   └─> Obter cookies de sessão

2. GET /pje-seguranca/api/token/perfis
   └─> Extrair idPerfil (idAdvogado)

3. GET /pje-comum-api/api/paineladvogado/{idAdvogado}/totalizadores
   └─> Obter quantidades por categoria

4. Para cada categoria (Acervo Geral, Pendentes, Arquivados):

   a. Inicializar: pagina = 1

   b. GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos
           ?idAgrupamentoProcessoTarefa={id}
           &pagina={pagina}
           &tamanhoPagina=100

   c. Processar resultado

   d. Se pagina < qtdPaginas:
      - pagina++
      - Voltar para (b)

   e. Salvar todos os processos em arquivo JSON

5. Gerar relatório final
```

## 📊 Agrupamentos de Processos

| ID | Nome | Descrição |
|----|------|-----------|
| 1 | Acervo Geral | Todos os processos ativos |
| 2 | Pendentes de Manifestação | Processos aguardando manifestação (suporta filtro de prazo) |
| 5 | Arquivados | Processos arquivados |

### Filtros para Pendentes de Manifestação

Quando usar `idAgrupamentoProcessoTarefa=2` (Pendentes de Manifestação), é possível filtrar por prazo:

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `agrupadorExpediente` | `'I'` | Expedientes sem prazo (sem data final) |
| `agrupadorExpediente` | `'N'` | Expedientes no prazo (com data final) |
| `tipoPainelAdvogado` | `2` | Identifica Pendentes de Manifestação |
| `idPainelAdvogadoEnum` | `2` | Identifica Pendentes de Manifestação |
| `ordenacaoCrescente` | `false` | Mais recentes primeiro (recomendado) |


## 📄 Download de Documentos (PDFs)

### Endpoint: Download de PDF de Documento/Expediente

Retorna o arquivo PDF de um documento ou expediente associado a um processo.

**Endpoint Principal:**
```
GET /pje-comum-api/api/processos/id/{idProcesso}/documentos/id/{idDocumento}/conteudo
```

**Parâmetros:**
- `idProcesso`: ID do processo (campo `id` retornado pela API de processos)
- `idDocumento`: ID do documento/expediente (campo `idDocumento` em Pendentes de Manifestação)

**Headers:**
- `Accept`: `application/pdf` ou `application/octet-stream`
- `Cookie`: Cookies de sessão (autenticação via cookies)

**Resposta:**
- **Content-Type**: `application/pdf` ou `application/octet-stream`
- **Body**: Arquivo PDF em formato binário

### Endpoints Alternativos (Fallback)

Diferentes tribunais podem usar endpoints variados. A implementação tenta múltiplos endpoints:

1. **Primary (TRT3)**: `/pje-comum-api/api/processos/id/{idProcesso}/documentos/id/{idDocumento}/conteudo`
2. **Com idBin**: `/pje-comum-api/api/binarios/{idBin}`
3. **Direto por documento**: `/pje-comum-api/api/documentos/{idDocumento}/conteudo`
4. **Download direto**: `/pje-comum-api/api/documentos/{idDocumento}/download`
5. **Com processo**: `/pje-comum-api/api/processos/{idProcesso}/documentos/{idDocumento}/pdf`
6. **Expedientes**: `/pje-comum-api/api/expedientes/{idDocumento}/pdf`

### Fluxo de Download (Two-step)

Para garantir sucesso, a implementação usa um fluxo de duas etapas:

**Etapa 1: Obter metadados do documento (para extrair idBin)**
```
GET /pje-comum-api/api/processos/id/{idProcesso}/documentos/id/{idDocumento}?incluirAssinatura=false&incluirAnexos=false
```

**Resposta:**
```json
{
  "id": 67890,
  "idBin": 123456,
  "tipoDocumento": "PDF",
  "nomeDocumento": "Manifestação",
  "dataAssinatura": "2025-11-08T10:30:00"
}
```

**Etapa 2: Download do PDF usando idBin (se disponível)**

Com o `idBin`, a implementação tenta múltiplos endpoints de download.

### Exemplo de Uso

```typescript
// Usando Playwright/Puppeteer page.evaluate()
const pdfBase64 = await page.evaluate(
  async ({ idProcesso, idDocumento }) => {
    const url = `/pje-comum-api/api/processos/id/${idProcesso}/documentos/id/${idDocumento}/conteudo`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Cookies enviados automaticamente
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Converter para base64 no contexto do browser
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },
  { idProcesso: 3071997, idDocumento: 67890 }
);

// Converter base64 de volta para Buffer no Node.js
const pdfBuffer = Buffer.from(pdfBase64, 'base64');

// Validar PDF signature
if (!pdfBuffer.toString('utf-8', 0, 4).startsWith('%PDF')) {
  throw new Error('Downloaded file is not a valid PDF');
}
```

### Validação

- **Signature check**: Todo PDF deve começar com `%PDF` nos primeiros 4 bytes
- **Content-Type check**: Aceita `application/pdf` ou `application/octet-stream`
- **Erro handling**: Implementa retry em múltiplos endpoints

### Implementação

- [lib/services/pje/enrichment-helpers.ts](../../lib/services/pje/enrichment-helpers.ts) - Função `downloadDocumentoPdf()`

## 🔗 Processos Associados

### Endpoint: Buscar Processo Associado

Retorna dados completos de um processo associado (vinculado) a outro processo.

**Endpoint Principal:**
```
GET /pje-comum-api/api/processos/id/{idProcesso}/associacoes
```

**Parâmetros:**
- `idProcesso`: ID do processo principal (campo `id` retornado pela API)

**Headers:**
- `Accept`: `application/json`
- `Cookie`: Cookies de sessão (autenticação via cookies)

**Resposta:**
```json
[
  {
    "numeroProcesso": "0010014-94.2025.5.03.0022",
    "classeJudicial": "ATOrd",
    "nomeParteAutora": "DRIELLE TAMARA RAMOS DE OLIVEIRA PIRES",
    "nomeParteRe": "TIM S A",
    "orgaoJulgador": "22ª VARA DO TRABALHO DE BELO HORIZONTE",
    "dataAutuacao": "2025-01-10T13:03:15.862",
    "tipoAssociacao": "Vinculado",
    "metadata": {
      // ... outros campos do processo
    }
  }
]
```

### Endpoints Alternativos (Fallback)

A implementação tenta múltiplos endpoints para compatibilidade com diferentes tribunais:

1. `/pje-comum-api/api/processos/id/{idProcesso}/associacoes`
2. `/pje-comum-api/api/processos/{idProcesso}/associacoes`
3. `/pje-comum-api/api/processos/id/{idProcesso}/vinculos`
4. `/pje-comum-api/api/processos/{idProcesso}/vinculos`
5. `/pje-comum-api/api/processos/id/{idProcesso}?includeAssociados=true`
6. `/pje-comum-api/api/processos/{idProcesso}?includeAssociados=true`

### Quando Buscar Processo Associado

O campo `temAssociacao` nos processos indica se há processo associado:

```json
{
  "id": 2887163,
  "numeroProcesso": "0010014-94.2025.5.03.0022",
  "temAssociacao": true,  // ← Indica que há processo associado
  // ... outros campos
}
```

**Lógica de busca:**
```typescript
if (processo.temAssociacao === true) {
  const associado = await fetchProcessoAssociado(page, processo.id);
  if (associado) {
    processo.processoAssociado = associado;
  }
}
```

### Estrutura de Resposta

A resposta pode variar entre tribunais. A implementação trata múltiplos formatos:

**Formato 1: Array direto**
```json
[
  { "numeroProcesso": "...", "classeJudicial": "..." }
]
```

**Formato 2: Wrapped em "processos"**
```json
{
  "processos": [
    { "numeroProcesso": "...", "classeJudicial": "..." }
  ]
}
```

**Formato 3: Wrapped em "associacoes"**
```json
{
  "associacoes": [
    { "numeroProcesso": "...", "classeJudicial": "..." }
  ]
}
```

A implementação `parseAssociadoResponse()` normaliza todos esses formatos.

### Campos Extraídos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `numeroProcesso` | string | Número do processo associado (formato CNJ) |
| `classeJudicial` | string | Classe judicial (ex: "ATOrd", "RecTrab") |
| `nomeParteAutora` | string | Nome da parte autora |
| `nomeParteRe` | string | Nome da parte ré |
| `orgaoJulgador` | string | Nome do órgão julgador |
| `dataAutuacao` | string | Data de autuação (ISO DateTime) |
| `tipoAssociacao` | string | Tipo de associação/vínculo |
| `metadata` | object | Objeto completo da resposta da API |

### Exemplo de Uso

```typescript
const processoAssociado = await page.evaluate(
  async ({ idProcesso }) => {
    const url = `/pje-comum-api/api/processos/id/${idProcesso}/associacoes`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  },
  { idProcesso: 3071997 }
);

// Processar resposta (pode ser array ou objeto wrapped)
const associado = Array.isArray(processoAssociado)
  ? processoAssociado[0]
  : processoAssociado?.processos?.[0] || processoAssociado?.associacoes?.[0];

console.log('Processo associado:', associado?.numeroProcesso);
```

### Implementação

- [lib/services/pje/enrichment-helpers.ts](../../lib/services/pje/enrichment-helpers.ts) - Função `fetchProcessoAssociado()`

### Tratamento de Erros

A busca de processos associados é **não-crítica**:
- Se falhar, retorna `null` sem interromper o scraping
- Processo principal ainda é salvo mesmo sem dados do associado
- Logs de debug mostram tentativas em todos os endpoints

## 🔒 Segurança

**Headers Necessários:**
- `Cookie`: Cookies de sessão obtidos após login
- `User-Agent`: User-Agent realista
- `Accept`: `application/json`

**IMPORTANTE - Autenticação:**
- ✅ **USE**: Autenticação via cookies automaticamente enviados pelo navegador
- ❌ **NÃO USE**: Header `Authorization: Bearer ${token}` - causa erro 401
- ✅ **Correto**: `credentials: 'include'` no fetch para envio automático de cookies
- ❌ **Incorreto**: Adicionar manualmente `Authorization` header

**Exemplo correto:**
```typescript
const response = await fetch(endpoint, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'X-XSRF-Token': xsrfToken, // Opcional
  },
  credentials: 'include', // Envia cookies automaticamente
});
```

**Proteções:**
- CloudFront (anti-bot)
- Rate limiting (evite muitas requisições simultâneas)
- Timeout de sessão (re-login necessário após período de inatividade)

## ⚙️ Limites e Boas Práticas

**Paginação:**
- Tamanho máximo de página: 100 registros
- Sempre use paginação para grandes volumes

**Rate Limiting:**
- Adicione delay entre requisições (500ms recomendado)
- Não faça mais de 2 requisições por segundo

**Timeouts:**
- Sessão expira após ~30 minutos de inatividade
- Implemente re-login automático se necessário

## 📝 Exemplos de Uso

### Exemplo 1: Buscar Acervo Geral

```javascript
const idAdvogado = 63042;
let todosProcessos = [];

// Primeira página
const primeira = await fetch(
  `/pje-comum-api/api/paineladvogado/${idAdvogado}/processos?` +
  `idAgrupamentoProcessoTarefa=1&` +
  `pagina=1&` +
  `tamanhoPagina=100`,
  {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'include'
  }
);
const dados = await primeira.json();
todosProcessos.push(...dados.resultado);

// Buscar páginas restantes
for (let p = 2; p <= dados.qtdPaginas; p++) {
  await delay(500);
  const response = await fetch(
    `/pje-comum-api/api/paineladvogado/${idAdvogado}/processos?` +
    `idAgrupamentoProcessoTarefa=1&` +
    `pagina=${p}&` +
    `tamanhoPagina=100`,
    {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    }
  );
  const page = await response.json();
  todosProcessos.push(...page.resultado);
}
```

### Exemplo 2: Buscar Pendentes de Manifestação (No Prazo)

```javascript
const idAdvogado = 63042;
let processosNoPrazo = [];

const primeira = await fetch(
  `/pje-comum-api/api/paineladvogado/${idAdvogado}/processos?` +
  `idAgrupamentoProcessoTarefa=2&` +
  `agrupadorExpediente=N&` +
  `tipoPainelAdvogado=2&` +
  `idPainelAdvogadoEnum=2&` +
  `ordenacaoCrescente=false&` +
  `pagina=1&` +
  `tamanhoPagina=100`,
  {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'include'
  }
);
const dados = await primeira.json();
processosNoPrazo.push(...dados.resultado);
```

### Exemplo 3: Buscar Pendentes de Manifestação (Sem Prazo)

```javascript
const idAdvogado = 63042;
let processosSemPrazo = [];

const primeira = await fetch(
  `/pje-comum-api/api/paineladvogado/${idAdvogado}/processos?` +
  `idAgrupamentoProcessoTarefa=2&` +
  `agrupadorExpediente=I&` +
  `tipoPainelAdvogado=2&` +
  `idPainelAdvogadoEnum=2&` +
  `ordenacaoCrescente=false&` +
  `pagina=1&` +
  `tamanhoPagina=100`,
  {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'include'
  }
);
const dados = await primeira.json();
processosSemPrazo.push(...dados.resultado);
```

### Exemplo 4: Buscar Audiências (Período Padrão: Hoje até +365 dias)

```javascript
const hoje = new Date();
const dataInicio = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
const dataFim = new Date(hoje.getTime() + 365 * 24 * 60 * 60 * 1000)
  .toISOString().split('T')[0]; // YYYY-MM-DD

let todasAudiencias = [];

const primeira = await fetch(
  `/pje-comum-api/api/pauta-usuarios-externos?` +
  `dataInicio=${dataInicio}&` +
  `dataFim=${dataFim}&` +
  `codigoSituacao=M&` +
  `numeroPagina=1&` +
  `tamanhoPagina=100&` +
  `ordenacao=asc`,
  {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'include'
  }
);
const dados = await primeira.json();
todasAudiencias.push(...dados.resultado);

// Nota: Se qtdPaginas=0 mas há resultados, todos estão na primeira página
if (dados.qtdPaginas > 1) {
  for (let p = 2; p <= dados.qtdPaginas; p++) {
    await delay(500);
    const response = await fetch(
      `/pje-comum-api/api/pauta-usuarios-externos?` +
      `dataInicio=${dataInicio}&` +
      `dataFim=${dataFim}&` +
      `codigoSituacao=M&` +
      `numeroPagina=${p}&` +
      `tamanhoPagina=100&` +
      `ordenacao=asc`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      }
    );
    const page = await response.json();
    todasAudiencias.push(...page.resultado);
  }
}
```

## 🐛 Troubleshooting

### Erro: Cookie `access_token` não encontrado

**Sintoma**: Scraping falha com erro "Cookie access_token não encontrado".

**Solução**: Verifique se o fluxo de login completou até o endpoint `authenticateSSO.seam`. Ver documentação em [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### Erro: Timeout durante login SSO

**Sintoma**: Timeout após 180-300 segundos durante o fluxo de login.

**Solução**: Aumentar timeout para 600 segundos (10 minutos). Ver documentação em [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### Erro: API retorna 401 Unauthorized

**Causas possíveis:**
1. Cookie expirou (sessão inativa por muito tempo)
2. Cookie inválido ou corrompido
3. Token JWT expirado (campo `exp` no payload)

**Solução:** Fazer novo login se token expirou.

### Erro: API retorna 403 Forbidden

**Sintoma**: CloudFront bloqueia requisições com 403.

**Causa**: WAF (Web Application Firewall) detectou comportamento de bot.

**Solução:**
1. Usar Firefox ao invés de Chrome (menos detectável)
2. Aumentar delays entre interações (2-3 segundos)
3. Aguardar 5-10 minutos antes de tentar novamente
4. Verificar configurações stealth no código
5. Usar User-Agent realista

### Chrome vs Firefox: Qual usar?

**Recomendação: Firefox** ✅

**Problemas do Chrome:**
- ❌ Popovers de gerenciamento de senha que roubam foco do campo OTP
- ❌ Alerta de "senha vazada" aparece durante login
- ❌ Impossível desabilitar completamente via args de linha de comando
- ❌ Interferência com automação de preenchimento de formulários

**Vantagens do Firefox:**
- ✅ Não exibe popovers de gerenciamento de senha
- ✅ Mais estável para automação de login com OTP
- ✅ Menos detectável como bot
- ✅ Configuração mais simples

**Configuração no código:**
```typescript
// .env ou .env.local
DEFAULT_BROWSER=firefox
HEADLESS=false
SCRAPING_TIMEOUT=60000
```

### Erro: API retorna 429 Too Many Requests

**Sintoma**: Rate limit excedido.

**Causa**: Muitas requisições em pouco tempo.

**Solução:**
1. Aumentar delays entre requisições (500ms-1s recomendado)
2. Não fazer mais de 2 requisições por segundo
3. Aguardar alguns minutos antes de tentar novamente
4. Implementar retry com exponential backoff

## 📚 Referências

- **Base URL**: Variável por TRT (ex: `https://pje.trt1.jus.br`, `https://pje.trt3.jus.br`)
- **API Base**: `/pje-comum-api/api`
- **Segurança**: `/pje-seguranca/api`
- **Frontend**: `/pjekz` (Angular application)

## 📋 Resumo das APIs Implementadas

| Endpoint | Método | Descrição | Status |
|----------|--------|-----------|--------|
| `/pje-comum-api/api/paineladvogado/{idAdvogado}/totalizadores` | GET | Totalizadores por categoria | ✅ Implementado |
| `/pje-comum-api/api/paineladvogado/{idAdvogado}/processos` | GET | Lista paginada de processos | ✅ Implementado |
| `/pje-comum-api/api/pauta-usuarios-externos` | GET | Pauta de audiências | ✅ Implementado |

### Observações Importantes

1. **Autenticação**: Todas as APIs requerem autenticação via cookies de sessão (`access_token` obtido após login SSO)
2. **ID do Advogado**: Obtido do JWT (`access_token`) após autenticação, campo `id` no payload
3. **Paginação**: Quando `qtdPaginas=0` mas há `totalRegistros>0`, todos os resultados estão na primeira página
4. **Filtros de Prazo**: Aplicáveis apenas para `idAgrupamentoProcessoTarefa=2` (Pendentes de Manifestação)



