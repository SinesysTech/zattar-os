# Princípios de Domain-Driven Design (DDD) no Sinesys

## 1. Visão Geral do Domain-Driven Design

Domain-Driven Design (DDD) é uma abordagem de desenvolvimento de software que foca na modelagem de um domínio de negócio complexo, conectando a implementação à um modelo em constante evolução. No Sinesys, a aplicação dos princípios de DDD visa criar um sistema que reflita de forma clara e precisa a lógica de negócio do escritório de advocacia Zattar Advogados, facilitando a comunicação entre especialistas de domínio e desenvolvedores, e promovendo uma arquitetura flexível e manutenível.

### Conceitos Fundamentais de DDD:
-   **Domínio (Domain)**: A esfera de conhecimento, influência ou atividade para a qual a aplicação está sendo desenvolvida.
-   **Modelo de Domínio (Domain Model)**: Uma representação abstrata do conhecimento do domínio, encapsulando dados e comportamento.
-   **Linguagem Ubíqua (Ubiquitous Language)**: Uma linguagem comum e precisa, construída em conjunto por especialistas de domínio e desenvolvedores, e usada consistentemente em todo o projeto (código, documentação, conversas).
-   **Contextos Delimitados (Bounded Contexts)**: Limites explícitos dentro dos quais um modelo de domínio específico é definido e aplicável. Cada contexto pode ter sua própria Linguagem Ubíqua e seu próprio modelo.
-   **Camadas (Layers)**: A arquitetura do sistema é dividida em camadas, cada uma com responsabilidades específicas.

## 2. Camadas da Arquitetura e Aplicação no Sinesys

O Sinesys adota uma arquitetura em camadas para organizar o código, separando responsabilidades e promovendo a modularidade.

### 2.1. Camada de Domínio (Domain Layer)

Esta é a camada central, que contém a lógica de negócio e o modelo de domínio puro. É o coração da aplicação, independente das tecnologias de banco de dados, frameworks UI ou detalhes de infraestrutura.

-   **Responsabilidades**:
    -   Representar conceitos de negócio, regras e comportamentos.
    -   Ser a "verdade" sobre o negócio.
    -   Validar regras de negócio intrínsecas ao domínio.

-   **Componentes Principais**:
    -   **Entidades (Entities)**: Objetos que possuem uma identidade e um ciclo de vida. São mutáveis e identificados por um ID.
        -   *Exemplos no Sinesys*: `Cliente`, `Acervo`, `Audiencia`, `Usuario`.
    -   **Value Objects**: Objetos que descrevem aspectos do domínio, mas não possuem identidade própria. São imutáveis e comparados por seus valores.
        -   *Exemplos no Sinesys*: `Endereco` (quando tratado como um bloco de valores, embora possa ser entidade em outros contextos), `NumeroProcesso`, `CpfCnpj`.
    -   **Agregados (Aggregates)**: Agrupamento de Entidades e Value Objects tratados como uma única unidade transacional. Um Aggregate Root (Raiz do Agregado) garante a consistência do agregado.
        -   *Exemplos no Sinesys*: Um `Processo` (Acervo) pode ser um Aggregate Root, com `Partes` e `Documentos` como parte do seu agregado.
    -   **Serviços de Domínio (Domain Services)**: Operações de negócio que não se encaixam naturalmente em uma Entidade ou Value Object. Orquestram Entidades e Value Objects.
        -   *Exemplos no Sinesys*: `GerenciamentoDePartesEmProcesso`, `CalculoDePrazos`.
    -   **Eventos de Domínio (Domain Events)**: Notificações de algo significativo que aconteceu no domínio.
        -   *Exemplos no Sinesys*: `ProcessoCapturado`, `AudienciaDesignada`.

-   **Localização no Projeto**: `types/domain/` para as definições de tipos, e `backend/{modulo}/domain/` para as implementações da lógica de domínio quando aplicável.

### 2.2. Camada de Aplicação (Application Layer)

Orquestra a camada de domínio para realizar casos de uso específicos da aplicação. Não contém lógica de negócio diretamente, mas coordena Entidades e Serviços de Domínio para executar tarefas.

-   **Responsabilidades**:
    -   Definir os casos de uso da aplicação.
    -   Transações e segurança.
    -   Transformar DTOs em objetos de domínio e vice-versa.
    -   Gerenciar o ciclo de vida dos objetos de domínio.

