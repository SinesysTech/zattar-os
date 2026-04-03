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
  FolderTree,
  ArrowUpDown,
  Link,
  Eye,
} from 'lucide-react';

export default function PlanoContas() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Plano de Contas</h1>
        <p className="text-muted-foreground mt-2">
          O Plano de Contas organiza as categorias contábeis do escritório em uma estrutura
          hierárquica, permitindo a classificação precisa de receitas e despesas em todos os
          lançamentos financeiros.
        </p>
      </div>

      <DocSection title="Estrutura Hierárquica">
        <p className="text-muted-foreground mb-4">
          O plano de contas é organizado em até quatro níveis de hierarquia:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>
            <strong>Nível 1 — Grupo Principal:</strong> ex: Receitas Operacionais, Despesas
            Administrativas
          </li>
          <li>
            <strong>Nível 2 — Subgrupo:</strong> ex: Honorários Advocatícios, Custas Processuais
          </li>
          <li>
            <strong>Nível 3 — Conta:</strong> ex: Honorários de Êxito, Honorários de Êxito
            Trabalhista
          </li>
          <li>
            <strong>Nível 4 — Subconta:</strong> detalhamento adicional quando necessário
          </li>
        </ul>
        <DocTip>
          Somente as contas nos níveis mais específicos (folhas da árvore) podem receber
          lançamentos financeiros. As contas agregadoras exibem o total consolidado dos filhos.
        </DocTip>
      </DocSection>

      <DocSection title="Criando uma Categoria">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse o Plano de Contas',
              descricao: 'No menu lateral, vá em Financeiro > Plano de Contas.',
            },
            {
              titulo: 'Selecione o nível pai',
              descricao:
                'Clique na conta superior à qual a nova categoria será subordinada, ou selecione a raiz para criar um grupo principal.',
            },
            {
              titulo: 'Clique em "Nova Categoria"',
              descricao: 'O botão fica no topo da tela ou no menu de contexto da conta pai.',
            },
            {
              titulo: 'Preencha os dados',
              descricao: 'Informe o código, nome, tipo (receita ou despesa) e o nível hierárquico.',
            },
            {
              titulo: 'Salve',
              descricao: 'A nova categoria aparece na árvore na posição correta.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos da Categoria">
        <DocFieldTable
          fields={[
            {
              campo: 'Código',
              tipo: 'Texto',
              obrigatorio: true,
              descricao:
                'Código único da conta, geralmente numérico e hierárquico, ex: "3.1.2".',
            },
            {
              campo: 'Nome',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'Nome descritivo da categoria.',
            },
            {
              campo: 'Tipo',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Receita ou Despesa. Define como o valor afeta o resultado.',
            },
            {
              campo: 'Conta Pai',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao:
                'Categoria superior na hierarquia. Deixar em branco cria uma conta de nível 1.',
            },
            {
              campo: 'Aceita Lançamentos',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao:
                'Indica se a conta pode receber lançamentos diretos ou é apenas agregadora.',
            },
            {
              campo: 'Ativo',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao:
                'Contas inativas não aparecem nas seleções de lançamentos mas mantêm o histórico.',
            },
            {
              campo: 'Descrição',
              tipo: 'Texto longo',
              obrigatorio: false,
              descricao: 'Orientações de uso e exemplos de lançamentos para esta categoria.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Plus,
              nome: 'Nova Categoria',
              descricao: 'Cria uma nova conta no plano de contas.',
            },
            {
              icon: Pencil,
              nome: 'Editar',
              descricao: 'Altera o nome, código ou configurações de uma conta existente.',
            },
            {
              icon: FolderTree,
              nome: 'Mover',
              descricao: 'Reposiciona uma conta na hierarquia, alterando sua conta pai.',
            },
            {
              icon: ArrowUpDown,
              nome: 'Reordenar',
              descricao: 'Altera a ordem de exibição das contas dentro do mesmo nível.',
            },
            {
              icon: Eye,
              nome: 'Ver Lançamentos',
              descricao:
                'Exibe todos os lançamentos vinculados à conta em um período selecionado.',
            },
            {
              icon: Link,
              nome: 'Ver no DRE',
              descricao: 'Navega para o DRE com a conta já selecionada para análise.',
            },
            {
              icon: Trash2,
              nome: 'Excluir',
              descricao:
                'Remove uma conta sem lançamentos vinculados. Contas com lançamentos devem ser inativadas.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Vinculação com Lançamentos">
        <p className="text-muted-foreground">
          Toda receita lançada em Contas a Receber e toda despesa em Contas a Pagar deve ser
          associada a uma categoria do Plano de Contas. Essa vinculação é obrigatória e permite
          que o DRE e os demais relatórios gerenciais apresentem os dados de forma consolidada e
          estruturada.
        </p>
        <DocTip>
          Mantenha o plano de contas simples e coerente. Um plano com muitas subcategorias pode
          dificultar a análise. Crie novas subcategorias apenas quando houver necessidade real de
          segmentação nos relatórios.
        </DocTip>
      </DocSection>

      <DocSection title="Importação do Plano de Contas">
        <p className="text-muted-foreground">
          Novos escritórios podem importar um plano de contas padrão fornecido pelo sistema ou
          carregar um arquivo XLSX com a estrutura personalizada. O modelo de importação pode ser
          baixado na própria tela do Plano de Contas.
        </p>
      </DocSection>
    </div>
  );
}
