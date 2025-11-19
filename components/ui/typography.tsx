import * as React from 'react';
import { cn } from '@/lib/utils';

// Tipos base para polimorfismo
type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProp<
  C extends React.ElementType,
  Props = object
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

// Componente polimórfico genérico
function createTypographyComponent<T extends React.ElementType>(
  defaultElement: T,
  className: string,
  displayName: string
) {
  type TypographyProps<C extends React.ElementType = T> = PolymorphicComponentProp<
    C,
    { className?: string }
  >;

  function Component<C extends React.ElementType = T>({
    as,
    className: userClassName,
    children,
    ref,
    ...props
  }: TypographyProps<C> & { ref?: React.ComponentPropsWithRef<C>['ref'] }) {
    const Element = (as || defaultElement) as React.ElementType;
    return (
      <Element
        ref={ref}
        className={cn(className, userClassName)}
        {...(props as any)}
      >
        {children}
      </Element>
    );
  }

  Component.displayName = displayName;
  return Component;
}

// Componentes individuais
const H1 = createTypographyComponent('h1', 'typography-h1', 'Typography.H1');
const H2 = createTypographyComponent('h2', 'typography-h2', 'Typography.H2');
const H3 = createTypographyComponent('h3', 'typography-h3', 'Typography.H3');
const H4 = createTypographyComponent('h4', 'typography-h4', 'Typography.H4');
const P = createTypographyComponent('p', 'typography-p', 'Typography.P');
const Blockquote = createTypographyComponent(
  'blockquote',
  'typography-blockquote',
  'Typography.Blockquote'
);
const List = createTypographyComponent('ul', 'typography-list', 'Typography.List');
const InlineCode = createTypographyComponent(
  'code',
  'typography-inline-code',
  'Typography.InlineCode'
);
const Lead = createTypographyComponent('p', 'typography-lead', 'Typography.Lead');
const Large = createTypographyComponent('div', 'typography-large', 'Typography.Large');
const Small = createTypographyComponent('small', 'typography-small', 'Typography.Small');
const Muted = createTypographyComponent('p', 'typography-muted', 'Typography.Muted');

// Componente especial para tabelas
interface TableProps extends React.ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode;
}

const Table = React.forwardRef<HTMLDivElement, TableProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('typography-table-wrapper', className)}
      {...props}
    >
      <table className="typography-table">{children}</table>
    </div>
  )
);
Table.displayName = 'Typography.Table';

// Namespace exportado
export const Typography = {
  H1,
  H2,
  H3,
  H4,
  P,
  Blockquote,
  List,
  InlineCode,
  Lead,
  Large,
  Small,
  Muted,
  Table,
};

// Exportações individuais para uso direto
export { H1, H2, H3, H4, P, Blockquote, List, InlineCode, Lead, Large, Small, Muted, Table };
