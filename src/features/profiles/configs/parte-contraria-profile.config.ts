import { ProfileConfig } from "./types";
import {
  Building2,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

export const parteContrariaProfileConfig: ProfileConfig = {
  entityType: "parte_contraria",
  headerConfig: {
    showBanner: true,
    showAvatar: true,
    showStatus: true,
    titleField: "nome",
    subtitleFields: ["cpf_cnpj"],
    badges: [
      { field: "tipo_pessoa", variant: "outline" },
      { field: "status", variant: "default" },
    ],
    metadata: [
      { label: "Documento", valuePath: "cpf_cnpj", icon: FileText },
      { label: "Localização", valuePath: "endereco_formatado", icon: MapPin },
    ],
  },
  sidebarSections: [
    {
      title: "Sobre",
      fields: [
        { label: "Nome", valuePath: "nome", icon: User },
        { label: "Tipo", valuePath: "tipo_pessoa", icon: Building2 },
        {
          label: "CPF/CNPJ",
          valuePath: "cpf_cnpj",
          icon: FileText,
          type: "document",
        },
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
      title: "Endereço",
      fields: [
        { label: "Logradouro", valuePath: "endereco.logradouro", icon: MapPin },
        { label: "Cidade/UF", valuePath: "endereco.cidade_uf", icon: MapPin },
      ],
    },
    {
      title: "Estatísticas",
      fields: [
        {
          label: "Processos Contra",
          valuePath: "stats.total_processos",
          icon: FileText,
        },
        {
          label: "Processos Ativos",
          valuePath: "stats.processos_ativos",
          icon: FileText,
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
          title: "Informações",
          fields: [
            { label: "Nome Completo", valuePath: "nome" },
            { label: "Observações", valuePath: "observacoes" },
          ],
        },
      ],
    },
    {
      id: "processos",
      label: "Processos",
      badgeField: "stats.total_processos",
      sections: [
        {
          type: "custom",
          title: "Processos Relacionados",
          componentName: "ParteContrariaProcessosTable",
        },
      ],
    },
    {
      id: "atividades",
      label: "Atividades",
      sections: [
        {
          type: "timeline",
          dataSource: "activities",
        },
      ],
    },
  ],
};
