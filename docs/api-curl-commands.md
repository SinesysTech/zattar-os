# API Curl Commands - Sinesys

Este arquivo contém todos os comandos curl das APIs do projeto, prontos para importação no N8N ou ferramentas similares.

**Base URL**: `http://localhost:3000` (desenvolvimento) ou `https://api.sinesys.com.br` (produção)

**Autenticação**:
- Bearer Token: `Authorization: Bearer <token>`
- Cookie de sessão: `Cookie: sb-access-token=<token>`
- API Key de serviço: `x-service-api-key: <api-key>`

---

## Health & Info

```bash
# Health Check
curl -X GET "http://localhost:3000/api/health"

# Dados do usuário autenticado
curl -X GET "http://localhost:3000/api/me" \
  -H "Authorization: Bearer <token>"

# Dashboard - Dados gerais
curl -X GET "http://localhost:3000/api/dashboard" \
  -H "Authorization: Bearer <token>"
```

---

## Acervo (Processos)

```bash
# Listar processos do acervo
curl -X GET "http://localhost:3000/api/acervo?pagina=1&limite=50" \
  -H "Authorization: Bearer <token>"

# Listar processos com filtros
curl -X GET "http://localhost:3000/api/acervo?pagina=1&limite=50&cliente_id=1&tribunal_id=1&busca=1234567" \
  -H "Authorization: Bearer <token>"

# Obter processo por ID
curl -X GET "http://localhost:3000/api/acervo/123" \
  -H "Authorization: Bearer <token>"

# Atualizar responsável do processo
curl -X PATCH "http://localhost:3000/api/acervo/123/responsavel" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"responsavel_id": 1}'

# Obter timeline do processo
curl -X GET "http://localhost:3000/api/acervo/123/timeline" \
  -H "Authorization: Bearer <token>"

# Buscar processos por CPF do cliente (para Agente IA WhatsApp)
# Retorna todos os processos do cliente com timeline consolidada
curl -X GET "http://localhost:3000/api/acervo/cliente/cpf/12345678901" \
  -H "x-service-api-key: <api-key>"

# Com CPF formatado (aceita ambos os formatos)
curl -X GET "http://localhost:3000/api/acervo/cliente/cpf/123.456.789-01" \
  -H "x-service-api-key: <api-key>"
```

---

## Acordos e Condenações

```bash
# Listar acordos e condenações
curl -X GET "http://localhost:3000/api/acordos-condenacoes?pagina=1&limite=50" \
  -H "Authorization: Bearer <token>"

# Listar com filtros
curl -X GET "http://localhost:3000/api/acordos-condenacoes?tipo=acordo&status=pendente&cliente_id=1" \
  -H "Authorization: Bearer <token>"

# Criar acordo/condenação
curl -X POST "http://localhost:3000/api/acordos-condenacoes" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "processo_id": 123,
    "tipo": "acordo",
    "valor_total": 50000.00,
    "numero_parcelas": 10,
    "data_primeiro_vencimento": "2025-01-15"
  }'

# Obter acordo/condenação por ID
curl -X GET "http://localhost:3000/api/acordos-condenacoes/123" \
  -H "Authorization: Bearer <token>"

# Atualizar acordo/condenação
curl -X PATCH "http://localhost:3000/api/acordos-condenacoes/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"valor_total": 55000.00}'

# Excluir acordo/condenação
curl -X DELETE "http://localhost:3000/api/acordos-condenacoes/123" \
  -H "Authorization: Bearer <token>"

# Recalcular parcelas
curl -X POST "http://localhost:3000/api/acordos-condenacoes/123/recalcular" \
  -H "Authorization: Bearer <token>"

# Atualizar parcela
curl -X PATCH "http://localhost:3000/api/acordos-condenacoes/123/parcelas/456" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"valor": 5500.00, "data_vencimento": "2025-02-15"}'

# Registrar recebimento de parcela
curl -X POST "http://localhost:3000/api/acordos-condenacoes/123/parcelas/456/receber" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"data_recebimento": "2025-01-15", "valor_recebido": 5000.00}'
```

---

## Advogados

