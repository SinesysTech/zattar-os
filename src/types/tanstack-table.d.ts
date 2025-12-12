import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "select" | "range" | "date-range";
    filterOptions?: {
      label: string;
      value: string;
      icon?: React.ComponentType<{ className?: string }>;
    }[];
    align?: "left" | "center" | "right";
    filterTitle?: string;
  }
}
