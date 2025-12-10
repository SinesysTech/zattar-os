# Custom Components

<cite>
**Referenced Files in This Document**   
- [dashboard-grid.tsx](file://app/(dashboard)/dashboard/components/dashboard-grid.tsx)
- [drag-drop-dashboard.tsx](file://app/(dashboard)/dashboard/components/drag-drop-dashboard.tsx)
- [audiencias-visualizacao-ano.tsx](file://app/(dashboard)/audiencias/components/audiencias-visualizacao-ano.tsx)
- [audiencias-visualizacao-mes.tsx](file://app/(dashboard)/audiencias/components/audiencias-visualizacao-mes.tsx)
- [audiencias-visualizacao-semana.tsx](file://app/(dashboard)/audiencias/components/audiencias-visualizacao-semana.tsx)
- [document-editor.tsx](file://components/documentos/document-editor.tsx)
- [canvas-assinatura.tsx](file://components/assinatura-digital/signature/canvas-assinatura.tsx)
- [preview-assinatura.tsx](file://components/assinatura-digital/signature/preview-assinatura.tsx)
- [plate-editor.tsx](file://components/plate/plate-editor.tsx)
- [use-realtime-collaboration.ts](file://hooks/use-realtime-collaboration.ts)
</cite>

## Table of Contents
1. [Dashboard Grid](#dashboard-grid)
2. [Hearing Calendar](#hearing-calendar)
3. [Document Editor](#document-editor)
4. [Signature Capture](#signature-capture)
5. [Component Integration](#component-integration)
6. [Common Issues and Solutions](#common-issues-and-solutions)

## Dashboard Grid

The Dashboard Grid component provides a flexible and interactive layout system for organizing widgets in the Sinesys application. It supports both static and drag-and-drop configurations, allowing users to customize their dashboard experience.

The core implementation consists of two main components: `DashboardGrid` for the basic layout rendering and `DragDropDashboard` for interactive reordering. The `DashboardGrid` component uses a responsive grid system with different column configurations for various screen sizes (single column on mobile, two columns on medium screens, and three columns on large screens). It manages widget loading states with skeleton placeholders and error handling for failed data retrieval.

The drag-and-drop functionality is implemented using the `@dnd-kit/core` library, which provides a robust foundation for drag-and-drop interactions. The `DragDropDashboard` component wraps widgets in `DraggableWidget` and `DroppableArea` components, enabling users to reorder widgets by dragging them vertically. When a drag operation completes, the component calculates the new widget positions and updates the state through the dashboard store. During dragging, a visual overlay shows the currently dragged widget with enhanced styling to provide clear feedback.

Widgets are rendered based on their type property, with specific components for different widget categories (tasks, notes, and links). The system uses React's `useCallback` and `useMemo` hooks to optimize performance by memoizing expensive calculations and preventing unnecessary re-renders. The component also implements proper cleanup of event listeners to prevent memory leaks.

**Section sources**
- [dashboard-grid.tsx](file://app/(dashboard)/dashboard/components/dashboard-grid.tsx#L1-L76)
- [drag-drop-dashboard.tsx](file://app/(dashboard)/dashboard/components/drag-drop-dashboard.tsx#L1-L99)

## Hearing Calendar

The Hearing Calendar component provides multiple views for managing court hearings, including year, month, and week perspectives. Each view is optimized for different use cases and screen sizes, allowing users to efficiently navigate and manage their hearing schedules.

### Year View
The year view displays all 12 months in a grid layout, with each month rendered as a separate calendar component. Days containing hearings are highlighted with a primary color background. When a user clicks on a day with hearings, a dialog appears showing all hearings scheduled for that day. The component uses React's `useCallback` hook to memoize the date filtering functions, improving performance when dealing with large datasets.

### Month View
The month view provides a more detailed calendar for a single month, showing all days with hearings highlighted. Similar to the year view, clicking on a day with hearings opens a dialog displaying the scheduled hearings. The component uses `useMemo` to pre-process the hearing data into a map indexed by date strings, enabling efficient lookups when rendering the calendar.

### Week View
The week view offers the most detailed perspective, displaying hearings in a tabular format organized by day of the week (Monday through Friday). This view uses the `DataTable` component from the UI library with custom columns for time, case details, hearing details, observations, and responsible parties. The week view implements several advanced features:

- **Tabs for Days**: Each day of the week has its own tab, with badge counters showing the number of active hearings
- **Action Buttons**: Integrated buttons for marking hearings as completed, creating related documents, and adding obligations
- **Responsible Assignment**: Popover menus for assigning hearing responsibilities to team members
- **Virtual Hearing Support**: Automatic detection and display of video conferencing platforms (Zoom, Meet, Webex) with appropriate logos
- **Data Filtering**: Intelligent filtering to show only hearings within the current week

The week view processes hearing data to group entries by day and sort them chronologically. It also implements responsive design patterns, adjusting column layouts and content density based on screen size.

**Section sources**
- [audiencias-visualizacao-ano.tsx](file://app/(dashboard)/audiencias/components/audiencias-visualizacao-ano.tsx#L1-L71)
- [audiencias-visualizacao-mes.tsx](file://app/(dashboard)/audiencias/components/audiencias-visualizacao-mes.tsx#L1-L70)
- [audiencias-visualizacao-semana.tsx](file://app/(dashboard)/audiencias/components/audiencias-visualizacao-semana.tsx#L1-L808)

## Document Editor

The Document Editor component provides a comprehensive document creation and collaboration environment, built on the Plate.js framework. It integrates rich text editing capabilities with real-time collaboration, version history, and document management features.

### Core Architecture
The editor follows a modular architecture with the main `DocumentEditor` component orchestrating various sub-components and hooks:

- **PlateEditor**: The core editing surface powered by Plate.js, providing rich text formatting and content editing
- **DocumentEditorProvider**: A context provider that manages document-specific state and operations
- **Real-time Collaboration**: Integration with Y.js and WebSockets for multi-user editing
- **Auto-save System**: Debounced saving mechanism that automatically persists changes after 2 seconds of inactivity

### Key Features
The editor implements several sophisticated features to enhance the user experience:

**Auto-save and Manual Save**: The component implements both automatic and manual saving mechanisms. The auto-save feature uses a 2-second debounce to prevent excessive server requests while ensuring data is preserved. Manual saving is available through a dedicated button, with visual feedback during the save process.

**Export Capabilities**: Users can export documents in multiple formats:
- **PDF Export**: Uses HTML-to-PDF conversion with fallback to text-based rendering
- **DOCX Export**: Generates Microsoft Word-compatible documents
- Both export functions provide loading states and success/error notifications

**Collaboration Interface**: The editor displays real-time collaboration status with:
- Connection indicator (Wi-Fi icon) showing collaboration status
- Avatar stack showing currently active collaborators
- Sidebar chat for document-related discussions

**Document Management**: Integrated tools for:
- Version history with restoration capabilities
- File sharing and permission management
- File uploads and attachments

### Responsive Design
The editor implements responsive design patterns to work across different device sizes:
- On mobile devices, the chat sidebar collapses to conserve screen space
- Toolbar buttons adapt to available space, with overflow menus for less frequently used actions
- The editor canvas maintains appropriate margins and maximum width for readability

The component uses React's `useRef` hooks to manage DOM references and timing operations, with proper cleanup in effect cleanup functions to prevent memory leaks.

**Section sources**
- [document-editor.tsx](file://components/documentos/document-editor.tsx#L1-L479)
- [plate-editor.tsx](file://components/plate/plate-editor.tsx)
- [use-realtime-collaboration.ts](file://hooks/use-realtime-collaboration.ts)

## Signature Capture

The Signature Capture components provide a complete solution for collecting and validating handwritten signatures in digital form. The system is designed to capture not just the visual representation of a signature but also behavioral metrics that can be used for authentication and fraud detection.

### Canvas Signature Component
The `CanvasAssinatura` component is the core signature capture interface, built on the `react-signature-canvas` library. It provides several key features:

**Responsive Design**: The canvas automatically adjusts its size based on the container width, with a maximum width of 600px and height optimized for touch input (200px on mobile, 250px on desktop).

**Signature Metrics Collection**: The component captures detailed metrics about the signing process:
- **Drawing Time**: Total time spent creating the signature
- **Stroke Count**: Number of separate pen strokes
- **Point Count**: Total number of coordinate points in the signature
- **Bounding Box**: Dimensions of the signature area (width and height)

These metrics are collected through event handlers (`onBegin` and `onEnd` props) that track when users start and stop drawing strokes. The component uses `useImperativeHandle` to expose methods for external components to access the signature data and metrics.

**Data Export**: The component can export the signature as a PNG image in Base64 format, which can be transmitted to servers or stored in databases.

### Signature Preview Component
The `PreviewAssinatura` component provides a confirmation interface that displays both the captured signature and the user's photo side by side. This allows users to verify that the correct signature is associated with the correct identity before finalizing.

The preview includes:
- **Photo Verification**: Display of the user's photo to confirm identity
- **Signature Display**: Rendered signature image
- **Edit Functionality**: Option to return to the signature canvas for corrections
- **Confirmation Dialog**: Two-step confirmation process to prevent accidental submissions

The component implements loading states to indicate when the finalization process is in progress, preventing multiple submissions.

### Integration and Validation
The signature capture system integrates with backend services for:
- **Storage**: Saving signature images and metadata
- **Validation**: Checking signature quality and completeness
- **Authentication**: Using signature metrics as part of multi-factor authentication

The components are designed to be accessible, with proper keyboard navigation and ARIA labels for screen readers.

**Section sources**
- [canvas-assinatura.tsx](file://components/assinatura-digital/signature/canvas-assinatura.tsx#L1-L189)
- [preview-assinatura.tsx](file://components/assinatura-digital/signature/preview-assinatura.tsx#L1-L106)

## Component Integration

The custom components in Sinesys are designed to work together seamlessly, creating a cohesive user experience across different application areas. The integration follows several key patterns:

### State Management
All components use a centralized state management approach through React context and custom hooks. The dashboard components use `useDashboardStore` to access and modify widget configurations, while the document editor uses `useRealtimeCollaboration` for shared editing state. This pattern ensures consistent data flow and prevents prop drilling.

### UI Library Integration
The components extensively use the application's UI library components (found in `components/ui/`) for consistent styling and behavior. This includes:
- **Card Components**: For content containers and widgets
- **Button Components**: For interactive elements with consistent styling
- **Dialog Components**: For modal interfaces and confirmation dialogs
- **Badge Components**: For status indicators and labels
- **Tooltip Components**: For additional information on hover

### Responsive Design Patterns
All components implement responsive design principles to work across different device sizes:
- **Mobile-First Approach**: Components are designed for mobile screens and enhanced for larger screens
- **Flexible Layouts**: Grid and flexbox layouts adapt to available space
- **Touch Optimization**: Interactive elements have appropriate sizes for touch input
- **Conditional Rendering**: Certain features are hidden or modified on smaller screens

### Accessibility Considerations
The components follow accessibility best practices:
- **Keyboard Navigation**: All interactive elements are accessible via keyboard
- **ARIA Labels**: Proper labeling for screen readers
- **Color Contrast**: Sufficient contrast for text and interactive elements
- **Focus Management**: Proper focus handling for modals and dialogs

### Performance Optimization
The components implement several performance optimizations:
- **Memoization**: Using `useMemo` and `useCallback` to prevent unnecessary re-renders
- **Lazy Loading**: Deferring non-critical operations
- **Debouncing**: Preventing excessive API calls during user interactions
- **Efficient Data Processing**: Pre-processing data to enable fast lookups

## Common Issues and Solutions

### Real-time Updates
**Issue**: Inconsistent state across multiple users in collaborative editing scenarios.

**Solution**: The document editor implements a robust real-time collaboration system using Y.js and WebSockets. The `useRealtimeCollaboration` hook manages the connection lifecycle, handles conflict resolution, and ensures eventual consistency across all clients. Connection status is displayed to users, and the system automatically reconnects when the connection is lost.

### Responsive Design Challenges
**Issue**: Layout issues on different screen sizes, particularly with complex components like the hearing calendar week view.

**Solution**: The components use CSS Grid and Flexbox with responsive breakpoints. The hearing calendar week view, for example, switches from a tabbed interface on desktop to a simplified list view on mobile. Media queries and container queries are used to adapt layouts based on available space.

### Performance with Large Datasets
**Issue**: Slow rendering when displaying large numbers of hearings or documents.

**Solution**: The components implement several optimization strategies:
- **Virtualization**: Only rendering visible items in long lists
- **Memoization**: Caching expensive calculations with `useMemo`
- **Data Pre-processing**: Organizing data into efficient structures for fast lookups
- **Lazy Loading**: Loading data in chunks as needed

### Cross-browser Compatibility
**Issue**: Inconsistent behavior across different browsers, particularly with canvas-based components.

**Solution**: The signature capture component includes fallbacks for browsers with limited canvas support. Feature detection is used to provide alternative input methods when necessary, and polyfills are included for critical functionality.

### Mobile Touch Issues
**Issue**: Difficulties with touch interactions on mobile devices, particularly with drag-and-drop functionality.

**Solution**: The drag-and-drop system includes a distance threshold (8px) to prevent accidental drags from taps. Touch events are properly handled, and the hit areas for interactive elements are enlarged for touch input.

### Data Synchronization
**Issue**: Conflicts when multiple users edit the same document simultaneously.

**Solution**: The real-time collaboration system uses operational transformation to resolve conflicts. Changes are broadcast to all clients, and the system automatically merges edits in a way that preserves all changes. Users can see other collaborators' cursors and selections in real-time.