```bash
# Listar advogados
curl -X GET "http://localhost:3000/api/advogados" \
  -H "Authorization: Bearer <token>"

# Criar advogado
curl -X POST "http://localhost:3000/api/advogados" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Dr. João Silva", "oab": "12345/PR"}'

# Obter advogado por ID
curl -X GET "http://localhost:3000/api/advogados/1" \
  -H "Authorization: Bearer <token>"

# Atualizar advogado
curl -X PATCH "http://localhost:3000/api/advogados/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Dr. João Paulo Silva"}'

# Excluir advogado
curl -X DELETE "http://localhost:3000/api/advogados/1" \
  -H "Authorization: Bearer <token>"

# Listar credenciais do advogado
curl -X GET "http://localhost:3000/api/advogados/1/credenciais" \
  -H "Authorization: Bearer <token>"

# Adicionar credencial ao advogado
curl -X POST "http://localhost:3000/api/advogados/1/credenciais" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tribunal_id": 9, "login": "usuario@email.com", "senha": "senha123"}'

# Obter credencial específica
curl -X GET "http://localhost:3000/api/advogados/1/credenciais/10" \
  -H "Authorization: Bearer <token>"

# Atualizar credencial
curl -X PATCH "http://localhost:3000/api/advogados/1/credenciais/10" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"senha": "novaSenha123"}'

# Excluir credencial
curl -X DELETE "http://localhost:3000/api/advogados/1/credenciais/10" \
  -H "Authorization: Bearer <token>"
```

---

## Audiências

```bash
# Listar audiências
curl -X GET "http://localhost:3000/api/audiencias?pagina=1&limite=50" \
  -H "Authorization: Bearer <token>"

# Listar audiências com filtros
curl -X GET "http://localhost:3000/api/audiencias?data_inicio=2025-01-01&data_fim=2025-12-31&tipo=inicial&cliente_id=1" \
  -H "Authorization: Bearer <token>"

# Atualizar URL virtual da audiência
curl -X PATCH "http://localhost:3000/api/audiencias/123/url-virtual" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"url_virtual": "https://meet.google.com/abc-defg-hij"}'

# Atualizar responsável da audiência
curl -X PATCH "http://localhost:3000/api/audiencias/123/responsavel" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"responsavel_id": 1}'

# Atualizar modalidade da audiência
curl -X PATCH "http://localhost:3000/api/audiencias/123/modalidade" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"modalidade": "hibrida", "url_virtual": "https://meet.google.com/abc"}'

# Obter observações da audiência
curl -X GET "http://localhost:3000/api/audiencias/123/observacoes" \
  -H "Authorization: Bearer <token>"

# Adicionar observação à audiência
curl -X POST "http://localhost:3000/api/audiencias/123/observacoes" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"observacao": "Cliente confirmou presença"}'

# Listar tipos de audiência
curl -X GET "http://localhost:3000/api/audiencias/tipos" \
  -H "Authorization: Bearer <token>"

# Listar salas de audiência
curl -X GET "http://localhost:3000/api/audiencias/salas" \
  -H "Authorization: Bearer <token>"

# Buscar audiências por CPF do cliente (para Agente IA WhatsApp)
# Retorna todas as audiências do cliente com resumo estatístico
curl -X GET "http://localhost:3000/api/audiencias/cliente/cpf/12345678901" \
  -H "x-service-api-key: <api-key>"

# Com CPF formatado (aceita ambos os formatos)
curl -X GET "http://localhost:3000/api/audiencias/cliente/cpf/123.456.789-01" \
  -H "x-service-api-key: <api-key>"
```

---

## Cache

```bash
# Obter estatísticas do cache Redis
curl -X GET "http://localhost:3000/api/cache/stats" \
  -H "Authorization: Bearer <token>"

# Limpar cache
curl -X POST "http://localhost:3000/api/cache/clear" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "acervo:*"}'
```

---

## Captura - Agendamentos

```bash
# Listar agendamentos de captura
curl -X GET "http://localhost:3000/api/captura/agendamentos" \
  -H "Authorization: Bearer <token>"

# Criar agendamento
curl -X POST "http://localhost:3000/api/captura/agendamentos" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Captura Diária TRT9",
    "tipo_captura": "acervo-geral",
    "advogado_id": 1,
    "credencial_ids": [1, 2],
    "cron_expression": "0 8 * * *",
    "ativo": true
  }'

# Obter agendamento por ID
curl -X GET "http://localhost:3000/api/captura/agendamentos/1" \
  -H "Authorization: Bearer <token>"

# Atualizar agendamento
curl -X PATCH "http://localhost:3000/api/captura/agendamentos/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"ativo": false}'

# Excluir agendamento
curl -X DELETE "http://localhost:3000/api/captura/agendamentos/1" \
  -H "Authorization: Bearer <token>"

# Executar agendamento manualmente
curl -X POST "http://localhost:3000/api/captura/agendamentos/1/executar" \
  -H "Authorization: Bearer <token>"
```

