# API Meu Processo - Integração Cliente

API para integração com o aplicativo cliente-facing "Meu Processo Zattar Advogados".

## Endpoint Principal

### `POST /api/meu-processo/consulta`

Consulta todos os dados de um cliente pelo CPF.

#### Autenticação

```bash
x-service-api-key: <SERVICE_API_KEY>
```

A chave deve ser configurada na variável de ambiente `SERVICE_API_KEY`.

#### Request

```json
{
  "cpf": "12345678901"
}
```

#### Response (Formato Legado)

```json
{
  "contratos": [
    {
      "cliente_nome": "João da Silva",
      "cliente_cpf": "12345678901",
      "parte_contraria": "Empresa XYZ Ltda",
      "processo_tipo_nome": "Ação Trabalhista",
      "data_admissao": "2020-01-15",
      "data_rescisao": "2023-06-30",
      "data_assinou_contrato": "2023-08-01",
      "estagio": "Em andamento",
      "data_estagio": "2024-01-10",
      "numero_processo": "0001234-56.2024.5.03.0001"
    }
  ],
  "processos": [
    {
      "processo": {
        "parteAutora": "João da Silva",
        "parteRe": "Empresa XYZ Ltda",
        "tribunal": "TRT da 3ª Região (MG)",
        "numero": "0001234-56.2024.5.03.0001",
        "valorDaCausa": "50000.00",
        "jurisdicaoEstado": "MG",
        "jurisdicaoMunicipio": "Belo Horizonte",
        "instancias": {
          "primeirograu": {
            "dataAjuizamento": "2024-01-10",
            "movimentos": []
          },
          "segundograu": null,
          "terceirograu": null
        }
      }
    }
  ],
  "audiencias": [
    {
      "data_hora": "15/03/2025 14:00",
      "polo_ativo": "João da Silva",
      "polo_passivo": "Empresa XYZ Ltda",
      "numero_processo": "0001234-56.2024.5.03.0001",
      "modalidade": "Virtual",
      "local_link": "https://zoom.us/j/123456789",
      "status": "Designada",
      "orgao_julgador": "1ª Vara do Trabalho de Belo Horizonte",
      "tipo": "Audiência de Instrução",
      "sala": "",
      "advogado": "",
      "detalhes": null,
      "cliente_nome": "João da Silva"
    }
  ],
  "acordos_condenacoes": [
    {
      "numero_processo": "0001234-56.2024.5.03.0001",
      "parte_autora": "João da Silva",
      "parte_contraria": "Empresa XYZ Ltda",
      "data_homologacao": "2024-11-15",
      "tipo_pagamento": "Acordo",
      "forma_pagamento": "Parcelado",
      "modalidade_pagamento": "Depósito em conta",
      "valor_bruto": "50000.00",
      "valor_liquido": "50000.00",
      "quantidade_parcelas": 5,
      "parcela_numero": 1,
      "data_vencimento": "2024-12-15",
      "valor_liquido_parcela": "10000.00",
      "repassado_cliente": "Y",
      "data_repassado_cliente": "2024-12-16"
    }
  ],
  "message": "Dados encontrados com sucesso"
}
```

#### Erros

##### 400 - Bad Request
```json
{
  "error": "CPF inválido - deve conter 11 dígitos numéricos"
}
```

##### 401 - Unauthorized
```json
{
  "error": "Autenticação inválida"
}
```

##### 500 - Internal Server Error
```json
{
  "error": "Erro ao processar consulta",
  "details": "Detalhes do erro"
}
```

## Arquitetura

### Camada de Abstração

A integração utiliza três componentes principais:

1. **SinesysClient** (`lib/services/sinesys-client.ts`)
   - Cliente HTTP para chamadas à API
   - Retry automático
   - Timeout configurável
   - Tratamento de erros

2. **Transformadores** (`lib/transformers/meu-processo-transformers.ts`)
   - Conversão de dados Sinesys → Formato Legado
   - Mapeamento de campos
   - Formatação de valores

3. **Tipos** (`lib/types/meu-processo-types.ts`)
   - Interfaces TypeScript
   - Tipos de resposta do Sinesys
   - Tipos do formato legado

### Fluxo de Dados

```
[App Meu Processo] 
    ↓ POST /api/meu-processo/consulta
[API Route]
    ↓ CPF
[SinesysClient]
    ↓ Chamadas paralelas
[APIs Sinesys]
    - /api/acervo/cliente/cpf/{cpf}
    - /api/audiencias/cliente/cpf/{cpf}
    - /api/clientes/buscar/por-cpf/{cpf}
    - /api/contratos?clienteId={id}
    - /api/acordos-condenacoes?processoId={id}
    ↓ Respostas
[Transformadores]
    ↓ Formato Legado
[App Meu Processo]
```

## Configuração

### Variáveis de Ambiente

```env
# API Sinesys
NEXT_PUBLIC_SINESYS_API_URL=http://localhost:3000
SINESYS_SERVICE_API_KEY=sua_chave_secreta

# Timeout (opcional, padrão: 30000ms)
SINESYS_TIMEOUT=30000

# Retries (opcional, padrão: 2)
SINESYS_RETRIES=2
```

## Performance

### Cache

A resposta inclui header de cache:

```
Cache-Control: private, max-age=300
```

O cliente pode cachear a resposta por 5 minutos.

### Otimizações

- Chamadas paralelas com `Promise.allSettled()`
- Retry exponencial com backoff
- Timeout configurável
- Tratamento gracioso de erros (continua se um endpoint falhar)

## Compatibilidade

Esta API mantém **100% de compatibilidade** com o formato legado do webhook N8N, permitindo migração sem alterações no app cliente.

### Campos Mapeados

| Sinesys | N8N Legado | Observações |
|---------|------------|-------------|
| `processo.numero` | `processo.numero` | ✅ Direto |
| `processo.tribunal` | `processo.tribunal` | ✅ Direto |
| `audiencia.data + horario` | `audiencia.data_hora` | 🔄 Combinado |
| `acordo.parcelas[]` | `acordos_condenacoes[]` | 🔄 Flattened |

## Segurança

- ✅ Autenticação via Service API Key
- ✅ Validação de CPF
- ✅ Sanitização de dados
- ✅ Rate limiting (configurável)
- ✅ Logs mascarados (CPF parcialmente oculto)

## Monitoramento

Logs estruturados:

```
[Meu Processo] Buscando dados para CPF: *******8901
[Meu Processo] Dados encontrados - Processos: 3, Audiências: 5
```

## Exemplo de Uso

```bash
curl -X POST http://localhost:3000/api/meu-processo/consulta \
  -H "Content-Type: application/json" \
  -H "x-service-api-key: sua_chave_secreta" \
  -d '{"cpf": "12345678901"}'
```

## Roadmap

- [ ] Cache Redis para reduzir latência
- [ ] Webhook para notificações de atualizações
- [ ] GraphQL endpoint (alternativa ao REST)
- [ ] Suporte a filtros (ex: apenas processos ativos)
- [ ] Paginação para grandes volumes
