import { ProfileConfig } from "./types";
import {
  Building2,
  Calendar,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
  Shield,
  Briefcase,
  Globe,
  Heart,
  GraduationCap,
  BadgeCheck,
  UserCheck,
} from "lucide-react";

export const terceiroProfileConfig: ProfileConfig = {
  entityType: "terceiro",
  headerConfig: {
    showBanner: true,
    showAvatar: true,
    showStatus: true,
    titleField: "nome",
    subtitleFields: ["cpf_cnpj"],
    badges: [
      { field: "tipo_parte", variant: "secondary" },
      { field: "polo", variant: "outline" },
      { field: "tipo_pessoa", variant: "outline" },
    ],
    metadata: [
      { label: "Tipo de Parte", valuePath: "tipo_parte", icon: Users },
      { label: "Documento", valuePath: "cpf_cnpj", icon: FileText },
      { label: "Polo", valuePath: "polo", icon: UserCheck },
    ],
  },
  sidebarSections: [
    {
      title: "Sobre",
      fields: [
        { label: "Nome", valuePath: "nome", icon: User },
        { label: "Nome Fantasia", valuePath: "nome_fantasia", icon: User },
        { label: "Tipo de Pessoa", valuePath: "tipo_pessoa_label", icon: Building2 },
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
      title: "Participação",
      fields: [
        { label: "Tipo de Parte", valuePath: "tipo_parte", icon: Users },
        { label: "Polo", valuePath: "polo", icon: UserCheck },
        { label: "Principal", valuePath: "principal_label", icon: UserCheck, type: "text" },
      ],
    },
    {
      title: "Dados Pessoais (PF)",
      fields: [
        { label: "Data Nascimento", valuePath: "data_nascimento_formatada", icon: Calendar },
        { label: "Idade", valuePath: "idade_formatada", icon: User },
        { label: "Sexo", valuePath: "sexo", icon: User },
        { label: "Gênero", valuePath: "genero", icon: User },
        { label: "Estado Civil", valuePath: "estado_civil", icon: Heart },
        { label: "Nacionalidade", valuePath: "nacionalidade", icon: Globe },
        { label: "Nome da Mãe", valuePath: "nome_genitora", icon: User },
        { label: "Naturalidade", valuePath: "naturalidade_completa", icon: MapPin },
        { label: "País Nascimento", valuePath: "pais_nascimento_descricao", icon: Globe },
        { label: "Escolaridade", valuePath: "escolaridade_codigo", icon: GraduationCap },
        { label: "Situação CPF", valuePath: "situacao_cpf_receita_descricao", icon: BadgeCheck },
      ],
    },
    {
      title: "Dados Empresariais (PJ)",
      fields: [
        { label: "Data Abertura", valuePath: "data_abertura_formatada", icon: Calendar },
        { label: "Fim Atividade", valuePath: "data_fim_atividade_formatada", icon: Calendar },
        { label: "Ramo Atividade", valuePath: "ramo_atividade", icon: Briefcase },
        { label: "Porte", valuePath: "porte_descricao", icon: Building2 },
        { label: "Órgão Público", valuePath: "orgao_publico_label", icon: Building2, type: "text" },
        { label: "Situação CNPJ", valuePath: "situacao_cnpj_receita_descricao", icon: BadgeCheck },
        { label: "CPF Responsável", valuePath: "cpf_responsavel_formatado", icon: User },
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
      title: "Endereço",
      fields: [
        { label: "Logradouro", valuePath: "endereco.logradouro", icon: MapPin },
        { label: "Número", valuePath: "endereco.numero", icon: MapPin },
        { label: "Complemento", valuePath: "endereco.complemento", icon: MapPin },
        { label: "Bairro", valuePath: "endereco.bairro", icon: MapPin },
        { label: "Cidade/UF", valuePath: "endereco.cidade_uf", icon: MapPin },
        { label: "CEP", valuePath: "endereco.cep_formatado", icon: MapPin },
      ],
    },
    {
      title: "Dados PJE",
      fields: [
        { label: "Status PJE", valuePath: "status_pje", icon: Shield },
        { label: "Situação PJE", valuePath: "situacao_pje", icon: Shield },
        { label: "Login PJE", valuePath: "login_pje", icon: User },
        { label: "Autoridade", valuePath: "autoridade_label", icon: Shield, type: "text" },
      ],
    },
    {
      title: "Estatísticas",
      fields: [
        {
          label: "Total de Participações",
          valuePath: "stats.total_participacoes",
          icon: FileText,
        },
        {
          label: "Processos Relacionados",
          valuePath: "stats.total_processos",
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
          type: "custom",
          title: "Informações do Terceiro",
          componentName: "TerceiroInfoSection",
        },
        {
          type: "custom",
          title: "Contatos",
          componentName: "TerceiroContatoSection",
        },
        {
          type: "custom",
          title: "Endereço",
          componentName: "TerceiroEnderecoSection",
        },
        {
          type: "custom",
          title: "Dados PJE",
          componentName: "TerceiroPJESection",
        },
      ],
    },
    {
      id: "participacoes",
      label: "Participações",
      badgeField: "stats.total_processos",
      sections: [
        {
          type: "custom",
          title: "Processos onde atua",
          componentName: "TerceiroProcessosTable",
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
