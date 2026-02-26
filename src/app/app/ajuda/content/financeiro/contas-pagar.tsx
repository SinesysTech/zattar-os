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
  CheckCircle,
  Filter,
  Download,
  Pencil,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function ContasPagar() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Contas a Pagar</h1>
        <p className="text-muted-foreground mt-2">
          Registre e controle todas as despesas do escritório, categorize por plano de contas,
          acompanhe vencimentos e marque pagamentos realizados.
        </p>
      </div>

      <DocSection title="Registrando uma Despesa">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse Contas a Pagar',
              descricao: 'No menu lateral, vá em Financeiro > Contas a Pagar.',
            },
            {
              titulo: 'Clique em "Nova Despesa"',
              descricao: 'O botão fica no canto superior direito da tela.',
            },
            {
              titulo: 'Preencha os dados da despesa',
              descricao:
                'Informe a descrição, valor, data de vencimento, categoria do plano de contas e fornecedor.',
            },
            {
              titulo: 'Salve o lançamento',
              descricao:
                'A despesa será listada com status "Em aberto" até que o pagamento seja registrado.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos da Despesa">
        <DocFieldTable
          fields={[
            {
              campo: 'Descrição',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'Identificação da despesa, ex: "Aluguel do escritório".',
            },
            {
              campo: 'Valor',
              tipo: 'Monetário',
              obrigatorio: true,
              descricao: 'Valor total da despesa em reais.',
            },
            {
              campo: 'Data de Vencimento',
              tipo: 'Data',
              obrigatorio: true,
              descricao: 'Data limite para pagamento sem acréscimos.',
            },
            {
              campo: 'Data de Competência',
              tipo: 'Data',
              obrigatorio: false,
              descricao: 'Mês/ano a que a despesa se refere (regime de competência).',
            },
            {
              campo: 'Categoria (Plano de Contas)',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Categoria contábil vinculada ao plano de contas do escritório.',
            },
            {
              campo: 'Fornecedor',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Pessoa física ou jurídica a quem o pagamento será efetuado.',
            },
            {
              campo: 'Conta Bancária',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Conta de onde o pagamento será debitado.',
            },
            {
              campo: 'Recorrência',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Define se a despesa se repete: mensal, trimestral, anual ou única.',
            },
            {
              campo: 'Número do Documento',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Número da NF, boleto ou outro documento de referência.',
            },
            {
              campo: 'Observações',
              tipo: 'Texto longo',
              obrigatorio: false,
              descricao: 'Informações adicionais sobre a despesa.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Marcando como Paga">
        <p className="text-muted-foreground mb-4">
          Após efetuar o pagamento, registre-o no sistema para manter o controle atualizado:
        </p>
        <DocSteps
          steps={[
            {
              titulo: 'Localize a despesa na lista',
              descricao: 'Use os filtros de período, status ou categoria para encontrar o lançamento.',
            },
            {
              titulo: 'Clique em "Registrar Pagamento"',
              descricao: 'O botão aparece na linha da despesa ou dentro do detalhe do lançamento.',
            },
            {
              titulo: 'Informe a data e o valor pago',
              descricao:
                'Confirme a data do pagamento e o valor efetivamente pago (pode diferir do previsto).',
            },
            {
              titulo: 'Confirme',
              descricao:
                'O status da despesa muda para "Pago" e o valor é baixado do saldo da conta bancária selecionada.',
            },
          ]}
        />
        <DocTip>
          Ao registrar o pagamento com valor diferente do previsto, o sistema cria uma linha de
          ajuste automática para manter a conciliação bancária correta.
        </DocTip>
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Plus,
              nome: 'Nova Despesa',
              descricao: 'Registra uma nova conta a pagar.',
            },
            {
              icon: CheckCircle,
              nome: 'Registrar Pagamento',
              descricao: 'Marca a despesa como paga e registra a data e conta de débito.',
            },
            {
              icon: Pencil,
              nome: 'Editar',
              descricao: 'Altera os dados de uma despesa ainda não paga.',
            },
            {
              icon: RefreshCw,
              nome: 'Lançamento Recorrente',
              descricao: 'Gera automaticamente cópias da despesa para os próximos períodos.',
            },
            {
              icon: AlertTriangle,
              nome: 'Despesas Vencidas',
              descricao: 'Filtro rápido para visualizar apenas lançamentos com vencimento no passado.',
            },
            {
              icon: Filter,
              nome: 'Filtrar',
              descricao: 'Filtra por período, categoria, status (pago/em aberto/vencido) ou fornecedor.',
            },
            {
              icon: Download,
              nome: 'Exportar',
              descricao: 'Exporta a lista filtrada para PDF ou planilha XLSX.',
            },
            {
              icon: Trash2,
              nome: 'Excluir',
              descricao: 'Remove uma despesa em aberto. Despesas pagas não podem ser excluídas.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Filtragem e Pesquisa">
        <p className="text-muted-foreground">
          A listagem de contas a pagar oferece os seguintes filtros combinados:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Período de vencimento ou competência</li>
          <li>Status: Em aberto, Pago, Vencido</li>
          <li>Categoria do plano de contas</li>
          <li>Fornecedor</li>
          <li>Conta bancária</li>
          <li>Busca por texto na descrição ou número do documento</li>
        </ul>
        <DocTip>
          Use o filtro &quot;Vencido&quot; combinado com o filtro de categoria para identificar quais tipos
          de despesa geram mais atrasos e priorize seu pagamento.
        </DocTip>
      </DocSection>

      <DocSection title="Despesas Recorrentes">
        <p className="text-muted-foreground">
          Para despesas fixas como aluguel, assinaturas e folha de pagamento, ative a opção de
          recorrência ao criar o lançamento. O sistema gera automaticamente os lançamentos dos
          próximos meses com base na frequência configurada, eliminando a necessidade de registro
          manual repetido.
        </p>
      </DocSection>
    </div>
  );
}
