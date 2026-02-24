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
  KeyRound,
  Building2,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Plus,
} from 'lucide-react';

export default function CapturaConfiguracao() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">
          Configurações de Captura
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure os advogados para captura, as credenciais de acesso ao PJe e os tribunais
          monitorados pelo sistema. Estas configurações são a base para o funcionamento correto
          da captura automática de movimentações.
        </p>
      </div>

      {/* ─── ADVOGADOS ─────────────────────────────────────────────── */}
      <DocSection title="Advogados para Captura">
        <p className="text-muted-foreground mb-4">
          Registre os advogados cujos processos serão monitorados. Cada advogado deve ter uma
          credencial válida cadastrada para o tribunal correspondente.
        </p>

        <DocSteps
          steps={[
            {
              titulo: 'Acesse Captura > Configurações > Advogados',
              descricao: 'Navegue até a aba "Advogados" dentro das configurações de captura.',
            },
            {
              titulo: 'Clique em "Adicionar Advogado"',
              descricao: 'O botão fica no canto superior direito da lista.',
            },
            {
              titulo: 'Selecione o usuário do sistema',
              descricao:
                'Vincule o advogado a um usuário já cadastrado em RH > Equipe.',
            },
            {
              titulo: 'Informe o número da OAB',
              descricao:
                'O número da OAB é usado para identificar os processos do advogado nos tribunais.',
            },
            {
              titulo: 'Salve',
              descricao:
                'O advogado ficará disponível para vincular a credenciais e agendamentos.',
            },
          ]}
        />

        <div className="mt-4">
          <DocFieldTable
            fields={[
              {
                campo: 'Usuário',
                tipo: 'Seleção',
                obrigatorio: true,
                descricao: 'Membro da equipe cadastrado em RH > Equipe.',
              },
              {
                campo: 'Número OAB',
                tipo: 'Texto',
                obrigatorio: true,
                descricao: 'Inscrição OAB no formato "UF-NNNNN", ex: "SP-123456".',
              },
              {
                campo: 'Seccional OAB',
                tipo: 'Seleção',
                obrigatorio: true,
                descricao: 'Estado da inscrição OAB (UF).',
              },
              {
                campo: 'Ativo',
                tipo: 'Booleano',
                obrigatorio: false,
                descricao: 'Advogados inativos não participam de novos agendamentos.',
              },
            ]}
          />
        </div>

        <DocActionList
          actions={[
            {
              icon: UserPlus,
              nome: 'Adicionar Advogado',
              descricao: 'Cadastra um advogado para participar das capturas.',
            },
            {
              icon: Pencil,
              nome: 'Editar',
              descricao: 'Altera os dados do advogado cadastrado.',
            },
            {
              icon: Trash2,
              nome: 'Remover',
              descricao: 'Remove o advogado. Agendamentos ativos vinculados serão pausados.',
            },
          ]}
        />
      </DocSection>

      {/* ─── CREDENCIAIS ───────────────────────────────────────────── */}
      <DocSection title="Credenciais PJe">
        <p className="text-muted-foreground mb-4">
          As credenciais são os dados de acesso (login e senha) usados para autenticação no PJe
          ou em outros portais de tribunal. Cada credencial é associada a um advogado e a um
          tribunal específico.
        </p>

        <DocSteps
          steps={[
            {
              titulo: 'Acesse a aba "Credenciais"',
              descricao: 'Dentro de Captura > Configurações, selecione a aba Credenciais.',
            },
            {
              titulo: 'Clique em "Nova Credencial"',
              descricao: 'O botão fica no canto superior direito.',
            },
            {
              titulo: 'Preencha os dados de acesso',
              descricao:
                'Informe o advogado, o tribunal, o login (CPF ou e-mail) e a senha de acesso.',
            },
            {
              titulo: 'Teste a credencial',
              descricao:
                'Clique em "Testar Conexão" para verificar se o sistema consegue autenticar com sucesso.',
            },
            {
              titulo: 'Salve',
              descricao:
                'As credenciais são armazenadas com criptografia. Somente o sistema pode utilizá-las.',
            },
          ]}
        />

        <div className="mt-4">
          <DocFieldTable
            fields={[
              {
                campo: 'Advogado',
                tipo: 'Seleção',
                obrigatorio: true,
                descricao: 'Advogado ao qual a credencial pertence.',
              },
              {
                campo: 'Tribunal',
                tipo: 'Seleção',
                obrigatorio: true,
                descricao: 'Tribunal ou sistema para o qual a credencial é válida.',
              },
              {
                campo: 'Login',
                tipo: 'Texto',
                obrigatorio: true,
                descricao: 'CPF ou e-mail usado para login no portal do tribunal.',
              },
              {
                campo: 'Senha',
                tipo: 'Senha',
                obrigatorio: true,
                descricao: 'Senha de acesso ao portal. Armazenada com criptografia AES-256.',
              },
              {
                campo: 'Certificado Digital',
                tipo: 'Arquivo',
                obrigatorio: false,
                descricao: 'Arquivo .pfx do certificado digital, quando exigido pelo tribunal.',
              },
              {
                campo: 'Senha do Certificado',
                tipo: 'Senha',
                obrigatorio: false,
                descricao: 'Senha de proteção do certificado digital.',
              },
            ]}
          />
        </div>

        <DocActionList
          actions={[
            {
              icon: Plus,
              nome: 'Nova Credencial',
              descricao: 'Cadastra uma nova credencial de acesso ao tribunal.',
            },
            {
              icon: CheckCircle,
              nome: 'Testar Conexão',
              descricao: 'Verifica se as credenciais estão corretas e o sistema consegue autenticar.',
            },
            {
              icon: ShieldCheck,
              nome: 'Ver Status',
              descricao: 'Exibe o status da última autenticação e se há erros ativos.',
            },
            {
              icon: Pencil,
              nome: 'Atualizar Senha',
              descricao: 'Atualiza a senha quando houver alteração no portal do tribunal.',
            },
            {
              icon: XCircle,
              nome: 'Desativar',
              descricao: 'Suspende o uso da credencial sem excluí-la.',
            },
            {
              icon: Trash2,
              nome: 'Excluir',
              descricao: 'Remove a credencial permanentemente.',
            },
          ]}
        />

        <DocTip>
          Credenciais com falha de autenticação são automaticamente marcadas como inválidas e
          os agendamentos vinculados são pausados. Você receberá uma notificação para atualizar
          os dados de acesso.
        </DocTip>
      </DocSection>

      {/* ─── TRIBUNAIS ─────────────────────────────────────────────── */}
      <DocSection title="Tribunais Monitorados">
        <p className="text-muted-foreground mb-4">
          Selecione quais tribunais o sistema deve monitorar. Apenas tribunais habilitados serão
          incluídos nos agendamentos de captura.
        </p>

        <DocSteps
          steps={[
            {
              titulo: 'Acesse a aba "Tribunais"',
              descricao: 'Dentro de Captura > Configurações, selecione a aba Tribunais.',
            },
            {
              titulo: 'Ative os tribunais desejados',
              descricao:
                'Use o toggle ao lado de cada tribunal para habilitar ou desabilitar o monitoramento.',
            },
            {
              titulo: 'Configure parâmetros específicos (opcional)',
              descricao:
                'Alguns tribunais permitem ajustar o intervalo de requisições para respeitar limites de acesso.',
            },
            {
              titulo: 'Salve as alterações',
              descricao:
                'Os agendamentos existentes serão atualizados para refletir os tribunais habilitados.',
            },
          ]}
        />

        <div className="mt-4">
          <DocFieldTable
            fields={[
              {
                campo: 'Tribunal',
                tipo: 'Texto',
                obrigatorio: false,
                descricao: 'Nome e sigla do tribunal, ex: "TRT-2 — Tribunal Regional do Trabalho da 2ª Região".',
              },
              {
                campo: 'Sistema',
                tipo: 'Texto',
                obrigatorio: false,
                descricao: 'Portal utilizado: PJe, e-SAJ, Projudi, etc.',
              },
              {
                campo: 'Habilitado',
                tipo: 'Booleano',
                obrigatorio: false,
                descricao: 'Indica se o tribunal está ativo para capturas.',
              },
              {
                campo: 'Intervalo Mínimo',
                tipo: 'Número',
                obrigatorio: false,
                descricao: 'Intervalo mínimo em segundos entre requisições ao tribunal (rate limit).',
              },
            ]}
          />
        </div>

        <DocActionList
          actions={[
            {
              icon: Building2,
              nome: 'Habilitar Tribunal',
              descricao: 'Ativa o monitoramento de um tribunal específico.',
            },
            {
              icon: XCircle,
              nome: 'Desabilitar Tribunal',
              descricao: 'Pausa o monitoramento de um tribunal sem afetar as credenciais.',
            },
            {
              icon: CheckCircle,
              nome: 'Verificar Disponibilidade',
              descricao: 'Testa a conectividade com o portal do tribunal.',
            },
          ]}
        />

        <DocTip>
          TRTs disponíveis: TRT-1 ao TRT-24. Novos tribunais são adicionados conforme
          integrações são desenvolvidas. Consulte o suporte para verificar a disponibilidade
          de um tribunal específico.
        </DocTip>
      </DocSection>
    </div>
  );
}
