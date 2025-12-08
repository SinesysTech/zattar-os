# Sinesys Type Definitions

<cite>
**Referenced Files in This Document**   
- [types/index.ts](file://types/index.ts)
- [types/domain/index.ts](file://types/domain/index.ts)
- [types/contracts/index.ts](file://types/contracts/index.ts)
- [types/sinesys/index.ts](file://types/sinesys/index.ts)
- [types/domain/common.ts](file://types/domain/common.ts)
- [types/domain/acervo.ts](file://types/domain/acervo.ts)
- [types/domain/audiencias.ts](file://types/domain/audiencias.ts)
- [types/domain/partes.ts](file://types/domain/partes.ts)
- [types/domain/processo-partes.ts](file://types/domain/processo-partes.ts)
- [types/contracts/acervo.ts](file://types/contracts/acervo.ts)
- [types/contracts/audiencias.ts](file://types/contracts/audiencias.ts)
- [types/contracts/partes.ts](file://types/contracts/partes.ts)
- [types/sinesys/common.ts](file://types/sinesys/common.ts)
- [types/sinesys/processos.ts](file://types/sinesys/processos.ts)
- [types/assinatura-digital/formulario.types.ts](file://types/assinatura-digital/formulario.types.ts)
- [types/assinatura-digital/segmento.types.ts](file://types/assinatura-digital/segmento.types.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Type System Architecture](#type-system-architecture)
3. [Domain Types](#domain-types)
4. [Contract Types](#contract-types)
5. [Sinesys-Specific Types](#sinesys-specific-types)
6. [Assinatura Digital Types](#assinatura-digital-types)
7. [Type Relationships and Dependencies](#type-relationships-and-dependencies)
8. [Conclusion](#conclusion)

## Introduction

The Sinesys application features a comprehensive type system organized into distinct categories that serve different purposes within the application architecture. This documentation provides an in-depth analysis of the type definitions, their organization, relationships, and usage patterns across the codebase. The type system is structured to separate domain entities from API contracts and application-specific types, creating a clear separation of concerns and facilitating maintainability.

The type definitions are primarily located in the `/types` directory and are organized into several subdirectories: `domain` for core business entities, `contracts` for API request/response shapes, `sinesys` for application-specific types, and `assinatura-digital` for digital signature related types. This modular structure allows for type reusability and clear boundaries between different aspects of the application.

**Section sources**
- [types/index.ts](file://types/index.ts)
- [types/domain/index.ts](file://types/domain/index.ts)
- [types/contracts/index.ts](file://types/contracts/index.ts)
- [types/sinesys/index.ts](file://types/sinesys/index.ts)

## Type System Architecture

The Sinesys type system follows a layered architecture with clear separation between different type categories. The architecture is designed to promote type safety, reusability, and maintainability across the application.

```mermaid
graph TD
A["Type System Architecture"] --> B["Domain Types"]
A --> C["Contract Types"]
A --> D["Sinesys-Specific Types"]
A --> E["Assinatura Digital Types"]
B --> F["Core business entities"]
B --> G["Shared domain primitives"]
C --> H["API request parameters"]
C --> I["API response structures"]
C --> J["Service operation contracts"]
D --> K["API response wrappers"]
D --> L["Application-specific schemas"]
D --> M["Zod validation schemas"]
E --> N["Form definitions"]
E --> O["Segment definitions"]
E --> P["Template types"]
B -- "Used by" --> C
B -- "Used by" --> D
C -- "Used by" --> E
```

**Diagram sources**
- [types/index.ts](file://types/index.ts)
- [types/domain/index.ts](file://types/domain/index.ts)
- [types/contracts/index.ts](file://types/contracts/index.ts)
- [types/sinesys/index.ts](file://types/sinesys/index.ts)

**Section sources**
- [types/index.ts](file://types/index.ts)
- [types/domain/index.ts](file://types/domain/index.ts)
- [types/contracts/index.ts](file://types/contracts/index.ts)
- [types/sinesys/index.ts](file://types/sinesys/index.ts)

## Domain Types

The domain types represent the core business entities and primitives of the Sinesys application. These types define the fundamental data structures used throughout the system and are organized in the `types/domain` directory. The domain types serve as the single source of truth for business entities and are imported and extended by other type categories.

### Common Domain Primitives

The `common.ts` file in the domain directory defines shared types and enums used across multiple domain entities. These include pagination structures, person types, PJE status codes, jurisdiction degrees, and process status enums.

```mermaid
classDiagram
class Paginacao {
+pagina : number
+limite : number
+total : number
+totalPaginas : number
}
class TipoPessoa {
<<type>>
'pf' | 'pj'
}
class SituacaoPJE {
<<type>>
'A' | 'I' | 'E' | 'H'
}
class GrauProcesso {
<<type>>
'primeiro_grau' | 'segundo_grau' | 'tribunal_superior'
}
class StatusProcesso {
<<enum>>
ATIVO
SUSPENSO
ARQUIVADO
EXTINTO
BAIXADO
PENDENTE
EM_RECURSO
OUTRO
}
```

**Diagram sources**
- [types/domain/common.ts](file://types/domain/common.ts)

### Acervo Domain Types

The acervo types define the structure of legal cases and processes within the system. The `Acervo` interface represents a case record with detailed information including process number, jurisdiction, parties involved, and status. The system also includes specialized types for process grouping and unified views that aggregate data from multiple instances of a process.

```mermaid
classDiagram
class Acervo {
+id : number
+id_pje : number
+advogado_id : number
+origem : OrigemAcervo
+trt : string
+grau : GrauProcesso
+numero_processo : string
+classe_judicial : string
+segredo_justica : boolean
+status : StatusProcesso
+data_autuacao : string
+nome_parte_autora : string
+nome_parte_re : string
+responsavel_id : number | null
+created_at : string
+updated_at : string
}
class AgrupamentoAcervo {
+grupo : string
+quantidade : number
+processos? : Acervo[]
}
class ProcessoInstancia {
+id : number
+grau : GrauProcesso
+origem : OrigemAcervo
+trt : string
+data_autuacao : string
+status : StatusProcesso
+updated_at : string
+is_grau_atual : boolean
}
class ProcessoUnificado {
+id : number
+grau_atual : GrauProcesso
+status_geral : StatusProcesso
+instances : ProcessoInstancia[]
+graus_ativos : GrauProcesso[]
}
Acervo --> GrauProcesso : "uses"
Acervo --> StatusProcesso : "uses"
ProcessoUnificado --> Acervo : "extends"
ProcessoUnificado --> ProcessoInstancia : "contains"
```

**Diagram sources**
- [types/domain/acervo.ts](file://types/domain/acervo.ts)

### Audiencias Domain Types

The audiencias types define the structure of court hearings within the system. The `Audiencia` interface contains comprehensive information about a hearing including date, time, location, participants, and status. The system includes specific types for hearing status, modality, and hybrid presence to capture the different ways hearings can be conducted.

```mermaid
classDiagram
class StatusAudiencia {
<<type>>
'M' | 'F' | 'C'
}
class ModalidadeAudiencia {
<<type>>
'virtual' | 'presencial' | 'hibrida'
}
class PresencaHibrida {
<<type>>
'advogado' | 'cliente'
}
class Audiencia {
+id : number
+id_pje : number
+advogado_id : number
+processo_id : number
+orgao_julgador_id : number | null
+trt : string
+grau : GrauProcesso
+numero_processo : string
+data_inicio : string
+data_fim : string
+hora_inicio : string | null
+hora_fim : string | null
+modalidade : ModalidadeAudiencia | null
+presenca_hibrida : PresencaHibrida | null
+status : string
+tipo_audiencia_id : number | null
+url_audiencia_virtual : string | null
+endereco_presencial : object | null
+responsavel_id : number | null
+observacoes : string | null
+created_at : string
+updated_at : string
}
Audiencia --> GrauProcesso : "uses"
Audiencia --> ModalidadeAudiencia : "uses"
Audiencia --> PresencaHibrida : "uses"
```

**Diagram sources**
- [types/domain/audiencias.ts](file://types/domain/audiencias.ts)

### Partes Domain Types

The partes types define the structure of parties involved in legal cases, including clients, opposing parties, and third parties. The system uses a discriminated union pattern to handle both physical and legal persons, with specific interfaces for each type that extend a common base interface.

```mermaid
classDiagram
class TipoPessoa {
<<type>>
'pf' | 'pj'
}
class ClienteBase {
+id : number
+tipo_pessoa : TipoPessoa
+nome : string
+emails : string[] | null
+ddd_celular : string | null
+numero_celular : string | null
+cpf : string | null
+cnpj : string | null
+endereco_id : number | null
+ativo : boolean
+created_at : string
+updated_at : string
}
class ClientePessoaFisica {
+tipo_pessoa : 'pf'
+cpf : string
+cnpj : null
+rg : string | null
+data_nascimento : string | null
}
class ClientePessoaJuridica {
+tipo_pessoa : 'pj'
+cnpj : string
+cpf : null
+inscricao_estadual : string | null
+data_abertura : string | null
}
class ParteContrariaBase {
+id : number
+tipo_pessoa : TipoPessoa
+nome : string
+emails : string[] | null
+cpf : string | null
+cnpj : string | null
}
class TerceiroBase {
+id : number
+tipo_parte : TipoParteTerceiro
+polo : PoloTerceiro
+tipo_pessoa : TipoPessoa
+nome : string
+cpf : string | null
+cnpj : string | null
}
ClienteBase <|-- ClientePessoaFisica : "extends"
ClienteBase <|-- ClientePessoaJuridica : "extends"
ParteContrariaBase <|-- ParteContrariaPessoaFisica : "extends"
ParteContrariaBase <|-- ParteContrariaPessoaJuridica : "extends"
TerceiroBase <|-- TerceiroPessoaFisica : "extends"
TerceiroBase <|-- TerceiroPessoaJuridica : "extends"
```

**Diagram sources**
- [types/domain/partes.ts](file://types/domain/partes.ts)

### Processo-Partes Domain Types

The processo-partes types define the relationship between parties and legal cases, serving as the junction table for the many-to-many relationship between parties and processes. These types include the `ProcessoParte` interface that represents a party's participation in a case, along with related types for retrieving parties with complete data and processes with participation information.

```mermaid
classDiagram
class EntidadeTipoProcessoParte {
<<type>>
'cliente' | 'parte_contraria' | 'terceiro'
}
class PoloProcessoParte {
<<type>>
'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO'
}
class TipoParteProcesso {
<<type>>
'AUTOR' | 'REU' | 'RECLAMANTE' | 'RECLAMADO' |
'EXEQUENTE' | 'EXECUTADO' | 'APELANTE' | 'APELADO' |
'PERITO' | 'MINISTERIO_PUBLICO' | 'ASSISTENTE' | 'TESTEMUNHA'
}
class ProcessoParte {
+id : number
+processo_id : number
+tipo_entidade : EntidadeTipoProcessoParte
+entidade_id : number
+tipo_parte : TipoParteProcesso
+polo : PoloProcessoParte
+principal : boolean | null
+ordem : number | null
+trt : string
+grau : GrauProcesso
+created_at : string | null
+updated_at : string | null
}
class ParteComDadosCompletos {
+id : number
+processo_id : number
+tipo_entidade : EntidadeTipoProcessoParte
+entidade_id : number
+tipo_parte : TipoParteProcesso
+polo : PoloProcessoParte
+nome : string
+tipo_pessoa : TipoPessoa
+cpf : string | null
+cnpj : string | null
}
class ProcessoComParticipacao {
+id : number
+processo_id : number
+numero_processo : string
+trt : string
+grau : GrauProcesso
+tipo_parte : TipoParteProcesso
+polo : PoloProcessoParte
+classe_judicial : string | null
+data_autuacao : string | null
}
ProcessoParte --> EntidadeTipoProcessoParte : "uses"
ProcessoParte --> PoloProcessoParte : "uses"
ProcessoParte --> TipoParteProcesso : "uses"
ProcessoParte --> GrauProcesso : "uses"
```

**Diagram sources**
- [types/domain/processo-partes.ts](file://types/domain/processo-partes.ts)

**Section sources**
- [types/domain/common.ts](file://types/domain/common.ts)
- [types/domain/acervo.ts](file://types/domain/acervo.ts)
- [types/domain/audiencias.ts](file://types/domain/audiencias.ts)
- [types/domain/partes.ts](file://types/domain/partes.ts)
- [types/domain/processo-partes.ts](file://types/domain/processo-partes.ts)

## Contract Types

The contract types define the shapes of API requests and responses, serving as the interface between the frontend and backend services. These types are organized in the `types/contracts` directory and are designed to be used in API service calls, form validations, and data transfer operations.

### Acervo Contract Types

The acervo contract types define the parameters and response structures for operations related to legal cases. These include types for sorting, filtering, and grouping cases, as well as the result structures for different query operations.

```mermaid
classDiagram
class OrdenarPorAcervo {
<<type>>
'data_autuacao' | 'numero_processo' |
'nome_parte_autora' | 'nome_parte_re' |
'data_arquivamento' | 'data_proxima_audiencia' |
'prioridade_processual' | 'created_at' | 'updated_at'
}
class AgruparPorAcervo {
<<type>>
'trt' | 'grau' | 'origem' | 'responsavel_id' |
'classe_judicial' | 'codigo_status_processo' |
'orgao_julgador' | 'mes_autuacao' | 'ano_autuacao'
}
class OrdemAcervo {
<<type>>
'asc' | 'desc'
}
class ListarAcervoParams {
+pagina? : number
+limite? : number
+unified? : boolean
+origem? : OrigemAcervo
+trt? : string
+grau? : GrauProcesso
+responsavel_id? : number | 'null'
+busca? : string
+numero_processo? : string
+ordenar_por? : OrdenarPorAcervo
+ordem? : OrdemAcervo
+agrupar_por? : AgruparPorAcervo
}
class ListarAcervoResult {
+processos : Acervo[]
+total : number
+pagina : number
+limite : number
+totalPaginas : number
}
class ListarAcervoAgrupadoResult {
+agrupamentos : AgrupamentoAcervo[]
+total : number
}
class ListarAcervoUnificadoResult {
+processos : ProcessoUnificado[]
+total : number
+pagina : number
+limite : number
+totalPaginas : number
}
ListarAcervoParams --> OrigemAcervo : "uses"
ListarAcervoParams --> GrauProcesso : "uses"
ListarAcervoParams --> OrdenarPorAcervo : "uses"
ListarAcervoParams --> OrdemAcervo : "uses"
ListarAcervoParams --> AgruparPorAcervo : "uses"
ListarAcervoResult --> Acervo : "contains"
ListarAcervoAgrupadoResult --> AgrupamentoAcervo : "contains"
ListarAcervoUnificadoResult --> ProcessoUnificado : "contains"
```

**Diagram sources**
- [types/contracts/acervo.ts](file://types/contracts/acervo.ts)

### Audiencias Contract Types

The audiencias contract types define the parameters and response structures for operations related to court hearings. These include types for sorting and filtering hearings, as well as parameter types for creating new hearings.

```mermaid
classDiagram
class OrdenarPorAudiencia {
<<type>>
'data_inicio' | 'data_fim' | 'hora_inicio' |
'hora_fim' | 'numero_processo' | 'polo_ativo_nome' |
'polo_passivo_nome' | 'status' | 'modalidade' |
'tipo_descricao' | 'trt' | 'grau' |
'orgao_julgador_descricao' | 'sala_audiencia_nome' |
'responsavel_id' | 'created_at' | 'updated_at'
}
class OrdemAudiencia {
<<type>>
'asc' | 'desc'
}
class ListarAudienciasParams {
+pagina? : number
+limite? : number
+trt? : string
+grau? : GrauProcesso
+responsavel_id? : number | 'null'
+busca? : string
+numero_processo? : string
+status? : StatusAudiencia | string
+modalidade? : ModalidadeAudiencia
+data_inicio_inicio? : string
+data_inicio_fim? : string
+ordenar_por? : OrdenarPorAudiencia
+ordem? : OrdemAudiencia
}
class ListarAudienciasResult {
+audiencias : Audiencia[]
+total : number
+pagina : number
+limite : number
+totalPaginas : number
}
class CriarAudienciaParams {
+processo_id : number
+advogado_id : number
+data_inicio : string
+data_fim : string
+tipo_audiencia_id? : number
+sala_audiencia_id? : number
+url_audiencia_virtual? : string
+endereco_presencial? : object
+observacoes? : string
+responsavel_id? : number
}
ListarAudienciasParams --> GrauProcesso : "uses"
ListarAudienciasParams --> StatusAudiencia : "uses"
ListarAudienciasParams --> ModalidadeAudiencia : "uses"
ListarAudienciasParams --> OrdenarPorAudiencia : "uses"
ListarAudienciasParams --> OrdemAudiencia : "uses"
ListarAudienciasResult --> Audiencia : "contains"
CriarAudienciaParams --> Audiencia : "partial"
```

**Diagram sources**
- [types/contracts/audiencias.ts](file://types/contracts/audiencias.ts)

### Partes Contract Types

The partes contract types define the parameters and response structures for operations related to parties (clients, opposing parties, and third parties). These include comprehensive types for creating, updating, and listing parties, with specific variants for physical and legal persons.

```mermaid
flowchart TD
A["Partes Contract Types"] --> B["Creation Parameters"]
A --> C["Update Parameters"]
A --> D["Listing Parameters"]
A --> E["Result Structures"]
B --> B1["CriarClientePFParams"]
B --> B2["CriarClientePJParams"]
B --> B3["CriarParteContrariaPFParams"]
B --> B4["CriarParteContrariaPJParams"]
B --> B5["CriarTerceiroPFParams"]
B --> B6["CriarTerceiroPJParams"]
C --> C1["AtualizarClientePFParams"]
C --> C2["AtualizarClientePJParams"]
C --> C3["AtualizarParteContrariaPFParams"]
C --> C4["AtualizarParteContrariaPJParams"]
C --> C5["AtualizarTerceiroPFParams"]
C --> C6["AtualizarTerceiroPJParams"]
D --> D1["ListarClientesParams"]
D --> D2["ListarPartesContrariasParams"]
D --> D3["ListarTerceirosParams"]
E --> E1["ListarClientesResult"]
E --> E2["ListarPartesContrariasResult"]
E --> E3["ListarTerceirosResult"]
B1 --> B7["CriarClienteParams"]
B2 --> B7
B3 --> B8["CriarParteContrariaParams"]
B4 --> B8
B5 --> B9["CriarTerceiroParams"]
B6 --> B9
C1 --> C7["AtualizarClienteParams"]
C2 --> C7
C3 --> C8["AtualizarParteContrariaParams"]
C4 --> C8
C5 --> C9["AtualizarTerceiroParams"]
C6 --> C9
E1 --> E4["ClienteComEndereco"]
E2 --> E5["ParteContrariaComEndereco"]
E3 --> E6["TerceiroComEndereco"]
```

**Diagram sources**
- [types/contracts/partes.ts](file://types/contracts/partes.ts)

**Section sources**
- [types/contracts/acervo.ts](file://types/contracts/acervo.ts)
- [types/contracts/audiencias.ts](file://types/contracts/audiencias.ts)
- [types/contracts/partes.ts](file://types/contracts/partes.ts)

## Sinesys-Specific Types

The Sinesys-specific types are located in the `types/sinesys` directory and define application-specific interfaces, enums, and validation schemas. These types are tailored to the specific needs of the Sinesys application and often include Zod schemas for runtime validation of API responses.

### Common Sinesys Types

The common types in the sinesys namespace define shared application-specific types and their corresponding Zod validation schemas. These include types for API responses, timeline status, client roles, hearing modalities, and agreement types.

```mermaid
classDiagram
class ApiResponse {
+success : boolean
+data? : T
+error? : string
}
class TimelineStatus {
<<type>>
'disponivel' | 'sincronizando' | 'indisponivel'
}
class PapelCliente {
<<type>>
'Reclamante' | 'Reclamado' | 'Autor' | 'Réu'
}
class ModalidadeAudiencia {
<<type>>
'Virtual' | 'Presencial' | 'Híbrida'
}
class StatusAudiencia {
<<type>>
'Designada' | 'Realizada' | 'Cancelada' | 'Adiada'
}
class TipoLocalAudiencia {
<<type>>
'virtual' | 'presencial' | 'hibrido'
}
class StatusContrato {
<<type>>
'ativo' | 'encerrado' | 'suspenso'
}
class TipoAcordo {
<<type>>
'acordo' | 'condenacao'
}
class DirecaoAcordo {
<<type>>
'recebimento' | 'pagamento'
}
class FormaPagamento {
<<type>>
'unica' | 'parcelada'
}
class ModalidadePagamento {
<<type>>
'judicial' | 'extrajudicial'
}
class StatusParcela {
<<type>>
'pendente' | 'paga' | 'vencida'
}
ApiResponse <|-- ProcessosResponse : "specialization"
```

**Diagram sources**
- [types/sinesys/common.ts](file://types/sinesys/common.ts)

### Processos Sinesys Types

The processos types define the structure of legal cases as represented in the Sinesys application, including timeline items, instance information, party details, and response structures for the process API. These types are specifically designed for the Sinesys frontend and include comprehensive Zod schemas for validation.

```mermaid
classDiagram
class TimelineItem {
+data : string
+evento : string
+descricao : string
+tem_documento : boolean
}
class InstanciaSinesys {
+vara : string
+data_inicio : string
+proxima_audiencia? : string
}
class PartesProcesso {
+polo_ativo : string
+polo_passivo : string
}
class UltimaMovimentacao {
+data : string
+evento : string
}
class ProcessoSinesys {
+numero : string
+tipo : string
+papel_cliente : PapelCliente
+parte_contraria : string
+tribunal : string
+sigilo : boolean
+valor_causa? : number
+vara? : string
+instancias : object
+timeline : TimelineItem[]
+timeline_status : TimelineStatus
+timeline_mensagem? : string
+ultima_movimentacao? : UltimaMovimentacao
+partes : PartesProcesso
}
class ClienteInfo {
+nome : string
+cpf : string
}
class ResumoProcessos {
+total_processos : number
+com_audiencia_proxima : number
}
class ProcessosResponseData {
+cliente : ClienteInfo
+resumo : ResumoProcessos
+processos : ProcessoSinesys[]
}
class ProcessosResponse {
+success : boolean
+data? : ProcessosResponseData
+error? : string
}
ProcessoSinesys --> PapelCliente : "uses"
ProcessoSinesys --> TimelineStatus : "uses"
ProcessoSinesys --> TimelineItem : "contains"
ProcessoSinesys --> InstanciaSinesys : "contains"
ProcessoSinesys --> UltimaMovimentacao : "contains"
ProcessoSinesys --> PartesProcesso : "contains"
ProcessosResponseData --> ClienteInfo : "contains"
ProcessosResponseData --> ResumoProcessos : "contains"
ProcessosResponseData --> ProcessoSinesys : "contains"
ProcessosResponse --> ProcessosResponseData : "contains"
```

**Diagram sources**
- [types/sinesys/processos.ts](file://types/sinesys/processos.ts)

**Section sources**
- [types/sinesys/common.ts](file://types/sinesys/common.ts)
- [types/sinesys/processos.ts](file://types/sinesys/processos.ts)

## Assinatura Digital Types

The assinatura digital types are located in the `types/assinatura-digital` directory and define the structures for digital signature forms, segments, and templates. These types support the digital document signing functionality within the Sinesys application.

### Formulario Types

The formulario types define the structure of digital forms, including form schemas, form entities, and template definitions. These types support the creation and management of digital forms that can be signed electronically.

```mermaid
classDiagram
class FormSchema {
+fields : FormField[]
+validations : ValidationRule[]
+layout : LayoutConfig
}
class FormField {
+id : string
+type : FieldType
+label : string
+required : boolean
+validation : FieldValidation
}
class FieldType {
<<enum>>
TEXT
NUMBER
DATE
EMAIL
PHONE
SELECT
CHECKBOX
RADIO
}
class FormularioEntity {
+id : string
+name : string
+schema : FormSchema
+segmento : string
+created_at : string
+updated_at : string
}
class Template {
+id : string
+name : string
+content : string
+variables : TemplateVariable[]
+segmento : string
}
class TemplateVariable {
+name : string
+type : string
+description : string
}
FormularioEntity --> FormSchema : "contains"
Template --> TemplateVariable : "contains"
```

**Diagram sources**
- [types/assinatura-digital/formulario.types.ts](file://types/assinatura-digital/formulario.types.ts)

### Segmento Types

The segmento types define the structure of form segments, which are used to organize digital forms by business area or client type. These types support the categorization and management of forms within different segments of the application.

```mermaid
classDiagram
class Segmento {
+id : string
+name : string
+description : string
+icon : string
+order : number
+active : boolean
}
class SegmentoConfig {
+segmento : string
+formTemplates : string[]
+defaultValues : Record<string, any>
+workflow : WorkflowStep[]
}
class WorkflowStep {
+id : string
+name : string
+requiredFields : string[]
+approvalRequired : boolean
+nextStep : string
}
Segmento --> SegmentoConfig : "has"
SegmentoConfig --> WorkflowStep : "contains"
```

**Diagram sources**
- [types/assinatura-digital/segmento.types.ts](file://types/assinatura-digital/segmento.types.ts)

**Section sources**
- [types/assinatura-digital/formulario.types.ts](file://types/assinatura-digital/formulario.types.ts)
- [types/assinatura-digital/segmento.types.ts](file://types/assinatura-digital/segmento.types.ts)

## Type Relationships and Dependencies

The Sinesys type system features a well-defined dependency hierarchy where domain types serve as the foundation for contract and application-specific types. This section analyzes the relationships and dependencies between different type categories.

```mermaid
graph TD
A["Domain Types"] --> B["Contract Types"]
A --> C["Sinesys-Specific Types"]
A --> D["Assinatura Digital Types"]
B --> D
C --> E["API Services"]
D --> E
B --> E
subgraph "Domain Layer"
A
end
subgraph "Contract Layer"
B
end
subgraph "Application Layer"
C
D
end
subgraph "Service Layer"
E
end
style A fill:#f9f,stroke:#333
style B fill:#bbf,stroke:#333
style C fill:#f96,stroke:#333
style D fill:#6f9,stroke:#333
style E fill:#9f9,stroke:#333
```

The dependency analysis reveals several key patterns in the type system:

1. **Domain-Centric Architecture**: The domain types serve as the foundation of the entire type system, with all other type categories depending on them. This ensures consistency and reduces duplication across the application.

2. **Separation of Concerns**: The system clearly separates domain entities (what the data is) from contracts (how the data is transferred) and application-specific types (how the data is used in the UI).

3. **Validation Layer**: The Sinesys-specific types include Zod schemas that provide runtime validation for API responses, adding an additional layer of type safety beyond compile-time TypeScript checking.

4. **Extensibility**: The contract types extend domain types with additional properties needed for API operations, such as pagination parameters and filtering options, while maintaining compatibility with the underlying domain entities.

5. **Feature-Specific Types**: The assinatura digital types represent a specialized feature area with its own type hierarchy, demonstrating how the system can accommodate feature-specific requirements while still integrating with the broader type system.

**Section sources**
- [types/index.ts](file://types/index.ts)
- [types/domain/index.ts](file://types/domain/index.ts)
- [types/contracts/index.ts](file://types/contracts/index.ts)
- [types/sinesys/index.ts](file://types/sinesys/index.ts)

## Conclusion

The Sinesys type system is a comprehensive and well-structured implementation that effectively separates concerns between domain entities, API contracts, and application-specific types. The system demonstrates several best practices in TypeScript type design:

1. **Modular Organization**: Types are organized into logical directories based on their purpose, making them easy to locate and understand.

2. **Clear Hierarchy**: The dependency hierarchy flows from domain types to contracts to application-specific types, creating a clear progression from business entities to UI representations.

3. **Reusability**: Common types and primitives are defined once and reused across multiple domains, reducing duplication and ensuring consistency.

4. **Runtime Validation**: The inclusion of Zod schemas for API responses provides an additional layer of type safety beyond compile-time checking.

5. **Extensibility**: The system is designed to accommodate new features and requirements through well-defined extension points.

The type system serves as a single source of truth for data structures across the application, enabling better collaboration between frontend and backend teams, reducing bugs related to data shape mismatches, and improving overall code quality. By maintaining a clear separation between different type categories and establishing well-defined dependencies, the Sinesys type system provides a solid foundation for the application's continued development and evolution.