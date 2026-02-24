'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
} from '../../components/doc-components';
import {
  UserPlus,
  Pencil,
  Trash2,
  ShieldCheck,
  KeyRound,
  UserX,
  UserCheck,
  Mail,
} from 'lucide-react';

export default function Equipe() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Equipe / Usuários</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os membros da equipe do escritório, crie e edite usuários, defina perfis de
          acesso e controle as permissões de cada integrante.
        </p>
      </div>

      <DocSection title="Criando um Novo Usuário">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse RH > Equipe',
              descricao: 'No menu lateral, vá em RH > Equipe.',
            },
            {
              titulo: 'Clique em "Novo Usuário"',
              descricao: 'O botão fica no canto superior direito da listagem.',
            },
            {
              titulo: 'Preencha os dados pessoais',
              descricao:
                'Informe nome completo, e-mail corporativo, CPF e telefone.',
            },
            {
              titulo: 'Defina o perfil de acesso',
              descricao:
                'Selecione o perfil (Administrador, Advogado, Assistente, Financeiro, etc.) que determina as permissões do usuário.',
            },
            {
              titulo: 'Configure dados profissionais',
              descricao:
                'Informe cargo, número da OAB (se advogado), data de admissão e departamento.',
            },
            {
              titulo: 'Salve e envie convite',
              descricao:
                'O sistema envia um e-mail de boas-vindas com o link para o usuário definir sua senha.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos do Usuário">
        <DocFieldTable
          fields={[
            {
              campo: 'Nome Completo',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'Nome do colaborador como aparecerá em todo o sistema.',
            },
            {
              campo: 'E-mail',
              tipo: 'E-mail',
              obrigatorio: true,
              descricao: 'E-mail corporativo usado para login e notificações.',
            },
            {
              campo: 'CPF',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'CPF do colaborador para identificação e relatórios de RH.',
            },
            {
              campo: 'Telefone',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Número de contato do colaborador.',
            },
            {
              campo: 'Cargo',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Função do colaborador no escritório, ex: Advogado Sênior.',
            },
            {
              campo: 'Número OAB',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Inscrição na OAB, obrigatório para advogados.',
            },
            {
              campo: 'Departamento',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Área ou setor ao qual o colaborador pertence.',
            },
            {
              campo: 'Data de Admissão',
              tipo: 'Data',
              obrigatorio: false,
              descricao: 'Data de início do vínculo com o escritório.',
            },
            {
              campo: 'Perfil de Acesso',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Define as permissões do usuário no sistema.',
            },
            {
              campo: 'Status',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Ativo ou Inativo. Usuários inativos não conseguem acessar o sistema.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Perfis e Permissões">
        <p className="text-muted-foreground mb-4">
          O sistema possui perfis de acesso predefinidos, cada um com um conjunto de permissões:
        </p>
        <ul className="space-y-3 text-sm text-muted-foreground list-disc list-inside">
          <li>
            <strong>Administrador:</strong> acesso total a todos os módulos, incluindo configurações
            e gestão de usuários.
          </li>
          <li>
            <strong>Advogado:</strong> acesso a processos, agenda, documentos, captura e DRE
            próprio.
          </li>
          <li>
            <strong>Assistente:</strong> acesso a processos e agenda, sem acesso ao módulo
            financeiro completo.
          </li>
          <li>
            <strong>Financeiro:</strong> acesso total ao módulo financeiro e RH, sem acesso a
            configurações de sistema.
          </li>
          <li>
            <strong>Somente Leitura:</strong> visualização de dados sem permissão para criar ou
            editar registros.
          </li>
        </ul>
        <DocTip>
          Perfis personalizados podem ser criados em Configurações &gt; Permissões, permitindo
          ajustar quais módulos e ações cada tipo de usuário pode acessar.
        </DocTip>
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: UserPlus,
              nome: 'Novo Usuário',
              descricao: 'Cria um novo membro da equipe e envia convite por e-mail.',
            },
            {
              icon: Pencil,
              nome: 'Editar',
              descricao: 'Altera dados pessoais, cargo ou departamento do usuário.',
            },
            {
              icon: ShieldCheck,
              nome: 'Alterar Perfil',
              descricao: 'Muda o perfil de acesso do usuário. Somente administradores podem realizar essa ação.',
            },
            {
              icon: KeyRound,
              nome: 'Redefinir Senha',
              descricao: 'Envia um e-mail ao usuário com link para redefinição de senha.',
            },
            {
              icon: Mail,
              nome: 'Reenviar Convite',
              descricao: 'Reenvia o e-mail de boas-vindas para usuários que ainda não ativaram a conta.',
            },
            {
              icon: UserX,
              nome: 'Inativar',
              descricao: 'Bloqueia o acesso do usuário sem excluir seu histórico e dados.',
            },
            {
              icon: UserCheck,
              nome: 'Reativar',
              descricao: 'Restaura o acesso de um usuário inativado.',
            },
            {
              icon: Trash2,
              nome: 'Excluir',
              descricao:
                'Remove o usuário permanentemente. Só disponível para contas sem nenhum registro associado.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Gestão de Acesso">
        <p className="text-muted-foreground">
          A aba "Acesso" no perfil de cada usuário exibe um histórico dos últimos logins, os
          dispositivos utilizados e permite revogar sessões ativas em caso de suspeita de acesso
          não autorizado. Usuários com autenticação em dois fatores (2FA) habilitada apresentam
          um cadeado na listagem da equipe.
        </p>
        <DocTip>
          Recomenda-se inativar imediatamente o usuário quando um colaborador deixar o escritório,
          antes de excluí-lo, para preservar o histórico de ações realizadas por ele no sistema.
        </DocTip>
      </DocSection>
    </div>
  );
}
