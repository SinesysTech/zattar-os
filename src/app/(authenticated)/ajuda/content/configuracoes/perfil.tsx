'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
} from '../../components/doc-components';
import {
  User,
  KeyRound,
  Camera,
  ShieldCheck,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function Perfil() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seus dados pessoais, atualize sua foto de perfil, altere sua senha e configure
          a segurança da sua conta.
        </p>
      </div>

      <DocSection title="Editando Dados Pessoais">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse seu Perfil',
              descricao:
                'Clique no seu avatar no canto superior direito da tela e selecione "Perfil".',
            },
            {
              titulo: 'Edite os campos desejados',
              descricao:
                'Atualize nome, telefone, cargo ou qualquer outro dado pessoal.',
            },
            {
              titulo: 'Salve as alterações',
              descricao: 'Clique em "Salvar" para confirmar as mudanças.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos do Perfil">
        <DocFieldTable
          fields={[
            {
              campo: 'Nome Completo',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'Seu nome como aparecerá em todo o sistema e nos documentos.',
            },
            {
              campo: 'E-mail',
              tipo: 'E-mail',
              obrigatorio: true,
              descricao:
                'Endereço de e-mail usado para login. A alteração exige confirmação no e-mail atual.',
            },
            {
              campo: 'Telefone',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Número de contato pessoal ou comercial.',
            },
            {
              campo: 'Cargo',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Sua função no escritório. Exibida no perfil e nos relatórios.',
            },
            {
              campo: 'Número OAB',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Inscrição OAB, caso seja advogado.',
            },
            {
              campo: 'Bio / Apresentação',
              tipo: 'Texto longo',
              obrigatorio: false,
              descricao: 'Texto curto de apresentação exibido no seu perfil público interno.',
            },
            {
              campo: 'Fuso Horário',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Define o fuso horário para exibição de datas e horários no sistema.',
            },
            {
              campo: 'Idioma',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Idioma da interface do sistema (atualmente Português - Brasil).',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Foto de Perfil (Avatar)">
        <p className="text-muted-foreground mb-4">
          Personalize seu avatar para facilitar a identificação em comentários, atribuições e
          menções dentro do sistema.
        </p>
        <DocSteps
          steps={[
            {
              titulo: 'Clique na foto de perfil',
              descricao: 'Na página de perfil, clique sobre o avatar atual.',
            },
            {
              titulo: 'Selecione a imagem',
              descricao:
                'Escolha um arquivo JPG, PNG ou WEBP de até 5 MB.',
            },
            {
              titulo: 'Ajuste o enquadramento',
              descricao:
                'Use o editor para recortar e centralizar o rosto na imagem.',
            },
            {
              titulo: 'Salve',
              descricao: 'O avatar é atualizado imediatamente em todo o sistema.',
            },
          ]}
        />
        <DocActionList
          actions={[
            {
              icon: Camera,
              nome: 'Fazer Upload',
              descricao: 'Envia uma nova foto do computador ou celular.',
            },
            {
              icon: User,
              nome: 'Remover Foto',
              descricao: 'Remove o avatar personalizado e exibe as iniciais do nome.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Alterando a Senha">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse a aba "Segurança"',
              descricao: 'Na página de perfil, clique na aba "Segurança".',
            },
            {
              titulo: 'Informe a senha atual',
              descricao: 'Digite sua senha atual para confirmar a identidade.',
            },
            {
              titulo: 'Defina a nova senha',
              descricao:
                'A nova senha deve ter no mínimo 8 caracteres, com letras maiúsculas, minúsculas, números e símbolos.',
            },
            {
              titulo: 'Confirme e salve',
              descricao: 'Digite a nova senha novamente para confirmação e clique em "Alterar Senha".',
            },
          ]}
        />
        <DocActionList
          actions={[
            {
              icon: Eye,
              nome: 'Mostrar Senha',
              descricao: 'Exibe os caracteres da senha durante o preenchimento.',
            },
            {
              icon: EyeOff,
              nome: 'Ocultar Senha',
              descricao: 'Mascara os caracteres da senha.',
            },
            {
              icon: KeyRound,
              nome: 'Alterar Senha',
              descricao: 'Confirma e aplica a nova senha à sua conta.',
            },
          ]}
        />
        <DocTip>
          Após alterar a senha, todas as sessões ativas em outros dispositivos serão encerradas
          por segurança. Você continuará logado apenas no dispositivo atual.
        </DocTip>
      </DocSection>

      <DocSection title="Autenticação em Dois Fatores (2FA)">
        <p className="text-muted-foreground mb-4">
          Ative o 2FA para adicionar uma camada extra de segurança à sua conta. Com o 2FA
          habilitado, além da senha você precisará de um código gerado pelo aplicativo
          autenticador a cada login.
        </p>
        <DocSteps
          steps={[
            {
              titulo: 'Acesse a aba "Segurança"',
              descricao: 'Na página de perfil, clique na aba "Segurança".',
            },
            {
              titulo: 'Clique em "Ativar 2FA"',
              descricao: 'O sistema exibirá um QR Code para configuração.',
            },
            {
              titulo: 'Escaneie o QR Code',
              descricao:
                'Use um aplicativo autenticador (Google Authenticator, Authy) para escanear o código.',
            },
            {
              titulo: 'Confirme com o código gerado',
              descricao:
                'Digite o código de 6 dígitos exibido no aplicativo para confirmar a configuração.',
            },
          ]}
        />
        <DocActionList
          actions={[
            {
              icon: ShieldCheck,
              nome: 'Ativar 2FA',
              descricao: 'Habilita a autenticação em dois fatores na conta.',
            },
            {
              icon: Save,
              nome: 'Salvar Códigos de Recuperação',
              descricao:
                'Baixe e guarde os códigos de recuperação para acesso emergencial caso perca o autenticador.',
            },
          ]}
        />
      </DocSection>
    </div>
  );
}
