import {
    ArrowDownIcon,
    ArrowRightIcon,
    ArrowUpIcon,
    CheckCircle2,
    Circle,
    HelpCircle,
    Timer,
    XCircle,
    Bug,
    FileText,
    Gavel,
    ClipboardList,
    Stethoscope,
    Briefcase
} from "lucide-react"

export const labels = [
    {
        value: "bug",
        label: "Bug",
        icon: Bug
    },
    {
        value: "feature",
        label: "Feature",
        icon: Briefcase
    },
    {
        value: "documentation",
        label: "Documentação",
        icon: FileText
    },
    {
        value: "audiencia",
        label: "Audiência",
        icon: Gavel
    },
    {
        value: "expediente",
        label: "Expediente",
        icon: ClipboardList
    },
    {
        value: "pericia",
        label: "Perícia",
        icon: Stethoscope
    },
    {
        value: "obrigacao",
        label: "Obrigação",
        icon: HelpCircle
    }
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
        icon: CheckCircle2,
    },
    {
        value: "canceled",
        label: "Cancelada",
        icon: XCircle,
    },
]

export const priorities = [
    {
        label: "Baixa",
        value: "low",
        icon: ArrowDownIcon,
    },
    {
        label: "Média",
        value: "medium",
        icon: ArrowRightIcon,
    },
    {
        label: "Alta",
        value: "high",
        icon: ArrowUpIcon,
    },
]
