# Captura de Partes - Módulo Técnico

## Visão Geral

Este módulo implementa a captura automatizada de partes de processos do PJE-TRT (Processo Judicial Eletrônico dos Tribunais Regionais do Trabalho). Ele identifica automaticamente quais partes são nossos clientes, quais são partes contrárias, e quais são terceiros (peritos, MP, etc.), persistindo todas as informações no banco de dados com relacionamentos corretos.

## Arquitetura

O módulo é composto por três arquivos principais:

```
backend/captura/services/partes/
├── partes-capture.service.ts      # Orquestração end-to-end da captura
├── identificacao-partes.service.ts # Lógica de identificação de tipo de parte
├── types.ts                        # Tipos TypeScript
└── __tests__/
    └── identificacao-partes.test.ts # 78 testes unitários
```

### Separação de Responsabilidades

1. **partes-capture.service.ts**: Orquestra todo o fluxo de captura

   - Busca partes via API PJE
   - Chama identificação de tipo
   - Faz upsert nas tabelas apropriadas
   - Salva representantes e endereços
   - Cria vínculos processo-partes

2. **identificacao-partes.service.ts**: Lógica pura de classificação

   - Sem dependências de banco de dados
   - Algoritmo determinístico
   - Testável unitariamente

3. **types.ts**: Definições de tipos compartilhadas
   - Resultado de captura
   - Erros de processamento
   - Union types para classificação

## Algoritmo de Identificação

1. **Verifica tipo especial** (prioridade máxima)

   - Se `tipoParte` está em TIPOS_ESPECIAIS → `terceiro`
   - Exemplos: PERITO, MINISTERIO_PUBLICO, ASSISTENTE, etc.

2. **Valida documento do advogado** (executado UMA ÚNICA VEZ no início do fluxo de captura)

   - Normaliza documento do advogado (remove pontos, hífens, barras)
   - **IMPORTANTE**: Valida documento do advogado - aceita CPF (11 dígitos) ou CNPJ (14 dígitos)
   - Rejeita sequências de números iguais (00000000000, 11111111111111, etc.)
   - Se inválido, lança erro e interrompe toda a captura (evita erros repetidos por parte)

3. **Verifica representantes**

   - Para cada representante:
     - Normaliza CPF/CNPJ do representante conforme tipo
     - Valida CPF/CNPJ (11/14 dígitos, não sequência)
     - Compara com documento do advogado
     - Se match → `cliente`

4. **Fallback**
   - Se nenhum representante deu match → `parte_contraria`

## Mapeamento de Tipos

### Polo Processual

O PJE retorna polo como `'ATIVO' | 'PASSIVO' | 'OUTROS'`, mas o sistema interno usa `'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO'`.

**Mapeamento:**

- `ATIVO` → `ATIVO`
- `PASSIVO` → `PASSIVO`
- `OUTROS` → `TERCEIRO`

### Tipo de Parte

O PJE retorna `tipoParte` como string livre. O sistema valida contra enum `TipoParteProcesso`.

**Tipos válidos:**

- Partes principais: AUTOR, REU, RECLAMANTE, RECLAMADO, EXEQUENTE, EXECUTADO, etc.
- Terceiros: PERITO, MINISTERIO_PUBLICO, ASSISTENTE, TESTEMUNHA, etc.
- Fallback: OUTRO (para tipos desconhecidos)

## Validações

### Documento do Advogado (CPF ou CNPJ)

- **Suporta tanto CPF quanto CNPJ** do advogado (pessoa física ou jurídica)
- Remove caracteres não numéricos (pontos, hífens, barras)
- Valida 11 dígitos (CPF) ou 14 dígitos (CNPJ)
- Rejeita sequências de números iguais (00000000000, 11111111111111, etc.)
- **Não valida dígitos verificadores** (validação básica suficiente)
- **Validação executada UMA ÚNICA VEZ** no início do fluxo de captura

### CPF de Representante

- Remove caracteres não numéricos
- Valida 11 dígitos
- Rejeita sequências de números iguais (00000000000, 11111111111, etc.)
- **Não valida dígitos verificadores** (validação básica suficiente)

### CNPJ de Representante

- Remove caracteres não numéricos
- Valida 14 dígitos
- Rejeita sequências de números iguais (00000000000000, 11111111111111, etc.)
- **Não valida dígitos verificadores** (validação básica suficiente)

### Tratamento de Erros

- **Documento do advogado inválido**: lança erro e interrompe captura completa (evita erros repetidos)
- **CPF/CNPJ do representante inválido**: pula representante (continua com próximo)
- **Tipo de parte desconhecido**: usa 'OUTRO' como fallback (não interrompe captura)

## Fluxo de Captura Completo

