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
  Pencil,
  Trash2,
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

export default function Salarios() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Salários</h1>
        <p className="text-muted-foreground mt-2">
          Registre e gerencie os salários de cada colaborador, configure componentes salariais
          como remuneração base, bonificações e descontos, e acompanhe o custo total de pessoal.
        </p>
      </div>

      <DocSection title="Registrando o Salário de um Colaborador">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse RH > Salários',
              descricao: 'No menu lateral, vá em RH > Salários.',
            },
            {
              titulo: 'Selecione o colaborador',
              descricao:
                'Localize o membro da equipe na listagem ou use a busca por nome.',
            },
            {
              titulo: 'Clique em "Configurar Salário"',
              descricao:
                'O botão abre o formulário de composição salarial do colaborador.',
            },
            {
              titulo: 'Preencha os componentes salariais',
              descricao:
                'Informe o salário base e adicione os componentes variáveis (bonificações, adicionais e descontos).',
            },
            {
              titulo: 'Defina a data de vigência',
              descricao:
                'Informe a partir de quando a composição salarial entrará em vigor.',
            },
            {
              titulo: 'Salve',
              descricao:
                'O histórico de alterações salariais é mantido para fins de auditoria e relatórios.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos da Composição Salarial">
        <DocFieldTable
          fields={[
            {
              campo: 'Colaborador',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Membro da equipe ao qual a composição salarial será aplicada.',
            },
            {
              campo: 'Salário Base',
              tipo: 'Monetário',
              obrigatorio: true,
              descricao: 'Remuneração fixa mensal bruta do colaborador.',
            },
            {
              campo: 'Data de Vigência',
              tipo: 'Data',
              obrigatorio: true,
              descricao: 'Data a partir da qual os valores entram em vigor.',
            },
            {
              campo: 'Motivo de Alteração',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Justificativa para criação ou alteração da composição, ex: "Promoção".',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Componentes Salariais">
        <p className="text-muted-foreground mb-4">
          Além do salário base, é possível adicionar componentes variáveis:
        </p>
        <DocFieldTable
          fields={[
            {
              campo: 'Nome do Componente',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'Identificação do componente, ex: "Vale Refeição", "INSS", "IR Retido".',
            },
            {
              campo: 'Tipo',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Adicional (soma ao salário base) ou Desconto (subtrai do salário base).',
            },
            {
              campo: 'Forma de Cálculo',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Valor fixo em reais ou percentual sobre o salário base.',
            },
            {
              campo: 'Valor / Percentual',
              tipo: 'Monetário / Percentual',
              obrigatorio: true,
              descricao: 'Valor do componente ou percentual a ser aplicado.',
            },
            {
              campo: 'Incide na Folha',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao:
                'Se marcado, o componente é incluído automaticamente na geração da folha de pagamento.',
            },
          ]}
        />
        <DocTip>
          Crie componentes padrão para encargos recorrentes (INSS, FGTS, IR) e ative a opção
          "Incide na Folha" para que sejam incluídos automaticamente na geração mensal.
        </DocTip>
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Plus,
              nome: 'Configurar Salário',
              descricao: 'Define ou atualiza a composição salarial de um colaborador.',
            },
            {
              icon: TrendingUp,
              nome: 'Histórico Salarial',
              descricao:
                'Exibe todas as composições salariais anteriores do colaborador com datas de vigência.',
            },
            {
              icon: Pencil,
              nome: 'Editar Componente',
              descricao: 'Altera um componente salarial da composição vigente.',
            },
            {
              icon: Plus,
              nome: 'Adicionar Componente',
              descricao: 'Inclui um novo adicional ou desconto na composição do colaborador.',
            },
            {
              icon: Trash2,
              nome: 'Remover Componente',
              descricao: 'Exclui um componente da composição salarial vigente.',
            },
            {
              icon: BarChart3,
              nome: 'Relatório de Custos',
              descricao:
                'Gera o relatório de custo total de pessoal consolidado por equipe ou período.',
            },
            {
              icon: DollarSign,
              nome: 'Simular Reajuste',
              descricao:
                'Calcula o impacto de um reajuste percentual aplicado a toda a equipe ou a um grupo.',
            },
            {
              icon: Download,
              nome: 'Exportar',
              descricao: 'Exporta a planilha de salários e componentes em formato XLSX.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Relatório de Custo de Pessoal">
        <p className="text-muted-foreground mb-4">
          O relatório de custo de pessoal consolida, por período selecionado:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Custo total da folha (salários brutos)</li>
          <li>Total de encargos patronais (FGTS, INSS patronal)</li>
          <li>Total de benefícios (VR, VT, plano de saúde)</li>
          <li>Custo médio por colaborador</li>
          <li>Evolução mensal do custo de pessoal</li>
          <li>Percentual do custo de pessoal sobre a receita total</li>
        </ul>
        <DocTip>
          O custo de pessoal é automaticamente vinculado às categorias do plano de contas,
          sendo refletido no DRE sem necessidade de lançamentos manuais adicionais.
        </DocTip>
      </DocSection>
    </div>
  );
}
