# Acordos Condenações Table

<cite>
**Referenced Files in This Document**   
- [20_acordos_condenacoes.sql](file://supabase/schemas/20_acordos_condenacoes.sql)
- [20250118120000_create_acordos_condenacoes.sql](file://supabase/migrations/aplicadas/20250118120000_create_acordos_condenacoes.sql)
- [20250118120002_create_triggers_and_views.sql](file://supabase/migrations/aplicadas/20250118120002_create_triggers_and_views.sql)
- [acordo-condenacao-persistence.service.ts](file://backend/acordos-condenacoes/services/persistence/acordo-condenacao-persistence.service.ts)
- [repasse-persistence.service.ts](file://backend/acordos-condenacoes/services/persistence/repasse-persistence.service.ts)
- [repasses-pendentes-list.tsx](file://app/(dashboard)/acordos-condenacoes/components/repasses-pendentes-list.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Table Structure](#table-structure)
3. [Field Definitions](#field-definitions)
4. [Relationships](#relationships)
5. [Business Rules and Validation](#business-rules-and-validation)
6. [Indexes and Performance](#indexes-and-performance)
7. [Data Model Diagram](#data-model-diagram)
8. [Application Workflow](#application-workflow)
9. [Sample Records](#sample-records)
10. [Conclusion](#conclusion)

## Introduction

The acordos_condenacoes table is a core component of the Sinesys legal management system, designed to track agreements, condemnations, and court costs associated with legal processes. This table serves as the foundation for financial tracking, payment scheduling, and reporting within the legal case management workflow. It enables law firms to manage financial agreements resulting from legal proceedings, including settlement agreements, court-ordered payments, and judicial expenses.

The table supports comprehensive financial management by establishing relationships with processes, tracking payment schedules through associated installments, and managing fund disbursement to clients. It plays a critical role in the financial operations of legal practices, ensuring proper accounting of funds received or paid as a result of legal cases.

**Section sources**
- [20_acordos_condenacoes.sql](file://supabase/schemas/20_acordos_condenacoes.sql#L1-L35)
- [20250118120000_create_acordos_condenacoes.sql](file://supabase/migrations/aplicadas/20250118120000_create_acordos_condenacoes.sql#L1-L36)

## Table Structure

The acordos_condenacoes table is structured to capture comprehensive information about legal financial agreements. The table uses a relational database design with appropriate data types, constraints, and relationships to ensure data integrity and support business operations.

```sql
create table if not exists public.acordos_condenacoes (
  id bigint generated always as identity primary key,
  processo_id bigint not null references public.acervo(id),
  tipo text not null check (tipo in ('acordo', 'condenacao', 'custas_processuais')),
  direcao text not null check (direcao in ('recebimento', 'pagamento')),
  valor_total numeric(15, 2) not null check (valor_total > 0),
  data_vencimento_primeira_parcela date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago_parcial', 'pago_total', 'atrasado')),
  numero_parcelas integer not null default 1 check (numero_parcelas > 0),
  forma_distribuicao text check (forma_distribuicao in ('integral', 'dividido')),
  percentual_escritorio numeric(5, 2) default 30.00 check (percentual_escritorio >= 0 and percentual_escritorio <= 100),
  percentual_cliente numeric(5, 2) generated always as (100 - percentual_escritorio) stored,
  honorarios_sucumbenciais_total numeric(15, 2) default 0 check (honorarios_sucumbenciais_total >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

The table is designed with both business and technical considerations in mind, incorporating constraints to enforce data validity, proper relationships to other entities in the system, and metadata fields to track creation and modification history.

**Section sources**
- [20_acordos_condenacoes.sql](file://supabase/schemas/20_acordos_condenacoes.sql#L6-L22)
- [20250118120000_create_acordos_condenacoes.sql](file://supabase/migrations/aplicadas/20250118120000_create_acordos_condenacoes.sql#L4-L26)

## Field Definitions

This section details each field in the acordos_condenacoes table, including its data type, constraints, and business purpose.

### id (BIGINT)
- **Type**: BIGINT
- **Constraint**: Primary Key, Generated Identity
- **Description**: Unique identifier for each agreement/condemnation record. The system automatically generates this value as an identity column, ensuring uniqueness across all records.

### processo_id (BIGINT)
- **Type**: BIGINT
- **Constraint**: Foreign Key to acervo(id), NOT NULL
- **Description**: References the legal process to which this agreement or condemnation is associated. This establishes the critical relationship between financial agreements and the legal cases that generate them.

### tipo (TEXT)
- **Type**: TEXT
- **Constraint**: NOT NULL, CHECK (tipo in ('acordo', 'condenacao', 'custas_processuais'))
- **Description**: Specifies the type of financial agreement:
  - 'acordo': Settlement agreement between parties
  - 'condenacao': Court-ordered payment
  - 'custas_processuais': Judicial costs and fees

### direcao (TEXT)
- **Type**: TEXT
- **Constraint**: NOT NULL, CHECK (direcao in ('recebimento', 'pagamento'))
- **Description**: Indicates the financial direction of the agreement:
  - 'recebimento': Funds received by the law firm (inflow)
  - 'pagamento': Funds paid by the law firm (outflow)

### valor_total (NUMERIC)
- **Type**: NUMERIC(15,2)
- **Constraint**: NOT NULL, CHECK (valor_total > 0)
- **Description**: The total monetary value of the agreement or condemnation. The precision of 15 digits with 2 decimal places accommodates large financial amounts while maintaining cent-level accuracy. The constraint ensures only positive values are stored.

### data_vencimento_primeira_parcela (DATE)
- **Type**: DATE
- **Constraint**: NOT NULL
- **Description**: The due date for the first installment or the single payment date. This field is critical for payment scheduling and financial planning.

### status (TEXT)
- **Type**: TEXT
- **Constraint**: NOT NULL, DEFAULT 'pendente', CHECK (status in ('pendente', 'pago_parcial', 'pago_total', 'atrasado'))
- **Description**: The current status of the agreement, calculated based on the payment status of associated installments:
  - 'pendente': No payments received
  - 'pago_parcial': Some installments paid
  - 'pago_total': All installments paid
  - 'atrasado': Payment overdue

### numero_parcelas (INTEGER)
- **Type**: INTEGER
- **Constraint**: NOT NULL, DEFAULT 1, CHECK (numero_parcelas > 0)
- **Description**: The number of installments for the agreement. A value of 1 indicates a single payment. This field determines the payment schedule structure.

### forma_distribuicao (TEXT)
- **Type**: TEXT
- **Constraint**: CHECK (forma_distribuicao in ('integral', 'dividido'))
- **Description**: For receivables, defines how funds are distributed:
  - 'integral': Law firm receives all funds and transfers client's share
  - 'dividido': Client receives their portion directly
  - NULL for payments and court costs

### percentual_escritorio (NUMERIC)
- **Type**: NUMERIC(5,2)
- **Constraint**: DEFAULT 30.00, CHECK (percentual_escritorio >= 0 and percentual_escritorio <= 100)
- **Description**: The percentage of contractual fees retained by the law firm. Defaults to 30% but can be adjusted per agreement.

### percentual_cliente (NUMERIC)
- **Type**: NUMERIC(5,2)
- **Constraint**: GENERATED ALWAYS AS (100 - percentual_escritorio) STORED
- **Description**: The percentage of funds allocated to the client, automatically calculated as the complement of the firm's percentage. This computed column ensures data consistency.

### honorarios_sucumbenciais_total (NUMERIC)
- **Type**: NUMERIC(15,2)
- **Constraint**: DEFAULT 0, CHECK (honorarios_sucumbenciais_total >= 0)
- **Description**: Total amount of court-awarded fees, which belong entirely to the law firm and are not shared with the client.

### created_by (UUID)
- **Type**: UUID
- **Constraint**: Foreign Key to auth.users(id), ON DELETE SET NULL
- **Description**: References the user who created the agreement record. If the user is deleted, this field is set to NULL to maintain referential integrity.

### created_at (TIMESTAMP WITH TIME ZONE)
- **Type**: TIMESTAMP WITH TIME ZONE
- **Constraint**: DEFAULT now()
- **Description**: Timestamp of when the record was created, stored with timezone information for accurate temporal tracking.

### updated_at (TIMESTAMP WITH TIME ZONE)
- **Type**: TIMESTAMP WITH TIME ZONE
- **Constraint**: DEFAULT now()
- **Description**: Timestamp automatically updated when the record is modified, enabling change tracking and audit capabilities.

**Section sources**
- [20_acordos_condenacoes.sql](file://supabase/schemas/20_acordos_condenacoes.sql#L6-L22)
- [20250118120000_create_acordos_condenacoes.sql](file://supabase/migrations/aplicadas/20250118120000_create_acordos_condenacoes.sql#L4-L26)

## Relationships

The acordos_condenacoes table establishes critical relationships with other entities in the Sinesys system, creating a comprehensive financial tracking network.

### One-to-Many Relationship with Parcelas Table

The primary relationship is a one-to-many association with the parcelas table, where each agreement can have multiple installments. This relationship is implemented through a foreign key constraint:

```sql
acordo_condenacao_id bigint not null references public.acordos_condenacoes(id) on delete cascade
```

This design enables:
- Flexible payment scheduling with multiple installments
- Individual tracking of each payment's status
- Automatic calculation of the agreement's overall status based on installment statuses
- Cascading deletion of installments when an agreement is removed

The parcelas table contains detailed information about each installment, including its due date, payment status, and distribution details.

### Relationship with Processos (acervo table)

The acordos_condenacoes table links to the acervo table (which stores process information) through the processo_id foreign key:

```sql
processo_id bigint not null references public.acervo(id)
```

This relationship ensures that every financial agreement is associated with a specific legal case, enabling:
- Contextual financial reporting by case
- Case-centric financial overviews
- Integration of financial data with case management workflows

### Relationship with Users

The created_by field establishes a relationship with the authentication system's users table:

```sql
created_by uuid references auth.users(id) on delete set null
```

This connection allows for:
- Attribution of record creation to specific users
- Audit trails for financial data changes
- User-based access control and reporting

**Section sources**
- [20_acordos_condenacoes.sql](file://supabase/schemas/20_acordos_condenacoes.sql#L63-L87)
- [20250118120000_create_acordos_condenacoes.sql](file://supabase/migrations/aplicadas/20250118120000_create_acordos_condenacoes.sql#L6-L7)

## Business Rules and Validation

The acordos_condenacoes table implements several business rules through database constraints and application logic to ensure data integrity and enforce financial policies.

### Data Validation Rules

- **Positive Value Constraint**: The valor_total field must be greater than zero, preventing the creation of agreements with zero or negative values.
- **Valid Status Values**: The status field is restricted to predefined values ('pendente', 'pago_parcial', 'pago_total', 'atrasado'), ensuring consistent status tracking.
- **Valid Type Values**: The tipo field is constrained to 'acordo', 'condenacao', or 'custas_processuais', maintaining data consistency.
- **Valid Direction Values**: The direcao field accepts only 'recebimento' or 'pagamento', ensuring proper financial categorization.

### Business Logic Constraints

The table includes specialized constraints that enforce business rules:

```sql
constraint check_custas_processuais check (
  (tipo = 'custas_processuais' and direcao = 'pagamento' and forma_distribuicao is null and numero_parcelas = 1) or
  (tipo in ('acordo', 'condenacao'))
)
```

This constraint ensures that court costs (custas_processuais) are always payments, have no distribution method, and are single payments.

Another constraint governs distribution methods:

```sql
constraint check_forma_distribuicao_recebimento check (
  (direcao = 'pagamento' and forma_distribuicao is null) or
  (direcao = 'recebimento' and tipo in ('acordo', 'condenacao'))
)
```

This ensures that distribution methods are only applicable to receivables and not to payments.

### Status Calculation Logic

The agreement status is not manually set but automatically calculated based on the status of associated installments through a database trigger. The logic follows these rules:
- **pago_total**: All installments are marked as 'recebida' or 'paga'
- **pago_parcial**: At least one installment is paid, but not all
- **atrasado**: No payments received, and the due date has passed
- **pendente**: No payments received, and the due date has not passed

This automated status calculation ensures real-time accuracy and eliminates manual errors in status tracking.

**Section sources**
- [20250118120000_create_acordos_condenacoes.sql](file://supabase/migrations/aplicadas/20250118120000_create_acordos_condenacoes.sql#L28-L35)
- [20250118120002_create_triggers_and_views.sql](file://supabase/migrations/aplicadas/20250118120002_create_triggers_and_views.sql#L79-L138)

## Indexes and Performance

The acordos_condenacoes table includes several indexes to optimize query performance for common access patterns.

### Index Structure

```sql
create index idx_acordos_condenacoes_processo_id on public.acordos_condenacoes using btree (processo_id);
create index idx_acordos_condenacoes_status on public.acordos_condenacoes using btree (status);
create index idx_acordos_condenacoes_tipo_direcao on public.acordos_condenacoes using btree (tipo, direcao);
create index idx_acordos_condenacoes_data_vencimento on public.acordos_condenacoes using btree (data_vencimento_primeira_parcela);
create index idx_acordos_condenacoes_created_at on public.acordos_condenacoes using btree (created_at desc);
```

### Index Purpose

- **idx_acordos_condenacoes_processo_id**: Optimizes queries that retrieve agreements for a specific legal process, which is a common operation in case management views.
- **idx_acordos_condenacoes_status**: Accelerates filtering by agreement status, enabling quick identification of pending, overdue, or completed agreements.
- **idx_acordos_condenacoes_tipo_direcao**: Supports queries that filter by both type and direction simultaneously, such as finding all receivable agreements.
- **idx_acordos_condenacoes_data_vencimento**: Optimizes date-based queries, particularly for payment scheduling and due date tracking.
- **idx_acordos_condenacoes_created_at**: Facilitates chronological sorting, with a descending order to quickly retrieve the most recent agreements.

These indexes ensure that the application can efficiently retrieve and display agreement data, even as the dataset grows over time. The selection of indexed columns reflects the most common query patterns in the application's financial workflows.

**Section sources**
- [20250118120000_create_acordos_condenacoes.sql](file://supabase/migrations/aplicadas/20250118120000_create_acordos_condenacoes.sql#L52-L56)

## Data Model Diagram

The following Entity-Relationship diagram illustrates the acordos_condenacoes table and its relationships with other entities in the system.

```mermaid
erDiagram
ACORDOS_CONDENACOES {
bigint id PK
bigint processo_id FK
string tipo
string direcao
numeric valor_total
date data_vencimento_primeira_parcela
string status
integer numero_parcelas
string forma_distribuicao
numeric percentual_escritorio
numeric percentual_cliente
numeric honorarios_sucumbenciais_total
uuid created_by FK
timestamp created_at
timestamp updated_at
}
PARCELAS {
bigint id PK
bigint acordo_condenacao_id FK
integer numero_parcela
numeric valor_bruto_credito_principal
numeric honorarios_sucumbenciais
numeric honorarios_contratuais
date data_vencimento
string status
timestamp data_efetivacao
string forma_pagamento
jsonb dados_pagamento
boolean editado_manualmente
numeric valor_repasse_cliente
string status_repasse
string arquivo_declaracao_prestacao_contas
timestamp data_declaracao_anexada
string arquivo_comprovante_repasse
timestamp data_repasse
bigint usuario_repasse_id FK
timestamp created_at
timestamp updated_at
}
ACERVO {
bigint id PK
-- Process fields
}
AUTH_USERS {
uuid id PK
-- User fields
}
ACORDOS_CONDENACOES ||--o{ PARCELAS : "one-to-many"
ACORDOS_CONDENACOES }o--|| ACERVO : "many-to-one"
ACORDOS_CONDENACOES }o--|| AUTH_USERS : "created_by"
```

**Diagram sources **
- [20_acordos_condenacoes.sql](file://supabase/schemas/20_acordos_condenacoes.sql#L6-L87)

## Application Workflow

The acordos_condenacoes table supports a comprehensive financial workflow within the Sinesys legal management system, integrating with various application components.

### Agreement Management Workflow

When a new agreement is created through the application interface, the following process occurs:
1. The user inputs agreement details including type, direction, total value, and payment schedule
2. The application validates the data against business rules
3. A record is created in the acordos_condenacoes table
4. Based on the number of installments, corresponding records are generated in the parcelas table
5. The system automatically calculates installment amounts and due dates

The backend service `acordo-condenacao-persistence.service.ts` handles these operations, providing functions for creating, reading, updating, and deleting agreement records while enforcing business logic.

### Payment Scheduling and Tracking

The table supports detailed payment scheduling through its relationship with the parcelas table. For agreements with multiple installments:
- The first installment's due date is stored in data_vencimento_primeira_parcela
- Subsequent installment dates are calculated based on the payment frequency
- Each installment's status is tracked individually in the parcelas table
- The agreement's overall status is automatically updated based on installment statuses

This enables the system to provide accurate payment reminders, overdue alerts, and financial forecasting.

### Financial Reporting

The structured data in acordos_condenacoes enables comprehensive financial reporting:
- Revenue tracking by agreement type and status
- Receivables aging reports based on due dates
- Client fund liability tracking for agreements with integral distribution
- Court cost expense reporting
- Performance metrics for the legal practice

The indexes on key fields ensure that these reports can be generated efficiently, even with large datasets.

### Repayment Processing

For agreements where the law firm receives funds and must disburse to clients (forma_distribuicao = 'integral'), the system manages the repayment process:
- When an installment is marked as received, the status_repasse in the parcelas table is automatically set to 'pendente_declaracao'
- The firm prepares and attaches a financial statement declaration
- Once the declaration is attached, the status changes to 'pendente_transferencia'
- After transferring funds to the client, the status becomes 'repassado'

The view `repasses_pendentes` identifies all repayments that require processing, enabling efficient workflow management.

**Section sources**
- [acordo-condenacao-persistence.service.ts](file://backend/acordos-condenacoes/services/persistence/acordo-condenacao-persistence.service.ts#L1-L445)
- [repasse-persistence.service.ts](file://backend/acordos-condenacoes/services/persistence/repasse-persistence.service.ts#L338-L376)
- [repasses-pendentes-list.tsx](file://app/(dashboard)/acordos-condenacoes/components/repasses-pendentes-list.tsx#L42-L87)

## Sample Records

The following examples illustrate typical data in the acordos_condenacoes table:

### Settlement Agreement (Receivable)

```json
{
  "id": 1001,
  "processo_id": 5001,
  "tipo": "acordo",
  "direcao": "recebimento",
  "valor_total": 50000.00,
  "data_vencimento_primeira_parcela": "2025-01-15",
  "status": "pago_parcial",
  "numero_parcelas": 12,
  "forma_distribuicao": "integral",
  "percentual_escritorio": 30.00,
  "percentual_cliente": 70.00,
  "honorarios_sucumbenciais_total": 5000.00,
  "created_at": "2024-12-10T09:30:00Z"
}
```

This record represents a settlement agreement for R$50,000.00, received in 12 monthly installments starting January 15, 2025. The law firm retains 30% (R$15,000.00) as contractual fees, while 70% (R$35,000.00) will be distributed to the client. Additionally, the firm receives R$5,000.00 in court-awarded fees.

### Court-Ordered Payment

```json
```