---

## Captura - Credenciais

```bash
# Listar credenciais de captura
curl -X GET "http://localhost:3000/api/captura/credenciais" \
  -H "Authorization: Bearer <token>"

# Criar credencial de captura
curl -X POST "http://localhost:3000/api/captura/credenciais" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "advogado_id": 1,
    "tribunal_id": 9,
    "login": "usuario@email.com",
    "senha": "senha123"
  }'
```

---

## Captura - Tribunais

```bash
# Listar tribunais configurados para captura
curl -X GET "http://localhost:3000/api/captura/tribunais" \
  -H "Authorization: Bearer <token>"

# Obter configuração de tribunal
curl -X GET "http://localhost:3000/api/captura/tribunais/9" \
  -H "Authorization: Bearer <token>"
```

---

## Captura - Histórico

```bash
# Listar histórico de capturas
curl -X GET "http://localhost:3000/api/captura/historico?pagina=1&limite=50" \
  -H "Authorization: Bearer <token>"

# Listar histórico com filtros
curl -X GET "http://localhost:3000/api/captura/historico?tipo_captura=acervo-geral&status=sucesso&advogado_id=1" \
  -H "Authorization: Bearer <token>"

# Obter detalhes de uma captura
curl -X GET "http://localhost:3000/api/captura/historico/abc123" \
  -H "Authorization: Bearer <token>"
```

---

## Captura TRT - Execução

```bash
# Capturar acervo geral
curl -X POST "http://localhost:3000/api/captura/trt/acervo-geral" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "advogado_id": 1,
    "credencial_ids": [1, 2, 3]
  }'

# Capturar processos arquivados
curl -X POST "http://localhost:3000/api/captura/trt/arquivados" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "advogado_id": 1,
    "credencial_ids": [1, 2, 3]
  }'

# Capturar audiências
curl -X POST "http://localhost:3000/api/captura/trt/audiencias" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "advogado_id": 1,
    "credencial_ids": [1, 2, 3]
  }'

# Capturar pendentes de manifestação
curl -X POST "http://localhost:3000/api/captura/trt/pendentes-manifestacao" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "advogado_id": 1,
    "credencial_ids": [1, 2, 3]
  }'

# Capturar timeline de processo
curl -X POST "http://localhost:3000/api/captura/trt/timeline" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "advogado_id": 1,
    "credencial_id": 1,
    "numero_processo": "0001234-56.2024.5.09.0001"
  }'

# Capturar partes de processo
curl -X POST "http://localhost:3000/api/captura/trt/partes" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "advogado_id": 1,
    "credencial_id": 1,
    "numero_processo": "0001234-56.2024.5.09.0001"
  }'
```

---

## Captura - Recovery

```bash
# Listar gaps de recovery
curl -X GET "http://localhost:3000/api/captura/recovery?pagina=1&limite=50" \
  -H "Authorization: Bearer <token>"

# Obter detalhes de recovery
curl -X GET "http://localhost:3000/api/captura/recovery/64abc123def456" \
  -H "Authorization: Bearer <token>"

# Obter elementos de recovery (modo genérico - todos os elementos)
curl -X GET "http://localhost:3000/api/captura/recovery/64abc123def456/elementos" \
  -H "Authorization: Bearer <token>"

# Obter elementos de recovery (modo genérico - apenas faltantes)
curl -X GET "http://localhost:3000/api/captura/recovery/64abc123def456/elementos?filtro=faltantes" \
  -H "Authorization: Bearer <token>"

# Obter elementos de recovery (modo genérico - apenas existentes)
curl -X GET "http://localhost:3000/api/captura/recovery/64abc123def456/elementos?filtro=existentes" \
  -H "Authorization: Bearer <token>"

# Obter elementos de recovery (modo partes - estrutura legada)
curl -X GET "http://localhost:3000/api/captura/recovery/64abc123def456/elementos?modo=partes" \
  -H "Authorization: Bearer <token>"

# Obter elementos de recovery (modo partes - apenas faltantes)
curl -X GET "http://localhost:3000/api/captura/recovery/64abc123def456/elementos?modo=partes&filtro=faltantes" \
  -H "Authorization: Bearer <token>"

# Reprocessar recovery
curl -X POST "http://localhost:3000/api/captura/recovery/reprocess" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"mongo_ids": ["64abc123def456", "64abc123def789"]}'
```

