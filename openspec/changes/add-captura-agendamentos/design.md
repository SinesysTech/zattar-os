# Design: Sistema de Agendamento de Capturas

## Contexto
O sistema atual permite capturas manuais através da interface web. Para automatizar o processo e garantir execuções regulares, precisamos implementar um sistema de agendamento que execute capturas automaticamente em horários e periodicidades definidas pelo usuário.

## Objetivos
1. Permitir que usuários criem agendamentos de captura
2. Executar capturas automaticamente conforme agendamento
3. Registrar execuções automáticas no histórico existente
4. Fornecer interface para gerenciar agendamentos

## Decisões Técnicas

### 1. Armazenamento de Agendamentos
**Decisão**: Usar tabela `agendamentos` no PostgreSQL
**Justificativa**: 
- Dados estruturados que precisam de queries complexas
- Necessidade de índices para performance do scheduler
- Integração com histórico existente (`capturas_log`)

### 2. Cálculo de Próxima Execução
**Decisão**: Calcular `proxima_execucao` no momento da criação/atualização
**Justificativa**:
- Evita cálculos repetidos no scheduler
- Facilita queries para encontrar agendamentos prontos
- Permite visualização clara no frontend

**Algoritmo**:
- `diario`: Adicionar 1 dia ao horário atual
- `a_cada_2_dias`: Adicionar 2 dias
- `a_cada_3_dias`: Adicionar 3 dias
- `semanal`: Adicionar 7 dias
- `mensal`: Adicionar 1 mês

### 3. Execução do Scheduler
**Decisão**: Criar serviço Node.js que roda periodicamente (ex: a cada minuto)
**Alternativas consideradas**:
- Cron job do sistema operacional
- Queue system (Bull/BullMQ)
- Serverless functions

**Justificativa**:
- Simplicidade de implementação inicial
- Controle total sobre execução
- Facilidade de debug e logs

**Implementação futura**: Considerar migração para queue system se volume aumentar

### 4. Parâmetros Extras
**Decisão**: Armazenar em JSONB (`parametros_extras`)
**Justificativa**:
- Diferentes tipos de captura têm parâmetros diferentes
- Flexibilidade para adicionar novos parâmetros sem migration
- Facilita extensão futura

**Estrutura**:
```json
{
  "dataInicio": "2024-01-01",  // Para audiências
  "dataFim": "2024-12-31",     // Para audiências
  "filtroPrazo": "no_prazo"    // Para pendentes
}
```

### 5. Integração com Histórico
**Decisão**: Reutilizar tabela `capturas_log` existente
**Justificativa**:
- Evita duplicação de código
- Histórico unificado (manual + automático)
- Identificação através de campo adicional se necessário

### 6. Interface Frontend
**Decisão**: Adicionar aba "Agendamentos" na página de captura existente
**Justificativa**:
- Mantém contexto relacionado junto
- Reutiliza componentes existentes (`CapturaFormBase`)
- UX consistente com outras abas

## Estrutura de Dados

### Tabela `agendamentos`
```sql
CREATE TABLE agendamentos (
  id BIGSERIAL PRIMARY KEY,
  tipo_captura TEXT NOT NULL,
  advogado_id BIGINT REFERENCES advogados(id),
  credencial_ids BIGINT[] NOT NULL,
  periodicidade TEXT NOT NULL, -- 'diario', 'a_cada_2_dias', 'a_cada_3_dias', 'semanal', 'mensal'
  horario TIME NOT NULL, -- HH:mm
  ativo BOOLEAN DEFAULT true,
  parametros_extras JSONB,
  ultima_execucao TIMESTAMPTZ,
  proxima_execucao TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Fluxo de Execução

1. **Criação de Agendamento**:
   - Usuário preenche formulário (tipo, advogado, credenciais, periodicidade, horário)
   - Sistema calcula `proxima_execucao` baseado em periodicidade e horário
   - Salva no banco

2. **Execução Automática** (Scheduler):
   - Scheduler roda periodicamente (ex: a cada minuto)
   - Busca agendamentos onde `ativo = true` e `proxima_execucao <= now()`
   - Para cada agendamento encontrado:
     - Executa captura usando serviços existentes
     - Registra no `capturas_log`
     - Atualiza `ultima_execucao = now()`
     - Calcula nova `proxima_execucao`
     - Atualiza registro do agendamento

3. **Execução Manual**:
   - Usuário pode executar agendamento manualmente via botão
   - Mesmo fluxo da execução automática
   - Não atualiza `proxima_execucao` (mantém agendamento original)

## Riscos e Mitigações

### Risco 1: Scheduler não executar
**Mitigação**: 
- Logs detalhados
- Monitoramento de última execução
- Alertas se scheduler parar

### Risco 2: Múltiplas execuções simultâneas
**Mitigação**:
- Lock no banco durante execução
- Verificar se já está em execução antes de iniciar

### Risco 3: Falha na execução
**Mitigação**:
- Try/catch robusto
- Registrar erro no histórico
- Não atualizar `proxima_execucao` se falhar (retentar no próximo ciclo)

## Plano de Migração

1. Criar tabela e serviços backend
2. Criar endpoints API
3. Implementar scheduler básico
4. Criar interface frontend
5. Testar em ambiente de desenvolvimento
6. Deploy gradual (ativar scheduler após validação)

