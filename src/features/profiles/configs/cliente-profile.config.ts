import { ProfileConfig } from "./types";
import {
  Building2,
  Calendar,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

export const clienteProfileConfig: ProfileConfig = {
  entityType: "cliente",
  headerConfig: {
    showBanner: true,
    showAvatar: true,
    showStatus: true,
    titleField: "nome",
    subtitleFields: ["cpf_cnpj"],
    badges: [
      { field: "tipo_pessoa", variant: "outline" },
      {
        field: "status",
        variant: "default",
        map: { ativo: "Ativo", inativo: "Inativo" },
      },
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
        { label: "RG", valuePath: "rg", icon: FileText },
        {
          label: "Inscrição Estadual",
          valuePath: "inscricao_estadual",
          icon: FileText,
        },
      ],
    },
    {
      title: "Contatos",
      fields: [
        { label: "Email", valuePath: "email", icon: Mail },
        { label: "Telefone", valuePath: "telefone", icon: Phone },
        { label: "Celular", valuePath: "celular", icon: Phone },
      ],
    },
    {
      title: "Endereço",
      fields: [
        { label: "Logradouro", valuePath: "endereco.logradouro", icon: MapPin },
        { label: "Bairro", valuePath: "endereco.bairro", icon: MapPin },
        { label: "Cidade/UF", valuePath: "endereco.cidade_uf", icon: MapPin },
        { label: "CEP", valuePath: "endereco.cep", icon: MapPin },
      ],
    },
    {
      title: "Estatísticas",
      fields: [
        {
          label: "Total de Processos",
          valuePath: "stats.total_processos",
          icon: FileText,
        },
        {
          label: "Processos Ativos",
          valuePath: "stats.processos_ativos",
          icon: FileText,
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
          type: "info-cards",
          title: "Dados Pessoais",
          fields: [
            { label: "Nome Completo", valuePath: "nome" },
            {
              label: "Data Nascimento",
              valuePath: "data_nascimento",
              type: "date",
            },
            { label: "Nacionalidade", valuePath: "nacionalidade" },
            { label: "Estado Civil", valuePath: "estado_civil" },
            { label: "Profissão", valuePath: "profissao" },
          ],
        },
        {
          type: "related-cards",
          title: "Representantes",
          cardConfig: {
            title: "Representantes Vinculados",
            relationType: "representantes",
            titleField: "nome",
            subtitleField: "oab",
            avatarField: "nome",
          },
        },
      ],
    },
    {
      id: "processos",
      label: "Processos",
      badgeField: "stats.total_processos",
      sections: [
        {
          type: "table",
          title: "Processos Relacionados",
          dataSource: "processos",
          columns: [
            { header: "Número", accessorKey: "numero_processo" },
            { header: "TRT", accessorKey: "trt" },
            { header: "Grau", accessorKey: "grau" },
            { header: "Polo", accessorKey: "polo" },
            { header: "Status", accessorKey: "status" },
          ],
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
