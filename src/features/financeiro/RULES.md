# Regras de Negócio - Financeiro

## Contexto
Módulo de gestão financeira do escritório jurídico. Gerencia lançamentos, contas a pagar/receber, fluxo de caixa, DRE, orçamentos e conciliação bancária. Integra com obrigações de processos e sistema de cobrança.

## Entidades Principais
- **Lancamento**: Entrada ou saída financeira
- **PlanoContas**: Estrutura de contas contábeis
- **ContaBancaria**: Contas bancárias do escritório
- **Orcamento**: Orçamentos por período/categoria
- **ConciliacaoBancaria**: Importação e conciliação de extratos

## Tipos de Lançamento
- `receita`: Entrada de recursos
- `despesa`: Saída de recursos
- `transferencia`: Movimentação entre contas

## Status de Lançamento
- `pendente`: Aguardando pagamento/recebimento
- `pago`: Pago/recebido
- `cancelado`: Cancelado
- `vencido`: Prazo expirado sem pagamento

## Regras de Validação

### Campos Obrigatórios
- `tipo`: receita, despesa, transferencia
- `valor`: Valor positivo (> 0)
- `data_vencimento`: Data de vencimento
- `plano_contas_id`: Categoria contábil
- `descricao`: Descrição do lançamento

### Valor
- Sempre positivo
- Máximo 2 casas decimais
- Formato: centavos armazenados como inteiro ou decimal(12,2)

### Vinculações
- `processo_id`: Lançamento vinculado a processo (opcional)
- `cliente_id`: Lançamento vinculado a cliente (opcional)
- `obrigacao_id`: Vinculado a obrigação/acordo (opcional)

## Regras de Negócio

### Criação de Lançamento
1. Validar categoria no plano de contas
2. Verificar saldo disponível (para despesas)
3. Status inicial: `pendente`
4. Se recorrente, gerar próximas parcelas

### Baixa de Lançamento (Pagamento)
1. Registrar data de pagamento efetivo
2. Atualizar status para `pago`
3. Atualizar saldo da conta bancária
4. Se parcela de acordo, atualizar status do acordo

### Lançamentos Recorrentes
1. Definir periodicidade (mensal, quinzenal, semanal)
2. Gerar N parcelas automaticamente
3. Cada parcela é um lançamento independente
4. Alteração em recorrente afeta apenas uma ou todas

### Transferência entre Contas
1. Criar lançamento de saída na conta origem
2. Criar lançamento de entrada na conta destino
3. Vincular ambos lançamentos
4. Valor líquido igual nas duas contas

## Plano de Contas

### Estrutura Hierárquica
```
1. Receitas
   1.1 Honorários
      1.1.1 Honorários Contratuais
      1.1.2 Honorários de Êxito
   1.2 Acordos
   1.3 Outros
2. Despesas
   2.1 Pessoal
   2.2 Custas Processuais
   2.3 Administrativa
   2.4 Outros
```

### Regras
- Conta pai não recebe lançamentos diretos
- Lançamentos apenas em contas folha
- Código único por conta
- Inativação apenas se sem lançamentos

## Fluxo de Caixa

### Cálculo
- **Entradas**: Soma de receitas pagas no período
- **Saídas**: Soma de despesas pagas no período
- **Saldo**: Entradas - Saídas
- **Projeção**: Lançamentos pendentes por período

### Relatório
1. Filtrar por período (mês, trimestre, ano)
2. Filtrar por conta bancária
3. Agrupar por categoria (plano de contas)
4. Comparativo com período anterior

## DRE (Demonstração de Resultado)

### Estrutura
```
(+) Receita Bruta
(-) Deduções
(=) Receita Líquida
(-) Custos
(=) Lucro Bruto
(-) Despesas Operacionais
(=) Resultado Operacional
(-) Despesas Financeiras
(=) Resultado Líquido
```

### Geração
1. Período: mensal, trimestral, anual
2. Considerar regime de competência ou caixa
3. Exportar para Excel/PDF

## Orçamentos

### Criação
1. Definir período (mês/ano)
2. Definir valor por categoria
3. Alertas ao atingir percentuais

### Acompanhamento
- Realizado vs Orçado por categoria
- Percentual de execução
- Alertas: 80%, 100%, 120%

## Conciliação Bancária

### Importação de Extrato
1. Formatos: OFX, CSV
2. Parsear movimentações
3. Detectar lançamentos já cadastrados
4. Sugerir correspondências

### Processo de Conciliação
1. Exibir movimentações não conciliadas
2. Vincular com lançamentos existentes
3. Criar lançamentos para novos
4. Marcar como conciliado

## Relatórios Disponíveis
- Fluxo de Caixa (realizado e projetado)
- DRE por período
- Análise por categoria
- Comparativo período anterior
- Inadimplência (receitas vencidas)
- Contas a Pagar/Receber

## Filtros Disponíveis
- **Tipo**: receita, despesa, transferencia
- **Status**: pendente, pago, cancelado, vencido
- **Período**: data_vencimento, data_pagamento
- **Categoria**: plano_contas_id
- **Conta**: conta_bancaria_id
- **Vinculação**: processo_id, cliente_id, obrigacao_id

## Restrições de Acesso
- Apenas financeiro/admin podem criar lançamentos
- Advogados visualizam apenas de seus processos
- Relatórios consolidados requerem permissão especial
- Exclusão apenas de lançamentos pendentes

## Integrações
- **Obrigações**: Parcelas de acordos geram lançamentos
- **Processos**: Custas e honorários por processo
- **Clientes**: Cobrança e inadimplência
- **Bancos**: Importação de extratos (OFX)
- **Sistema de IA**: Indexação para busca semântica

## Revalidação de Cache
Após mutações, revalidar:
- `/financeiro` - Dashboard financeiro
- `/financeiro/lancamentos` - Lista de lançamentos
- `/financeiro/fluxo-caixa` - Fluxo de caixa
- `/financeiro/dre` - DRE
- `/dashboard` - Métricas do dashboard principal
