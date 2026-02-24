'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  type FieldDef,
  type ActionDef,
} from '../../components/doc-components';
import {
  Plus,
  Pencil,
  Eye,
  Search,
  Download,
  Trash2,
} from 'lucide-react';

const fields: FieldDef[] = [
  {
    campo: 'Nome / Razão Social',
    tipo: 'Texto',
    obrigatorio: true,
    descricao: 'Nome completo da pessoa física ou razão social da pessoa jurídica.',
  },
  {
    campo: 'Tipo de Pessoa',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Define se o cliente é Pessoa Física (PF) ou Pessoa Jurídica (PJ). Altera os campos exibidos no formulário.',
  },
  {
    campo: 'CPF',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Cadastro de Pessoa Física. Obrigatório para clientes PF. O sistema valida o dígito verificador automaticamente.',
  },
  {
    campo: 'CNPJ',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Cadastro Nacional da Pessoa Jurídica. Obrigatório para clientes PJ. O sistema valida o formato e os dígitos verificadores.',
  },
  {
    campo: 'E-mail',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Endereço de e-mail principal para contato e envio de notificações.',
  },
  {
    campo: 'Celular',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Número de celular com DDD. Usado para contato e integração com WhatsApp.',
  },
  {
    campo: 'Endereço',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Logradouro, número, complemento, bairro, cidade, estado e CEP.',
  },
  {
    campo: 'Estado Civil',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Situação civil do cliente PF: solteiro, casado, divorciado, viúvo, união estável, separado.',
  },
  {
    campo: 'Gênero',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Gênero do cliente pessoa física para fins de comunicação e documentos.',
  },
  {
    campo: 'Nacionalidade',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'País de nascimento ou origem do cliente. Padrão: Brasileiro(a).',
  },
  {
    campo: 'RG',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Registro Geral do cliente pessoa física, incluindo órgão expedidor e UF.',
  },
  {
    campo: 'Data de Nascimento',
    tipo: 'Data',
    obrigatorio: false,
    descricao: 'Data de nascimento do cliente PF. Usada para calcular a idade e gerar documentos com dados corretos.',
  },
];

const actions: ActionDef[] = [
  {
    icon: Plus,
    nome: 'Criar Cliente',
    descricao: 'Abre o formulário de cadastro para incluir um novo cliente na base.',
  },
  {
    icon: Pencil,
    nome: 'Editar',
    descricao: 'Permite alterar os dados de um cliente já cadastrado. Disponível no menu de ações da linha ou na tela de detalhes.',
  },
  {
    icon: Eye,
    nome: 'Visualizar Detalhes',
    descricao: 'Exibe a ficha completa do cliente, incluindo processos vinculados, contratos e histórico.',
  },
  {
    icon: Search,
    nome: 'Buscar / Filtrar',
    descricao: 'Use a barra de busca para localizar clientes por nome, CPF, CNPJ ou e-mail. Filtros avançados por tipo de pessoa e status estão disponíveis.',
  },
  {
    icon: Download,
    nome: 'Exportar',
    descricao: 'Exporta a lista de clientes em formato CSV ou XLSX para uso em planilhas externas.',
  },
  {
    icon: Trash2,
    nome: 'Excluir',
    descricao: 'Remove o registro do cliente. Clientes vinculados a processos ou contratos ativos não podem ser excluídos.',
  },
];

export default function ClientesDoc() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Clientes</h1>
        <p className="text-muted-foreground text-lg">
          Cadastro centralizado de clientes pessoas físicas e jurídicas do escritório.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Clientes armazena todos os dados cadastrais das pessoas ou empresas que
          contratam os serviços do escritório. Cada cliente pode ser vinculado a um ou mais
          processos e contratos, centralizando as informações para fácil consulta.
        </p>
        <DocTip>
          O sistema valida automaticamente o CPF e o CNPJ informados. Se o documento for inválido,
          o formulário exibirá uma mensagem de erro antes de permitir o salvamento. Certifique-se de
          digitar apenas os números, sem pontos ou traços — a formatação é aplicada automaticamente.
        </DocTip>
      </DocSection>

      <DocSection title="Campos do Cadastro">
        <DocFieldTable fields={fields} />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList actions={actions} />
      </DocSection>

      <DocSection title="Vinculação com Processos e Contratos">
        <p className="text-muted-foreground">
          Na tela de detalhes do cliente, são exibidas abas com os processos nos quais ele figura
          como parte e os contratos associados. É possível navegar diretamente para cada processo
          ou contrato clicando no registro correspondente.
        </p>
        <DocTip>
          Ao cadastrar um novo processo, você pode buscar o cliente diretamente pelo nome ou CPF/CNPJ
          sem precisar sair da tela de criação do processo.
        </DocTip>
      </DocSection>
    </div>
  );
}