```
┌──────────────────────────────────────────────────────────┐
│  1. capturarPartesProcesso()                             │
│     - Recebe: page (Playwright), processo, advogado      │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  2. validarDocumentoAdvogado()                           │
│     - Valida CPF (11 dígitos) ou CNPJ (14 dígitos)      │
│     - Se inválido, lança erro e interrompe captura      │
│     - ⚠️ EXECUTADO UMA ÚNICA VEZ (evita erros repetidos)│
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  3. obterPartesProcesso() (API PJE)                      │
│     - Busca todas as partes do processo via browser      │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  4. Loop: Para cada parte                                │
└──────────────┬───────────────────────────────────────────┘
               │
               ├──► identificarTipoParte()
               │    └─► Retorna: 'cliente' | 'parte_contraria' | 'terceiro'
               │
               ├──► processarParte()
               │    └─► Upsert em clientes / partes_contrarias / terceiros
               │        (por id_pessoa_pje)
               │
               ├──► processarEndereco()
               │    └─► Upsert em enderecos (tabela polimórfica)
               │
               ├──► processarRepresentantes()
               │    └─► Upsert em representantes para cada representante
               │
               └──► criarVinculoProcessoParte()
                    └─► Insert em processo_partes (many-to-many)
```

### Tratamento de Erros

- **Erro em uma parte**: Não interrompe processamento das demais
- **Erros são coletados**: Array `erros[]` no resultado
- **Logging detalhado**: Console logs em cada etapa
- **Resultado parcial**: Contadores refletem sucessos reais

## Uso da API

### Endpoint REST

```typescript
POST /api/captura/trt/partes
Content-Type: application/json
Authorization: Bearer <token>

{
  "processoId": 123,
  "credencialId": 1
}
```

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Partes capturadas com sucesso",
  "data": {
    "processoId": 123,
    "numeroProcesso": "0001234-56.2024.5.03.0001",
    "totalPartes": 3,
    "clientes": 1,
    "partesContrarias": 1,
    "terceiros": 1,
    "representantes": 5,
    "vinculos": 3,
    "erros": [],
    "duracaoMs": 2500
  }
}
```

### Resposta com Falha Parcial

```json
{
  "success": true,
  "message": "Captura concluída com alguns erros",
  "data": {
    "processoId": 123,
    "numeroProcesso": "0001234-56.2024.5.03.0001",
    "totalPartes": 3,
    "clientes": 1,
    "partesContrarias": 0,
    "terceiros": 1,
    "representantes": 3,
    "vinculos": 2,
    "erros": [
      {
        "parteIndex": 1,
        "parteDados": {
          "idParte": 456,
          "nome": "Empresa XYZ LTDA"
        },
        "erro": "Erro ao fazer upsert: CNPJ inválido"
      }
    ],
    "duracaoMs": 3200
  }
}
```

## Exemplos de Código

### Exemplo 1: Uso Direto do Serviço

```typescript
import { capturarPartesProcesso } from '@/backend/captura/services/partes/partes-capture.service';
import type { Page } from 'playwright';

const page: Page = ...; // Página autenticada no PJE

const processo = {
  id: 123,
  numero_processo: '0001234-56.2024.5.03.0001',
  id_pje: 456789,
  trt: '03',
  grau: 'primeiro_grau' as const,
};

const advogado = {
  id: 1,
  documento: '123.456.789-00',
  nome: 'Dr. João Silva',
};

const resultado = await capturarPartesProcesso(page, processo, advogado);

console.log(`Capturados: ${resultado.clientes} clientes, ${resultado.partesContrarias} partes contrárias`);
console.log(`Erros: ${resultado.erros.length}`);
```

### Exemplo 2: Identificação Manual

```typescript
import { identificarTipoParte } from "@/backend/captura/services/partes/identificacao-partes.service";
import type { PartePJE } from "@/backend/api/pje-trt/partes/types";

const parte: PartePJE = {
  idParte: 123,
  idPessoa: 456,
  nome: "Maria Santos",
  tipoParte: "AUTOR",
  polo: "ATIVO",
  numeroDocumento: "987.654.321-00",
  tipoDocumento: "CPF",
  representantes: [
    {
      idRepresentante: 1,
      idPessoa: 789,
      nome: "Dr. João Silva",
      numeroDocumento: "123.456.789-00", // Mesmo documento do advogado
      tipoDocumento: "CPF",
      numeroOAB: "12345",
      ufOAB: "MG",
      // ...
    },
  ],
  // ...
};

const advogado = {
  id: 1,
  cpf: "123.456.789-00",
};

const tipo = identificarTipoParte(parte, advogado);
// Retorna: 'cliente'
```

### Exemplo 3: Normalização de CPF

```typescript
import { normalizarCpf } from "@/backend/captura/services/partes/identificacao-partes.service";

normalizarCpf("123.456.789-00"); // "12345678900"
normalizarCpf("123 456 789 00"); // "12345678900"
normalizarCpf("12345678900"); // "12345678900"
normalizarCpf(""); // ""
normalizarCpf(null); // ""
```

### Exemplo 4: Verificação de Tipo Especial

```typescript
import { isTipoEspecial } from "@/backend/captura/services/partes/identificacao-partes.service";

