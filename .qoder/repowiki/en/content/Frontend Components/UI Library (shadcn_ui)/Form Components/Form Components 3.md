# Form Components

<cite>
**Referenced Files in This Document**   
- [form.tsx](file://components/ui/form.tsx)
- [input.tsx](file://components/ui/input.tsx)
- [textarea.tsx](file://components/ui/textarea.tsx)
- [checkbox.tsx](file://components/ui/checkbox.tsx)
- [radio-group.tsx](file://components/ui/radio-group.tsx)
- [select.tsx](file://components/ui/select.tsx)
- [combobox.tsx](file://components/ui/combobox.tsx)
- [date-picker.tsx](file://components/ui/date-picker.tsx)
- [switch.tsx](file://components/ui/switch.tsx)
</cite>

## Update Summary
**Changes Made**   
- Updated mobile touch target requirements for all form components to meet 44x44px minimum standard
- Added documentation on touch-manipulation CSS class implementation
- Enhanced responsive behavior section with mobile optimization details
- Updated core form components sections with touch target specifications

## Table of Contents
1. [Introduction](#introduction)
2. [Core Form Components](#core-form-components)
3. [Form State Management with React Hook Form](#form-state-management-with-react-hook-form)
4. [Validation and Error Handling](#validation-and-error-handling)
5. [Accessibility Implementation](#accessibility-implementation)
6. [Styling and Responsive Behavior](#styling-and-responsive-behavior)
7. [Usage Examples](#usage-examples)
8. [Component Integration Patterns](#component-integration-patterns)
9. [Performance Considerations](#performance-considerations)

## Introduction
The Sinesys UI library provides a comprehensive set of form components designed for legal data entry applications. These components are built with accessibility, validation, and responsive design principles in mind, ensuring reliable data capture across various legal workflows including client registration, hearing creation, and contract management. The form system integrates seamlessly with React Hook Form for efficient state management and validation handling. Recent updates have enhanced mobile touch optimization with 44x44px minimum touch targets and touch-manipulation CSS class implementation.

## Core Form Components

The Sinesys UI library includes a complete suite of form controls designed for legal data entry scenarios. Each component follows consistent design patterns for styling, accessibility, and interaction. All form components now implement a minimum 44x44px touch target for mobile devices and include the touch-manipulation CSS class for improved touch performance.

### Input
The Input component provides a styled text input field with support for various input types including text, email, phone, and number. It integrates with the form system to display validation states and error messages. On mobile devices, the input maintains a minimum height of 44px to ensure adequate touch targets.

**Section sources**
- [input.tsx](file://components/ui/input.tsx#L5-L21)

### Textarea
The Textarea component offers a multi-line text input with automatic height adjustment. It supports character counting and validation for legal document descriptions and case notes. The component ensures a minimum height of 88px (two touch targets) to accommodate mobile touch interactions.

**Section sources**
- [textarea.tsx](file://components/ui/textarea.tsx#L5-L18)

### Checkbox
The Checkbox component provides binary selection capability with visual feedback for checked and unchecked states. It supports indeterminate states and can be used in groups for multiple selection scenarios. The checkbox has a minimum size of 44x44px on mobile devices with appropriate padding for touch accuracy.

**Section sources**
- [checkbox.tsx](file://components/ui/checkbox.tsx#L9-L32)

### Radio Group
The Radio Group component enables single selection from multiple options. It ensures proper keyboard navigation and screen reader support for accessible form interactions. Each radio button item maintains a 44x44px minimum touch target on mobile devices.

**Section sources**
- [radio-group.tsx](file://components/ui/radio-group.tsx#L22-L45)

### Select
The Select component implements a dropdown menu for choosing from predefined options. It supports both single and multiple selection modes with keyboard navigation and screen reader compatibility. The select trigger and dropdown items have been updated to meet the 44x44px touch target requirement on mobile.

**Section sources**
- [select.tsx](file://components/ui/select.tsx#L27-L51)

### Combobox
The Combobox component combines a text input with a dropdown list, allowing users to either select from predefined options or type a custom value. It includes search functionality and supports multiple selections with badge indicators. Both the input field and dropdown options maintain 44x44px minimum touch targets.

**Section sources**
- [combobox.tsx](file://components/ui/combobox.tsx#L36-L278)

### Date Picker
The Date Picker component provides a calendar interface for date selection with proper formatting for Brazilian legal standards. It includes validation for date ranges and business days. The date picker trigger button and calendar cells have been optimized for touch with appropriate sizing.

**Section sources**
- [date-picker.tsx](file://components/ui/date-picker.tsx#L14-L49)

### Switch
The Switch component offers a toggle control for binary options with smooth animation and clear visual states. It's commonly used for enabling/disabling features or options. The switch component has been updated with adequate touch padding to meet mobile touch requirements.

**Section sources**
- [switch.tsx](file://components/ui/switch.tsx#L8-L31)

## Form State Management with React Hook Form

The form components are designed to work seamlessly with React Hook Form, providing efficient state management and validation capabilities.

```mermaid
sequenceDiagram
participant Form as Form Component
participant RHF as React Hook Form
participant Field as Form Field
participant Validation as Validation Rules
Form->>RHF : Initialize useForm()
RHF-->>Form : Return form methods
Form->>Field : Wrap with FormField
Field->>RHF : Register field
RHF-->>Field : Return field state
User->>Field : Interact with input
Field->>RHF : Update field value
RHF->>Validation : Validate input
Validation-->>RHF : Return validation result
RHF->>Field : Update error state
Field->>User : Display validation feedback
```

**Diagram sources**
- [form.tsx](file://components/ui/form.tsx)

**Section sources**
- [form.tsx](file://components/ui/form.tsx)

## Validation and Error Handling

The form system implements a robust validation approach that provides immediate feedback to users while maintaining accessibility standards.

### Validation Patterns
The components support various validation patterns specific to legal data entry:
- Document number validation (CPF, CNPJ, OAB)
- Date format validation (dd/mm/yyyy)
- Monetary value formatting
- Case number pattern matching
- Email and contact information validation

### Error Messaging
Error messages are displayed using tooltips that appear on blur or when a field loses focus. This approach ensures screen reader compatibility while providing visual feedback without disrupting the form layout.

```mermaid
flowchart TD
Start([Field Interaction]) --> Blur["Field loses focus"]
Blur --> HasError{"Has validation error?"}
HasError --> |Yes| ShowTooltip["Show tooltip with error message"]
HasError --> |No| HideTooltip["Hide tooltip if visible"]
ShowTooltip --> Announce["Announce error to screen reader"]
HideTooltip --> End([Ready for next interaction])
```

**Diagram sources**
- [form.tsx](file://components/ui/form.tsx)

**Section sources**
- [form.tsx](file://components/ui/form.tsx)

## Accessibility Implementation

The form components follow WCAG 2.1 guidelines to ensure accessibility for all users.

### Labeling
Each form control is properly associated with its label using ARIA attributes and proper HTML structure. The FormLabel component automatically connects to its corresponding input field.

### Keyboard Navigation
All components support full keyboard navigation:
- Tab to move between fields
- Arrow keys to navigate options in select menus
- Space/Enter to select options
- Escape to close dropdowns

### Screen Reader Support
The components provide appropriate ARIA roles and states:
- aria-invalid for invalid fields
- aria-describedby for error messages
- role="combobox" for enhanced input controls
- Proper landmark roles for form sections

**Section sources**
- [form.tsx](file://components/ui/form.tsx)
- [input.tsx](file://components/ui/input.tsx)
- [checkbox.tsx](file://components/ui/checkbox.tsx)

## Styling and Responsive Behavior

The form components use Tailwind CSS for styling with a consistent design system across the application. Recent updates have enhanced mobile touch optimization with 44x44px minimum touch targets and touch-manipulation CSS class implementation.

### Validation States
Components respond to different validation states with visual feedback:
- Error state: Red border and icon
- Focus state: Blue ring indicator
- Disabled state: Reduced opacity and cursor

### Responsive Design
Forms adapt to different screen sizes:
- Mobile: Full-width inputs with 44x44px minimum touch targets and touch-manipulation class
- Tablet: Two-column layouts for related fields
- Desktop: Multi-column layouts with proper spacing

```mermaid
graph TB
subgraph "Mobile View"
A[44x44px minimum touch targets]
B[Full-width inputs]
C[Stacked layout]
D[touch-manipulation class]
end
subgraph "Tablet View"
E[Two-column layout]
F[Medium spacing]
G[Adaptive sizing]
end
subgraph "Desktop View"
H[Multi-column layout]
I[Consistent spacing]
J[Hover states]
end
A --> E
B --> F
C --> H
D --> G
F --> I
G --> J
```

**Diagram sources**
- [input.tsx](file://components/ui/input.tsx)
- [form.tsx](file://components/ui/form.tsx)

**Section sources**
- [input.tsx](file://components/ui/input.tsx)
- [form.tsx](file://components/ui/form.tsx)

## Usage Examples

The form components are used throughout the application in various legal workflows.

### Client Registration Form
A multi-step form that collects client information including personal details, contact information, and legal representation preferences. Uses Input, Select, and Checkbox components with conditional fields. All form controls implement 44x44px touch targets for mobile optimization.

### Hearing Creation Dialog
A modal form for scheduling hearings with fields for date, time, participants, and hearing type. Utilizes DatePicker, Combobox, and Radio Group components. The dialog implements touch-manipulation class for improved mobile performance.

### Contract Editing Sheet
A comprehensive form for editing legal contracts with sections for parties, terms, payment schedules, and attachments. Uses Textarea, Switch, and nested form fields. All interactive elements maintain minimum touch target requirements.

**Section sources**
- [form.tsx](file://components/ui/form.tsx)
- [input.tsx](file://components/ui/input.tsx)
- [textarea.tsx](file://components/ui/textarea.tsx)

## Component Integration Patterns

The form components follow consistent integration patterns for easy implementation.

```mermaid
classDiagram
class Form {
+useForm()
+handleSubmit()
+formState
+control
}
class FormField {
+name : string
+control : Control
+render : function
}
class FormItem {
+id : string
+children : ReactNode
}
class FormLabel {
+htmlFor : string
+children : ReactNode
}
class FormControl {
+id : string
+aria-describedby
+aria-invalid
}
class FormDescription {
+id : string
+children : ReactNode
}
Form --> FormField : "contains"
FormField --> FormItem : "wraps"
FormItem --> FormLabel : "contains"
FormItem --> FormControl : "contains"
FormItem --> FormDescription : "contains"
FormItem --> FormMessage : "contains"
```

**Diagram sources**
- [form.tsx](file://components/ui/form.tsx)

**Section sources**
- [form.tsx](file://components/ui/form.tsx)

## Performance Considerations

The form components are optimized for performance in legal applications with complex forms.

### Dynamic Fields
Forms with dynamic fields use React Hook Form's efficient re-rendering to minimize performance impact when adding or removing fields.

### Validation Optimization
Validation rules are applied efficiently with debounce for expensive operations like API calls for duplicate checking.

### Memory Management
Components properly clean up event listeners and state to prevent memory leaks in long-lived forms. The touch-manipulation class reduces unnecessary touch events, improving mobile performance.

**Section sources**
- [form.tsx](file://components/ui/form.tsx)
- [combobox.tsx](file://components/ui/combobox.tsx)