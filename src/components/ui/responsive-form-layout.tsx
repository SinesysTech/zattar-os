/**
 * ResponsiveFormLayout Component
 * 
 * Wrapper component that applies responsive grid layout to form fields.
 * Automatically adapts to different screen sizes:
 * - Mobile (< 640px): Single column, stacked vertically
 * - Tablet (768px-1024px): 2 columns maximum
 * - Desktop (≥ 1024px): Configurable columns (1-3)
 * 
 * Buttons are automatically made full-width or stacked on mobile.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/use-viewport';

export interface ResponsiveFormLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Number of columns for desktop layout (≥ 1024px)
     * @default 2
     */
    columns?: 1 | 2 | 3;

    /**
     * Gap between form fields
     * @default 4 (1rem)
     */
    gap?: number;

    /**
     * Whether to make buttons full-width on mobile
     * @default true
     */
    fullWidthButtonsOnMobile?: boolean;

    /**
     * Whether to stack buttons vertically on mobile
     * @default true
     */
    stackButtonsOnMobile?: boolean;
}

/**
 * ResponsiveFormLayout - Container for responsive form fields
 * 
 * @example
 * ```tsx
 * <ResponsiveFormLayout columns={2}>
 *   <FormField name="firstName" />
 *   <FormField name="lastName" />
 *   <FormField name="email" className="col-span-full" />
 * </ResponsiveFormLayout>
 * ```
 */
export const ResponsiveFormLayout = React.forwardRef<HTMLDivElement, ResponsiveFormLayoutProps>(
    (
        {
            children,
            className,
            columns = 2,
            gap = 4,
            fullWidthButtonsOnMobile = true,
            stackButtonsOnMobile = true,
            ...props
        },
        ref
    ) => {
        const viewport = useViewport();

        // Determine grid columns based on viewport
        const gridCols = React.useMemo(() => {
            if (viewport.isMobile) return 1; // Mobile: single column
            if (viewport.isTablet) return Math.min(columns, 2); // Tablet: max 2 columns
            return columns; // Desktop: use specified columns
        }, [viewport.isMobile, viewport.isTablet, columns]);

        // Apply button styling to button elements on mobile
        const processedChildren = React.useMemo(() => {
            if (!viewport.isMobile || (!fullWidthButtonsOnMobile && !stackButtonsOnMobile)) {
                return children;
            }

            return React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return child;

                // Fragment não aceita props como className, então pulamos
                if (child.type === React.Fragment) return child;

                // Check if this is a button container (div with buttons)
                if (child.type === 'div' && child.props.children) {
                    const hasButtons = React.Children.toArray(child.props.children).some(
                        (c) => React.isValidElement(c) && (c.type as React.ComponentType & { displayName?: string })?.displayName === 'Button'
                    );

                    if (hasButtons) {
                        return React.cloneElement(child as React.ReactElement, {
                            className: cn(
                                child.props.className,
                                stackButtonsOnMobile && 'flex flex-col gap-2',
                                fullWidthButtonsOnMobile && '[&>button]:w-full'
                            ),
                        });
                    }
                }

                return child;
            });
        }, [children, viewport.isMobile, fullWidthButtonsOnMobile, stackButtonsOnMobile]);

        return (
            <div
                ref={ref}
                data-slot="responsive-form-layout"
                data-columns={gridCols}
                className={cn(
                    'grid w-full',
                    // Grid columns based on viewport
                    gridCols === 1 && 'grid-cols-1',
                    gridCols === 2 && 'grid-cols-2',
                    gridCols === 3 && 'grid-cols-3',
                    // Gap
                    gap === 2 && 'gap-2',
                    gap === 3 && 'gap-3',
                    gap === 4 && 'gap-4',
                    gap === 6 && 'gap-6',
                    gap === 8 && 'gap-8',
                    className
                )}
                {...props}
            >
                {processedChildren}
            </div>
        );
    }
);

ResponsiveFormLayout.displayName = 'ResponsiveFormLayout';

/**
 * ResponsiveFormField - Wrapper for individual form fields
 * Provides utilities for spanning multiple columns
 */
export interface ResponsiveFormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Number of columns to span on desktop
     * Use 'full' to span all columns
     */
    span?: 1 | 2 | 3 | 'full';
}

export const ResponsiveFormField = React.forwardRef<HTMLDivElement, ResponsiveFormFieldProps>(
    ({ children, className, span, ...props }, ref) => {
        return (
            <div
                ref={ref}
                data-slot="responsive-form-field"
                className={cn(
                    // Column spanning
                    span === 'full' && 'col-span-full',
                    span === 2 && 'md:col-span-2',
                    span === 3 && 'lg:col-span-3',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

ResponsiveFormField.displayName = 'ResponsiveFormField';

/**
 * ResponsiveFormActions - Container for form action buttons
 * Automatically handles responsive button layout
 */
export interface ResponsiveFormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Alignment of buttons on desktop
     * @default 'end'
     */
    align?: 'start' | 'center' | 'end' | 'between';

    /**
     * Whether to reverse button order on mobile
     * Useful for placing primary action at top on mobile
     * @default false
     */
    reverseOnMobile?: boolean;
}

export const ResponsiveFormActions = React.forwardRef<HTMLDivElement, ResponsiveFormActionsProps>(
    ({ children, className, align = 'end', reverseOnMobile = false, ...props }, ref) => {
        const viewport = useViewport();

        return (
            <div
                ref={ref}
                data-slot="responsive-form-actions"
                className={cn(
                    'col-span-full flex gap-3',
                    // Mobile: stack vertically, full width buttons
                    'flex-col sm:flex-row',
                    '[&>button]:w-full sm:[&>button]:w-auto',
                    // Desktop alignment
                    align === 'start' && 'sm:justify-start',
                    align === 'center' && 'sm:justify-center',
                    align === 'end' && 'sm:justify-end',
                    align === 'between' && 'sm:justify-between',
                    // Reverse order on mobile if specified
                    reverseOnMobile && viewport.isMobile && 'flex-col-reverse',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

ResponsiveFormActions.displayName = 'ResponsiveFormActions';