isTipoEspecial("PERITO"); // true
isTipoEspecial("perito"); // true (case-insensitive)
isTipoEspecial("PERITO_CONTADOR"); // true
isTipoEspecial("MINISTERIO_PUBLICO"); // true
isTipoEspecial("AUTOR"); // false
isTipoEspecial("REU"); // false
isTipoEspecial(""); // false
```

## Testes

### Testes Unitários (78 testes, 100% passing)

```bash
# Executar testes de identificação
npx tsx backend/captura/services/partes/__tests__/identificacao-partes.test.ts
```

**Cobertura de testes**:

- ✅ `normalizarCpf()` - 6 testes
- ✅ `isTipoEspecial()` - 11 testes
- ✅ `identificarTipoParte()` validações - 3 testes
- ✅ `identificarTipoParte()` tipos especiais - 4 testes
- ✅ `identificarTipoParte()` cliente - 6 testes
- ✅ `identificarTipoParte()` parte contrária - 4 testes
- ✅ `identificarTipoParte()` edge cases - 5 testes

### Teste de Integração API PJE

```bash
# Testar API real do PJE (requer credenciais)
npx tsx dev_data/scripts/test-pje-partes-api.ts
```

**Configuração necessária** em `dev_data/scripts/test-pje-partes-api.ts`:

```typescript
const CONFIG_TESTE = {
  credencialId: 1, // ID da credencial no banco
  idProcesso: 0, // ⚠️ AJUSTAR! ID PJE do processo
  trt: 5, // TRT do processo
  timeout: 60000,
};
```

**O que o teste verifica**:

- Autenticação no PJE com 2FA
- Busca de partes via `obterPartesProcesso()`
- Busca de representantes via `obterRepresentantesPartePorID()`
- Formatação correta dos dados retornados

## Estrutura de Dados

### Tabelas Afetadas

1. **clientes** - Partes representadas pelo escritório
2. **partes_contrarias** - Partes opostas
3. **terceiros** - Partes especiais (peritos, MP, etc.)
4. **representantes** - Advogados e representantes das partes
5. **enderecos** - Endereços (tabela polimórfica)
6. **processo_partes** - Vínculos many-to-many processo ↔ partes

### Relacionamentos

```
acervo (processos)
   │
   │ 1:N
   ▼
processo_partes (vínculo)
   │
   │ N:1
   ├──► clientes
   ├──► partes_contrarias
   └──► terceiros
        │
        │ 1:N
        ▼
   representantes
        │
        │ 1:1
        ▼
   enderecos (polimórfico)
