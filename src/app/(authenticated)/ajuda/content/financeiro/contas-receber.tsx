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
  Link,
  Filter,
  Download,
  Pencil,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export default function ContasReceber() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Contas a Receber</h1>
        <p className="text-muted-foreground mt-2">
          Registre receitas, vincule a contratos e honorários, acompanhe recebimentos e gere
          relatórios de inadimplência para manter o fluxo de caixa do escritório saudável.
        </p>
      </div>

      <DocSection title="Registrando uma Receita">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse Contas a Receber',
              descricao: 'No menu lateral, vá em Financeiro > Contas a Receber.',
            },
            {
              titulo: 'Clique em "Nova Receita"',
              descricao: 'O botão fica no canto superior direito da tela.',
            },
            {
              titulo: 'Preencha os dados da receita',
              descricao:
                'Informe a descrição, valor, data de vencimento, cliente e categoria do plano de contas.',
            },
            {
              titulo: 'Vincule a um contrato ou processo (opcional)',
              descricao:
                'Se a receita for originada de honorários, vincule ao processo ou contrato correspondente.',
            },
            {
              titulo: 'Salve o lançamento',
              descricao:
                'A receita ficará com status "Em aberto" até o recebimento ser registrado.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos da Receita">
        <DocFieldTable
          fields={[
            {
              campo: 'Descrição',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'Identificação da receita, ex: "Honorários — Processo nº 1234".',
            },
            {
              campo: 'Valor',
              tipo: 'Monetário',
              obrigatorio: true,
              descricao: 'Valor total a receber em reais.',
            },
            {
              campo: 'Data de Vencimento',
              tipo: 'Data',
              obrigatorio: true,
              descricao: 'Data prevista para recebimento.',
            },
            {
              campo: 'Data de Competência',
              tipo: 'Data',
              obrigatorio: false,
              descricao: 'Mês/ano a que a receita se refere (regime de competência).',
            },
            {
              campo: 'Cliente',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Parte ou cliente responsável pelo pagamento.',
            },
            {
              campo: 'Categoria (Plano de Contas)',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Categoria contábil vinculada ao plano de contas do escritório.',
            },
            {
              campo: 'Processo / Contrato',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Vínculo com um processo ou contrato cadastrado no sistema.',
            },
            {
              campo: 'Conta Bancária',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Conta onde o valor será recebido.',
            },
            {
              campo: 'Recorrência',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Define se a receita se repete: mensal, trimestral, anual ou única.',
            },
            {
              campo: 'Número do Documento',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Número da NF ou recibo emitido.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Marcando como Recebida">
        <DocSteps
          steps={[
            {
              titulo: 'Localize a receita na lista',
              descricao: 'Use os filtros de período, status ou cliente.',
            },
            {
              titulo: 'Clique em "Registrar Recebimento"',
              descricao: 'O botão aparece na linha da receita ou dentro do detalhe do lançamento.',
            },
            {
              titulo: 'Informe a data e o valor recebido',
              descricao:
                'Confirme a data do recebimento e o valor efetivamente recebido.',
            },
            {
              titulo: 'Confirme',
              descricao:
                'O status muda para "Recebido" e o valor é creditado ao saldo da conta bancária selecionada.',
            },
          ]}
        />
        <DocTip>
          Recebimentos parciais são suportados. O sistema cria um registro de recebimento parcial
          e mantém o saldo remanescente em aberto para controle de inadimplência.
        </DocTip>
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Plus,
              nome: 'Nova Receita',
              descricao: 'Registra um novo título a receber.',
            },
            {
              icon: CheckCircle,
              nome: 'Registrar Recebimento',
              descricao: 'Marca o título como recebido e registra a data e conta de crédito.',
            },
            {
              icon: Link,
              nome: 'Vincular a Processo',
              descricao: 'Associa a receita a um processo ou contrato cadastrado.',
            },
            {
              icon: AlertTriangle,
              nome: 'Inadimplentes',
              descricao: 'Filtro rápido para clientes com títulos vencidos e não recebidos.',
            },
            {
              icon: FileText,
              nome: 'Relatório de Inadimplência',
              descricao: 'Gera relatório detalhado com todos os títulos em atraso por cliente.',
            },
            {
              icon: Pencil,
              nome: 'Editar',
              descricao: 'Altera dados de uma receita ainda não recebida.',
            },
            {
              icon: Filter,
              nome: 'Filtrar',
              descricao: 'Filtra por período, status, cliente ou categoria.',
            },
            {
              icon: Download,
              nome: 'Exportar',
              descricao: 'Exporta a lista filtrada em PDF ou planilha XLSX.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Relatório de Inadimplência">
        <p className="text-muted-foreground mb-4">
          O relatório de inadimplência consolida todos os títulos vencidos e não recebidos. Ele
          exibe:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Nome do cliente</li>
          <li>Valor original e valor atualizado (se configurado)</li>
          <li>Dias de atraso</li>
          <li>Processo ou contrato vinculado</li>
          <li>Histórico de contatos realizados</li>
        </ul>
        <DocTip>
          O sistema envia notificações automáticas por e-mail para clientes com títulos vencidos,
          caso a integração de e-mail esteja configurada nas Configurações do sistema.
        </DocTip>
      </DocSection>

      <DocSection title="Vinculação com Contratos">
        <p className="text-muted-foreground">
          Ao vincular uma receita a um processo ou contrato, o sistema registra automaticamente
          o histórico financeiro daquele processo. Isso permite visualizar, na tela do processo,
          todos os honorários cobrados, recebidos e em aberto sem precisar acessar o módulo
          financeiro separadamente.
        </p>
      </DocSection>
    </div>
  );
}
