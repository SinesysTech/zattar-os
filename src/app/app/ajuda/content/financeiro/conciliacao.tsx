'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
} from '../../components/doc-components';
import {
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Link,
  RefreshCw,
  Download,
  Eye,
} from 'lucide-react';

export default function Conciliacao() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Conciliação Bancária</h1>
        <p className="text-muted-foreground mt-2">
          A conciliação bancária compara os lançamentos registrados no sistema com as transações
          reais do extrato bancário, garantindo que os saldos financeiros estejam sempre corretos
          e sem divergências.
        </p>
      </div>

      <DocSection title="Importando o Extrato Bancário">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse Conciliação Bancária',
              descricao: 'No menu lateral, vá em Financeiro > Conciliação Bancária.',
            },
            {
              titulo: 'Selecione a conta bancária',
              descricao:
                'Escolha a conta bancária que será conciliada. Cada conta é conciliada separadamente.',
            },
            {
              titulo: 'Importe o extrato',
              descricao:
                'Clique em "Importar Extrato" e faça o upload do arquivo OFX ou CSV exportado do seu banco.',
            },
            {
              titulo: 'Confirme o período',
              descricao:
                'O sistema detecta automaticamente o período do extrato. Confirme se está correto antes de prosseguir.',
            },
            {
              titulo: 'Inicie a conciliação',
              descricao:
                'O sistema cruza automaticamente os lançamentos do extrato com os registros do sistema.',
            },
          ]}
        />
        <DocTip>
          O formato OFX é o mais compatível e garante maior precisão na conciliação automática.
          Consulte o seu banco para saber como exportar o extrato nesse formato.
        </DocTip>
      </DocSection>

      <DocSection title="Formatos de Extrato Aceitos">
        <DocFieldTable
          fields={[
            {
              campo: 'OFX',
              tipo: 'Arquivo',
              obrigatorio: false,
              descricao:
                'Formato padrão bancário (Open Financial Exchange). Recomendado para maior precisão.',
            },
            {
              campo: 'CSV',
              tipo: 'Arquivo',
              obrigatorio: false,
              descricao:
                'Planilha separada por vírgulas. Requer mapeamento de colunas na primeira importação.',
            },
            {
              campo: 'XLSX',
              tipo: 'Arquivo',
              obrigatorio: false,
              descricao: 'Planilha Excel. Mesmo processo de mapeamento de colunas do CSV.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Status de Conciliação">
        <p className="text-muted-foreground mb-4">
          Após a importação, cada linha do extrato recebe um dos seguintes status:
        </p>
        <DocActionList
          actions={[
            {
              icon: CheckCircle,
              nome: 'Conciliado',
              descricao:
                'A transação do extrato foi associada a um lançamento do sistema com valor e data correspondentes.',
            },
            {
              icon: AlertTriangle,
              nome: 'Pendente de Revisão',
              descricao:
                'O sistema encontrou um lançamento próximo mas com divergência de valor ou data. Requer confirmação manual.',
            },
            {
              icon: XCircle,
              nome: 'Não Encontrado',
              descricao:
                'A transação do extrato não possui lançamento correspondente no sistema. Deve ser criado manualmente.',
            },
            {
              icon: Eye,
              nome: 'Ignorado',
              descricao:
                'A transação foi marcada como irrelevante (ex: transferências entre contas próprias).',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Resolvendo Divergências">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse os itens pendentes',
              descricao:
                'Filtre a lista por status "Pendente de Revisão" ou "Não Encontrado".',
            },
            {
              titulo: 'Analise cada transação',
              descricao:
                'Clique na transação para visualizar os detalhes e os lançamentos sugeridos pelo sistema.',
            },
            {
              titulo: 'Associe manualmente ou crie novo lançamento',
              descricao:
                'Vincule a um lançamento existente ou clique em "Criar Lançamento" para registrar a transação diretamente.',
            },
            {
              titulo: 'Confirme a conciliação',
              descricao:
                'Após resolver todas as pendências, confirme a conciliação do período para bloquear alterações.',
            },
          ]}
        />
        <DocTip>
          Conciliações confirmadas ficam bloqueadas para edição. Caso precise corrigir um período
          já conciliado, utilize a função "Reabrir Conciliação" disponível para usuários administradores.
        </DocTip>
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Upload,
              nome: 'Importar Extrato',
              descricao: 'Faz o upload de um arquivo OFX, CSV ou XLSX do extrato bancário.',
            },
            {
              icon: Link,
              nome: 'Associar Manualmente',
              descricao: 'Vincula uma transação do extrato a um lançamento existente no sistema.',
            },
            {
              icon: CheckCircle,
              nome: 'Confirmar Conciliação',
              descricao: 'Finaliza a conciliação do período e bloqueia edições.',
            },
            {
              icon: RefreshCw,
              nome: 'Reabrir Conciliação',
              descricao: 'Desfaz a confirmação do período para permitir correções.',
            },
            {
              icon: Download,
              nome: 'Exportar Relatório',
              descricao: 'Exporta o relatório de conciliação com todas as transações e status.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Saldo Final e Relatório">
        <p className="text-muted-foreground">
          Após a conciliação, o sistema apresenta um resumo comparando o saldo inicial, as
          entradas, as saídas e o saldo final do extrato bancário com os valores registrados no
          sistema. Qualquer diferença remanescente é destacada em vermelho para facilitar a
          identificação e correção.
        </p>
      </DocSection>
    </div>
  );
}