```

### Upsert por id_pessoa_pje

Todas as entidades (clientes, partes_contrarias, terceiros, representantes, enderecos) usam **upsert por id_pessoa_pje** (ou id_pje para endereços):

- **ON CONFLICT**: Se `id_pessoa_pje` já existe, atualiza os dados
- **INSERT**: Se não existe, cria novo registro
- **Vantagem**: Evita duplicatas ao recapturar mesmo processo

## Mapeamento de Campos PJE → Banco

O serviço `processarParte()` mapeia os campos do JSON do PJE (`PartePJE.dadosCompletos`) para as tabelas do banco de dados. Abaixo, a tabela completa dos campos mapeados, separados por categoria.

### Campos Comuns (PF e PJ)

| Campo Banco      | Campo PJE                   | Obrigatório | Descrição                        |
| ---------------- | --------------------------- | ----------- | -------------------------------- |
| `tipo_documento` | `parte.tipoDocumento`       | Sim         | Tipo do documento (CPF/CNPJ)     |
| `status_pje`     | `dadosCompletos.status`     | Não         | Status da pessoa no PJE          |
| `situacao_pje`   | `dadosCompletos.situacao`   | Não         | Situação da pessoa no PJE        |
| `login_pje`      | `dadosCompletos.login`      | Não         | Login da pessoa no PJE           |
| `autoridade`     | `dadosCompletos.autoridade` | Não         | Indica se é autoridade (boolean) |

### Campos Específicos de PF (Pessoa Física)

| Campo Banco                  | Campo PJE                                | Obrigatório | Descrição                                      |
| ---------------------------- | ---------------------------------------- | ----------- | ---------------------------------------------- |
| `sexo`                       | `dadosCompletos.sexo`                    | Não         | Sexo da pessoa                                 |
| `nome_genitora`              | `dadosCompletos.nomeGenitora`            | Não         | Nome da genitora                               |
| `naturalidade_*`             | `dadosCompletos.naturalidade`            | Não         | Estrutura completa da naturalidade             |
| `uf_nascimento_*`            | `dadosCompletos.ufNascimento`            | Não         | UF de nascimento                               |
| `pais_nascimento_*`          | `dadosCompletos.paisNascimento`          | Não         | País de nascimento                             |
| `escolaridade_codigo`        | `dadosCompletos.escolaridade`            | Não         | Código da escolaridade                         |
| `situacao_cpf_receita_*`     | `dadosCompletos.situacaoCpfReceita`      | Não         | Situação do CPF na Receita                     |
| `pode_usar_celular_mensagem` | `dadosCompletos.podeUsarCelularMensagem` | Não         | Permissão para mensagens via celular (boolean) |

### Campos Específicos de PJ (Pessoa Jurídica)

| Campo Banco               | Campo PJE                            | Obrigatório | Descrição                              |
| ------------------------- | ------------------------------------ | ----------- | -------------------------------------- |
| `inscricao_estadual`      | `dadosCompletos.inscricaoEstadual`   | Não         | Inscrição estadual                     |
| `data_abertura`           | `dadosCompletos.dataAbertura`        | Não         | Data de abertura da empresa            |
| `orgao_publico`           | `dadosCompletos.orgaoPublico`        | Não         | Indica se é órgão público (boolean)    |
| `tipo_pessoa_codigo_pje`  | `dadosCompletos.tipoPessoa.codigo`   | Não         | Código do tipo de pessoa no PJE        |
| `tipo_pessoa_label_pje`   | `dadosCompletos.tipoPessoa.label`    | Não         | Label do tipo de pessoa no PJE         |
| `situacao_cnpj_receita_*` | `dadosCompletos.situacaoCnpjReceita` | Não         | Situação do CNPJ na Receita            |
| `ramo_atividade`          | `dadosCompletos.ramoAtividade`       | Não         | Ramo de atividade                      |
| `cpf_responsavel`         | `dadosCompletos.cpfResponsavel`      | Não         | CPF do responsável                     |
| `oficial`                 | `dadosCompletos.oficial`             | Não         | Indica se é oficial (boolean)          |
| `porte_codigo`            | `dadosCompletos.porte.codigo`        | Não         | Código do porte                        |
| `porte_descricao`         | `dadosCompletos.porte.descricao`     | Não         | Descrição do porte                     |
| `ultima_atualizacao_pje`  | `dadosCompletos.ultimaAtualizacao`   | Não         | Timestamp da última atualização no PJE |

**Notas sobre o mapeamento:**

- Campos marcados como "Não" são opcionais e usam optional chaining (`?.`) para evitar erros se não estiverem presentes no JSON do PJE.
- Tipos são convertidos conforme necessário (strings para números, datas para ISO).
- Logs de debug são adicionados para campos não encontrados.
- O campo `dados_anteriores` é usado para auditoria: armazena o estado anterior do registro antes da atualização. É sempre `null` na criação e populado automaticamente no update com o estado completo anterior.

## Deduplicação

A deduplicação de entidades (clientes, partes contrárias e terceiros) é baseada no campo `id_pessoa_pje`, que representa o ID único da pessoa no sistema PJE.

- **Chave primária de deduplicação**: `id_pessoa_pje` com constraint UNIQUE, garantindo que não há duplicatas de pessoas oriundas do PJE.
- **Upsert por `id_pessoa_pje`**: Se o ID já existe, os dados são atualizados; caso contrário, um novo registro é criado.
- **Vantagem**: Evita duplicatas ao recapturar mesmo processo

## Tratamento de Erros

Erros de persistência são tratados especificamente para fornecer mensagens claras e facilitar o debug.

### Códigos de Erro Específicos

- **23505 (UNIQUE violation)**: Violação de constraint UNIQUE (duplicata de CPF, CNPJ ou `id_pessoa_pje`).

### Como os Erros de Constraint São Tratados

- No `catch` dos serviços de persistência (`cliente-persistence.service.ts` e `parte-contraria-persistence.service.ts`), o código detecta erros de constraint e retorna mensagens específicas.
- Para erros genéricos, uma mensagem padrão é usada.

### Mensagens de Erro Retornadas

- **CPF duplicado**: `'Cliente com este CPF já cadastrado (id_pessoa_pje: X)'` ou `'Parte contrária com este CPF já cadastrada (id_pessoa_pje: X)'`
- **CNPJ duplicado**: `'Cliente com este CNPJ já cadastrado (id_pessoa_pje: X)'` ou `'Parte contrária com este CNPJ já cadastrada (id_pessoa_pje: X)'`
- **`id_pessoa_pje` duplicado**: `'Pessoa PJE já cadastrada como cliente (ID: X)'` ou `'Pessoa PJE já cadastrada como parte contrária (ID: X)'`
- **Outros erros**: Mensagem genérica com detalhes do erro original.

## Captura de Representantes

Representantes são advogados, defensores públicos, procuradores e outros profissionais que atuam em nome das partes em um processo judicial. Eles são capturados automaticamente durante o processamento de partes do PJE-TRT e armazenados na tabela `representantes` com vínculo à parte específica.

A tabela `representantes` possui uma constraint UNIQUE `(id_pessoa_pje, trt, grau, parte_id, parte_tipo, numero_processo)` que garante um representante único por contexto completo (parte + processo). Isso significa que o mesmo representante pode atuar em múltiplos processos, mas cada atuação é registrada como um registro separado na tabela.

### Campos Obrigatórios

- `id_pessoa_pje`: ID único da pessoa no PJE
- `parte_tipo`: Tipo da parte ('cliente', 'parte_contraria', 'terceiro')
- `parte_id`: ID da parte na tabela correspondente
- `trt`: Tribunal Regional do Trabalho (ex: '03')
- `grau`: Grau do processo ('primeiro_grau', 'segundo_grau')
- `numero_processo`: Número completo do processo
- `tipo_pessoa`: Tipo da pessoa ('pf' para pessoa física, 'pj' para pessoa jurídica)
- `nome`: Nome completo do representante
- `cpf`: CPF do representante (obrigatório para PF)
- `cnpj`: CNPJ do representante (obrigatório para PJ)

### Campos Opcionais

- `numero_oab`: Número da Ordem dos Advogados do Brasil
- `situacao_oab`: Situação atual na OAB
- `tipo`: Tipo do representante (advogado, defensor, procurador, etc.)
- `emails`: Lista de endereços de email
- `ddd_telefone` / `numero_telefone`: Telefone residencial
- `ddd_celular` / `numero_celular`: Telefone celular
- `ddd_comercial` / `numero_comercial`: Telefone comercial
- Campos específicos de PF: `sexo`, `data_nascimento`, `nome_mae`, `nome_pai`, `nacionalidade`, `estado_civil`, `uf_nascimento`, `municipio_nascimento`, `pais_nascimento`
- Campos específicos de PJ: `razao_social`, `nome_fantasia`, `inscricao_estadual`, `tipo_empresa`
- `endereco_id`: ID do endereço vinculado (se disponível)

## Validações de Representantes

### CPF (Pessoa Física)

- Validação completa com dígitos verificadores usando algoritmo oficial
- Obrigatório para representantes do tipo pessoa física
- Rejeita CPFs com todos os dígitos iguais (sequências como "11111111111")
- Remove formatação automática (pontos e hífens)

### CNPJ (Pessoa Jurídica)

- Validação completa com dígitos verificadores usando algoritmo oficial
- Obrigatório para representantes do tipo pessoa jurídica
- Rejeita CNPJs com todos os dígitos iguais (sequências como "00000000000000")
- Remove formatação automática (pontos, barras e hífens)

### OAB (Ordem dos Advogados do Brasil)

- Formato: UF (2 letras maiúsculas) + número (3-6 dígitos)
- Exemplos válidos: "MG123456", "SP12345", "RJ1234"
- Opcional: Defensores públicos e procuradores não possuem registro na OAB
- Valida UF contra lista oficial de estados brasileiros

### Email

- Formato simplificado RFC 5322: `usuario@dominio.tld`
- Opcional: Nem todos os representantes possuem email cadastrado
- Validação básica: presença de '@' e domínio

## Mapeamento de Campos PJE → Banco

O serviço `extrairCamposRepresentantePJE()` mapeia os campos do JSON do PJE (`RepresentantePJE.dadosCompletos`) para a tabela `representantes`. Abaixo, a tabela completa dos campos mapeados.

### Campos Comuns (PF e PJ)

| Campo PJE                              | Campo Banco             | Observações                         |
| -------------------------------------- | ----------------------- | ----------------------------------- |
| `dadosCompletos.situacao`              | `situacao_pje`          | Status da pessoa no PJE             |
| `dadosCompletos.status`                | `status_pje`            | Situação da pessoa no PJE           |
| `dadosCompletos.principal`             | `principal`             | Indica se é representante principal |
| `dadosCompletos.endereco_desconhecido` | `endereco_desconhecido` | Flag para endereço desconhecido     |
| `dadosCompletos.id_tipo_parte`         | `id_tipo_parte`         | ID do tipo de parte no PJE          |
| `dadosCompletos.polo`                  | `polo`                  | Polo processual (ATIVO/PASSIVO)     |

### Campos Específicos de PF (Pessoa Física)

| Campo PJE                             | Campo Banco            | Observações                        |
| ------------------------------------- | ---------------------- | ---------------------------------- |
| `dadosCompletos.sexo`                 | `sexo`                 | Campo aninhado em `dadosCompletos` |
| `dadosCompletos.data_nascimento`      | `data_nascimento`      | Campo aninhado em `dadosCompletos` |
| `dadosCompletos.nome_mae`             | `nome_mae`             | Campo aninhado em `dadosCompletos` |
| `dadosCompletos.nome_pai`             | `nome_pai`             | Campo aninhado em `dadosCompletos` |
| `dadosCompletos.nacionalidade`        | `nacionalidade`        | Campo aninhado em `dadosCompletos` |
| `dadosCompletos.estado_civil`         | `estado_civil`         | Campo aninhado em `dadosCompletos` |
| `dadosCompletos.uf_nascimento`        | `uf_nascimento`        | Campo aninhado em `dadosCompletos` |
| `dadosCompletos.municipio_nascimento` | `municipio_nascimento` | Campo aninhado em `dadosCompletos` |
| `dadosCompletos.pais_nascimento`      | `pais_nascimento`      | Campo aninhado em `dadosCompletos` |

### Campos Específicos de PJ (Pessoa Jurídica)

| Campo PJE                           | Campo Banco          | Observações                        |
| ----------------------------------- | -------------------- | ---------------------------------- |
| `dadosCompletos.razao_social`       | `razao_social`       | Campo aninhado em `dadosCompletos` |
| `dadosCompletos.nome_fantasia`      | `nome_fantasia`      | Campo aninhado em `dadosCompletos` |
| `dadosCompletos.inscricao_estadual` | `inscricao_estadual` | Campo aninhado em `dadosCompletos` |
| `dadosCompletos.tipo_empresa`       | `tipo_empresa`       | Campo aninhado em `dadosCompletos` |

**Notas sobre o mapeamento:**

- Campos extraídos de `dadosCompletos` são aninhados no JSON do PJE
- Logs de debug são adicionados para campos não encontrados
- Mapeamento é feito via função auxiliar `extrairCamposRepresentantePJE()`

## Tratamento de Erros

Erros durante o processamento de representantes são tratados de forma a não interromper a captura das demais partes e representantes.

### Tipos de Erro

- **Constraint UNIQUE violation**: Representante já existe para esta parte neste processo (código 23505)
- **CPF/CNPJ inválido**: Validação dos dígitos verificadores falhou
- **Parte não encontrada**: Violação de chave estrangeira (FK violation, código 23503)
- **Campos obrigatórios ausentes**: Violação de NOT NULL (código 23502)

### Comportamento

- Erro em um representante não interrompe o processamento dos demais
- Erros são coletados no array `erros[]` do resultado da captura
- Logs detalhados são gerados para facilitar debug
- Contadores refletem apenas sucessos (representantes salvos com sucesso)

## Exemplos de Casos Edge

### Representante sem OAB (Defensor Público)

```typescript
// Defensor público não possui número OAB
const representanteDefensor = {
  id_pessoa_pje: 12345,
  nome: "Dr. João Defensor",
  tipo_pessoa: "pf",
  cpf: "12345678900",
  numero_oab: null, // Campo opcional
  situacao_oab: null,
  // ... outros campos
};
```

### Representante PJ (Escritório de Advocacia)

```typescript
// Escritório de advocacia com CNPJ
const representanteEscritorio = {
  id_pessoa_pje: 67890,
  nome: "Escritório Silva & Associados",
  tipo_pessoa: "pj",
  cnpj: "12345678000123",
  razao_social: "Silva & Associados Advogados Ltda",
  numero_oab: null, // Escritórios podem não ter OAB própria
  // ... outros campos
};
```

### Representante sem Endereço

```typescript
// Representante com endereço desconhecido
const representanteSemEndereco = {
  id_pessoa_pje: 11111,
  nome: "Dra. Maria Santos",
  tipo_pessoa: "pf",
  cpf: "98765432100",
  endereco_desconhecido: true,
  endereco_id: null, // Sem vínculo de endereço
  // ... outros campos
};
```

### Representante Atuando em Múltiplos Processos

```typescript
// Mesmo representante em dois processos diferentes
const representanteMultiplo1 = {
  id_pessoa_pje: 22222,
  nome: "Dr. Carlos Oliveira",
  tipo_pessoa: "pf",
  cpf: "11122233344",
  parte_id: 1, // Parte no processo A
  numero_processo: "0001234-56.2024.5.03.0001",
  // ... outros campos
};

