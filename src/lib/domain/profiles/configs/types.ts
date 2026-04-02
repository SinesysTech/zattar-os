import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export interface FieldConfig {
  label: string;
  valuePath: string; // path to value in data object (e.g. "address.city")
  icon?: LucideIcon;
  type?: "text" | "date" | "boolean" | "currency" | "document";
  format?: (value: unknown) => string;
}

export interface SidebarSection {
  title: string;
  fields: FieldConfig[];
}

export interface HeaderConfig {
  showBanner: boolean;
  showAvatar: boolean;
  showStatus: boolean;
  titleField: string; // field to use as title (e.g. "nome")
  subtitleFields: string[]; // fields to show below title
  badges?: {
    field: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
    map?: Record<string, string>; // map value to display text
  }[];
  metadata?: FieldConfig[];
}

export interface SectionConfig {
  type: "info-cards" | "timeline" | "related-cards" | "table" | "custom";
  title?: string;
  dataSource?: string; // key in data object or "activities" etc.
  fields?: FieldConfig[]; // for info-cards
  columns?: TableColumnConfig[]; // for tables
  cardConfig?: RelatedCardConfig; // for related-cards
  limit?: number;
  componentName?: string; // for custom sections: 'PermissoesMatriz', 'AuthLogsTimeline', 'AtividadesCards', etc.
  componentProps?: Record<string, unknown>; // additional props for custom components
}

export interface TableColumnConfig {
  header: string;
  accessorKey: string;
  cell?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

export interface RelatedCardConfig {
  title: string;
  relationType: string; // to fetch data
  avatarField?: string;
  titleField: string;
  subtitleField?: string;
}

export interface TabConfig {
  id: string;
  label: string;
  badgeField?: string; // field in specific data source to show count
  sections: SectionConfig[];
}

export interface ActivityConfig {
  enabled: boolean;
  types?: string[];
}

export interface ProfileConfig {
  entityType:
    | "cliente"
    | "parte_contraria"
    | "terceiro"
    | "representante"
    | "usuario";
  headerConfig: HeaderConfig;
  sidebarSections: SidebarSection[];
  tabs: TabConfig[];
  activityConfig?: ActivityConfig;
}

export interface ProfileData {
  id: number | string;
  [key: string]: unknown;
}
