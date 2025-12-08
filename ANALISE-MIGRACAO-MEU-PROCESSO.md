# Análise Técnica e Plano de Migração: Meu Processo Zattar Advogados

**Data:** 08 de dezembro de 2025  
**Repositório Analisado:** `/Users/jordanmedeiros/Documents/GitHub/meu-processo-zattar-advogados`  
**Sistema Destino:** Sinesys (projeto atual)

---

## 📋 Índice

1. [Resumo Executivo](#resumo-executivo)
2. [Análise do Sistema Atual](#análise-do-sistema-atual)
3. [Arquitetura do Sistema Sinesys](#arquitetura-do-sistema-sinesys)
4. [Mapeamento de Dados e APIs](#mapeamento-de-dados-e-apis)
5. [Plano de Migração](#plano-de-migração)
6. [Questões Técnicas para Esclarecimento](#questões-técnicas-para-esclarecimento)
7. [Riscos e Mitigações](#riscos-e-mitigações)
8. [Cronograma Estimado](#cronograma-estimado)

---

## 📊 Resumo Executivo

### Contexto
O aplicativo **Meu Processo Zattar Advogados** é uma aplicação cliente-facing que permite aos clientes do escritório acompanhar seus processos jurídicos. Atualmente, consome dados de um webhook N8N que retorna informações processadas de uma base de dados antiga.

### Objetivo da Migração
Atualizar o aplicativo para consumir dados diretamente das APIs REST do novo sistema **Sinesys**, eliminando a dependência do webhook N8N e garantindo dados em tempo real com maior confiabilidade.

### Tecnologias Envolvidas
- **App Cliente:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **API Sinesys:** Next.js 16 API Routes, Supabase (PostgreSQL), MongoDB, Redis

---

## 🔍 Análise do Sistema Atual

### Arquitetura Atual

```mermaid
graph LR
    A[App Meu Processo] --> B[API Interna /api/consulta]
    B --> C[Webhook N8N]
    C --> D[Base de Dados Antiga]
    D --> C
    C --> B
    B --> A
```

### Estrutura do Projeto

```
meu-processo-zattar-advogados/
├── app/
│   ├── dashboard/              # Páginas do dashboard
│   │   ├── processos/         # Visualização de processos
│   │   ├── contratos/         # Listagem de contratos
│   │   ├── audiencias/        # Calendário de audiências
│   │   └── pagamentos/        # Acordos e condenações
│   ├── api/
│   │   └── consulta/
│   │       └── route.ts       # Proxy para webhook N8N
│   ├── components/            # Componentes UI
│   └── page.tsx               # Página de busca por CPF
├── contexts/
│   └── DashboardContext.tsx   # Gerenciamento de estado
├── types/
│   └── legal.ts               # Definições TypeScript
└── package.json
```

### Fluxo de Dados Atual

1. **Entrada:** Usuário insere CPF na página inicial
2. **Requisição:** `/api/consulta` recebe POST com CPF
3. **Proxy:** Endpoint faz chamada HTTP com Basic Auth para webhook N8N
4. **Processamento N8N:** Workflow busca dados na base antiga e transforma
5. **Resposta:** JSON retorna com estrutura específica
6. **Cache:** Dados salvos no `localStorage` do navegador
7. **Renderização:** Dashboard exibe informações

### Estrutura de Dados Retornada (N8N)

```typescript
interface ConsultaCPFResponse {
  contratos: Contrato[] | string;
  acordos_condenacoes: Pagamento[];
  audiencias: Audiencia[];
  processos: ProcessoItem[];
  message?: string;
}
```

#### Tipos Detalhados

**Contrato:**
```typescript
{
  cliente_nome: string;
  cliente_cpf: string;
  parte_contraria: string;
  processo_tipo_nome: string;
  data_admissao?: string;
  data_rescisao?: string;
  data_assinou_contrato: string;
  estagio: string;
  data_estagio: string;
  numero_processo: string;
}
```

**Audiencia:**
```typescript
{
  data_hora: string;
  polo_ativo: string;
  polo_passivo: string;
  numero_processo: string;
  modalidade: string;
  local_link: string | null;
  status: string;
  orgao_julgador: string;
  tipo: string;
  sala: string;
  advogado: string;
  detalhes: string | null;
  cliente_nome: string;
}
```

**Pagamento (Acordo/Condenação):**
```typescript
{
  numero_processo: string;
  parte_autora: string;
  parte_contraria: string;
  data_homologacao: string;
  tipo_pagamento: string;
  forma_pagamento: string;
  modalidade_pagamento: string;
  valor_bruto: string;
  valor_liquido: string;
  quantidade_parcelas: number;
  parcela_numero: number;
  data_vencimento: string;
  valor_liquido_parcela: string;
  repassado_cliente: string; // 'Y' ou 'N'
  data_repassado_cliente: string;
}
```

**Processo:**
```typescript
{
  processo?: {
    parteAutora: string;
    parteRe: string;
    tribunal: string;
    numero: string;
    valorDaCausa: string;
    jurisdicaoEstado: string;
    jurisdicaoMunicipio: string;
    instancias: {
      primeirograu: Instancia | null;
      segundograu: Instancia | null;
      terceirograu: Instancia | null;
    };
  };
  result?: string; // Mensagem de erro se processo não disponível
}
```

### Autenticação Atual

**Método:** Basic Authentication  
**Credenciais:**
- Usuário: `meu_processo`
- Senha: `yC2su27Gr3vxr4G7`
- Webhook ID: `be254d47-ee8b-4e29-9ed8-3fae7a20fa01`

**URL:** `https://workflows.platform.sinesys.app/webhook/meu-processo`

### Funcionalidades Implementadas

✅ **Busca por CPF** - Consulta dados do cliente  
✅ **Dashboard Responsivo** - Interface adaptável  
✅ **Visualização de Processos** - Cards com timeline  
✅ **Listagem de Contratos** - Informações contratuais  
✅ **Calendário de Audiências** - Próximas e passadas  
✅ **Acordos/Condenações** - Parcelas e pagamentos  
✅ **Cache Local** - Otimização com `localStorage`  
✅ **Estados de Loading** - Skeletons e feedback  
✅ **Tratamento de Erros** - Mensagens amigáveis  

---

## 🏗️ Arquitetura do Sistema Sinesys

### Visão Geral

```mermaid
graph TB
    A[App Meu Processo] --> B[API Sinesys]
    B --> C[Autenticação Supabase]
    B --> D[PostgreSQL/Supabase]
    B --> E[MongoDB Timeline]
    B --> F[Redis Cache]
    
    C --> G[JWT Token]
    C --> H[Service API Key]
```

### Stack Tecnológico

| Componente | Tecnologia |
|------------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **API** | Next.js API Routes (REST) |
| **Banco Principal** | Supabase (PostgreSQL) |
| **Timeline/Docs** | MongoDB |
| **Cache** | Redis (ioredis) |
| **Autenticação** | Supabase Auth + Service API Key |
| **Storage** | Supabase Storage + Backblaze B2 |

### Métodos de Autenticação

O Sinesys suporta **3 métodos de autenticação**:

#### 1. Bearer Token (JWT)
```bash
Authorization: Bearer <token_jwt>
```
- Para usuários autenticados via Supabase Auth
- Token obtido após login

#### 2. Session Cookie
```bash
Cookie: sb-access-token=<token>
```
- Automático após login no navegador
- Gerenciado pelo Supabase Client

#### 3. Service API Key ⭐ **RECOMENDADO PARA O APP CLIENTE**
```bash
x-service-api-key: <chave_api>
```
- Para comunicação servidor-servidor
- Não requer login de usuário
- Ideal para apps cliente que consultam dados públicos

**Variável de Ambiente:**
```env
SERVICE_API_KEY=sua_chave_secreta_aqui
```

---

## 🔄 Mapeamento de Dados e APIs

### Endpoint Principal: Consulta por CPF

#### ❌ Sistema Atual (N8N)
```
POST https://workflows.platform.sinesys.app/webhook/meu-processo
Authorization: Basic <base64(meu_processo:yC2su27Gr3vxr4G7)>

Body: { "cpf": "12345678901" }

Response: {
  contratos: [...],
  processos: [...],
  audiencias: [...],
  acordos_condenacoes: [...]
}
```

#### ✅ Sistema Novo (Sinesys)

**IMPORTANTE:** O Sinesys **NÃO possui um endpoint único** que retorna todos os dados. É necessário fazer **múltiplas chamadas**:

### 1️⃣ **Processos por CPF**

```http
GET /api/acervo/cliente/cpf/{cpf}
Headers:
  x-service-api-key: <SERVICE_API_KEY>

Response: {
  success: true,
  data: {
    cliente: {
      nome: "João da Silva",
      cpf: "12345678901"
    },
    resumo: {
      total_processos: 3,
      com_audiencia_proxima: 1
    },
    processos: [
      {
        numero: "0001234-56.2024.5.03.0001",
        tipo: "Ação Trabalhista - Rito Ordinário",
        papel_cliente: "Reclamante",
        parte_contraria: "Empresa XYZ Ltda",
        tribunal: "TRT da 3ª Região (MG)",
        sigilo: false,
        instancias: {
          primeiro_grau: {
            vara: "1ª Vara do Trabalho de Belo Horizonte",
            data_inicio: "10/01/2024",
            proxima_audiencia: "15/03/2025 às 14:00"
          },
          segundo_grau: null
        },
        timeline: [
          {
            data: "20/11/2024",
            evento: "Audiência designada",
            descricao: "Audiência de instrução designada para 15/03/2025",
            tem_documento: false
          }
        ],
        timeline_status: "disponivel",
        ultima_movimentacao: {
          data: "20/11/2024",
          evento: "Audiência designada"
        }
      }
    ]
  }
}
```

**Características:**
- Dados sanitizados para consumo externo
- Inclui timeline completa de cada processo
- Sincronização lazy (dispara captura se timeline não disponível)
- Processos agrupados por número (1º e 2º grau juntos)

### 2️⃣ **Audiências por CPF**

```http
GET /api/audiencias/cliente/cpf/{cpf}
Headers:
  x-service-api-key: <SERVICE_API_KEY>

Response: {
  success: true,
  data: {
    cliente: {
      nome: "João da Silva",
      cpf: "12345678901"
    },
    resumo: {
      total_audiencias: 5,
      futuras: 2,
      realizadas: 2,
      canceladas: 1
    },
    audiencias: [
      {
        numero_processo: "0001234-56.2024.5.03.0001",
        tipo: "Audiência de Instrução",
        data: "15/03/2025",
        horario: "14:00 - 15:00",
        modalidade: "Virtual",
        status: "Designada",
        local: {
          tipo: "virtual",
          url_virtual: "https://zoom.us/j/123456789",
          endereco: null,
          sala: null,
          presenca_hibrida: null
        },
        partes: {
          polo_ativo: "João da Silva",
          polo_passivo: "Empresa XYZ Ltda"
        },
        papel_cliente: "Reclamante",
        parte_contraria: "Empresa XYZ Ltda",
        tribunal: "TRT da 3ª Região (MG)",
        vara: "1ª Vara do Trabalho de Belo Horizonte",
        sigilo: false,
        observacoes: null
      }
    ]
  }
}
```

**Características:**
- Ordenação inteligente (futuras primeiro, depois passadas)
- Informações de local (presencial/virtual/híbrido)
- Status detalhado da audiência

### 3️⃣ **Contratos por Cliente**

```http
GET /api/contratos?clienteId={id}
Headers:
  x-service-api-key: <SERVICE_API_KEY>

Response: {
  success: true,
  data: {
    contratos: [...],
    total: 10,
    pagina: 1,
    limite: 50
  }
}
```

**⚠️ LIMITAÇÃO:** Requer `clienteId` numérico, não aceita CPF diretamente.

**Solução:**
1. Buscar cliente por CPF: `GET /api/clientes/buscar/por-cpf/{cpf}`
2. Obter `clienteId` da resposta
3. Buscar contratos com o ID

### 4️⃣ **Acordos/Condenações**

```http
GET /api/acordos-condenacoes?processoId={id}
Headers:
  x-service-api-key: <SERVICE_API_KEY>

Response: {
  success: true,
  data: {
    acordos: [
      {
        id: 1,
        processo_id: 123,
        tipo: "acordo",
        direcao: "recebimento",
        valor_total: 50000.00,
        data_homologacao: "2024-11-15",
        parcelas: [
          {
            numero: 1,
            valor: 10000.00,
            data_vencimento: "2024-12-15",
            status: "paga"
          }
        ]
      }
    ],
    total: 1,
    pagina: 1,
    limite: 50
  }
}
```

**⚠️ LIMITAÇÃO:** Também requer `processoId` numérico.

---

## 📋 Plano de Migração

### Fase 1: Preparação (1-2 dias)

#### 1.1 Configuração de Ambiente
- [ ] Obter `SERVICE_API_KEY` do Sinesys
- [ ] Adicionar variáveis de ambiente no app cliente:
  ```env
  NEXT_PUBLIC_SINESYS_API_URL=https://api.sinesys.com.br
  SINESYS_SERVICE_API_KEY=<chave_secreta>
  ```
- [ ] Configurar proxy reverso se necessário (evitar exposição de chave no client)

#### 1.2 Análise de Dados
- [ ] Mapear campos faltantes entre sistemas
- [ ] Identificar transformações necessárias
- [ ] Definir estratégia para dados não disponíveis

### Fase 2: Criação de Camada de Abstração (2-3 dias)

#### 2.1 Service Layer
Criar serviços que abstraem as chamadas às APIs do Sinesys:

```typescript
// lib/services/sinesys-client.ts

interface SinesysClientConfig {
  baseUrl: string;
  apiKey: string;
}

class SinesysClient {
  private config: SinesysClientConfig;

  constructor(config: SinesysClientConfig) {
    this.config = config;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'x-service-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async buscarDadosClientePorCpf(cpf: string) {
    // Busca paralela de todos os dados
    const [processos, audiencias, cliente] = await Promise.allSettled([
      this.buscarProcessosPorCpf(cpf),
      this.buscarAudienciasPorCpf(cpf),
      this.buscarClientePorCpf(cpf),
    ]);

    // Processar resultados e buscar contratos/acordos se necessário
    // ...
  }

  async buscarProcessosPorCpf(cpf: string) {
    return this.request(`/api/acervo/cliente/cpf/${cpf}`);
  }

  async buscarAudienciasPorCpf(cpf: string) {
    return this.request(`/api/audiencias/cliente/cpf/${cpf}`);
  }

  async buscarClientePorCpf(cpf: string) {
    return this.request(`/api/clientes/buscar/por-cpf/${cpf}`);
  }

  async buscarContratosPorClienteId(clienteId: number) {
    return this.request(`/api/contratos?clienteId=${clienteId}`);
  }

  async buscarAcordosPorProcessoId(processoId: number) {
    return this.request(`/api/acordos-condenacoes?processoId=${processoId}`);
  }
}

export const sinesysClient = new SinesysClient({
  baseUrl: process.env.NEXT_PUBLIC_SINESYS_API_URL || 'http://localhost:3000',
  apiKey: process.env.SINESYS_SERVICE_API_KEY || '',
});
```

#### 2.2 Transformadores de Dados
Criar funções que convertem dados do Sinesys para o formato esperado pelo app:

```typescript
// lib/transformers/processo-transformer.ts

export function transformProcessosSinesysParaLegacy(
  responseSinesys: ProcessosSinesysResponse
): ProcessoItem[] {
  return responseSinesys.data.processos.map(processo => ({
    processo: {
      parteAutora: processo.partes.polo_ativo,
      parteRe: processo.partes.polo_passivo,
      tribunal: processo.tribunal,
      numero: processo.numero,
      valorDaCausa: processo.valor_causa || '',
      jurisdicaoEstado: extrairEstado(processo.tribunal),
      jurisdicaoMunicipio: extrairMunicipio(processo.vara),
      instancias: {
        primeirograu: transformInstancia(processo.instancias.primeiro_grau),
        segundograu: transformInstancia(processo.instancias.segundo_grau),
        terceirograu: null,
      },
    },
  }));
}
```

### Fase 3: Atualização do Backend (1-2 dias)

#### 3.1 Substituir Endpoint de Consulta

**Arquivo:** `app/api/consulta/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { sinesysClient } from '@/lib/services/sinesys-client';
import { transformDadosParaLegacy } from '@/lib/transformers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cpf } = body;

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF não fornecido' },
        { status: 400 }
      );
    }

    // Validar CPF
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      return NextResponse.json(
        { error: 'CPF deve conter 11 dígitos' },
        { status: 400 }
      );
    }

    // Buscar dados no Sinesys
    const dadosSinesys = await sinesysClient.buscarDadosClientePorCpf(cpfLimpo);

    // Transformar para formato legacy
    const dadosLegacy = transformDadosParaLegacy(dadosSinesys);

    return NextResponse.json(dadosLegacy);
  } catch (error) {
    console.error('[API] Erro ao consultar Sinesys:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar a API' },
      { status: 502 }
    );
  }
}
```

### Fase 4: Atualização de Types (1 dia)

#### 4.1 Criar Tipos do Sinesys

```typescript
// types/sinesys.ts

export interface ProcessosSinesysResponse {
  success: boolean;
  data: {
    cliente: {
      nome: string;
      cpf: string;
    };
    resumo: {
      total_processos: number;
      com_audiencia_proxima: number;
    };
    processos: ProcessoSinesys[];
  };
}

export interface ProcessoSinesys {
  numero: string;
  tipo: string;
  papel_cliente: string;
  parte_contraria: string;
  tribunal: string;
  sigilo: boolean;
  instancias: {
    primeiro_grau: InstanciaSinesys | null;
    segundo_grau: InstanciaSinesys | null;
  };
  timeline: TimelineItemSinesys[];
  timeline_status: 'disponivel' | 'sincronizando' | 'indisponivel';
}

// ... outros tipos
```

### Fase 5: Testes (2-3 dias)

#### 5.1 Testes Unitários
- [ ] Testar transformadores de dados
- [ ] Testar client Sinesys
- [ ] Testar validações de CPF

#### 5.2 Testes de Integração
- [ ] Testar fluxo completo de consulta
- [ ] Testar casos de erro (CPF inválido, não encontrado, etc.)
- [ ] Testar cache local

#### 5.3 Testes de UI
- [ ] Verificar renderização de processos
- [ ] Verificar exibição de audiências
- [ ] Verificar cards de contratos
- [ ] Testar estados de loading
- [ ] Testar mensagens de erro

### Fase 6: Deploy Gradual (1 dia)

#### 6.1 Feature Flag
Implementar toggle para alternar entre N8N e Sinesys:

```typescript
const USE_SINESYS_API = process.env.NEXT_PUBLIC_USE_SINESYS === 'true';

if (USE_SINESYS_API) {
  // Nova implementação
} else {
  // Implementação antiga (fallback)
}
```

#### 6.2 Rollout
1. Deploy em ambiente de staging
2. Testes com usuários beta
3. Monitoramento de erros
4. Deploy gradual em produção (10% → 50% → 100%)
5. Desativação do webhook N8N após estabilização

---

## ❓ Questões Técnicas para Esclarecimento

### 1. **Autenticação e Segurança**

**Q1.1:** Qual deve ser a estratégia de autenticação do app cliente?
- **Opção A:** Service API Key (servidor → servidor)
- **Opção B:** Autenticação de usuários individuais (cada cliente faz login)
- **Opção C:** Híbrido (login opcional para recursos avançados)

**Recomendação:** Opção A (Service API Key) é mais simples e adequada se o app apenas consulta dados públicos do cliente.

**Q1.2:** Como proteger a `SERVICE_API_KEY` no app Next.js?
- **Solução:** Manter a chave apenas no servidor (não expor no client)
- **Implementação:** Todas as chamadas passam por `/api/consulta` (Next.js API Route)

**Q1.3:** É necessário implementar autenticação de usuários (clientes fazem login)?
- Se **SIM**, qual o fluxo? (Supabase Auth, OAuth, etc.)
- Se **NÃO**, manter modelo atual (apenas consulta por CPF)

### 2. **Mapeamento de Dados**

**Q2.1:** Como obter **Contratos** por CPF?
- API atual exige `clienteId` numérico
- **Estratégia:**
  1. Buscar cliente por CPF: `GET /api/clientes/buscar/por-cpf/{cpf}`
  2. Extrair `clienteId` da resposta
  3. Buscar contratos: `GET /api/contratos?clienteId={id}`

**Q2.2:** Como obter **Acordos/Condenações** por CPF?
- API atual exige `processoId`
- **Estratégia:**
  1. Buscar processos por CPF
  2. Para cada processo, buscar acordos: `GET /api/acordos-condenacoes?processoId={id}`
  3. Agregar resultados

**Q2.3:** Existem endpoints alternativos que aceitam CPF diretamente?
- Verificar se há endpoints customizados para o app cliente
- Se não, implementar agregação no backend do app

### 3. **Estrutura de Dados**

**Q3.1:** Campos do N8N sem equivalente direto no Sinesys:

| Campo N8N | Equivalente Sinesys? | Ação |
|-----------|---------------------|------|
| `contrato.data_admissao` | ❓ Verificar | Mapear ou omitir |
| `contrato.data_rescisao` | ❓ Verificar | Mapear ou omitir |
| `contrato.estagio` | ❓ Verificar | Mapear ou omitir |
| `audiencia.advogado` | ❓ Verificar | Mapear ou omitir |
| `pagamento.repassado_cliente` | ❓ Verificar | Mapear ou omitir |

**Necessário:** Levantamento completo dos schemas do Sinesys para esses recursos.

**Q3.2:** A timeline do processo no Sinesys tem estrutura diferente?
- N8N retorna `MovimentoAgrupado[]` (agrupado por data → polo → responsável)
- Sinesys retorna `TimelineItem[]` simples?
- **Ação:** Verificar estrutura exata e criar transformador

### 4. **Performance e Cache**

**Q4.1:** O Sinesys possui cache interno para consultas por CPF?
- Se SIM, qual o TTL?
- Se NÃO, considerar implementar Redis cache no app cliente

**Q4.2:** Qual a latência esperada das APIs do Sinesys?
- N8N webhook: ~2-5 segundos
- Sinesys esperado: ?
- **Impacto:** Se > 10s, implementar loading incremental

**Q4.3:** É recomendado implementar cache no app cliente?
- Manter `localStorage` atual?
- Migrar para Redis/IndexedDB?
- Definir estratégia de invalidação

### 5. **Funcionalidades Especiais**

**Q5.1:** Sincronização Lazy de Timeline
- Sinesys dispara captura automática se timeline não disponível
- App deve exibir mensagem "Sincronizando..." e fazer polling?
- Qual a frequência de polling recomendada? (30s? 1min?)

**Q5.2:** Processos com erro (campo `result` no N8N)
- No N8N, processos com erro retornam `{ result: "mensagem" }`
- Como o Sinesys lida com isso?
- Retorna erro 404? Campo específico?

**Q5.3:** Sigilo Processual
- Como o Sinesys trata processos sigilosos?
- Campo `sigilo: true` oculta quais dados?
- App deve exibir mensagem genérica?

### 6. **Dados Financeiros**

**Q6.1:** Estrutura de Parcelas
- N8N retorna parcelas individuais (uma linha por parcela)
- Sinesys retorna acordo com array de parcelas?
- **Verificar:** Estrutura exata do endpoint `/api/acordos-condenacoes`

**Q6.2:** Valores Monetários
- Formato no N8N: string `"10000.00"`
- Formato no Sinesys: number `10000.00`?
- **Ação:** Definir transformação e formatação para exibição

### 7. **Migração de Dados Históricos**

**Q7.1:** Dados antigos serão migrados para o Sinesys?
- Se **SIM**, quando? Antes ou depois da migração do app?
- Se **NÃO**, implementar fallback para dados históricos?

**Q7.2:** Período de transição
- Manter N8N webhook ativo como fallback?
- Quanto tempo? (1 semana? 1 mês?)

### 8. **Ambiente e Deploy**

**Q8.1:** URLs das APIs

| Ambiente | URL Base |
|----------|----------|
| Desenvolvimento | `http://localhost:3000` |
| Staging | ❓ `https://staging.sinesys.com.br`? |
| Produção | ❓ `https://api.sinesys.com.br`? |

**Q8.2:** CORS e Domínios
- App cliente está em qual domínio? `https://meuprocesso.zattaradvogados.com.br`?
- Sinesys está configurado para aceitar requisições desse domínio?
- Necessário whitelist de CORS?

### 9. **Monitoramento e Logs**

**Q9.1:** Como monitorar erros e performance?
- Sentry? LogRocket? Datadog?
- Implementar no app cliente ou confiar nos logs do Sinesys?

**Q9.2:** Métricas importantes
- Taxa de erro por endpoint
- Latência P50/P95/P99
- Taxa de cache hit
- Usuários ativos

### 10. **Documentação e Suporte**

**Q10.1:** Existe documentação Swagger/OpenAPI do Sinesys?
- URL: `http://localhost:3000/api/docs/openapi.json`
- Produção: ❓

**Q10.2:** Endpoints adicionais necessários?
- Criar endpoint agregado `/api/cliente/dashboard/{cpf}` no Sinesys?
- Retornaria todos os dados em uma única chamada
- Otimização: queries paralelas no backend

---

## ⚠️ Riscos e Mitigações

### Risco 1: Incompatibilidade de Dados

**Descrição:** Campos do N8N podem não ter equivalente no Sinesys.

**Impacto:** Alto - Quebra funcionalidades do app cliente.

**Mitigação:**
1. Levantamento completo de schemas antes do desenvolvimento
2. Criar mapeamento campo a campo
3. Definir valores padrão ou omissão para campos ausentes
4. Testes extensivos de regressão

### Risco 2: Performance Degradada

**Descrição:** Múltiplas chamadas à API podem ser mais lentas que o webhook único.

**Impacto:** Médio - Experiência do usuário prejudicada.

**Mitigação:**
1. Implementar chamadas paralelas com `Promise.all()`
2. Cache agressivo (Redis no servidor, IndexedDB no cliente)
3. Loading incremental (exibir dados conforme chegam)
4. Considerar criar endpoint agregado no Sinesys

### Risco 3: Erros de Autenticação

**Descrição:** Service API Key pode ser exposta ou expirar.

**Impacto:** Alto - App para de funcionar.

**Mitigação:**
1. Nunca expor chave no código client-side
2. Todas as chamadas passam por proxy Next.js API Route
3. Rotação periódica de chaves
4. Monitoramento de erros 401/403

### Risco 4: Sincronização de Timeline

**Descrição:** Timeline pode não estar disponível imediatamente (captura lazy).

**Impacto:** Médio - Usuário vê dados incompletos.

**Mitigação:**
1. Exibir mensagem clara "Sincronizando..."
2. Implementar polling automático (a cada 30s por 2 minutos)
3. Fallback: mostrar dados sem timeline temporariamente

### Risco 5: Rollback Necessário

**Descrição:** Bugs críticos em produção exigem volta ao N8N.

**Impacto:** Alto - Downtime do serviço.

**Mitigação:**
1. Feature flag para toggle rápido
2. Manter código do N8N ativo por 1 mês
3. Deploy gradual (canary deployment)
4. Monitoramento rigoroso nas primeiras 48h

---

## 📅 Cronograma Estimado

### Sprint 1: Preparação e Análise (3 dias úteis)
- [ ] Levantamento completo de schemas do Sinesys
- [ ] Obtenção de credenciais (SERVICE_API_KEY)
- [ ] Configuração de ambientes (dev, staging, prod)
- [ ] Definição de estratégias (auth, cache, erro)
- [ ] Aprovação do plano de migração

### Sprint 2: Desenvolvimento Backend (5 dias úteis)
- [ ] Criação da camada de abstração (SinesysClient)
- [ ] Implementação de transformadores de dados
- [ ] Atualização do endpoint `/api/consulta`
- [ ] Implementação de cache (Redis/localStorage)
- [ ] Tratamento de erros e edge cases

### Sprint 3: Atualização de Types e UI (3 dias úteis)
- [ ] Criação de tipos TypeScript do Sinesys
- [ ] Atualização de componentes React (se necessário)
- [ ] Ajustes de formatação e exibição
- [ ] Mensagens de erro customizadas

### Sprint 4: Testes (4 dias úteis)
- [ ] Testes unitários (transformadores, validações)
- [ ] Testes de integração (fluxo completo)
- [ ] Testes de UI (componentes, estados)
- [ ] Testes de performance (latência, cache)
- [ ] QA manual (cenários reais)

### Sprint 5: Deploy e Monitoramento (3 dias úteis)
- [ ] Deploy em staging
- [ ] Testes com usuários beta (5-10 CPFs)
- [ ] Ajustes pós-feedback
- [ ] Deploy gradual em produção (10% → 50% → 100%)
- [ ] Monitoramento intensivo (48h)
- [ ] Desativação do webhook N8N (se estável)

**Total Estimado:** 18 dias úteis (~4 semanas)

---

## 🎯 Próximos Passos Imediatos

### 1. Reunião de Alinhamento
Agendar reunião técnica para:
- Esclarecer dúvidas listadas na seção 6
- Aprovar plano de migração
- Definir prioridades e prazos

### 2. Acesso e Credenciais
Obter:
- [ ] `SERVICE_API_KEY` do Sinesys (produção e staging)
- [ ] URLs de API (staging e produção)
- [ ] Acesso ao ambiente de staging
- [ ] Documentação Swagger/OpenAPI atualizada

### 3. Análise de Schemas
Documentar schemas completos de:
- [ ] `/api/contratos` (response completo)
- [ ] `/api/acordos-condenacoes` (response completo com parcelas)
- [ ] `/api/clientes/buscar/por-cpf/{cpf}` (response completo)
- [ ] Confirmar estrutura de timeline no Sinesys

### 4. Decisões Arquiteturais
Definir:
- [ ] Estratégia de autenticação final
- [ ] Estratégia de cache (onde, como, TTL)
- [ ] Endpoint agregado no Sinesys (criar ou não?)
- [ ] Política de rollback e feature flags

### 5. Setup de Ambiente
Configurar:
- [ ] Repositório com branch de migração
- [ ] CI/CD para testes automatizados
- [ ] Monitoramento (Sentry, logs, métricas)
- [ ] Ambientes isolados (dev, staging, prod)

---

## 📚 Referências

### Documentação Sinesys
- README.md principal
- Documentação de API: `/app/ajuda/desenvolvimento/api-referencia/page.tsx`
- Swagger/OpenAPI: `GET /api/docs/openapi.json`

### Endpoints Relevantes
| Recurso | Endpoint | Método |
|---------|----------|--------|
| Processos por CPF | `/api/acervo/cliente/cpf/{cpf}` | GET |
| Audiências por CPF | `/api/audiencias/cliente/cpf/{cpf}` | GET |
| Cliente por CPF | `/api/clientes/buscar/por-cpf/{cpf}` | GET |
| Contratos | `/api/contratos?clienteId={id}` | GET |
| Acordos/Condenações | `/api/acordos-condenacoes?processoId={id}` | GET |

### Arquivos do App Cliente
| Arquivo | Descrição |
|---------|-----------|
| `app/api/consulta/route.ts` | Endpoint atual (N8N) - **MIGRAR** |
| `contexts/DashboardContext.tsx` | Gerenciamento de estado - **ATUALIZAR** |
| `types/legal.ts` | Tipos TypeScript - **ADICIONAR NOVOS** |
| `app/dashboard/processos/page.tsx` | UI Processos - **TESTAR** |
| `app/dashboard/audiencias/page.tsx` | UI Audiências - **TESTAR** |

---

## ✅ Checklist de Aprovação

Antes de iniciar a implementação, confirmar:

- [ ] Todas as dúvidas da seção 6 foram respondidas
- [ ] Credenciais e acessos foram fornecidos
- [ ] Schemas do Sinesys foram documentados
- [ ] Estratégias de autenticação e cache foram definidas
- [ ] Cronograma foi aprovado
- [ ] Orçamento e recursos estão alinhados
- [ ] Plano de rollback está claro
- [ ] Monitoramento está configurado

---

**Documento preparado por:** Qoder AI  
**Data:** 08/12/2025  
**Versão:** 1.0  
**Status:** Aguardando aprovação e esclarecimentos
