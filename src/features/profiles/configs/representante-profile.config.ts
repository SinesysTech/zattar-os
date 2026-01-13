import { ProfileConfig } from "./types";
import { Briefcase, FileText, Mail, Phone, Scale, User } from "lucide-react";

export const representanteProfileConfig: ProfileConfig = {
  entityType: "representante",
  headerConfig: {
    showBanner: true,
    showAvatar: true,
    showStatus: true,
    titleField: "nome",
    subtitleFields: ["oab_principal"],
    badges: [
      { field: "tipo_representante", variant: "outline" },
      { field: "status_oab", variant: "default" },
    ],
    metadata: [
      { label: "OAB Principal", valuePath: "oab_principal", icon: Scale },
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
      title: "OAB",
      fields: [
        { label: "Inscrições", valuePath: "oabs_formatadas", icon: Scale },
      ],
    },
    {
      title: "Contatos",
      fields: [
        { label: "Email", valuePath: "email", icon: Mail },
        { label: "Telefone", valuePath: "telefone", icon: Phone },
      ],
    },
    {
      title: "Estatísticas",
      fields: [
        {
          label: "Processos",
          valuePath: "stats.total_processos",
          icon: Briefcase,
        },
        { label: "Clientes", valuePath: "stats.total_clientes", icon: User },
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
          title: "Dados Pessoais",
          fields: [
            { label: "Nome", valuePath: "nome" },
            { label: "Nacionalidade", valuePath: "nacionalidade" },
          ],
        },
      ],
    },
    {
      id: "processos",
      label: "Processos Representados",
      badgeField: "stats.total_processos",
      sections: [
        {
          type: "table",
          title: "Processos",
          dataSource: "processos",
          columns: [
            { header: "Processo", accessorKey: "numero_processo" },
            { header: "Cliente", accessorKey: "cliente_nome" },
            { header: "Status", accessorKey: "status" },
          ],
        },
      ],
    },
    {
      id: "clientes",
      label: "Clientes",
      sections: [
        {
          type: "related-cards",
          title: "Carteira de Clientes",
          cardConfig: {
            title: "Clientes",
            relationType: "clientes",
            titleField: "nome",
            subtitleField: "cpf_cnpj",
          },
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
};