---

## Clientes

```bash
# Listar clientes
curl -X GET "http://localhost:3000/api/clientes?pagina=1&limite=50" \
  -H "Authorization: Bearer <token>"

# Listar clientes com filtros
curl -X GET "http://localhost:3000/api/clientes?busca=João&tipo=pessoa_fisica" \
  -H "Authorization: Bearer <token>"

# Criar cliente
curl -X POST "http://localhost:3000/api/clientes" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João da Silva",
    "cpf": "12345678901",
    "tipo": "pessoa_fisica",
    "email": "joao@email.com",
    "telefone": "41999999999"
  }'

# Obter cliente por ID
curl -X GET "http://localhost:3000/api/clientes/123" \
  -H "Authorization: Bearer <token>"

# Atualizar cliente
curl -X PATCH "http://localhost:3000/api/clientes/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "joao.silva@email.com"}'

# Excluir cliente
curl -X DELETE "http://localhost:3000/api/clientes/123" \
  -H "Authorization: Bearer <token>"

# Buscar cliente por CPF
curl -X GET "http://localhost:3000/api/clientes/buscar/por-cpf/12345678901" \
  -H "Authorization: Bearer <token>"

# Buscar cliente por CNPJ
curl -X GET "http://localhost:3000/api/clientes/buscar/por-cnpj/12345678000199" \
  -H "Authorization: Bearer <token>"
```

---

## Contratos

```bash
# Listar contratos
curl -X GET "http://localhost:3000/api/contratos?pagina=1&limite=50" \
  -H "Authorization: Bearer <token>"

# Listar contratos com filtros
curl -X GET "http://localhost:3000/api/contratos?cliente_id=1&tipo=ajuizamento" \
  -H "Authorization: Bearer <token>"

# Criar contrato
curl -X POST "http://localhost:3000/api/contratos" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": 1,
    "tipo": "ajuizamento",
    "descricao": "Ação trabalhista",
    "data_assinatura": "2025-01-01"
  }'

# Obter contrato por ID
curl -X GET "http://localhost:3000/api/contratos/123" \
  -H "Authorization: Bearer <token>"

# Atualizar contrato
curl -X PATCH "http://localhost:3000/api/contratos/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"descricao": "Ação trabalhista - Horas extras"}'

# Excluir contrato
curl -X DELETE "http://localhost:3000/api/contratos/123" \
  -H "Authorization: Bearer <token>"

# Listar processos do contrato
curl -X GET "http://localhost:3000/api/contratos/123/processos" \
  -H "Authorization: Bearer <token>"

# Vincular processo ao contrato
curl -X POST "http://localhost:3000/api/contratos/123/processos" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"processo_id": 456}'

# Desvincular processo do contrato
curl -X DELETE "http://localhost:3000/api/contratos/123/processos/456" \
  -H "Authorization: Bearer <token>"
```

---

## Endereços

```bash
# Listar endereços
curl -X GET "http://localhost:3000/api/enderecos" \
  -H "Authorization: Bearer <token>"

# Criar endereço
curl -X POST "http://localhost:3000/api/enderecos" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cep": "80000000",
    "logradouro": "Rua XV de Novembro",
    "numero": "100",
    "bairro": "Centro",
    "cidade": "Curitiba",
    "estado": "PR"
  }'

# Obter endereço por ID
curl -X GET "http://localhost:3000/api/enderecos/123" \
  -H "Authorization: Bearer <token>"

# Atualizar endereço
curl -X PATCH "http://localhost:3000/api/enderecos/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"numero": "200"}'

# Excluir endereço
curl -X DELETE "http://localhost:3000/api/enderecos/123" \
  -H "Authorization: Bearer <token>"
```