const representanteMultiplo2 = {
  id_pessoa_pje: 22222, // Mesmo ID PJE
  nome: "Dr. Carlos Oliveira", // Mesmo nome
  tipo_pessoa: "pf",
  cpf: "11122233344", // Mesmo CPF
  parte_id: 2, // Parte diferente no processo B
  numero_processo: "0005678-90.2024.5.03.0002", // Processo diferente
  // ... outros campos
};
// Resultado: Dois registros na tabela representantes
```

### Address Processing

**Overview**:

- Addresses are extracted from `parte.dadosCompletos.endereco` (PJE API response)
- Stored in normalized `enderecos` table (not JSONB)
- Linked to entities via `endereco_id` FK in entity tables

**Flow**:

1. `processarEndereco()` extracts address from `PartePJE.dadosCompletos.endereco`
2. Maps PJE fields to database columns (see field mapping table below)
3. Calls `upsertEnderecoPorIdPje()` with `id_pje` + `entidade_tipo` + `entidade_id`
4. Returns `endereco.id` or `null` if failed
5. `vincularEnderecoNaEntidade()` updates entity's `endereco_id` FK

**Field Mapping** (PJE → Database):

| PJE Field                | Database Column              | Notes                                |
| ------------------------ | ---------------------------- | ------------------------------------ |
| `id`                     | `id_pje`                     | Required, must be > 0                |
| `logradouro`             | `logradouro`                 | Street address                       |
| `numero`                 | `numero`                     | Street number                        |
| `complemento`            | `complemento`                | Address complement                   |
| `bairro`                 | `bairro`                     | Neighborhood                         |
| `idMunicipio`            | `id_municipio_pje`           | Municipality ID in PJE               |
| `municipio`              | `municipio`                  | Municipality name                    |
| `municipioIbge`          | `municipio_ibge`             | IBGE municipality code               |
| `estado.id`              | `estado_id_pje`              | State ID in PJE                      |
| `estado.sigla`           | `estado_sigla`               | State abbreviation (2 chars)         |
| `estado.descricao`       | `estado_descricao`           | State full name                      |
| `estado` (top-level)     | `estado`                     | Fallback to top-level state string   |
| `pais.id`                | `pais_id_pje`                | Country ID in PJE                    |
| `pais.codigo`            | `pais_codigo`                | Country code                         |
| `pais.descricao`         | `pais_descricao`             | Country full name                    |
| `pais` (top-level)       | `pais`                       | Fallback to top-level country string |
| `nroCep`                 | `cep`                        | Postal code                          |
| `classificacoesEndereco` | `classificacoes_endereco`    | JSONB array of {codigo, descricao}   |
| `correspondencia`        | `correspondencia`            | Boolean flag for mailing address     |
| `situacao`               | `situacao`                   | Address situation (A, I, P, H)       |
| `idUsuarioCadastrador`   | `id_usuario_cadastrador_pje` | PJE user who registered              |
| `dtAlteracao`            | `data_alteracao_pje`         | Last modification date               |
| `endereco` (full object) | `dados_pje_completo`         | Complete PJE address JSON for audit  |

**Validation**:

- `id_pje` must be > 0 (PJE address ID)
- At least one of: `logradouro`, `municipio`, `cep` should be present
- Incomplete addresses logged as warnings but not rejected
- Invalid addresses return `null` (capture continues)

**Representative Addresses**:

- Representatives' addresses created with **party's** `entidade_tipo` + `entidade_id`
- Representative's `endereco_id` FK links to this address
- Rationale: Avoid duplication (reps typically share party's address)
- See `processarEnderecoRepresentante()` implementation

**Error Handling**:

- Address processing errors don't stop party capture
- Errors logged with context (party name, `id_pje`, `tipoParte`)
- Returns `null` on failure (entity still created, just without address link)

**Related Files**:

- `backend/enderecos/services/enderecos-persistence.service.ts` - Address CRUD
- `backend/types/partes/enderecos-types.ts` - Type definitions
- `supabase/migrations/20251126000000_create_enderecos_table.sql` - Table schema
- `supabase/migrations/20251124000000_add_endereco_id_to_partes.sql` - FK columns

## Performance

### Métricas Típicas

| Cenário           | Partes | Representantes | Duração | Observações                          |
| ----------------- | ------ | -------------- | ------- | ------------------------------------ |
| Processo simples  | 2      | 2              | 1.5-2s  | Autor + Réu com 1 advogado cada      |
| Processo médio    | 4      | 6              | 2-3s    | Múltiplas partes e advogados         |
| Processo complexo | 10+    | 15+            | 4-6s    | Litisconsórcio, assistentes, peritos |

### Otimizações

- ✅ Partes processadas sequencialmente (evita race conditions)
- ✅ Representantes salvos em lote por parte
- ✅ Upsert usa índices de id_pessoa_pje (performance de lookup)
- ✅ Logs com console.log (assíncrono, não bloqueia)
- ⚠️ API PJE pode ser lenta (depende do tribunal)

## Troubleshooting

### Problema: Todas as partes sendo classificadas como parte_contraria

**Causa**: Documento do advogado não está cadastrado corretamente ou representantes não têm CPF/CNPJ

**Solução**:

1. Verificar documento do advogado no banco: `SELECT id, nome, documento FROM advogados WHERE id = X`
2. Verificar se representantes têm CPF/CNPJ no PJE
3. Adicionar logs para debug:

```typescript
console.log("Documento advogado:", advogado.documento);
console.log("Documento representante:", representante.numeroDocumento);
```

### Problema: Perito sendo classificado como cliente

**Causa**: Tipo não está na lista TIPOS_ESPECIAIS ou tem formatação diferente

**Solução**:

1. Verificar `tipoParte` retornado pelo PJE
2. Adicionar novo tipo à lista em `identificacao-partes.service.ts`:

```typescript
const TIPOS_ESPECIAIS = [
  // ...
  "NOVO_TIPO_PERITO",
];
```

3. Executar testes:

```bash
npx tsx backend/captura/services/partes/__tests__/identificacao-partes.test.ts
```

### Problema: Erro "Parte e advogado são obrigatórios"

**Causa**: Parâmetros null/undefined sendo passados

**Solução**:

```typescript
// ✅ Correto
const advogado = {
  id: 1,
  cpf: "123.456.789-00",
};

