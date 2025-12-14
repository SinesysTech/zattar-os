import { ProfileConfig } from "./types";
import {
  BadgeCheck,
  Building,
  Calendar,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";

export const usuarioProfileConfig: ProfileConfig = {
  entityType: "usuario",
  headerConfig: {
    showBanner: true,
    showAvatar: true,
    showStatus: true,
    titleField: "nome",
    subtitleFields: ["email"],
    badges: [
      { field: "cargo", variant: "outline" },
      {
        field: "is_super_admin",
        variant: "destructive",
        map: { true: "Super Admin" },
      },
    ],
    metadata: [
      { label: "Departamento", valuePath: "departamento", icon: Building },
    ],
  },
  sidebarSections: [
    {
      title: "Sobre",
      fields: [
        { label: "Nome", valuePath: "nome", icon: User },
        { label: "CPF", valuePath: "cpf", icon: FileText },
      ],
    },
    {
      title: "Contatos",
      fields: [
        { label: "Email Corp.", valuePath: "email", icon: Mail },
        { label: "Telefone", valuePath: "telefone", icon: Phone },
      ],
    },
    {
      title: "Profissional",
      fields: [
        { label: "Cargo", valuePath: "cargo", icon: BadgeCheck },
        { label: "Departamento", valuePath: "departamento", icon: Building },
      ],
    },
    {
      title: "Estatísticas",
      fields: [
        {
          label: "Processos",
          valuePath: "stats.total_processos",
          icon: FileText,
        },
        {
          label: "Audiências",
          valuePath: "stats.total_audiencias",
          icon: Calendar,
        },
      ],
    },
  ],
  tabs: [
    {
      id: "perfil",
      label: "Perfil",
      sections: [
        {
          type: "info-cards",
          title: "Dados Cadastrais",
          fields: [
            { label: "Nome", valuePath: "nome" },
            { label: "Email", valuePath: "email" },
          ],
        },
      ],
    },
    {
      id: "processos",
      label: "Processos",
      sections: [
        {
          type: "table",
          title: "Processos Atribuídos",
          dataSource: "processos",
          columns: [
            { header: "Processo", accessorKey: "numero_processo" },
            { header: "Status", accessorKey: "task_status" },
          ],
        },
      ],
    },
    {
      id: "permissoes",
      label: "Permissões",
      sections: [
        {
          type: "info-cards",
          title: "Matriz de Acesso",
          // Custom component handling or special field for permissions would go here
          // For now, using info-cards as placeholder
          fields: [],
        },
      ],
    },
  ],
};
