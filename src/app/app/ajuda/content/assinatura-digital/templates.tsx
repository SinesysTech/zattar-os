'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
} from '../../components/doc-components';
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  Type,
  CheckSquare,
  AlignLeft,
  Hash,
  Calendar,
  Pen,
} from 'lucide-react';

export default function AssinaturaDigitalTemplatesDoc() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading mb-2">
          Assinatura Digital — Templates
        </h1>
        <p className="text-muted-foreground text-lg">
          Crie modelos reutilizáveis de documentos para assinatura digital, com campos de preenchimento posicionados e configurados para cada uso.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          Templates são modelos de documentos que podem ser reutilizados repetidamente para gerar
          novos documentos para assinatura. Em vez de fazer upload do mesmo PDF e reconfigurar os
          campos a cada vez, você cria o template uma vez com os campos posicionados e, nas próximas
          utilizações, apenas preenche os dados variáveis e adiciona os signatários. Ideal para
          contratos de prestação de serviços, procurações e termos de autorização recorrentes.
        </p>
        <DocTip>
          Templates bem configurados com campos de preenchimento reduzem o tempo de preparação
          de um documento para assinatura de minutos para segundos.
        </DocTip>
      </DocSection>

      <DocSection title="Criando um Template">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse Templates',
              descricao:
                'No menu lateral, navegue até Assinatura Digital > Templates.',
            },
            {
              titulo: 'Clique em "Novo Template"',
              descricao:
                'Informe o nome do template e uma descrição opcional.',
            },
            {
              titulo: 'Faça upload do PDF base',
              descricao:
                'Carregue o arquivo PDF que servirá como base do template. Este é o documento que será enviado para assinatura, com os campos configurados sobre ele.',
            },
            {
              titulo: 'Posicione os campos de assinatura',
              descricao:
                'No editor visual, arraste e posicione campos de assinatura, rubrica, data e outros nas páginas corretas do documento.',
            },
            {
              titulo: 'Adicione campos de preenchimento',
              descricao:
                'Insira campos de texto, data, CPF e outros que deverão ser preenchidos com dados variáveis antes de cada envio.',
            },
            {
              titulo: 'Configure os papéis dos signatários',
              descricao:
                'Defina quais papéis de signatários o template exige (ex: "Contratante", "Contratada", "Testemunha") para que sejam solicitados ao usar o template.',
            },
            {
              titulo: 'Salve o template',
              descricao:
                'Clique em "Salvar Template". Ele ficará disponível na galeria para uso imediato.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos do Template">
        <DocFieldTable
          fields={[
            {
              campo: 'Nome do Template',
              tipo: 'Texto',
              obrigatorio: true,
              descricao:
                'Identificação do template na galeria. Ex: "Contrato de Prestação de Serviços Jurídicos".',
            },
            {
              campo: 'Descrição',
              tipo: 'Texto',
              obrigatorio: false,
              descricao:
                'Explicação do propósito do template e quando utilizá-lo.',
            },
            {
              campo: 'Categoria',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao:
                'Organiza os templates por categoria: Contratos, Procurações, Termos, Laudos, Outros.',
            },
            {
              campo: 'PDF Base',
              tipo: 'Upload',
              obrigatorio: true,
              descricao:
                'Arquivo PDF com o conteúdo fixo do documento. Tamanho máximo de 50 MB.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Tipos de Campos de Preenchimento">
        <p className="text-muted-foreground mb-4">
          Ao configurar um template, você pode inserir diferentes tipos de campos sobre o PDF
          para coletar informações variáveis em cada uso.
        </p>
        <DocActionList
          actions={[
            {
              icon: Pen,
              nome: 'Assinatura',
              descricao:
                'Campo para a assinatura digital do signatário. Pode ser manuscrita via mouse/touch ou gerada a partir do nome.',
            },
            {
              icon: Pen,
              nome: 'Rubrica',
              descricao:
                'Campo menor, utilizado em páginas intermediárias do documento para confirmar a ciência do conteúdo.',
            },
            {
              icon: Calendar,
              nome: 'Data',
              descricao:
                'Preenchido automaticamente com a data em que o signatário assinar, ou pode ser um campo de data editável.',
            },
            {
              icon: Type,
              nome: 'Texto Livre',
              descricao:
                'Campo para inserção de texto variável antes do envio (ex: nome do cliente, valor do contrato, endereço).',
            },
            {
              icon: Hash,
              nome: 'CPF / CNPJ',
              descricao:
                'Campo formatado para número de documento, com validação automática do formato.',
            },
            {
              icon: CheckSquare,
              nome: 'Caixa de Seleção',
              descricao:
                'Checkbox para confirmação de ciência ou aceite de uma condição específica.',
            },
            {
              icon: AlignLeft,
              nome: 'Iniciais',
              descricao:
                'Campo para que o signatário insira suas iniciais, frequentemente usado em páginas de contratos longos.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Configurando Campos de Preenchimento">
        <p className="text-muted-foreground mb-4">
          Cada campo de preenchimento pode ser configurado com as seguintes opções:
        </p>
        <DocFieldTable
          fields={[
            {
              campo: 'Rótulo',
              tipo: 'Texto',
              obrigatorio: true,
              descricao:
                'Nome do campo exibido no formulário de preenchimento antes do envio. Ex: "Nome Completo do Cliente".',
            },
            {
              campo: 'Obrigatório',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao:
                'Define se o campo deve ser preenchido antes do envio. Campos obrigatórios bloqueiam o envio até serem preenchidos.',
            },
            {
              campo: 'Placeholder',
              tipo: 'Texto',
              obrigatorio: false,
              descricao:
                'Texto de exemplo exibido dentro do campo como orientação para o preenchimento.',
            },
            {
              campo: 'Vinculado a Signatário',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao:
                'Para campos de assinatura, rubrica e data: indica qual papel de signatário deve preencher aquele campo.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Gerenciando Templates">
        <DocActionList
          actions={[
            {
              icon: Edit,
              nome: 'Editar Template',
              descricao:
                'Modifica o nome, descrição, campos e posições de assinatura. Alterações não afetam documentos já enviados a partir do template.',
            },
            {
              icon: Copy,
              nome: 'Duplicar Template',
              descricao:
                'Cria uma cópia do template para usar como base de uma variação. O novo template é nomeado "Cópia de [nome]".',
            },
            {
              icon: Trash2,
              nome: 'Excluir Template',
              descricao:
                'Remove o template permanentemente. Documentos já gerados a partir dele não são afetados.',
            },
            {
              icon: Plus,
              nome: 'Usar Template',
              descricao:
                'Cria um novo documento para assinatura baseado no template, abrindo o formulário para preencher os campos variáveis e adicionar signatários.',
            },
          ]}
        />
        <DocTip>
          Mantenha os templates organizados por categoria. Use nomes descritivos que incluam
          a área do direito e o tipo de documento para facilitar a busca da equipe. Ex:
          &quot;Trabalhista — Acordo Extrajudicial de Rescisão&quot;.
        </DocTip>
      </DocSection>
    </div>
  );
}