// ❌ Incorreto
const advogado = null;
```

### Problema: Duplicatas de clientes/partes

**Causa**: Upsert por id_pessoa_pje não está funcionando (chave duplicada ou índice ausente)

**Solução**:

1. Verificar constraint UNIQUE em id_pessoa_pje:

```sql
-- Deve ter constraint UNIQUE
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'clientes' AND constraint_type = 'UNIQUE';
```

2. Verificar migrações aplicadas:

```bash
npx supabase db remote commit
```

### Problema: Performance lenta (>10s por processo)

**Causa**: Muitas queries ao banco ou API PJE lenta

**Solução**:

1. Verificar logs do banco (query lenta)
2. Verificar latência da API PJE (timeout)
3. Considerar aumentar timeout:

```typescript
const resultado = await capturarPartesProcesso(page, processo, advogado);
// Se timeout, aumentar SCRAPING_TIMEOUT em .env.local
```

## Logs e Debugging

### Níveis de Log

```typescript
// INFO - Operações normais
console.log("[CAPTURA-PARTES] Iniciando captura...");

// WARNING - Situações incomuns mas não fatais
console.warn("[IDENTIFICACAO] Parte sem representantes");

// ERROR - Falhas que requerem atenção
console.error("[CAPTURA-PARTES] Erro ao processar parte:", error);

