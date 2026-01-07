import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const statuses = [
  {
    value: "rascunho",
    label: "Rascunho",
    icon: FileText,
  },
  {
    value: "pronto",
    label: "Pronto para Assinatura",
    icon: Clock,
  },
  {
    value: "concluido",
    label: "Concluído",
    icon: CheckCircle2,
  },
  {
    value: "cancelado",
    label: "Cancelado",
    icon: XCircle,
  },
];