---

## Expedientes Manuais

```bash
# Listar expedientes manuais
curl -X GET "http://localhost:3000/api/expedientes-manuais?pagina=1&limite=50" \
  -H "Authorization: Bearer <token>"

# Listar com filtros
curl -X GET "http://localhost:3000/api/expedientes-manuais?status=pendente&responsavel_id=1" \
  -H "Authorization: Bearer <token>"

# Criar expediente manual
curl -X POST "http://localhost:3000/api/expedientes-manuais" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "processo_id": 123,
    "tipo_expediente_id": 1,
    "descricao": "Audiência de conciliação",
    "data_prazo": "2025-02-15",
    "responsavel_id": 1
  }'

# Obter expediente manual por ID
curl -X GET "http://localhost:3000/api/expedientes-manuais/123" \
  -H "Authorization: Bearer <token>"

# Atualizar expediente manual
curl -X PATCH "http://localhost:3000/api/expedientes-manuais/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"descricao": "Audiência de instrução"}'

# Excluir expediente manual
curl -X DELETE "http://localhost:3000/api/expedientes-manuais/123" \
  -H "Authorization: Bearer <token>"

# Atualizar responsável
curl -X PATCH "http://localhost:3000/api/expedientes-manuais/123/responsavel" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"responsavel_id": 2}'

# Dar baixa no expediente
curl -X POST "http://localhost:3000/api/expedientes-manuais/123/baixa" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"observacao": "Concluído com sucesso"}'

# Reverter baixa
curl -X POST "http://localhost:3000/api/expedientes-manuais/123/reverter-baixa" \
  -H "Authorization: Bearer <token>"
```

---

## Partes - Endereços

```bash
# Listar endereços de partes
curl -X GET "http://localhost:3000/api/partes/enderecos" \
  -H "Authorization: Bearer <token>"

# Criar endereço de parte
curl -X POST "http://localhost:3000/api/partes/enderecos" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "entidade_tipo": "cliente",
    "entidade_id": 1,
    "cep": "80000000",
    "logradouro": "Rua XV de Novembro",
    "numero": "100",
    "bairro": "Centro",
    "cidade": "Curitiba",
    "estado": "PR",
    "principal": true
  }'

# Obter endereço por ID
curl -X GET "http://localhost:3000/api/partes/enderecos/123" \
  -H "Authorization: Bearer <token>"

# Atualizar endereço
curl -X PATCH "http://localhost:3000/api/partes/enderecos/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"numero": "200"}'

# Excluir endereço
curl -X DELETE "http://localhost:3000/api/partes/enderecos/123" \
  -H "Authorization: Bearer <token>"

# Definir endereço como principal
curl -X POST "http://localhost:3000/api/partes/enderecos/123/principal" \
  -H "Authorization: Bearer <token>"

# Listar endereços de uma entidade
curl -X GET "http://localhost:3000/api/partes/enderecos/entidade/cliente/1" \
  -H "Authorization: Bearer <token>"
```

---

## Partes - Processo-Partes

```bash
# Listar vínculos processo-partes
curl -X GET "http://localhost:3000/api/partes/processo-partes" \
  -H "Authorization: Bearer <token>"

# Criar vínculo processo-parte
curl -X POST "http://localhost:3000/api/partes/processo-partes" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "processo_id": 123,
    "entidade_tipo": "cliente",
    "entidade_id": 1,
    "tipo_participacao": "reclamante"
  }'

# Obter vínculo por ID
curl -X GET "http://localhost:3000/api/partes/processo-partes/123" \
  -H "Authorization: Bearer <token>"

# Atualizar vínculo
curl -X PATCH "http://localhost:3000/api/partes/processo-partes/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tipo_participacao": "autor"}'

# Excluir vínculo
curl -X DELETE "http://localhost:3000/api/partes/processo-partes/123" \
  -H "Authorization: Bearer <token>"

# Listar partes de um processo
curl -X GET "http://localhost:3000/api/partes/processo-partes/processo/123" \
  -H "Authorization: Bearer <token>"

# Listar processos de uma entidade
curl -X GET "http://localhost:3000/api/partes/processo-partes/entidade/cliente/1" \
  -H "Authorization: Bearer <token>"
```

---

## Partes - Terceiros

