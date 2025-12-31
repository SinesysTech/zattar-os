import { ProfileConfig } from "./types";
import {
  BadgeCheck,
  Calendar,
  FileText,
  Mail,
  Phone,
  User,
  MapPin,
  CreditCard,
  Cake,
  Users,
  Hash,
  Briefcase,
} from "lucide-react";
import { formatarEnderecoCompleto } from "@/features/usuarios/utils";

// Wrapper para formatar endereço com tipo compatível
const formatEndereco = (value: unknown): string => {
  return formatarEnderecoCompleto(value as any);
};

export const usuarioProfileConfig: ProfileConfig = {
  entityType: "usuario",
  headerConfig: {
    showBanner: true,
    showAvatar: true,
    showStatus: true,
    titleField: "nomeCompleto",
    subtitleFields: ["emailCorporativo"],
    badges: [
      { field: "cargo.nome", variant: "outline" },
      {
        field: "isSuperAdmin",
        variant: "destructive",
        map: { true: "Super Admin" },
      },
      {
        field: "ativo",
        variant: "default",
        map: { true: "Ativo", false: "Inativo" },
      },
    ],
    metadata: [
      { label: "OAB", valuePath: "oab", icon: BadgeCheck },
    ],
  },
  sidebarSections: [
    {
      title: "Identificação",
      fields: [
        { label: "Nome Completo", valuePath: "nomeCompleto", icon: User },
        { label: "CPF", valuePath: "cpf", icon: CreditCard },
        { label: "RG", valuePath: "rg", icon: Hash },
        { label: "Data de Nascimento", valuePath: "dataNascimento", icon: Cake },
        { label: "Gênero", valuePath: "genero", icon: Users },
      ],
    },
    {
      title: "Contatos",
      fields: [
        { label: "Email Corporativo", valuePath: "emailCorporativo", icon: Mail },
        { label: "Email Pessoal", valuePath: "emailPessoal", icon: Mail },
        { label: "Telefone", valuePath: "telefone", icon: Phone },
        { label: "Ramal", valuePath: "ramal", icon: Phone },
      ],
    },
    {
      title: "Profissional",
      fields: [
        { label: "Cargo", valuePath: "cargo.nome", icon: Briefcase },
        { label: "OAB", valuePath: "oab", icon: BadgeCheck },
        { label: "UF OAB", valuePath: "ufOab", icon: MapPin },
      ],
    },
    {
      title: "Endereço",
      fields: [
        { label: "Endereço Completo", valuePath: "endereco", icon: MapPin, format: formatEndereco },
      ],
    },
    {
      title: "Estatísticas",
      fields: [
        { label: "Processos Atribuídos", valuePath: "stats.processos", icon: FileText },
        { label: "Audiências", valuePath: "stats.audiencias", icon: Calendar },
        { label: "Pendentes", valuePath: "stats.pendentes", icon: FileText },
        { label: "Contratos", valuePath: "stats.contratos", icon: Briefcase },
      ],
    },
  ],
  tabs: [
    {
      id: "dados-cadastrais",
      label: "Dados Cadastrais",
      sections: [
        {
          type: "info-cards",
          title: "Informações Pessoais",
          fields: [
            { label: "Nome Completo", valuePath: "nomeCompleto" },
            { label: "Nome de Exibição", valuePath: "nomeExibicao" },
            { label: "CPF", valuePath: "cpf" },
            { label: "RG", valuePath: "rg" },
            { label: "Data de Nascimento", valuePath: "dataNascimento" },
            { label: "Gênero", valuePath: "genero" },
          ],
        },
        {
          type: "info-cards",
          title: "Contatos",
          fields: [
            { label: "Email Corporativo", valuePath: "emailCorporativo" },
            { label: "Email Pessoal", valuePath: "emailPessoal" },
            { label: "Telefone", valuePath: "telefone" },
            { label: "Ramal", valuePath: "ramal" },
          ],
        },
        {
          type: "info-cards",
          title: "Dados Profissionais",
          fields: [
            { label: "Cargo", valuePath: "cargo.nome" },
            { label: "OAB", valuePath: "oab" },
            { label: "UF OAB", valuePath: "ufOab" },
          ],
        },
        {
          type: "info-cards",
          title: "Endereço",
          fields: [
            { label: "Endereço Completo", valuePath: "endereco", format: formatEndereco },
          ],
        },
      ],
    },
  ],
};
