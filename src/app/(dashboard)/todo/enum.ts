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


