# ZattarOS — Sistema de Gestão Jurídica

**by Synthropic**  
Documentação — Visão Geral do Sistema  
Escritório Zattar Advogados  
Versão 1.0 · Maio 2026

---

## Sumário

1. [Introdução](#1-introdução)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Módulos do Sistema](#3-módulos-do-sistema)
4. [Integrações Externas](#4-integrações-externas)
5. [Infraestrutura e Deploy](#5-infraestrutura-e-deploy)
6. [Segurança](#6-segurança)
7. [Design System](#7-design-system)
8. [Testes e Qualidade de Código](#8-testes-e-qualidade-de-código)
9. [Glossário](#9-glossário)

---

## 1. Introdução

### 1.1 O que é o ZattarOS

O ZattarOS é um sistema de gestão jurídica corporativa desenvolvido pela Synthropic, focado em automação inteligente e integração com Inteligência Artificial. O sistema é utilizado pelo escritório Zattar Advogados para gerenciar toda a operação jurídica e administrativa: desde o acervo de processos judiciais até o financeiro, RH, captura automatizada de expedientes nos tribunais e comunicação com clientes.

A plataforma é acessada via web (navegador) e disponibiliza também um portal exclusivo para clientes, além de uma camada de automação por agentes de IA (via MCP — Model Context Protocol) que permite que assistentes inteligentes operem o sistema de forma programática.

### 1.2 Contexto de Uso

O escritório Zattar Advogados atua na área trabalhista e opera com múltiplos advogados, cada um responsável por uma carteira de processos distribuída nos Tribunais Regionais do Trabalho (TRT1 a TRT24) e no TST. O ZattarOS foi construído especificamente para este contexto, com funcionalidades como:

- Captura automatizada de intimações e prazos do PJE (Processo Judicial Eletrônico)
- Integração com a API do Comunica CNJ para comunicações do Diário Oficial Digital
- Gestão unificada de processos em múltiplos graus de jurisdição
- Agenda, audiências, perícias e controle de prazos processuais
- Módulo financeiro integrado ao ciclo processual
- Dashboard com métricas em tempo real para usuários e administradores
- Automação por agentes de IA via MCP

### 1.3 Escopo deste Documento

Este documento apresenta a visão geral do sistema ZattarOS: sua arquitetura técnica, os módulos funcionais, as integrações externas, a infraestrutura de implantação e o modelo de automação por IA. Destina-se a advogados, gestores do escritório e parceiros técnicos que precisam compreender o funcionamento completo da plataforma.

---

## 2. Arquitetura Técnica

### 2.1 Stack Tecnológico

| Camada | Tecnologia / Decisão |
|---|---|
| Framework Web | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| Banco de Dados | Supabase (PostgreSQL 15 + Row Level Security + pgvector) |
| Cache e Performance | Redis (cache de queries, TTL configurável, streaming de logs) |
| Interface Visual | Tailwind CSS 4 + shadcn/ui (estilo New York) + Design System próprio |
| Busca Semântica / IA | pgvector + OpenAI Embeddings (text-embedding-3-small) |
| Automação de Navegador | Playwright (captura automatizada nos tribunais) |
| Storage de Arquivos | Backblaze B2 (compatível com S3) |
| Autenticação | Supabase Auth (JWT + SSO + 2FA via 2FAuth) |
| Editor de Documentos | Plate.js (editor rich-text colaborativo, baseado em Slate) |
| Videoconferência | Dyte SDK (audiências virtuais) |
| Comunicação Interna | Chatwoot (chat e suporte ao cliente) |
| Deploy | Docker + Cloudron + Docker Swarm |
| Testes | Jest + Playwright (E2E) |

### 2.2 Arquitetura Feature-Sliced Design (FSD)

O projeto adota o padrão **Feature-Sliced Design (FSD)** com colocation rigoroso: a lógica de cada domínio fica acoplada à sua rota dentro de `src/app/(authenticated)/`. Cada módulo é autossuficiente, com seus próprios arquivos de domínio, serviço, repositório, ações e componentes.

> **Regra Fundamental:** É proibido realizar "deep imports" — importar diretamente de arquivos internos de um módulo. Sempre use o arquivo barrel `index.ts`.  
> ✅ Correto: `import { actionListarClientes } from "@/app/(authenticated)/partes"`  
> ❌ Errado: `import { ... } from "@/app/(authenticated)/partes/actions/listar-action"`

#### Estrutura de cada módulo

| Arquivo / Pasta | Responsabilidade |
|---|---|
| `domain.ts` | Schemas Zod, tipos TypeScript, constantes e regras lógicas |
| `service.ts` | Casos de uso — regras de negócio e orquestração |
| `repository.ts` | Integração com banco de dados (Supabase) e APIs externas |
| `actions/` | Server Actions (Next.js) — ponto de entrada da UI para o servidor |
| `components/` | Componentes React específicos do domínio |
| `index.ts` | Barrel — único ponto de exportação público do módulo |
| `RULES.md` | Documentação de regras de negócio para agentes cognitivos |

### 2.3 Fluxo de Dados

O fluxo de dados segue uma arquitetura unidirecional rigorosa:

```
Componente (Client) → Server Action → Service (regras de negócio) → Repository → Supabase (PostgreSQL)
```

Para operações de leitura intensivas, o Redis atua como camada de cache com TTL configurável. As mutações invalidam o cache via `revalidatePath` do Next.js. Após persistência, hooks assíncronos (`after()`) disparam indexação no pgvector para busca semântica.

### 2.4 Model Context Protocol (MCP) e IA

O ZattarOS expõe um endpoint MCP em `/api/mcp` que permite a agentes de IA controlarem o sistema de forma programática. Cada módulo possui um arquivo de tools correspondente (ex: `expedientes-tools.ts`, `processos-tools.ts`) registrado no registry centralizado em `src/lib/mcp/registry.ts`.

O assistente principal do escritório é o **Pedrinho** (integrado via Chatwoot), que pode executar ações reais no sistema — buscar processos, criar tarefas, verificar audiências — com a mesma lógica de negócio utilizada pela interface web.

| Módulo MCP | Tools Expostas |
|---|---|
| acervo-tools | Consulta e gestão do acervo processual |
| processos-tools | CRUD e listagem de processos judiciais |
| partes-tools | Gestão de clientes, partes contrárias e terceiros |
| expedientes-tools | Gestão de expedientes, baixa, atribuição de responsável |
| audiencias-tools | Agendamento e consulta de audiências |
| financeiro-tools | Lançamentos, fluxo de caixa, DRE |
| documentos-tools | Gestão de documentos e arquivos |
| tarefas-tools | Gestão de tarefas e quadros Kanban |
| dashboard-tools | Métricas e consolidados do escritório |
| comunica-cnj-tools | Consulta e sincronização Comunica CNJ |
| busca-semantica-tools | Busca semântica via pgvector |
| + 20 outros | Cada módulo tem seu arquivo de tools registrado |

---

## 3. Módulos do Sistema

### 3.1 Processos (Acervo)

Módulo central do sistema. Gerencia todo o acervo de processos judiciais trabalhistas do escritório, integrando-se com o PJE para captura automática de movimentações.

**Entidades principais:** Processo (27+ campos), ProcessoUnificado (múltiplas instâncias agregadas), Movimentação (timeline em JSONB).

**Status de Processo:**

| Status | Descrição |
|---|---|
| ATIVO | Processo em andamento normal |
| SUSPENSO | Temporariamente suspenso por ordem judicial |
| ARQUIVADO | Processo arquivado no escritório |
| EXTINTO | Processo extinto por decisão judicial |
| BAIXADO | Processo baixado do sistema |
| PENDENTE | Aguardando ação do advogado |
| EM_RECURSO | Em fase recursal |

**Regras de negócio principais:**
- Número CNJ obrigatório no formato `NNNNNNN-DD.AAAA.J.TT.OOOO`
- Arquivamento só é permitido se não há audiências futuras ou expedientes pendentes vinculados
- Um processo pode ter instâncias simultâneas em múltiplos graus; `ProcessoUnificado` as agrega
- Após persistência, processo é indexado no pgvector para busca semântica

---

### 3.2 Expedientes

Módulo de gestão de intimações, notificações e prazos processuais. Expedientes podem ser originados de três fontes: captura automática do PJE/TRT, cadastro manual ou importação via Comunica CNJ.

**Origens:**

| Origem | Descrição |
|---|---|
| `captura` | Capturado automaticamente do PJE via scraper Playwright |
| `manual` | Cadastrado manualmente pelo usuário (padrão) |
| `comunica_cnj` | Importado via API do Comunica CNJ (Diário Oficial Digital) |

**Ciclo de vida:**
- **Criação:** valida processo e tipo; preserva histórico em `dados_anteriores` (JSONB)
- **Baixa:** exige protocolo OU justificativa; impede baixa duplicada; registra auditoria via RPC
- **Reversão de baixa:** só permitida se já está baixado; auditoria via RPC
- **Atribuição de responsável:** operação em lote via RPC com log de auditoria

**Views disponíveis:** Quadro (Kanban), Lista (tabela filtrada), Semana, Mês, Ano.

---

### 3.3 Audiências

Controla o agendamento e acompanhamento de audiências judiciais. Integra-se com o calendário unificado e o módulo de videoconferência (Dyte).

**Modalidades:** Virtual (Dyte / Google Meet / Zoom / Webex), Presencial (endereço físico), Híbrida (combinação).

**Status:** `M` = Marcada | `F` = Finalizada | `C` = Cancelada

---

### 3.4 Partes (Clientes e Contrapartes)

Módulo unificado para gestão de todas as partes processuais: clientes, partes contrárias e terceiros. Suporta Pessoa Física (PF) e Pessoa Jurídica (PJ) via discriminated unions TypeScript.

| Tipo | Descrição |
|---|---|
| Cliente PF | Pessoa física representada — CPF com validação de dígitos verificadores |
| Cliente PJ | Empresa representada — CNPJ com validação de dígitos verificadores |
| Parte Contrária | Polo adversário — permite duplicatas (mesma empresa em múltiplos processos) |
| Terceiro | Perito, testemunha, Ministério Público, Amicus Curiae, etc. |

---

### 3.5 Documentos e Arquivos

Módulo de gestão documental com dois tipos: documentos criados no editor Plate.js (rich-text) e arquivos genéricos (uploads de PDF, imagens, planilhas). Ambos organizados em pastas por processo.

- Editor Plate.js com colaboração em tempo real (Yjs)
- Upload de arquivos até 50 MB, armazenados no Backblaze B2
- Versionamento automático, templates reutilizáveis
- Pastas hierárquicas (máximo 10 níveis)
- Integração com editor de IA para geração de peças jurídicas

---

### 3.6 Financeiro

Módulo de gestão financeira completo. Controla receitas, despesas, transferências, contas bancárias, orçamentos e conciliação bancária.

| Tipo de Lançamento | Descrição |
|---|---|
| receita | Entrada de recursos (honorários, repasses) |
| despesa | Saída de recursos (custas, despesas operacionais) |
| transferencia | Movimentação entre contas bancárias do escritório |

**Status de lançamento:** `pendente` → `pago` / `cancelado` / `vencido`

**Funcionalidades:** Plano de contas hierárquico, lançamentos recorrentes, DRE, fluxo de caixa, conciliação bancária, orçamentos por período.

---

### 3.7 Contratos

Gestão dos contratos jurídicos com clientes.

| Tipo de Contrato | Descrição |
|---|---|
| Ajuizamento | Propositura de nova ação judicial |
| Defesa | Defesa em processo já existente |
| Ato Processual | Realização de ato processual específico |
| Assessoria | Assessoria jurídica contínua |

**Modalidades de cobrança:** Pró-êxito (vinculado ao resultado) ou Pró-labore (honorários fixos).

---

### 3.8 Captura Automatizada

Módulo responsável pela captura automatizada de dados dos sistemas judiciais eletrônicos via Playwright.

| Sistema | Tribunais | Dados Capturados |
|---|---|---|
| PJE | TRT1 a TRT24 + TST | Processos, expedientes, audiências, perícias, partes, timeline |
| ESAJ | TJSP e outros | Processos e movimentações |
| EPROC | TRF e outros | Processos e movimentações |
| PROJUDI | Tribunais estaduais | Processos e movimentações |

**Fluxo de captura PJE:**
1. Autenticação no tribunal via SSO (PDPJ) + OTP (2FA)
2. Listagem de processos/expedientes pendentes com filtros de prazo
3. Extração de metadados: partes, timeline, datas, situação
4. Persistência com deduplicação por hash — detecta e registra diferenças
5. Download opcional do PDF para o Backblaze B2
6. Indexação assíncrona no pgvector para busca semântica

O módulo mantém logs brutos de cada captura para reprocessamento sem nova autenticação no tribunal.

---

### 3.9 Comunica CNJ (Diário Oficial Digital)

Integração com a API pública do CNJ para captura de comunicações processuais publicadas no DJE.

- Consulta paginada por OAB, número de processo ou tribunal+data
- Sincronização com vinculação automática a expedientes existentes
- Criação automática de expedientes para comunicações sem correspondência
- Views salvas com filtros customizados
- Resumos gerados por IA com tags semânticas

---

### 3.10 Perícias

Controle de perícias judiciais vinculadas aos processos. Suporta criação manual e captura do PJE.

| Código | Situação | Descrição |
|---|---|---|
| L | Aguardando Laudo | Perito designado, aguardando entrega |
| S | Aguardando Esclarecimentos | Laudo recebido, aguardando esclarecimentos |
| P | Laudo Juntado | Laudo juntado aos autos |
| F | Finalizada | Perícia concluída |
| R | Redesignada | Data reagendada |
| C | Cancelada | Perícia cancelada |

---

### 3.11 Tarefas e Quadros Kanban

Sistema completo de gerenciamento de tarefas com quadros Kanban, subtarefas, comentários e anexos. Agrega em interface unificada tarefas manuais e eventos do sistema (audiências, expedientes, perícias, obrigações).

- Quadros Kanban personalizáveis (sistema e customizados)
- Eventos virtuais materializáveis como tarefas reais
- Prioridades: baixa, média, alta
- Status: `backlog` → `todo` → `in progress` → `done` / `canceled`

---

### 3.12 Dashboard

Painel consolidado com métricas de todos os módulos principais.

| Visão | Conteúdo |
|---|---|
| Dashboard Usuário | Processos, audiências, expedientes do próprio usuário; produtividade pessoal; financeiro; lembretes |
| Dashboard Admin | Métricas globais; carga de cada usuário; status de capturas; performance por advogado; saúde da infraestrutura |

---

### 3.13 Agenda e Calendário

- **Agenda:** eventos livres do escritório (reuniões, compromissos internos). Soft delete — eventos nunca são excluídos permanentemente.
- **Calendário Unificado:** agrega em uma única visão todos os eventos do sistema (audiências, expedientes, perícias, agenda e tarefas), com filtro por tipo e período.

---

### 3.14 Recursos Humanos

Módulo de gestão de salários e folhas de pagamento. Ao aprovar uma folha, lançamentos financeiros são gerados automaticamente no módulo Financeiro.

| Status de Folha | Descrição |
|---|---|
| rascunho | Em preparação — não impacta financeiro |
| aprovada | Aprovada — lançamentos gerados no Financeiro |
| paga | Pagamento realizado |
| cancelada | Folha cancelada — lançamentos revertidos |

---

### 3.15 Assistentes de IA

Gerenciamento dos assistentes inteligentes disponíveis no sistema.

| Tipo | Descrição |
|---|---|
| Dify | Assistente conectado a uma aplicação Dify — LLM com RAG e workflows |
| iframe | Widget externo embarcado via código HTML |

O assistente principal é o **Pedrinho**, integrado via Chatwoot, que pode responder a perguntas, buscar processos, criar tarefas e executar ações via MCP.

---

### 3.16 Configurações (Admin)

Painel de configuração do sistema, acessível apenas por administradores.

- **Sistema:** métricas do banco de dados (cache hit rate, queries lentas, bloat), segurança (IPs bloqueados), assistente de decisão para upgrade de infraestrutura Supabase
- **Integrações:** gerenciamento de serviços externos (2FAuth, Chatwoot, Dyte, Editor IA) e assistentes Dify
- **Personalização:** temas, cores, tipografia e prompts de sistema para IA

---

### 3.17 Portal do Cliente

Interface exclusiva para os clientes do escritório. Permite consultar o andamento dos processos, visualizar documentos e receber notificações sem acesso à área interna do sistema.

---

## 4. Integrações Externas

| Serviço | Categoria | Função no Sistema |
|---|---|---|
| Supabase | Banco de Dados / Auth | PostgreSQL + RLS + pgvector + Autenticação JWT |
| Redis | Cache / Performance | Cache de queries, streaming de logs, sessões |
| Backblaze B2 | Storage | Armazenamento de documentos, PDFs e arquivos |
| OpenAI | IA / Embeddings | Embeddings para busca semântica; LLM |
| Google Gemini | IA | LLM alternativo para assistentes e geração de texto |
| Dify | IA / Fluxos | Plataforma de assistentes IA com RAG e workflows |
| CopilotKit | IA / Agentes | Framework de agentes IA integrado à UI |
| Chatwoot | Comunicação | Chat com clientes; assistente Pedrinho |
| Dyte | Videoconferência | Audiências virtuais integradas ao sistema |
| Comunica CNJ | Tribunais | API do CNJ para comunicações processuais (DJE) |
| PJE / ESAJ / EPROC | Tribunais | Captura automatizada via Playwright |
| 2FAuth | Segurança | Gerenciamento de tokens TOTP para 2FA nos tribunais |
| Strapi | CMS | Conteúdo editorial (base de conhecimento, ajuda) |
| Cloudron | Infraestrutura | Plataforma de self-hosting e gerenciamento de apps |

---

## 5. Infraestrutura e Deploy

### 5.1 Ambientes

| Ambiente | Descrição |
|---|---|
| Desenvolvimento | `npm run dev` — servidor local com Turbopack, hot reload |
| Produção (Cloudron) | Deploy via CLI Cloudron (`deploy:cloudron`) — self-hosted |
| Produção (Docker) | Dockerfile com multi-stage build; docker-compose para orquestração |
| Docker Swarm | `scripts/docker/deploy-swarm.sh` — para alta disponibilidade |

### 5.2 Variáveis de Ambiente Principais

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Chave pública do Supabase (client-side) |
| `SUPABASE_SECRET_KEY` | Chave secreta do Supabase (apenas server-side) |
| `OPENAI_API_KEY` | Chave OpenAI para IA e embeddings |
| `ENABLE_REDIS_CACHE` | Ativa/desativa cache Redis |
| `REDIS_URL` / `REDIS_PASSWORD` | Conexão com Redis |
| `B2_*` | Credenciais Backblaze B2 |
| `SERVICE_API_KEY` | Chave interna para autenticação entre serviços |
| `CRON_SECRET` | Segredo para autenticação de jobs cron |
| `FRONTEND_URL` | URL pública do sistema |

### 5.3 Banco de Dados e Migrações

O banco de dados é PostgreSQL gerenciado pelo Supabase. Migrações são versionadas em `scripts/database/` e aplicadas via SDK do Supabase. Row Level Security (RLS) é utilizado para controle granular de acesso por usuário.

### 5.4 PWA e Modo Offline

O ZattarOS é uma Progressive Web App (PWA) com suporte a modo offline via Service Worker (Workbox). O `manifest.json` define ícones, tema e modo de exibição para instalação como app nativo.

---

## 6. Segurança

### 6.1 Modelo de Permissões (3 camadas)

1. **Row Level Security (RLS)** no banco de dados: políticas PostgreSQL que filtram dados no nível mais baixo
2. **Service Layer:** validações de invariantes e regras de negócio
3. **Server Actions:** wrapper `authenticatedAction` garante que toda requisição é de usuário autenticado

### 6.2 Autenticação

- JWT via Supabase Auth com refresh automático de tokens
- Suporte a SSO (OAuth) para login com Google e outros provedores
- 2FA obrigatório para acesso aos portais dos tribunais (via 2FAuth + TOTP)
- Bloqueio de IPs configurável via allowlist/blocklist

### 6.3 Proteções Adicionais

- Content Security Policy (CSP) configurável — modo report-only ou enforced
- Rate limiting em rotas de API críticas
- Auditoria de mutações sensíveis via RPCs com `SECURITY DEFINER` no PostgreSQL
- Verificação automática de segredos no código-fonte (`scripts/security/check-secrets.js`)

---

## 7. Design System

O ZattarOS possui um Design System próprio denominado **Glass Briefing**, construído sobre shadcn/ui (estilo New York) e Tailwind CSS 4.

### 7.1 Princípios Visuais

- Efeitos de vidro (glassmorphism) com backdrop-blur e transparências
- Tokens de cor em OKLCH para consistência perceptual em diferentes temas
- Componentes `Heading` e `Text` canônicos — tamanhos NUNCA definidos inline
- `GlassPanel`: componente estrutural padrão para painéis e cards
- Suporte a temas claro e escuro (dark mode)

### 7.2 Componentes Estruturais

| Componente | Uso |
|---|---|
| DataShell | Layout padrão para listagens (tabelas, filtros, paginação) |
| DialogShell | Padrão para modais e formulários |
| PageShell | Wrapper de página com breadcrumbs e header |
| DockBar | Barra de ações flutuante para ações contextuais |

---

## 8. Testes e Qualidade de Código

### 8.1 Estratégia de Testes

| Tipo | Ferramenta / Escopo |
|---|---|
| Testes Unitários | Jest — validações de domínio, utilitários, serviços |
| Testes de Integração | Jest + Supabase test client — actions e repositórios |
| Testes de Componentes | Jest + Testing Library — componentes React |
| Testes E2E | Playwright — fluxos completos de usuário |

### 8.2 Qualidade e Linting

- ESLint com regras customizadas: proibição de hardcoded secrets, tokens HSL diretos, espaçamentos sem tokens
- TypeScript strict mode — type-check completo em build de CI
- Husky: hooks de pre-commit para lint e type-check automáticos
- `check:architecture` — verifica violações de deep imports
- `validate:design-system` — detecta uso incorreto de tokens visuais

---

## 9. Glossário

| Termo | Definição |
|---|---|
| Acervo | Conjunto de processos ativos do escritório capturados do PJE |
| Expediente | Intimação, notificação ou comunicação processual com prazo legal |
| Baixa de Expediente | Registro formal de que o expediente foi atendido |
| Captura | Processo automatizado de extração de dados dos sistemas judiciais |
| CNJ | Conselho Nacional de Justiça — define o padrão de numeração processual |
| Comunica CNJ | Sistema do CNJ de comunicações processuais eletrônicas |
| FSD | Feature-Sliced Design — padrão de organização de código adotado |
| Grau | Instância processual: 1º grau, 2º grau ou Tribunal Superior |
| MCP | Model Context Protocol — protocolo para que agentes IA controlem o sistema |
| OAB | Ordem dos Advogados do Brasil — registro profissional do advogado |
| PJE | Processo Judicial Eletrônico — sistema judicial do CNJ |
| Polo Ativo | Parte que ingressa com a ação (autor) |
| Polo Passivo | Parte que defende a ação (réu) |
| RLS | Row Level Security — controle de acesso a nível de linha no PostgreSQL |
| Server Action | Função Next.js que executa no servidor, chamada diretamente pelo cliente |
| TRT | Tribunal Regional do Trabalho (TRT1 a TRT24) |
| TST | Tribunal Superior do Trabalho — instância máxima da Justiça do Trabalho |
| pgvector | Extensão PostgreSQL para armazenamento e busca de vetores (busca semântica) |

---

*ZattarOS · Documentação Interna · Confidencial · Synthropic © 2026*
