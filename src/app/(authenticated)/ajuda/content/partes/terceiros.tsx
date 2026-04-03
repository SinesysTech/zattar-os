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
    campo: 'Nome',
    tipo: 'Texto',
    obrigatorio: true,
    descricao: 'Nome completo do terceiro envolvido no processo.',
  },
  {
    campo: 'Tipo de Terceiro',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Classifica o envolvimento: Testemunha, Perito, Assistente Técnico, Interveniente, Amicus Curiae ou Outros.',
  },
  {
    campo: 'CPF',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'CPF do terceiro, quando necessário para identificação formal.',
  },
  {
    campo: 'E-mail',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'E-mail para contato com o terceiro.',
  },
  {
    campo: 'Celular / Telefone',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Número de telefone para contato.',
  },
  {
    campo: 'Endereço',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Endereço completo do terceiro, necessário em casos de intimação ou convocação.',
  },
  {
    campo: 'Observações',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Anotações adicionais sobre o papel deste terceiro no processo ou qualquer informação relevante.',
  },
];

const actions: ActionDef[] = [
  {
    icon: Plus,
    nome: 'Cadastrar Terceiro',
    descricao: 'Abre o formulário para incluir um novo terceiro na base de dados.',
  },
  {
    icon: Pencil,
    nome: 'Editar',
    descricao: 'Atualiza os dados cadastrais de um terceiro já registrado.',
  },
  {
    icon: Eye,
    nome: 'Visualizar Detalhes',
    descricao: 'Exibe a ficha completa do terceiro e os processos aos quais está vinculado.',
  },
  {
    icon: Search,
    nome: 'Buscar',
    descricao: 'Localiza terceiros pelo nome, CPF ou tipo de envolvimento.',
  },
  {
    icon: Link,
    nome: 'Vincular a Processo',
    descricao: 'Associa o terceiro a um processo específico, definindo o seu papel naquele contexto.',
  },
];

export default function TerceirosDoc() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Terceiros</h1>
        <p className="text-muted-foreground text-lg">
          Cadastro de pessoas indiretamente envolvidas nos processos, como testemunhas, peritos e assistentes técnicos.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          Terceiros são pessoas que participam do processo de forma indireta ou auxiliar, sem serem
          parte autora nem ré. Exemplos comuns incluem testemunhas arroladas, peritos judiciais,
          assistentes técnicos nomeados e outros intervenientes processuais.
        </p>
        <p className="text-muted-foreground">
          O cadastro de Terceiros é mais simples que o de Clientes ou Partes Contrárias, focado apenas
          nas informações necessárias para identificação e contato.
        </p>
        <DocTip>
          Peritos cadastrados aqui ficam disponíveis para seleção no módulo de Perícias. Mantenha os
          dados de contato atualizados para facilitar a comunicação durante o processo.
        </DocTip>
      </DocSection>

      <DocSection title="Campos do Cadastro">
        <DocFieldTable fields={fields} />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList actions={actions} />
      </DocSection>

      <DocSection title="Tipos de Terceiros">
        <p className="text-muted-foreground">
          O campo Tipo de Terceiro ajuda a classificar o envolvimento de cada pessoa:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mt-2">
          <li><strong>Testemunha:</strong> pessoa arrolada para depor no processo.</li>
          <li><strong>Perito:</strong> especialista nomeado pelo juízo para elaborar laudo técnico.</li>
          <li><strong>Assistente Técnico:</strong> especialista indicado por uma das partes para acompanhar a perícia.</li>
          <li><strong>Interveniente:</strong> terceiro que ingressa no processo por interesse próprio ou por determinação judicial.</li>
          <li><strong>Outros:</strong> qualquer outro envolvido que não se enquadre nas categorias anteriores.</li>
        </ul>
      </DocSection>
    </div>
  );
}
