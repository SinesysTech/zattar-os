'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  type FieldDef,
  type ActionDef,
} from '../../components/doc-components';
import { Plus, Pencil, Eye, Search, Link, UserCheck } from 'lucide-react';

const fields: FieldDef[] = [
  {
    campo: 'Nome',
    tipo: 'Texto',
    obrigatorio: true,
    descricao: 'Nome completo do advogado ou representante legal.',
  },
  {
    campo: 'CPF',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'CPF do representante. O sistema valida o dígito verificador automaticamente.',
  },
  {
    campo: 'Número OAB',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Número de inscrição na Ordem dos Advogados do Brasil, incluindo seccional (ex: 123456/SP).',
  },
  {
    campo: 'Seccional OAB',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Estado da seccional da OAB onde o advogado está inscrito.',
  },
  {
    campo: 'E-mail',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Endereço de e-mail profissional do representante.',
  },
  {
    campo: 'Celular',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Número de celular com DDD para contato direto.',
  },
  {
    campo: 'Tipo de Representação',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Define o papel do representante: Advogado do Escritório, Advogado Correspondente, Procurador ou Curador.',
  },
  {
    campo: 'Observações',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Informações adicionais sobre o representante, como especialidades ou restrições.',
  },
];

const actions: ActionDef[] = [
  {
    icon: Plus,
    nome: 'Cadastrar Representante',
    descricao: 'Abre o formulário para incluir um novo advogado ou representante.',
  },
  {
    icon: Pencil,
    nome: 'Editar',
    descricao: 'Atualiza os dados do representante, como número OAB atualizado ou novo e-mail.',
  },
  {
    icon: Eye,
    nome: 'Visualizar Detalhes',
    descricao: 'Exibe a ficha completa com os processos e partes representadas.',
  },
  {
    icon: Search,
    nome: 'Buscar',
    descricao: 'Localiza representantes por nome, CPF ou número OAB.',
  },
  {
    icon: Link,
    nome: 'Vincular a Parte ou Processo',
    descricao: 'Associa o representante a um cliente, parte contrária ou diretamente a um processo.',
  },
  {
    icon: UserCheck,
    nome: 'Definir como Responsável',
    descricao: 'Atribui o representante como advogado responsável por um processo específico.',
  },
];

export default function RepresentantesDoc() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Representantes</h1>
        <p className="text-muted-foreground text-lg">
          Cadastro de advogados e representantes legais vinculados às partes e processos do escritório.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Representantes centraliza o cadastro de advogados internos, correspondentes e
          outros representantes legais. Eles podem ser vinculados tanto a partes (clientes ou partes
          contrárias) quanto diretamente a processos, tornando possível rastrear quem atua em cada caso.
        </p>
        <DocTip>
          Advogados cadastrados no módulo de Recursos Humanos (RH) são importados automaticamente como
          Representantes. Complementar o cadastro com o número OAB facilita o preenchimento automático
          de petições e documentos gerados pelo sistema.
        </DocTip>
      </DocSection>

      <DocSection title="Campos do Cadastro">
        <DocFieldTable fields={fields} />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList actions={actions} />
      </DocSection>

      <DocSection title="Vinculação com Partes e Processos">
        <p className="text-muted-foreground">
          Um representante pode atuar em múltiplos papéis dentro do sistema:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mt-2">
          <li>Como advogado do escritório responsável por um processo.</li>
          <li>Como representante legal de um cliente específico.</li>
          <li>Como advogado correspondente contratado para atos em outra comarca.</li>
          <li>Como procurador da parte contrária, identificado na captura do PJe.</li>
        </ul>
        <DocTip>
          Ao capturar um processo do PJe, o sistema pode identificar automaticamente o advogado da
          parte contrária. Esses dados são armazenados para referência, mas não substituem o cadastro
          manual quando informações mais detalhadas forem necessárias.
        </DocTip>
      </DocSection>
    </div>
  );
}
