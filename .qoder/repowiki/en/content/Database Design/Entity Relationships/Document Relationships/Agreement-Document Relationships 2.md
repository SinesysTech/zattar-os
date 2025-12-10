# Agreement-Document Relationships

<cite>
**Referenced Files in This Document**   
- [20_acordos_condenacoes.sql](file://supabase/schemas/20_acordos_condenacoes.sql)
- [25_assinatura_digital.sql](file://supabase/schemas/25_assinatura_digital.sql)
- [documentos-persistence.service.ts](file://backend/documentos/services/persistence/documentos-persistence.service.ts)
- [versoes-persistence.service.ts](file://backend/documentos/services/persistence/versoes-persistence.service.ts)
- [acordo-condenacao-form.tsx](file://app/(dashboard)/acordos-condenacoes/components/acordo-condenacao-form.tsx)
- [route.ts](file://app/api/acordos-condenacoes/[id]/route.ts)
- [route.ts](file://app/api/acordos-condenacoes/route.ts)
- [route.ts](file://app/api/documentos/[id]/route.ts)
- [route.ts](file://app/api/documentos/[id]/versoes/route.ts)
- [recovery-analysis.service.ts](file://backend/captura/services/recovery/recovery-analysis.service.ts)
- [endereco-recovery.service.ts](file://backend/captura/services/recovery/endereco-recovery.service.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Database Schema Implementation](#database-schema-implementation)
3. [Generic Foreign Key System](#generic-foreign-key-system)
4. [API Endpoints for Document Operations](#api-endpoints-for-document-operations)
5. [Frontend Components for Document Management](#frontend-components-for-document-management)
6. [Document Signing Process](#document-signing-process)
7. [Security, Audit Trails, and Compliance](#security-audit-trails-and-compliance)
8. [Common Workflows](#common-workflows)
9. [Conclusion](#conclusion)

## Introduction
The Sinesys system implements a sophisticated relationship between documents and judgment agreements (acordos_condenacoes) through a generic foreign key system. This documentation details how documents are linked to judgment agreements using the 'entidade_tipo' and 'entidade_id' fields, which enable flexible associations across different entity types within the system. The architecture supports document versioning, secure storage, and comprehensive audit trails while maintaining referential integrity through database constraints. This system allows users to attach signed settlement agreements to judgment agreements, retrieve all documents related to specific agreements, and manage document versions throughout the agreement lifecycle.

## Database Schema Implementation
The database schema in Sinesys implements a robust structure for managing agreement-document relationships with strict referential integrity constraints. The core tables involved are `acordos_condenacoes` for judgment agreements and a generic document system that supports relationships with multiple entity types through polymorphic associations.

The `acordos_condenacoes` table contains essential fields for tracking judgment agreements, including `processo_id` (foreign key to the acervo table), `tipo` (acordo, condenacao, or custas_processuais), `direcao` (recebimento or pagamento), `valor_total`, and `status`. The table includes constraints ensuring data integrity, such as check constraints on the `tipo` and `direcao` fields, and foreign key constraints linking to related tables.

For document management, the system uses a generic foreign key approach with `entidade_tipo` and `entidade_id` fields that allow documents to be associated with various entity types, including judgment agreements. This design enables a single document management system to serve multiple modules within the application while maintaining referential integrity through proper indexing and constraints.

**Section sources**
- [20_acordos_condenacoes.sql](file://supabase/schemas/20_acordos_condenacoes.sql#L6-L128)

## Generic Foreign Key System
The Sinesys system implements a generic foreign key system using the 'entidade_tipo' and 'entidade_id' fields to establish relationships between documents and judgment agreements. This polymorphic association pattern allows documents to be linked to various entity types within the system, providing flexibility while maintaining data integrity.

The implementation follows a consistent pattern across the codebase, where entities are identified by a type field (entidade_tipo) and an ID field (entidade_id). This approach is evident in the recovery analysis service, which processes entities of different types (cliente, parte_contraria, terceiro) using these generic fields to establish relationships with their corresponding addresses and other related data.

This generic foreign key system enables the document management functionality to work seamlessly with judgment agreements and other entities without requiring separate document tables for each entity type. The system maintains referential integrity through proper indexing on the entidade_tipo and entidade_id fields, ensuring efficient lookups and preventing orphaned records.

**Section sources**
- [recovery-analysis.service.ts](file://backend/captura/services/recovery/recovery-analysis.service.ts#L273-L275)
- [endereco-recovery.service.ts](file://backend/captura/services/recovery/endereco-recovery.service.ts#L330-L350)

## API Endpoints for Document Operations
The Sinesys system provides a comprehensive set of API endpoints for managing document operations related to judgment agreements. These endpoints enable users to upload settlement documents, retrieve agreement-related documents, and manage document versions through a RESTful interface.

The document management API includes endpoints for creating, reading, updating, and deleting documents, as well as specialized endpoints for version management. The `/api/documentos/[id]/versoes` endpoint allows for retrieving document version history, while the `/api/documentos/[id]/versoes/[versaoId]/restaurar` endpoint enables restoring previous document versions. For judgment agreements specifically, the system provides endpoints like `/api/acordos-condenacoes/[id]` for retrieving agreement details including associated documents.

Document upload functionality is handled through the `/api/documentos/[id]/upload` endpoint, which processes file uploads and associates them with the appropriate entity. The system also includes endpoints for document sharing and permission management, allowing controlled access to agreement-related documents.

**Section sources**
- [route.ts](file://app/api/acordos-condenacoes/[id]/route.ts#L112-L198)
- [route.ts](file://app/api/acordos-condenacoes/route.ts#L128-L245)
- [route.ts](file://app/api/documentos/[id]/route.ts#L1-L200)
- [route.ts](file://app/api/documentos/[id]/versoes/route.ts#L1-L150)

## Frontend Components for Document Management
The frontend components in the agreements module provide a user-friendly interface for managing documents associated with judgment agreements. The system includes specialized components for displaying document lists, handling uploads, and managing document versions within the context of specific agreements.

The `acordo-condenacao-form.tsx` component implements a comprehensive form for creating and editing judgment agreements, with integrated document management capabilities. This component allows users to attach documents directly to agreements during creation or editing, providing a seamless workflow for associating settlement agreements with their corresponding judgment records.

Document display functionality is implemented through a document list component that shows all documents related to a specific judgment agreement. The interface includes filtering and sorting options, making it easy for users to locate specific documents. Upload functionality is integrated directly into the agreement view, allowing users to add new documents without navigating away from the agreement details.

**Section sources**
- [acordo-condenacao-form.tsx](file://app/(dashboard)/acordos-condenacoes/components/acordo-condenacao-form.tsx#L1-L369)

## Document Signing Process
The document signing process in Sinesys is specifically designed to handle judgment agreements with a focus on security, compliance, and auditability. When a settlement agreement needs to be signed, the system generates a document using predefined templates and initiates a signing workflow that captures comprehensive metadata about the signing process.

The signing process captures important information including IP address, user agent, geolocation data, and timestamps, creating a robust audit trail. For judgment agreements, this process ensures that signed settlement documents are properly linked to their corresponding agreement records through the generic foreign key system. The signed documents are stored securely with versioning, allowing users to track changes and maintain compliance with legal requirements.

Signed documents are stored with metadata that includes the protocol number, signature URL, and PDF URL, making it easy to verify the authenticity of the document. The system also maintains a record of the signing session, including device information and geolocation data, providing additional layers of security and verification.

**Section sources**
- [25_assinatura_digital.sql](file://supabase/schemas/25_assinatura_digital.sql#L99-L133)

## Security, Audit Trails, and Compliance
The Sinesys system implements comprehensive security measures, audit trails, and compliance features for agreement-document relationships. The system uses Row Level Security (RLS) policies to ensure that only authorized users can access agreement-related documents, with different permission levels for viewing, editing, and sharing.

Audit trails are maintained through comprehensive logging of all document operations, including creation, modification, deletion, and access. Each document version is timestamped and associated with the user who made the changes, creating a complete history of document evolution. For judgment agreements specifically, the system tracks all changes to agreement terms and associated documents, providing a complete audit trail for legal and compliance purposes.

Compliance requirements are addressed through secure document storage, encryption, and retention policies. The system ensures that signed settlement agreements are stored in their original form with all associated metadata, meeting legal requirements for document authenticity and integrity. Access to sensitive documents is logged and monitored, with alerts for suspicious activity.

**Section sources**
- [25_assinatura_digital.sql](file://supabase/schemas/25_assinatura_digital.sql#L134-L207)
- [documentos-persistence.service.ts](file://backend/documentos/services/persistence/documentos-persistence.service.ts#L397-L427)

## Common Workflows
The Sinesys system supports several common workflows for managing agreement-document relationships. One primary workflow involves attaching a signed settlement agreement to an existing judgment agreement. Users can upload the signed document directly from the agreement view, where it is automatically linked to the agreement through the generic foreign key system.

Another common workflow is viewing all documents related to a specific judgment agreement. Users can navigate to the agreement details page and access a comprehensive document list that shows all associated documents, including settlement agreements, payment receipts, and correspondence. The interface allows sorting and filtering of documents by type, date, and status.

For document version management, users can view the complete version history of any agreement-related document. The system displays all previous versions with timestamps and author information, allowing users to compare versions and restore previous states if needed. This is particularly useful for tracking changes to settlement terms or other agreement documents.

**Section sources**
- [versoes-persistence.service.ts](file://backend/documentos/services/persistence/versoes-persistence.service.ts#L207-L267)

## Conclusion
The Sinesys system implements a robust and flexible relationship between documents and judgment agreements through its generic foreign key system using 'entidade_tipo' and 'entidade_id' fields. This architecture enables seamless integration of document management with judgment agreements while maintaining data integrity and security. The comprehensive API endpoints, intuitive frontend components, and robust document signing process provide users with powerful tools for managing agreement-related documents throughout their lifecycle. With strong security measures, comprehensive audit trails, and compliance features, the system meets the demanding requirements of legal document management while providing an efficient and user-friendly experience.