-   **Componentes Principais**:
    -   **Serviços de Aplicação (Application Services)**: Classes que implementam os casos de uso. Recebem DTOs como entrada, utilizam Repositórios para carregar Entidades, invocam a lógica de domínio e retornam DTOs.
        -   *Exemplos no Sinesys*: `CriarClienteService`, `ListarAcervoService`, `AgendarCapturaService`.
    -   **DTOs (Data Transfer Objects)**: Objetos simples, sem comportamento, usados para transferir dados entre as camadas de apresentação, aplicação e domínio.
        -   *Exemplos no Sinesys*: `CriarClienteParams`, `ListarAcervoResult`.

-   **Localização no Projeto**: `types/contracts/` para as definições de tipos (DTOs), e `backend/{modulo}/services/` para as implementações dos Application Services.

### 2.3. Camada de Infraestrutura (Infrastructure Layer)

Fornece a base técnica para a aplicação, lidando com aspectos como persistência de dados, comunicação externa, logging, etc. É a camada mais externa, dependendo das camadas de Domínio e Aplicação.

-   **Responsabilidades**:
    -   Implementar repositórios (acesso a dados).
    -   Interagir com sistemas externos (APIs, serviços de terceiros).
    -   Configuração e inicialização da aplicação.
    -   Detalhes técnicos como ORMs, bibliotecas HTTP, etc.

-   **Componentes Principais**:
    -   **Repositórios (Repositories)**: Abstraem os detalhes de persistência de dados. A interface do Repositório (contrato) reside na camada de Domínio ou Aplicação, enquanto a implementação está na Infraestrutura.
        -   *Exemplos no Sinesys*: `ClientePersistenceService` (implementa a interface `IClienteRepository`), `AcervoPersistenceService`.
    -   **Serviços de Integração**: Implementam a comunicação com APIs externas ou outros microsserviços.
        -   *Exemplos no Sinesys*: `PjeTrtApiService`, `SupabaseAuthService`.

-   **Localização no Projeto**: `backend/persistence/`, `backend/api/`, `backend/utils/` e a camada de API do Next.js (`app/api/`).

### 2.4. Camada de Apresentação (Presentation Layer) / Interface do Usuário

A camada mais externa, responsável por exibir informações ao usuário e interpretar seus comandos. No Sinesys, esta é a interface web construída com Next.js e React.

-   **Responsabilidades**:
    -   Converter DTOs em um formato exibível para o usuário.
    -   Capturar entradas do usuário e traduzi-las em comandos para a camada de Aplicação.
    -   Gerenciar o estado da UI.

-   **Componentes Principais**:
    -   **Controladores/Rotas de API (Next.js API Routes)**: Atuam como interfaces entre o frontend e a camada de aplicação do backend.
        -   *Exemplos no Sinesys*: `app/api/clientes/route.ts` que utiliza `CriarClienteService`.
    -   **Componentes de UI (React Components)**: Renderizam a interface.
        -   *Exemplos no Sinesys*: Componentes em `app/(dashboard)/` e `components/`.
    -   **Tipos de UI/Forms**: Tipos específicos para gerenciar o estado e os dados de formulários na interface.
        -   *Exemplos no Sinesys*: `ClienteFormData`, `ProcessosFilters` em `app/_lib/types/`.

## 3. Boas Práticas e Padrões Adotados

-   **Injeção de Dependência**: Serviços e Repositórios são gerenciados e injetados, promovendo baixo acoplamento.
-   **Validações**: Regras de validação são aplicadas na camada apropriada (domínio para regras de negócio intrínsecas, aplicação para DTOs e requisitos de caso de uso, apresentação para formatação de entrada).
-   **Testes**: A arquitetura em camadas facilita o teste unitário de cada camada isoladamente, especialmente a camada de Domínio e Aplicação.
-   **Linguagem Ubíqua Consistente**: Esforço contínuo para garantir que os nomes de tipos, variáveis, funções e nomes de arquivos reflitam a Linguagem Ubíqua do domínio, conforme definido com os especialistas jurídicos.

Ao seguir esses princípios e padrões, o projeto Sinesys busca ser robusto, escalável e alinhado com as necessidades de negócio da Zattar Advogados.
