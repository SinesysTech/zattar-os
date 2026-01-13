import { ProfileConfig } from "./types";
import {
  Briefcase,
  Calendar,
  FileText,
  Mail,
  Phone,
  Scale,
  User,
  Users,
} from "lucide-react";

export const representanteProfileConfig: ProfileConfig = {
  entityType: "representante",
  headerConfig: {
    showBanner: true,
    showAvatar: true,
    showStatus: true,
    titleField: "nome",
    subtitleFields: ["oab_principal"],
    badges: [
      { field: "tipo", variant: "outline" },
      { field: "oab_situacao_principal", variant: "default" },
    ],
    metadata: [
      { label: "OAB Principal", valuePath: "oab_principal", icon: Scale },
      { label: "CPF", valuePath: "cpf_formatado", icon: FileText },
    ],
  },
  sidebarSections: [
    {
      title: "Sobre",
      fields: [
        { label: "Nome", valuePath: "nome", icon: User },
        {
          label: "CPF",
          valuePath: "cpf_formatado",
          icon: FileText,
          type: "document",
        },
        { label: "Sexo", valuePath: "sexo", icon: User },
        { label: "Tipo", valuePath: "tipo", icon: Briefcase },
      ],
    },
    {
      title: "OAB",
      fields: [
        { label: "OAB Principal", valuePath: "oab_principal", icon: Scale },
        { label: "Situação", valuePath: "oab_situacao_principal", icon: Scale },
        { label: "Todas Inscrições", valuePath: "oabs_formatadas", icon: Scale },
      ],
    },
    {
      title: "Contatos",
      fields: [
        { label: "Celular", valuePath: "celular_formatado", icon: Phone },
        { label: "Residencial", valuePath: "residencial_formatado", icon: Phone },
        { label: "Comercial", valuePath: "comercial_formatado", icon: Phone },
        { label: "Emails", valuePath: "emails_formatados", icon: Mail },
      ],
    },
    {
      title: "Estatísticas",
      fields: [
        {
          label: "Total de Processos",
          valuePath: "stats.total_processos",
          icon: Briefcase,
        },
        {
          label: "Total de Clientes",
          valuePath: "stats.total_clientes",
          icon: Users,
        },
        {
          label: "Última Atualização",
          valuePath: "updated_at",
          icon: Calendar,
          type: "date",
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
          type: "custom",
          title: "Dados Pessoais",
          componentName: "RepresentanteInfoSection",
        },
        {
          type: "custom",
          title: "Contatos",
          componentName: "RepresentanteContatoSection",
        },
        {
          type: "custom",
          title: "Inscrições OAB",
          componentName: "RepresentanteOABSection",
        },
      ],
    },
    {
      id: "processos",
      label: "Processos Representados",
      badgeField: "stats.total_processos",
      sections: [
        {
          type: "custom",
          title: "Processos",
          componentName: "RepresentanteProcessosTable",
        },
      ],
    },
    {
      id: "clientes",
      label: "Clientes",
      badgeField: "stats.total_clientes",
      sections: [
        {
          type: "custom",
          title: "Carteira de Clientes",
          componentName: "RepresentanteClientesTable",
        },
      ],
    },
    {
      id: "atividades",
      label: "Atividades",
      sections: [
        {
          type: "timeline",
          title: "Histórico de Atividades",
          dataSource: "activities",
        },
      ],
    },
  ],
  activityConfig: {
    enabled: true,
  },
};
