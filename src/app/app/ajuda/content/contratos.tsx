'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
  type FieldDef,
  type ActionDef,
  type StepDef,
} from '../components/doc-components';
import {
  Plus,
  Pencil,
  Eye,
  Search,
  Download,
  Trash2,
  FileSignature,
  DollarSign,
} from 'lucide-react';

const fields: FieldDef[] = [
  {
    campo: 'Número do Contrato',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Identificador único do contrato. Pode ser gerado automaticamente pelo sistema ou informado manualmente.',
  },
  {
    campo: 'Cliente',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Cliente vinculado ao contrato. Busca na base de clientes cadastrados.',
  },
  {
    campo: 'Processo Vinculado',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Processo judicial ao qual o contrato está relacionado. Um contrato pode existir sem processo vinculado (ex: consultoria).',
  },
  {
    campo: 'Tipo de Contrato',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Classifica o contrato: Honorários de Êxito, Honorários Fixos, Consultoria, Retainer, Outro.',
  },
  {
    campo: 'Valor Total',
    tipo: 'Monetário',
    obrigatorio: true,
    descricao: 'Valor total acordado no contrato em reais.',
  },
  {
    campo: 'Número de Parcelas',
    tipo: 'Número',
    obrigatorio: false,
    descricao: 'Quantidade de parcelas em que o valor total será dividido. Informe 1 para pagamento único.',
  },
  {
    campo: 'Valor da Parcela',
    tipo: 'Monetário',
    obrigatorio: false,
    descricao: 'Calculado automaticamente com base no valor total e no número de parcelas.',
  },
  {
    campo: 'Data de Início',
    tipo: 'Data',
    obrigatorio: true,
    descricao: 'Data de início da vigência do contrato.',
  },
  {
    campo: 'Data de Término',
    tipo: 'Data',
    obrigatorio: false,
    descricao: 'Data de encerramento do contrato. Opcional para contratos com prazo indeterminado.',
  },
  {
    campo: 'Status',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Situação atual do contrato: Ativo, Encerrado, Suspenso, Cancelado.',
  },
  {
    campo: 'Descrição / Objeto',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Descrição do escopo de serviços contratados.',
  },
  {
    campo: 'Observações',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Notas internas sobre o contrato, condições especiais ou acordos complementares.',
  },
];

const actions: ActionDef[] = [
  {
    icon: Plus,
    nome: 'Criar Contrato',
    descricao: 'Abre o assistente de criação de contrato passo a passo.',
  },
  {
    icon: Pencil,
    nome: 'Editar',
    descricao: 'Permite alterar dados do contrato, como valor, parcelas ou datas de vigência.',
  },
  {
    icon: Eye,
    nome: 'Visualizar Detalhes',
    descricao: 'Exibe a ficha completa do contrato com parcelas, histórico de pagamentos e documentos anexados.',
  },
  {
    icon: DollarSign,
    nome: 'Registrar Pagamento',
    descricao: 'Marca uma ou mais parcelas como pagas, registrando a data e o valor recebido.',
  },
  {
    icon: FileSignature,
    nome: 'Assinar Digitalmente',
    descricao: 'Envia o contrato para assinatura digital pelo cliente através do módulo de Assinatura Digital.',
  },
  {
    icon: Search,
    nome: 'Buscar / Filtrar',
    descricao: 'Localiza contratos por número, cliente, status ou período.',
  },
  {
    icon: Download,
    nome: 'Exportar',
    descricao: 'Exporta a lista de contratos em CSV/XLSX.',
  },
  {
    icon: Trash2,
    nome: 'Excluir',
    descricao: 'Remove o contrato. Contratos com pagamentos registrados não podem ser excluídos — apenas cancelados.',
  },
];

const creationSteps: StepDef[] = [
  {
    titulo: 'Selecionar o Cliente',
    descricao: 'Busque o cliente pelo nome ou CPF/CNPJ. Se o cliente não estiver cadastrado, acesse o módulo de Clientes para incluí-lo antes de criar o contrato.',
  },
  {
    titulo: 'Definir o Tipo e Objeto',
    descricao: 'Escolha o tipo de contrato (honorários fixos, êxito, consultoria etc.) e descreva os serviços que serão prestados no campo Descrição / Objeto.',
  },
  {
    titulo: 'Informar Valores e Parcelas',
    descricao: 'Digite o valor total do contrato e defina o número de parcelas. O sistema calcula automaticamente o valor de cada parcela e gera as datas de vencimento.',
  },
  {
    titulo: 'Definir Datas de Vigência',
    descricao: 'Informe a data de início e, quando aplicável, a data de término do contrato.',
  },
  {
    titulo: 'Vincular a um Processo (opcional)',
    descricao: 'Se o contrato for referente a um processo judicial em andamento, vincule-o nesta etapa para facilitar o acompanhamento conjunto.',
  },
  {
    titulo: 'Salvar e Enviar para Assinatura',
    descricao: 'Salve o contrato e, se desejado, envie-o para assinatura digital pelo cliente diretamente do módulo de Assinatura Digital.',
  },
];

export default function ContratosDoc() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Contratos</h1>
        <p className="text-muted-foreground text-lg">
          Gestão de contratos de honorários e serviços firmados com os clientes do escritório.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Contratos permite registrar e acompanhar os acordos de prestação de serviços
          jurídicos firmados com os clientes. É possível controlar parcelas, registrar pagamentos
          e enviar contratos para assinatura digital, tudo em um único lugar.
        </p>
        <DocTip>
          Contratos vinculados a processos são exibidos automaticamente na ficha do processo,
          permitindo que qualquer membro da equipe visualize as condições financeiras do caso sem
          precisar acessar o módulo financeiro separadamente.
        </DocTip>
      </DocSection>

      <DocSection title="Campos do Contrato">
        <DocFieldTable fields={fields} />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList actions={actions} />
      </DocSection>

      <DocSection title="Criando um Novo Contrato">
        <DocSteps steps={creationSteps} />
      </DocSection>

      <DocSection title="Controle de Parcelas">
        <p className="text-muted-foreground">
          Após criar o contrato, o sistema gera automaticamente as parcelas com as datas de vencimento.
          Na tela de detalhes do contrato, cada parcela é exibida com seu status:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mt-2">
          <li><strong>Pendente:</strong> parcela ainda não venceu e não foi paga.</li>
          <li><strong>Paga:</strong> pagamento confirmado e registrado.</li>
          <li><strong>Vencida:</strong> data de vencimento ultrapassada sem pagamento registrado.</li>
        </ul>
        <DocTip>
          O Dashboard Financeiro exibe um resumo das parcelas vencidas e a vencer nos próximos dias,
          facilitando o acompanhamento da inadimplência sem precisar acessar cada contrato individualmente.
        </DocTip>
      </DocSection>
    </div>
  );
}
