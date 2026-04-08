import { SemanticBadge } from "@/components/ui/semantic-badge";
import {
  STATUS_PROJETO_LABELS,
  STATUS_TAREFA_LABELS,
  type StatusProjeto,
  type StatusTarefa,
} from "../../domain";

interface ProjectStatusBadgeProps {
  status: StatusProjeto;
  className?: string;
}

export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps) {
  return (
    <SemanticBadge category="project_status" value={status} className={className}>
      {STATUS_PROJETO_LABELS[status]}
    </SemanticBadge>
  );
}

interface TaskStatusBadgeProps {
  status: StatusTarefa;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  return (
    <SemanticBadge category="task_status" value={status} className={className}>
      {STATUS_TAREFA_LABELS[status]}
    </SemanticBadge>
  );
}