```bash
# Listar terceiros
curl -X GET "http://localhost:3000/api/partes/terceiros" \
  -H "Authorization: Bearer <token>"

# Criar terceiro
curl -X POST "http://localhost:3000/api/partes/terceiros" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Empresa ABC Ltda",
    "documento": "12345678000199",
    "tipo_documento": "cnpj"
  }'

# Obter terceiro por ID
curl -X GET "http://localhost:3000/api/partes/terceiros/123" \
  -H "Authorization: Bearer <token>"

# Atualizar terceiro
curl -X PATCH "http://localhost:3000/api/partes/terceiros/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Empresa ABC S.A."}'

# Excluir terceiro
curl -X DELETE "http://localhost:3000/api/partes/terceiros/123" \
  -H "Authorization: Bearer <token>"

# Upsert terceiro (criar ou atualizar)
curl -X POST "http://localhost:3000/api/partes/terceiros/upsert" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Empresa XYZ Ltda",
    "documento": "98765432000111",
    "tipo_documento": "cnpj"
  }'

# Listar terceiros de um processo
curl -X GET "http://localhost:3000/api/partes/terceiros/processo?processo_id=123" \
  -H "Authorization: Bearer <token>"
```

---

## Partes Contrárias

```bash
# Listar partes contrárias
curl -X GET "http://localhost:3000/api/partes-contrarias?pagina=1&limite=50" \
  -H "Authorization: Bearer <token>"

# Criar parte contrária
curl -X POST "http://localhost:3000/api/partes-contrarias" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Empresa Reclamada Ltda",
    "cnpj": "12345678000199",
    "email": "contato@empresa.com"
  }'

# Obter parte contrária por ID
curl -X GET "http://localhost:3000/api/partes-contrarias/123" \
  -H "Authorization: Bearer <token>"

# Atualizar parte contrária
curl -X PATCH "http://localhost:3000/api/partes-contrarias/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "novo@empresa.com"}'

# Excluir parte contrária
curl -X DELETE "http://localhost:3000/api/partes-contrarias/123" \
  -H "Authorization: Bearer <token>"

# Buscar por CPF
curl -X GET "http://localhost:3000/api/partes-contrarias/buscar/por-cpf/12345678901" \
  -H "Authorization: Bearer <token>"

# Buscar por CNPJ
curl -X GET "http://localhost:3000/api/partes-contrarias/buscar/por-cnpj/12345678000199" \
  -H "Authorization: Bearer <token>"
```

---

## Pendentes de Manifestação

```bash
# Listar pendentes de manifestação
curl -X GET "http://localhost:3000/api/pendentes-manifestacao?pagina=1&limite=50" \
  -H "Authorization: Bearer <token>"

# Listar com filtros
curl -X GET "http://localhost:3000/api/pendentes-manifestacao?status=pendente&responsavel_id=1&data_inicio=2025-01-01" \
  -H "Authorization: Bearer <token>"

# Atualizar responsável
curl -X PATCH "http://localhost:3000/api/pendentes-manifestacao/123/responsavel" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"responsavel_id": 1}'

# Atualizar tipo e descrição
curl -X PATCH "http://localhost:3000/api/pendentes-manifestacao/123/tipo-descricao" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tipo_expediente_id": 1, "descricao": "Intimação para manifestação"}'

# Dar baixa
curl -X POST "http://localhost:3000/api/pendentes-manifestacao/123/baixa" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"observacao": "Manifestação protocolada"}'

# Reverter baixa
curl -X POST "http://localhost:3000/api/pendentes-manifestacao/123/reverter-baixa" \
  -H "Authorization: Bearer <token>"
```

---

## Perfil

```bash
# Obter dados do perfil
curl -X GET "http://localhost:3000/api/perfil" \
  -H "Authorization: Bearer <token>"

# Atualizar perfil
curl -X PATCH "http://localhost:3000/api/perfil" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nome": "João Paulo Silva", "telefone": "41999999999"}'

# Alterar senha
curl -X POST "http://localhost:3000/api/perfil/senha" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"senha_atual": "senhaAntiga123", "nova_senha": "novaSenha456"}'
```

---

## Permissões

