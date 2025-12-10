# Financeiro Bounded Context

<cite>
**Referenced Files in This Document**   
- [obrigacoes-content.tsx](file://app/(dashboard)/acordos-condenacoes/components/obrigacoes-content.tsx)
- [obrigacoes.types.ts](file://backend/types/financeiro/obrigacoes.types.ts)
- [obrigacoes-persistence.service.ts](file://backend/financeiro/obrigacoes/services/persistence/obrigacoes-persistence.service.ts)
- [listar-obrigacoes.service.ts](file://backend/financeiro/obrigacoes/services/obrigacoes/listar-obrigacoes.service.ts)
- [obrigacoes-integracao.service.ts](file://backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service.ts)
- [page.tsx](file://app/(dashboard)/financeiro/obrigacoes/page.tsx)
- [contas-pagar/page.tsx](file://app/(dashboard)/financeiro/contas-pagar/page.tsx)
- [contas-receber/page.tsx](file://app/(dashboard)/financeiro/contas-receber/page.tsx)
- [33_financeiro_functions.sql](file://supabase/schemas/33_financeiro_functions.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Domain Model for Financial Obligations](#domain-model-for-financial-obligations)
3. [Business Rules for Payment Tracking](#business-rules-for-payment-tracking)
4. [Integration with Acervo Context](#integration-with-acervo-context)
5. [Unique Aspects of the Financeiro Context](#unique-aspects-of-the-financeiro-context)
6. [Implementation Details](#implementation-details)
7. [Conclusion](#conclusion)

## Introduction
The Financeiro bounded context in the Sinesys application manages financial obligations, encompassing both receivables and payables. This context provides a unified view of financial commitments, integrating data from legal agreements, contracts, and manual entries. The system handles payment tracking, installment distribution, status transitions, and reconciliation with external financial systems. This document details the domain model, business rules, integration patterns, and implementation specifics of the Financeiro context.

## Domain Model for Financial Obligations
The Financeiro context models financial obligations through a unified interface that consolidates various financial entities. The core entities include Obrigacao (obligation), ContaPagar (payable account), and ContaReceber (receivable account), each representing different types of financial commitments.

### Obrigacao Entity
The Obrigacao entity serves as a consolidated view of financial obligations, unifying data from different sources into a single interface. It represents any financial commitment in the system, whether derived from legal agreements, contracts, or manual entries.

```mermaid
classDiagram
class Obrigacao {
+string id
+string tipoEntidade
+number entidadeId
+TipoObrigacao tipo
+StatusObrigacao status
+OrigemObrigacao origem
+StatusSincronizacao statusSincronizacao
+string descricao
+number valor
+string dataVencimento
+string dataEfetivacao
+string dataLancamento
+string dataCompetencia
+number| null diasAteVencimento
+number| null percentualHonorarios
+number| null clienteId
+number| null processoId
+number| null acordoId
+number| null parcelaId
+number| null lancamentoId
+number| null contaContabilId
+number| null centroCustoId
+number| null contaBancariaId
+string createdAt
+string updatedAt
+number| null createdBy
}
class ObrigacaoComDetalhes {
+ClienteResumoObrigacao cliente
+ProcessoResumoObrigacao processo
+AcordoResumoObrigacao acordo
+ParcelaResumoObrigacao parcela
+LancamentoResumoObrigacao lancamento
+ContaContabilResumoObrigacao contaContabil
}
Obrigacao <|-- ObrigacaoComDetalhes
```

**Diagram sources**
- [obrigacoes.types.ts](file://backend/types/financeiro/obrigacoes.types.ts#L145-L183)

**Section sources**
- [obrigacoes.types.ts](file://backend/types/financeiro/obrigacoes.types.ts#L18-L684)

### ContaPagar and ContaReceber Entities
The ContaPagar and ContaReceber entities represent payable and receivable accounts respectively. These entities extend the financial model to handle direct financial transactions outside of legal agreements.

```mermaid
classDiagram
class ContaPagar {
+StatusContaPagar status
+OrigemContaPagar origem
+FormaPagamentoContaPagar formaPagamento
+FrequenciaRecorrencia frequencia
+CategoriaContaPagar categoria
+AnexoContaPagar[] anexos
+number valor
+string dataVencimento
+string dataEfetivacao
+number fornecedorId
+number contaContabilId
+number centroCustoId
+number contaBancariaId
}
class ContaReceber {
+StatusContaReceber status
+OrigemContaReceber origem
+FormaRecebimentoContaReceber formaRecebimento
+CategoriaContaReceber categoria
+AnexoContaReceber[] anexos
+number valor
+string dataVencimento
+string dataEfetivacao
+number clienteId
+number contratoId
+number contaContabilId
+number centroCustoId
+number contaBancariaId
}
class PlanoConta {
+TipoContaContabil tipoConta
+NaturezaConta natureza
+NivelConta nivel
+string codigo
+string nome
+boolean aceitaLancamento
+boolean ativo
+number? contaPaiId
}
ContaPagar --> PlanoConta : "conta contábil"
ContaReceber --> PlanoConta : "conta contábil"
```

**Diagram sources**
- [financeiro.ts](file://types/domain/financeiro.ts#L40-L64)
- [financeiro.ts](file://types/domain/financeiro.ts#L90-L100)

**Section sources**
- [financeiro.ts](file://types/domain/financeiro.ts#L1-L210)

## Business Rules for Payment Tracking
The Financeiro context implements comprehensive business rules for payment tracking, including installment distribution, payment status transitions, and reconciliation processes.

### Installment Distribution
The system manages installment distribution through automated processes that create payment schedules based on agreement terms. When a legal agreement is established with multiple installments, the system automatically generates the corresponding financial obligations.

```mermaid
sequenceDiagram
participant Agreement as "Acordo Judicial"
participant Financeiro as "Financeiro Context"
participant Database as "Database"
Agreement->>Financeiro : Criar acordo com N parcelas
Financeiro->>Financeiro : Validar termos do acordo
Financeiro->>Database : Criar N registros de parcelas
Database-->>Financeiro : Retornar parcelas criadas
Financeiro->>Financeiro : Calcular datas de vencimento
Financeiro->>Database : Atualizar datas de vencimento
Database-->>Financeiro : Confirmação
Financeiro-->>Agreement : Acordo criado com parcelas
```

**Diagram sources**
- [obrigacoes-integracao.service.ts](file://backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service.ts#L146-L358)
- [obrigacoes-persistence.service.ts](file://backend/financeiro/obrigacoes/services/persistence/obrigacoes-persistence.service.ts#L403-L478)

**Section sources**
- [obrigacoes-integracao.service.ts](file://backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service.ts#L1-L655)

### Payment Status Transitions
The system implements a state machine for payment status transitions, ensuring data consistency and proper workflow progression. The status transitions follow specific business rules based on payment timing and user actions.

```mermaid
stateDiagram-v2
[*] --> Pendente
Pendente --> Efetivada : "Pagamento confirmado"
Pendente --> Vencida : "Data de vencimento passada"
Pendente --> Cancelada : "Cancelamento manual"
Vencida --> Efetivada : "Pagamento após vencimento"
Vencida --> Cancelada : "Cancelamento manual"
Efetivada --> Estornada : "Estorno solicitado"
Cancelada --> [*]
Estornada --> [*]
Efetivada --> [*]
note right of Vencida
Status automático quando
data_vencimento < hoje
end note
```

**Diagram sources**
- [obrigacoes.types.ts](file://backend/types/financeiro/obrigacoes.types.ts#L32-L37)
- [obrigacoes.types.ts](file://backend/types/financeiro/obrigacoes.types.ts#L588-L613)

**Section sources**
- [obrigacoes.types.ts](file://backend/types/financeiro/obrigacoes.types.ts#L1-L684)

### Reconciliation with External Systems
The Financeiro context includes mechanisms for reconciliation with external financial systems, ensuring data consistency across platforms. This includes automated detection of inconsistencies and manual reconciliation processes.

```mermaid
flowchart TD
A[Extrato Bancário] --> B{Importar Transações}
B --> C[Verificar Duplicatas]
C --> D[Gerar Hash Único]
D --> E{Transação Existente?}
E --> |Sim| F[Ignorar ou Atualizar]
E --> |Não| G[Criar Lançamento Financeiro]
G --> H[Atualizar Saldo Conta]
H --> I[Fechamento de Período]
I --> J[Conciliação Bancária]
J --> K[Relatório de Discrepâncias]
K --> L[Correção Manual]
L --> M[Fechamento Confirmado]
```

**Diagram sources**
- [33_financeiro_functions.sql](file://supabase/schemas/33_financeiro_functions.sql#L444-L479)
- [33_financeiro_functions.sql](file://supabase/schemas/33_financeiro_functions.sql#L53-L114)

**Section sources**
- [33_financeiro_functions.sql](file://supabase/schemas/33_financeiro_functions.sql#L1-L479)

## Integration with Acervo Context
The Financeiro context integrates with the Acervo context to create payment agreements linked to legal processes. This integration enables the automatic creation of financial obligations based on legal agreements and court rulings.

### Data Flow from Acervo to Financeiro
The integration follows a service-oriented architecture where the Financeiro context consumes data from the Acervo context through well-defined service interfaces. When a legal agreement is finalized in the Acervo context, it triggers the creation of corresponding financial obligations.

```mermaid
sequenceDiagram
participant Acervo as "Acervo Context"
participant Financeiro as "Financeiro Context"
participant Database as "Database"
Acervo->>Financeiro : Acordo Judicial Finalizado
Financeiro->>Financeiro : Validar Acordo
Financeiro->>Database : Buscar Detalhes do Acordo
Database-->>Financeiro : Dados do Acordo
Financeiro->>Financeiro : Calcular Parcelas
Financeiro->>Database : Criar Parcelas
Database-->>Financeiro : Parcelas Criadas
Financeiro->>Financeiro : Agendar Sincronização
Financeiro-->>Acervo : Confirmação
loop Diariamente
Financeiro->>Financeiro : Verificar Novos Acordos
Financeiro->>Database : Buscar Acordos Não Sincronizados
Database-->>Financeiro : Lista de Acordos
Financeiro->>Financeiro : Processar Sincronização
end
```

**Diagram sources**
- [obrigacoes-integracao.service.ts](file://backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service.ts#L146-L358)
- [obrigacoes-persistence.service.ts](file://backend/financeiro/obrigacoes/services/persistence/obrigacoes-persistence.service.ts#L403-L478)

**Section sources**
- [obrigacoes-integracao.service.ts](file://backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service.ts#L1-L655)

### Synchronization Process
The synchronization process between Acervo and Financeiro contexts ensures that financial obligations are accurately reflected in the accounting system. This process handles both automatic and manual synchronization scenarios.

```mermaid
flowchart TD
A[Acordo Judicial] --> B{Status do Acordo}
B --> |Efetivado| C[Verificar Sincronização]
B --> |Pendente| D[Agendar para Futuro]
C --> E{Lançamento Existe?}
E --> |Não| F[Criar Lançamento Financeiro]
E --> |Sim| G{Valores Consistentes?}
G --> |Não| H[Atualizar Lançamento]
G --> |Sim| I[Manter Inalterado]
F --> J[Atualizar Status]
H --> J
J --> K[Registrar Sincronização]
K --> L[Fim]
D --> L
```

**Diagram sources**
- [obrigacoes-integracao.service.ts](file://backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service.ts#L146-L358)
- [obrigacoes-persistence.service.ts](file://backend/financeiro/obrigacoes/services/persistence/obrigacoes-persistence.service.ts#L197-L220)

**Section sources**
- [obrigacoes-integracao.service.ts](file://backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service.ts#L1-L655)

## Unique Aspects of the Financeiro Context
The Financeiro context has several unique characteristics that distinguish it from other domains in the Sinesys application, particularly in its handling of both receivables and payables and its independent financial terminology.

### Dual Handling of Receivables and Payables
The Financeiro context uniquely manages both receivables and payables within a single unified framework. This dual capability allows for comprehensive financial management while maintaining clear separation between incoming and outgoing funds.

```mermaid
classDiagram
class FinanceiroContext {
+handleReceivables()
+handlePayables()
+reconcileAccounts()
+generateReports()
}
class Receivables {
+createReceivable()
+trackPayments()
+manageInvoices()
+handleLatePayments()
}
class Payables {
+createPayable()
+schedulePayments()
+manageBills()
+handleEarlyPayments()
}
FinanceiroContext --> Receivables : "composição"
FinanceiroContext --> Payables : "composição"
Receivables <|.. ContaReceber : "implementa"
Payables <|.. ContaPagar : "implementa"
```

**Diagram sources**
- [contas-pagar/page.tsx](file://app/(dashboard)/financeiro/contas-pagar/page.tsx#L1-L590)
- [contas-receber/page.tsx](file://app/(dashboard)/financeiro/contas-receber/page.tsx#L1-L628)

**Section sources**
- [contas-pagar/page.tsx](file://app/(dashboard)/financeiro/contas-pagar/page.tsx#L1-L590)
- [contas-receber/page.tsx](file://app/(dashboard)/financeiro/contas-receber/page.tsx#L1-L628)

### Independent Financial Terminology and Model
The Financeiro context maintains its own financial terminology and model, separate from other domains. This independence ensures financial accuracy and compliance with accounting standards while providing a consistent interface for users.

```mermaid
classDiagram
class FinanceiroModel {
+Obrigacao
+ContaPagar
+ContaReceber
+PlanoConta
+LancamentoFinanceiro
}
class LegalModel {
+AcordoJudicial
+Parcela
+Processo
+Cliente
}
class ContractModel {
+Contrato
+Cláusula
+Parte
+Anexo
}
FinanceiroModel --> LegalModel : "consome dados"
FinanceiroModel --> ContractModel : "consome dados"
note right of FinanceiroModel
Modelo financeiro independente
com terminologia própria
separado dos domínios legais
e contratuais
end note
```

**Diagram sources**
- [obrigacoes.types.ts](file://backend/types/financeiro/obrigacoes.types.ts#L18-L684)
- [financeiro.ts](file://types/domain/financeiro.ts#L1-L210)

**Section sources**
- [obrigacoes.types.ts](file://backend/types/financeiro/obrigacoes.types.ts#L1-L684)
- [financeiro.ts](file://types/domain/financeiro.ts#L1-L210)

## Implementation Details
The implementation of the Financeiro context includes both frontend components for user interaction and backend services for processing financial operations.

### obrigacoes-content.tsx Component
The obrigacoes-content.tsx component displays financial obligations with filtering and navigation capabilities. It provides a unified view of all financial obligations, allowing users to manage both receivables and payables.

```mermaid
classDiagram
class ObrigacoesContent {
+visualizacao : ObrigacoesVisualizacao
+busca : string
+filtros : ObrigacoesFilters
+selectedFilterIds : string[]
+novaObrigacaoOpen : boolean
+refreshKey : number
+semanaAtual : Date | null
+mesAtual : Date | null
+anoAtual : number | null
}
class ObrigacoesVisualizacao {
+tabela
+semana
+mes
+ano
}
ObrigacoesContent --> ObrigacoesVisualizacao
note right of ObrigacoesContent
Componente React que exibe
obrigações financeiras com
suporte a múltiplas visualizações
e filtros avançados
end note
```

**Diagram sources**
- [obrigacoes-content.tsx](file://app/(dashboard)/acordos-condenacoes/components/obrigacoes-content.tsx#L1-L288)

**Section sources**
- [obrigacoes-content.tsx](file://app/(dashboard)/acordos-condenacoes/components/obrigacoes-content.tsx#L1-L288)

### Backend Services for Payment Processing
The backend services handle payment processing and reconciliation, ensuring data consistency and proper financial workflows. These services implement business logic for creating, updating, and deleting financial obligations.

```mermaid
sequenceDiagram
participant Frontend as "Frontend"
participant API as "API Gateway"
participant Service as "Backend Service"
participant Database as "Database"
Frontend->>API : Solicitar pagamento
API->>Service : Processar pagamento
Service->>Service : Validar pagamento
Service->>Database : Atualizar status
Database-->>Service : Confirmação
Service->>Service : Atualizar saldos
Service->>Database : Registrar transação
Database-->>Service : Sucesso
Service-->>API : Resultado
API-->>Frontend : Confirmação
```

**Diagram sources**
- [obrigacoes-integracao.service.ts](file://backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service.ts#L146-L358)
- [obrigacoes-persistence.service.ts](file://backend/financeiro/obrigacoes/services/persistence/obrigacoes-persistence.service.ts#L709-L805)

**Section sources**
- [obrigacoes-integracao.service.ts](file://backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service.ts#L1-L655)
- [obrigacoes-persistence.service.ts](file://backend/financeiro/obrigacoes/services/persistence/obrigacoes-persistence.service.ts#L1-L1001)

## Conclusion
The Financeiro bounded context in Sinesys provides a comprehensive solution for managing financial obligations in a legal practice environment. By unifying receivables and payables under a single framework, the system offers a holistic view of financial commitments while maintaining the necessary separation between different types of transactions. The integration with the Acervo context enables automatic creation of payment agreements linked to legal processes, streamlining workflow and reducing manual data entry. The implementation follows sound architectural principles with clear separation between frontend components and backend services, ensuring maintainability and scalability. The use of independent financial terminology and models ensures accuracy and compliance with accounting standards while providing a consistent user experience.