// DEBUG - Informações detalhadas (comentar em produção)
console.debug("[IDENTIFICACAO] CPF do representante não corresponde");
```

### Exemplo de Logs Completos

```
[CAPTURA-PARTES] Iniciando captura de partes do processo 0001234-56.2024.5.03.0001 (ID: 123)
[CAPTURA-PARTES] Encontradas 3 partes no processo 0001234-56.2024.5.03.0001
[CAPTURA-PARTES] Processando parte 1/3: MARIA SANTOS
[IDENTIFICACAO] Parte "MARIA SANTOS" (AUTOR) identificada como CLIENTE (representada por Dr. João Silva - 12345/MG)
[CAPTURA-PARTES] Processando parte 2/3: EMPRESA XYZ LTDA
[IDENTIFICACAO] Parte "EMPRESA XYZ LTDA" identificada como PARTE_CONTRARIA (2 representantes, nenhum do escritório)
[CAPTURA-PARTES] Processando parte 3/3: JOSÉ PERITO
[IDENTIFICACAO] Parte "JOSÉ PERITO" (PERITO) identificada como TERCEIRO (tipo especial)
[CAPTURA-PARTES] Captura concluída para processo 0001234-56.2024.5.03.0001: Clientes: 1, Partes Contrárias: 1, Terceiros: 1, Representantes: 5, Vínculos: 3, Erros: 0, Tempo: 2500ms
```

## Manutenção

### Adicionar Novo Tipo Especial

1. Editar `identificacao-partes.service.ts`:

```typescript
const TIPOS_ESPECIAIS = [
  // ... tipos existentes
  "NOVO_TIPO",
] as const;
```

2. Adicionar teste em `__tests__/identificacao-partes.test.ts`:

```typescript
it("deve identificar NOVO_TIPO como terceiro", () => {
  const parte = createParteMock({
    tipoParte: "NOVO_TIPO",
    representantes: [],
  });
  expect(identificarTipoParte(parte, mockAdvogado)).toBe("terceiro");
});
```

3. Executar testes:

```bash
npx tsx backend/captura/services/partes/__tests__/identificacao-partes.test.ts
```

### Modificar Algoritmo de Identificação

⚠️ **CUIDADO**: Mudanças no algoritmo afetam classificação de todos os processos

**Processo recomendado**:

1. Adicionar testes para novo comportamento
2. Modificar função
3. Executar todos os 78 testes
4. Testar em processos reais no ambiente de dev
5. Documentar mudança em `tasks.md` da OpenSpec

## Referências

- **PJE-TRT API**: [`backend/api/pje-trt/partes/`](../../../api/pje-trt/partes/)
- **Persistence Services**:
  - Clientes: [`backend/clientes/services/persistence/`](../../../clientes/services/persistence/)
  - Partes Contrárias: [`backend/partes-contrarias/services/persistence/`](../../../partes-contrarias/services/persistence/)
  - Terceiros: [`backend/terceiros/services/persistence/`](../../../terceiros/services/persistence/)
  - Representantes: [`backend/representantes/services/`](../../../representantes/services/)
  - Endereços: [`backend/enderecos/services/`](../../../enderecos/services/)
  - Vínculo Processo-Partes: [`backend/processo-partes/services/persistence/`](../../../processo-partes/services/persistence/)
- **OpenSpec Change**: [`openspec/changes/captura-partes-pje/`](../../../../openspec/changes/captura-partes-pje/)

---

**Última atualização**: 2025-11-24
**Versão do módulo**: 1.0.0
**Autor**: Sistema Sinesys - Zattar Advogados