```bash
# Listar recursos e permissões disponíveis
curl -X GET "http://localhost:3000/api/permissoes/recursos" \
  -H "Authorization: Bearer <token>"

# Obter permissões de um usuário
curl -X GET "http://localhost:3000/api/permissoes/usuarios/1" \
  -H "Authorization: Bearer <token>"

# Atualizar permissões de um usuário
curl -X POST "http://localhost:3000/api/permissoes/usuarios/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permissoes": [
      {"recurso_id": 1, "ler": true, "criar": true, "atualizar": true, "deletar": false}
    ]
  }'
```

---

## PJE

```bash
# Obter documento de pendente de manifestação
curl -X POST "http://localhost:3000/api/pje/pendente-manifestacao/documento" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pendente_id": 123,
    "advogado_id": 1,
    "credencial_id": 1
  }'
```

---

## Processo-Partes (raiz)

```bash
# Listar processo-partes
curl -X GET "http://localhost:3000/api/processo-partes" \
  -H "Authorization: Bearer <token>"

# Criar vínculo
curl -X POST "http://localhost:3000/api/processo-partes" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "processo_id": 123,
    "parte_id": 1,
    "tipo": "reclamante"
  }'

# Obter por ID
curl -X GET "http://localhost:3000/api/processo-partes/123" \
  -H "Authorization: Bearer <token>"

# Atualizar
curl -X PATCH "http://localhost:3000/api/processo-partes/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tipo": "autor"}'

# Excluir
curl -X DELETE "http://localhost:3000/api/processo-partes/123" \
  -H "Authorization: Bearer <token>"
```

---

## Repasses

```bash
# Listar repasses
curl -X GET "http://localhost:3000/api/repasses?pagina=1&limite=50" \
  -H "Authorization: Bearer <token>"

# Criar repasse
curl -X POST "http://localhost:3000/api/repasses" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "acordo_condenacao_id": 123,
    "parcela_id": 456,
    "valor": 1000.00,
    "data_repasse": "2025-01-15"
  }'
```

---

## Representantes

```bash
# Listar representantes
curl -X GET "http://localhost:3000/api/representantes" \
  -H "Authorization: Bearer <token>"

# Criar representante
curl -X POST "http://localhost:3000/api/representantes" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Dr. Maria Silva",
    "oab": "12345/PR",
    "email": "maria@advocacia.com"
  }'

# Obter representante por ID
curl -X GET "http://localhost:3000/api/representantes/123" \
  -H "Authorization: Bearer <token>"

# Atualizar representante
curl -X PATCH "http://localhost:3000/api/representantes/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "novo@email.com"}'

# Excluir representante
curl -X DELETE "http://localhost:3000/api/representantes/123" \
  -H "Authorization: Bearer <token>"

# Upsert representante
curl -X POST "http://localhost:3000/api/representantes/upsert" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Dr. João Silva",
    "oab": "54321/PR"
  }'

# Buscar por OAB
curl -X GET "http://localhost:3000/api/representantes/oab/12345-PR" \
  -H "Authorization: Bearer <token>"

# Listar representantes de um processo
curl -X GET "http://localhost:3000/api/representantes/processo?processo_id=123" \
  -H "Authorization: Bearer <token>"
```

---

## Terceiros (raiz)

```bash
# Listar terceiros
curl -X GET "http://localhost:3000/api/terceiros" \
  -H "Authorization: Bearer <token>"

# Criar terceiro
curl -X POST "http://localhost:3000/api/terceiros" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Empresa Terceira Ltda",
    "documento": "12345678000199"
  }'

# Obter por ID
curl -X GET "http://localhost:3000/api/terceiros/123" \
  -H "Authorization: Bearer <token>"

# Atualizar
curl -X PATCH "http://localhost:3000/api/terceiros/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Empresa Terceira S.A."}'

# Excluir
curl -X DELETE "http://localhost:3000/api/terceiros/123" \
  -H "Authorization: Bearer <token>"
```

---

## Tribunais

```bash
# Listar tribunais
curl -X GET "http://localhost:3000/api/tribunais" \
  -H "Authorization: Bearer <token>"
```

---

## Tipos de Expedientes

