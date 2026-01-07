import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  Circle,
  CircleOff,
  HelpCircle,
  Timer,
} from "lucide-react"

export const labels = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Funcionalidade",
  },
  {
    value: "documentation",
    label: "Documentação",
  },
]

export const statuses = [
  {
    value: "backlog",
    label: "Backlog",
    icon: HelpCircle,
  },
  {
    value: "todo",
    label: "A fazer",
    icon: Circle,
  },
  {
    value: "in progress",
    label: "Em andamento",
    icon: Timer,
  },
  {
    value: "done",
    label: "Concluída",
    icon: CheckCircle,
  },
  {
    value: "canceled",
    label: "Cancelada",
    icon: CircleOff,
  },
]

export const priorities = [
  {
    label: "Baixa",
    value: "low",
    icon: ArrowDown,
  },
  {
    label: "Média",
    value: "medium",
    icon: ArrowRight,
  },
  {
    label: "Alta",
    value: "high",
    icon: ArrowUp,
  },
]
