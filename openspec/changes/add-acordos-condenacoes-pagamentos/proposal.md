# Proposta: Sistema de Controle de Acordos, Condenações e Pagamentos

## Contexto
O escritório necessita controlar pagamentos e recebimentos relacionados a processos jurídicos, incluindo:
- Acordos realizados entre as partes
- Condenações transitadas em julgado
- Custas processuais

Atualmente não existe nenhum sistema para gerenciar esses valores, suas parcelas, formas de pagamento e repasses aos clientes.

## Objetivo
Implementar um sistema completo de gestão financeira processual que permita:

1. **Registrar acordos e condenações** com controle detalhado de valores
2. **Gerenciar parcelas** com valores editáveis e redistribuição automática
3. **Controlar repasses** aos clientes com validações e comprovantes obrigatórios
4. **Múltiplas formas de pagamento** (transferência, depósito judicial, depósito recursal)
5. **Distribuição automática** de honorários contratuais e sucumbenciais
6. **Preparar integração futura** com sistema de gestão financeira

## Escopo

### Incluído
- Tabelas no banco de dados (migrations)
- Serviços de backend para CRUD
- API Routes REST completas
- Documentação Swagger
- Frontend completo com formulários e listagens
- Sistema de storage abstrato (preparado para Minio/S3/AWS)
- Triggers para cálculos automáticos e mudança de status
- View para repasses pendentes

### Não Incluído (Futuro)
- Integração com sistema financeiro/fluxo de caixa
- Notificações automáticas de vencimento
- Dashboard/relatórios financeiros

## Capabilities
Esta mudança introduz 3 novas capabilities:

1. **acordos-condenacoes**: Gestão principal de acordos, condenações e custas
2. **parcelas**: Controle de parcelamento com valores editáveis
3. **repasses**: Gestão de repasses aos clientes com validações

## Impacto
- **Backend**: Nova feature, sem impacto em features existentes
- **Frontend**: Nova seção no dashboard
- **Banco de Dados**: 3 novas tabelas + 1 view
- **Storage**: Necessita configuração de variáveis de ambiente

## Relacionamentos
- Depende de: `processos` (FK para processos)
- Relacionado com: `usuarios` (repasses feitos por usuário)
- Preparação para: `gestao-financeira` (integração futura)