```bash
# Listar tipos de expedientes
curl -X GET "http://localhost:3000/api/tipos-expedientes" \
  -H "Authorization: Bearer <token>"

# Criar tipo de expediente
curl -X POST "http://localhost:3000/api/tipos-expedientes" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Intimação", "descricao": "Intimação para manifestação"}'

# Obter por ID
curl -X GET "http://localhost:3000/api/tipos-expedientes/1" \
  -H "Authorization: Bearer <token>"

# Atualizar
curl -X PATCH "http://localhost:3000/api/tipos-expedientes/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"descricao": "Intimação judicial"}'

# Excluir
curl -X DELETE "http://localhost:3000/api/tipos-expedientes/1" \
  -H "Authorization: Bearer <token>"
```

---

## Usuários

```bash
# Listar usuários
curl -X GET "http://localhost:3000/api/usuarios?pagina=1&limite=50" \
  -H "Authorization: Bearer <token>"

# Criar usuário
curl -X POST "http://localhost:3000/api/usuarios" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Novo Usuário",
    "email": "usuario@email.com",
    "cpf": "12345678901",
    "senha": "senhaSegura123"
  }'

# Obter usuário por ID
curl -X GET "http://localhost:3000/api/usuarios/1" \
  -H "Authorization: Bearer <token>"

# Atualizar usuário
curl -X PATCH "http://localhost:3000/api/usuarios/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Nome Atualizado"}'

# Excluir usuário
curl -X DELETE "http://localhost:3000/api/usuarios/1" \
  -H "Authorization: Bearer <token>"

# Resetar senha de usuário
curl -X POST "http://localhost:3000/api/usuarios/1/senha" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nova_senha": "novaSenha123"}'

# Sincronizar usuários (Supabase Auth <-> DB)
curl -X POST "http://localhost:3000/api/usuarios/sincronizar" \
  -H "Authorization: Bearer <token>"

# Buscar usuário por CPF
curl -X GET "http://localhost:3000/api/usuarios/buscar/por-cpf/12345678901" \
  -H "Authorization: Bearer <token>"

# Buscar usuário por email
curl -X GET "http://localhost:3000/api/usuarios/buscar/por-email/usuario@email.com" \
  -H "Authorization: Bearer <token>"
```

---

## Cargos

```bash
# Listar cargos
curl -X GET "http://localhost:3000/api/cargos" \
  -H "Authorization: Bearer <token>"

# Criar cargo
curl -X POST "http://localhost:3000/api/cargos" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Advogado Sênior", "descricao": "Advogado com mais de 10 anos de experiência"}'

# Obter cargo por ID
curl -X GET "http://localhost:3000/api/cargos/1" \
  -H "Authorization: Bearer <token>"

# Atualizar cargo
curl -X PATCH "http://localhost:3000/api/cargos/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"descricao": "Advogado sênior especializado"}'

# Excluir cargo
curl -X DELETE "http://localhost:3000/api/cargos/1" \
  -H "Authorization: Bearer <token>"
```

---

## AI (Inteligência Artificial)

```bash
# Executar comando AI
curl -X POST "http://localhost:3000/api/ai/command" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"command": "resumir processo", "context": {"processo_id": 123}}'

# Copilot AI
curl -X POST "http://localhost:3000/api/ai/copilot" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Ajude-me a entender este processo", "context": {"processo_id": 123}}'
```

---

## Debug

```bash
# Verificar schema do banco
curl -X GET "http://localhost:3000/api/debug/schema-check" \
  -H "Authorization: Bearer <token>"
```

---

## Documentação OpenAPI

```bash
# Obter especificação OpenAPI
curl -X GET "http://localhost:3000/api/docs/openapi.json"
```

---

## Notas de Uso no N8N

### Importando no N8N
1. Abra o N8N e crie um novo workflow
2. Adicione um node "HTTP Request"
3. Clique em "Import cURL"
4. Cole o comando curl desejado
5. Substitua `<token>` pelo token JWT real

### Variáveis de Ambiente Recomendadas
- `{{$env.SINESYS_BASE_URL}}` - URL base da API
- `{{$env.SINESYS_API_TOKEN}}` - Token de autenticação
- `{{$env.SINESYS_SERVICE_KEY}}` - API Key de serviço

### Exemplo de Configuração N8N
```json
{
  "method": "GET",
  "url": "={{$env.SINESYS_BASE_URL}}/api/acervo",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "options": {
    "headerName": "Authorization",
    "headerValue": "Bearer {{$env.SINESYS_API_TOKEN}}"
  }
}
```
