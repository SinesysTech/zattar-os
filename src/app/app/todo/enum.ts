export enum EnumTodoPriority {
  High = "high",
  Medium = "medium",
  Low = "low",
}

export enum EnumTodoStatus {
  Pending = "pending",
  InProgress = "in-progress",
  Completed = "completed",
}

export const todoStatusNamed: Record<EnumTodoStatus, string> = {
  [EnumTodoStatus.Pending]: "Pendente",
  [EnumTodoStatus.InProgress]: "Em andamento",
  [EnumTodoStatus.Completed]: "Concluído",
};

export const todoPriorityNamed: Record<EnumTodoPriority, string> = {
  [EnumTodoPriority.High]: "Alta",
  [EnumTodoPriority.Medium]: "Média",
  [EnumTodoPriority.Low]: "Baixa",
};

// Dot colors para indicadores visuais (usado nos componentes)
export const priorityDotColors: Record<EnumTodoPriority, string> = {
  [EnumTodoPriority.High]: "bg-red-500",
  [EnumTodoPriority.Medium]: "bg-orange-500",
  [EnumTodoPriority.Low]: "bg-gray-400",
};

export const statusDotColors: Record<EnumTodoStatus, string> = {
  [EnumTodoStatus.Pending]: "bg-blue-500",
  [EnumTodoStatus.InProgress]: "bg-purple-500",
  [EnumTodoStatus.Completed]: "bg-green-500",
};

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info"
  | "neutral"
  | "accent";

export const todoStatusBadgeVariant: Record<EnumTodoStatus, BadgeVariant> = {
  [EnumTodoStatus.Pending]: "warning",
  [EnumTodoStatus.InProgress]: "info",
  [EnumTodoStatus.Completed]: "success",
};

export const todoPriorityBadgeVariant: Record<EnumTodoPriority, BadgeVariant> = {
  [EnumTodoPriority.High]: "destructive",
  [EnumTodoPriority.Medium]: "warning",
  [EnumTodoPriority.Low]: "neutral",
};


