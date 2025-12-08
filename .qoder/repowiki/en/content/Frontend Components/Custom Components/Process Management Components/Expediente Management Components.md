# Expediente Management Components

<cite>
**Referenced Files in This Document**   
- [expedientes-content.tsx](file://app/(dashboard)/expedientes/components/expedientes-content.tsx)
- [expedientes-toolbar-filters.tsx](file://app/(dashboard)/expedientes/components/expedientes-toolbar-filters.tsx)
- [expedientes-filtros-avancados.tsx](file://app/(dashboard)/expedientes/components/expedientes-filtros-avancados.tsx)
- [expediente-detalhes-dialog.tsx](file://app/(dashboard)/expedientes/components/expediente-detalhes-dialog.tsx)
- [expediente-visualizar-dialog.tsx](file://app/(dashboard)/expedientes/components/expediente-visualizar-dialog.tsx)
- [pdf-viewer-dialog.tsx](file://app/(dashboard)/expedientes/components/pdf-viewer-dialog.tsx)
- [expedientes-baixar-dialog.tsx](file://app/(dashboard)/expedientes/components/expedientes-baixar-dialog.tsx)
- [expedientes-reverter-baixa-dialog.tsx](file://app/(dashboard)/expedientes/components/expedientes-reverter-baixa-dialog.tsx)
- [expedientes-visualizacao-ano.tsx](file://app/(dashboard)/expedientes/components/expedientes-visualizacao-ano.tsx)
- [expedientes-visualizacao-mes.tsx](file://app/(dashboard)/expedientes/components/expedientes-visualizacao-mes.tsx)
- [expedientes-visualizacao-semana.tsx](file://app/(dashboard)/expedientes/components/expedientes-visualizacao-semana.tsx)
- [novo-expediente-dialog.tsx](file://app/(dashboard)/expedientes/components/novo-expediente-dialog.tsx)
- [parte-detalhe-dialog.tsx](file://app/(dashboard)/expedientes/components/parte-detalhe-dialog.tsx)
- [baixa-expediente.service.ts](file://backend/expedientes/services/baixa-expediente.service.ts)
- [reverter-baixa.service.ts](file://backend/expedientes/services/reverter-baixa.service.ts)
- [listar-pendentes.service.ts](file://backend/expedientes/services/listar-pendentes.service.ts)
- [atualizar-tipo-descricao.service.ts](file://backend/expedientes/services/atualizar-tipo-descricao.service.ts)
- [atribuir-responsavel.service.ts](file://backend/expedientes/services/atribuir-responsavel.service.ts)
</cite>

## Table of Contents
1. [ExpedientesContent Component](#expedientescontent-component)
2. [Year, Month, and Week Visualization Components](#year-month-and-week-visualization-components)
3. [Filtering Components](#filtering-components)
4. [Dialog Components](#dialog-components)
5. [Backend Service Integration](#backend-service-integration)
6. [Workflow for Creating and Processing Expedientes](#workflow-for-creating-and-processing-expedientes)

## ExpedientesContent Component

The `ExpedientesContent` component serves as the main container for managing and displaying expedientes in the Sinesys application. It orchestrates the integration of various sub-components to provide a comprehensive interface for viewing, filtering, and interacting with pending items and expedientes. The component supports multiple view modes including table, week, month, and year, allowing users to visualize their pending tasks in different temporal contexts.

The component manages state for pagination, sorting, filtering, and search functionality. It uses React hooks to handle user interactions and fetch data from the backend via the `usePendentes` hook. The component renders different visualization components based on the current view mode and coordinates the display of data through the `DataTable` component when in table view mode.

**Section sources**
- [expedientes-content.tsx](file://app/(dashboard)/expedientes/components/expedientes-content.tsx#L1-L1216)

## Year, Month, and Week Visualization Components

### Year Visualization Component

The `ExpedientesVisualizacaoAno` component provides a calendar-based view of expedientes organized by year. It displays a grid of 12 months, with each month showing a calendar where days containing expedientes are highlighted. The component allows users to navigate between years and click on specific days to view details of expedientes scheduled for that day.

The visualization highlights three types of expedientes:
- Days with regular expedientes (highlighted in primary color)
- Today's date (highlighted in blue)
- Days without any expedientes (grayed out)

When a user clicks on a day with expedientes, a dialog displays all expedientes for that day, allowing for quick review and action.

**Section sources**
- [expedientes-visualizacao-ano.tsx](file://app/(dashboard)/expedientes/components/expedientes-visualizacao-ano.tsx#L1-L198)

### Month Visualization Component

The `ExpedientesVisualizacaoMes` component provides a monthly calendar view of expedientes. It displays a standard calendar grid with days of the week as columns and weeks as rows. Each day cell shows expedientes scheduled for that date, with a maximum of three expedientes displayed directly in the cell and a "more" badge for additional items.

The component handles special cases for expedientes without a defined deadline or those that are overdue, displaying them as pinned items at the top of the list for each day. Users can navigate between months and click on individual expedientes or days to view more details.

**Section sources**
- [expedientes-visualizacao-mes.tsx](file://app/(dashboard)/expedientes/components/expedientes-visualizacao-mes.tsx#L1-L214)

### Week Visualization Component

The `ExpedientesVisualizacaoSemana` component provides a weekly view of expedientes organized into tabs for different categories: overdue items, items without a date, and items scheduled for each weekday (Monday through Friday). This component offers the most detailed temporal organization, allowing users to focus on their immediate tasks.

The weekly view includes:
- **Vencidos (Overdue)**: Expedientes that have passed their deadline
- **Sem Data (No Date)**: Expedientes without a defined deadline
- **Weekdays**: Expedientes scheduled for each day of the workweek

Each tab displays a data table with expedientes sorted by deadline, with overdue items prioritized. The component supports sorting by various criteria including type, deadline, process information, and responsible party.

**Section sources**
- [expedientes-visualizacao-semana.tsx](file://app/(dashboard)/expedientes/components/expedientes-visualizacao-semana.tsx#L1-L1547)

## Filtering Components

### ExpedientesToolbarFilters

The `ExpedientesToolbarFilters` component provides basic filtering capabilities through a toolbar interface. It offers filter options organized into logical groups including Tribunal, Grade, Status, Responsible, Type, and Characteristics. Users can quickly apply filters by clicking on individual filter buttons, with the ability to combine multiple filters.

The component uses a configuration system that defines filter options and their types (select or boolean). It builds filter options dynamically based on available data such as users and expediente types. The filtering system supports both simple boolean filters (e.g., "Without Responsible") and value-based filters (e.g., specific tribunal or responsible party).

**Section sources**
- [expedientes-toolbar-filters.tsx](file://app/(dashboard)/expedientes/components/expedientes-toolbar-filters.tsx#L1-L324)

### ExpedientesFiltrosAvancados

The `ExpedientesFiltrosAvancados` component provides advanced filtering capabilities through a modal dialog interface. This component offers a comprehensive set of filtering options beyond the basic toolbar filters, including date ranges for various events and additional process attributes.

Key features of the advanced filters include:
- Date range filtering for deadline, knowledge date, and creation date
- Process status filtering
- Judicial characteristics filtering (secret of justice, digital court)
- Comprehensive tribunal and grade selection
- Responsible party assignment filtering

The advanced filters maintain state independently and apply filters only when the user explicitly clicks the "Apply Filters" button, providing a clear separation between filter configuration and application.

**Section sources**
- [expedientes-filtros-avancados.tsx](file://app/(dashboard)/expedientes/components/expedientes-filtros-avancados.tsx#L1-L426)

## Dialog Components

### ExpedienteDetalhesDialog

The `ExpedienteDetalhesDialog` component displays detailed information about one or more expedientes. It can show either a single expediente's details or a list of expedientes for a specific day. The dialog includes key information such as process number, parties involved, tribunal, grade, and status.

For single expedientes, the dialog shows:
- Process identification (class and number)
- Knowledge and deadline dates
- Organ of jurisdiction
- Party information (plaintiff and defendant)
- Status indicators (processed or pending, on time or overdue)

The component also includes functionality to set deadlines for expedientes that don't have one defined.

**Section sources**
- [expediente-detalhes-dialog.tsx](file://app/(dashboard)/expedientes/components/expediente-detalhes-dialog.tsx#L1-L235)

### ExpedienteVisualizarDialog

The `ExpedienteVisualizarDialog` component provides a comprehensive view of an expediente's details, building upon the basic details dialog with additional functionality. This dialog allows users to view and edit key information about the expediente, including its type and description.

Key features include:
- Display of process information with tribunal badge coloring
- Party information with role-specific badge styling
- Deadline calculation showing business days remaining
- Direct editing of expediente type and description
- Document preview capability

**Section sources**
- [expediente-visualizar-dialog.tsx](file://app/(dashboard)/expedientes/components/expediente-visualizar-dialog.tsx)

### ExpedientesBaixarDialog

The `ExpedientesBaixarDialog` component handles the workflow for marking an expediente as processed ("baixar"). Users can mark an expediente as processed by providing either a protocol ID (for formally submitted responses) or a justification (for cases where no formal response was required).

The dialog requires users to select one of two modes:
- **With Protocol**: Requires entering a protocol ID for the submitted response
- **Without Protocol**: Requires providing a justification for processing without submission

This ensures that all processed expedientes have appropriate documentation in the system.

**Section sources**
- [expedientes-baixar-dialog.tsx](file://app/(dashboard)/expedientes/components/expedientes-baixar-dialog.tsx#L1-L232)

### ExpedientesReverterBaixaDialog

The `ExpedientesReverterBaixaDialog` component allows users to revert the processing status of an expediente, returning it to the pending state. This is useful for correcting mistakes or when additional work is required on a previously processed expediente.

The dialog displays all relevant information about the expediente, including:
- Process identification
- Party information
- Processing date and time
- Protocol ID (if applicable)
- Justification for processing

A warning message alerts users that reverting the status will remove protocol and justification data, though the action is logged in the system.

**Section sources**
- [expedientes-reverter-baixa-dialog.tsx](file://app/(dashboard)/expedientes/components/expedientes-reverter-baixa-dialog.tsx#L1-L177)

### PdfViewerDialog

The `PdfViewerDialog` component enables document preview functionality for expedientes. It retrieves documents from storage using signed URLs and displays them in an embedded PDF viewer within a modal dialog.

The component handles:
- Generation of signed URLs for secure document access
- Loading state indication
- Error handling for document retrieval failures
- Full-screen PDF viewing with standard navigation controls

This allows users to review attached documents without leaving the expediente management interface.

**Section sources**
- [pdf-viewer-dialog.tsx](file://app/(dashboard)/expedientes/components/pdf-viewer-dialog.tsx#L1-L132)

## Backend Service Integration

The expediente management components integrate with the `pendentes-manifestacao` service through API endpoints that handle CRUD operations and business logic. The frontend components make HTTP requests to these endpoints to retrieve and update expediente data.

Key service integrations include:

### ListarPendentes Service
The `listar-pendentes.service.ts` handles retrieval of pending expedientes with support for filtering, pagination, and sorting. It accepts parameters for:
- Pagination (page number and limit)
- Search terms
- Sorting criteria
- Status filters (processed, pending, overdue)
- Responsible party
- Date ranges
- Tribunal and grade

**Section sources**
- [listar-pendentes.service.ts](file://backend/expedientes/services/listar-pendentes.service.ts)

### BaixaExpediente Service
The `baixa-expediente.service.ts` handles the business logic for marking an expediente as processed. It validates the provided protocol ID or justification and updates the expediente status in the database. The service also creates audit logs for all processing actions.

**Section sources**
- [baixa-expediente.service.ts](file://backend/expedientes/services/baixa-expediente.service.ts)

### ReverterBaixa Service
The `reverter-baixa.service.ts` handles the reversal of an expediente's processed status. This service restores the expediente to the pending state and removes protocol and justification data while preserving the audit trail of the original processing action.

**Section sources**
- [reverter-baixa.service.ts](file://backend/expedientes/services/reverter-baixa.service.ts)

### AtualizarTipoDescricao Service
The `atualizar-tipo-descricao.service.ts` handles updates to an expediente's type and description fields. This service ensures data consistency and validates the selected expediente type against available options.

**Section sources**
- [atualizar-tipo-descricao.service.ts](file://backend/expedientes/services/atualizar-tipo-descricao.service.ts)

### AtribuirResponsavel Service
The `atribuir-responsavel.service.ts` handles the assignment of responsible parties to expedientes. This service validates that the assigned user exists and has appropriate permissions for handling the expediente.

**Section sources**
- [atribuir-responsavel.service.ts](file://backend/expedientes/services/atribuir-responsavel.service.ts)

## Workflow for Creating and Processing Expedientes

### Creating New Expedientes
Users can create new expedientes manually through the "Novo expediente manual" button in the toolbar. This opens a dialog that allows users to input key information about the expediente, including process details, parties involved, and initial deadline information. The new expediente is then added to the pending items list and can be managed like any other expediente.

### Processing Workflow
The processing workflow for expedientes follows a structured path:

1. **Identification**: Expedientes appear in the pending list, categorized by deadline status (overdue, no date, or scheduled for a specific day)
2. **Review**: Users review expediente details, including attached documents via the PDF viewer
3. **Processing Decision**: Users decide whether to process the expediente immediately or schedule it for later
4. **Marking as Processed**: Users open the "Baixar Expediente" dialog and provide either a protocol ID or justification
5. **Confirmation**: The expediente is removed from pending lists and marked as processed in the system

### Reverting Processing Status
When errors occur or additional work is needed, users can revert the processing status:
1. Click the "Reverter Baixa" button on a processed expediente
2. Confirm the action in the dialog, understanding that protocol and justification data will be lost
3. The expediente returns to the pending state and reappears in relevant views

This workflow ensures that all actions are properly documented while providing flexibility for corrections and adjustments.

**Section sources**
- [expedientes-content.tsx](file://app/(dashboard)/expedientes/components/expedientes-content.tsx#L1-L1216)
- [expedientes-baixar-dialog.tsx](file://app/(dashboard)/expedientes/components/expedientes-baixar-dialog.tsx#L1-L232)
- [expedientes-reverter-baixa-dialog.tsx](file://app/(dashboard)/expedientes/components/expedientes-reverter-baixa-dialog.tsx#L1-L177)