'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  type FieldDef,
  type ActionDef,
} from '../../components/doc-components';
import { Plus, Pencil, Eye, Search, Link } from 'lucide-react';

const fields: FieldDef[] = [
  {
    campo: 'Nome / Razão Social',
    tipo: 'Texto',
    obrigatorio: true,
    descricao: 'Nome completo da parte contrária ou razão social da pessoa jurídica.',
  },
  {
    campo: 'Tipo de Pessoa',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Pessoa Física (PF) ou Pessoa Jurídica (PJ). Controla quais campos adicionais são exibidos.',
  },
  {
    campo: 'CPF',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'CPF da parte contrária pessoa física. O sistema valida o dígito verificador.',
  },
  {
    campo: 'CNPJ',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'CNPJ da parte contrária pessoa jurídica. O sistema valida o formato.',
  },
  {
    campo: 'E-mail',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Endereço de e-mail da parte contrária, quando disponível.',
  },
  {
    campo: 'Celular / Telefone',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Número de telefone de contato da parte contrária.',
  },
  {
    campo: 'Endereço',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Endereço completo da parte contrária para citações e intimações.',
  },
  {
    campo: 'Estado Civil',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Estado civil da parte contrária pessoa física.',
  },
  {
    campo: 'Gênero',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Gênero da parte contrária, utilizado em documentos e peças processuais.',
  },
  {
    campo: 'Nacionalidade',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Nacionalidade da parte contrária.',
  },
  {
    campo: 'RG',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Documento de identidade da parte contrária pessoa física.',
  },
  {
    campo: 'Data de Nascimento',
    tipo: 'Data',
    obrigatorio: false,
    descricao: 'Data de nascimento, usada para preencher documentos processuais automaticamente.',
  },
];

const actions: ActionDef[] = [
  {
    icon: Plus,
    nome: 'Cadastrar Parte Contrária',
    descricao: 'Abre o formulário de criação de uma nova parte contrária.',
  },
  {
    icon: Pencil,
    nome: 'Editar',
    descricao: 'Permite alterar os dados cadastrais de uma parte contrária existente.',
  },
  {
    icon: Eye,
    nome: 'Visualizar Detalhes',
    descricao: 'Exibe a ficha completa com os processos em que a parte figura como adversária.',
  },
  {
    icon: Search,
    nome: 'Buscar / Filtrar',
    descricao: 'Localiza partes contrárias por nome, CPF/CNPJ ou e-mail.',
  },
  {
    icon: Link,
    nome: 'Vincular a Processo',
    descricao: 'Associa a parte contrária a um ou mais processos em andamento no escritório.',
  },
];

export default function PartesContariasDoc() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Partes Contrárias</h1>
        <p className="text-muted-foreground text-lg">
          Cadastro de pessoas físicas ou jurídicas que figuram como adversárias nos processos do escritório.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          As Partes Contrárias são os réus, reclamados, impetrados ou qualquer outra figura processual
          que se posicione em lado oposto ao cliente do escritório. O cadastro centraliza os dados
          desses envolvidos para uso em peças jurídicas, notificações e acompanhamento processual.
        </p>
        <p className="text-muted-foreground">
          Uma mesma parte contrária pode estar vinculada a múltiplos processos, evitando duplicidade
          de cadastros e facilitando consultas históricas.
        </p>
        <DocTip>
          Ao importar um processo do PJe, o sistema tenta identificar automaticamente a parte contrária
          com base nos dados capturados. Verifique e complemente o cadastro sempre que dados adicionais
          estiverem disponíveis.
        </DocTip>
      </DocSection>

      <DocSection title="Campos do Cadastro">
        <DocFieldTable fields={fields} />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList actions={actions} />
      </DocSection>

      <DocSection title="Relação com Processos">
        <p className="text-muted-foreground">
          Na ficha de detalhes da parte contrária, é exibida a lista de todos os processos nos quais
          ela é adversária do escritório. Cada linha indica o número do processo, a vara, o status
          atual e o cliente do escritório envolvido.
        </p>
        <DocTip>
          Se a mesma empresa ou pessoa aparecer em múltiplos processos com grafias diferentes do nome,
          utilize a função de busca por CPF/CNPJ para localizar o cadastro correto e evitar duplicatas.
        </DocTip>
      </DocSection>
    </div>
  );
}
