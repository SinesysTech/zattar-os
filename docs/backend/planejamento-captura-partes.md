# Planejamento: Captura de Partes do PJE

## Visão Geral

Este documento descreve o planejamento da implementação do backend para captura de partes de processos do PJE-TRT.

## Endpoint PJE

**URL**: `https://pje.trt{N}.jus.br/pje-comum-api/api/processos/id/{processo_id}/partes?retornaEndereco=true`

**Parâmetros**:
- `processo_id`: ID do processo no PJE

**Estrutura da Resposta**:
```json
{
  "ATIVO": [ /* array de partes do polo ativo */ ],
  "PASSIVO": [ /* array de partes do polo passivo */ ],
  "TERCEIROS": [ /* array de terceiros interessados */ ]
}
```

## Regras de Negócio

### 1. Identificação do Cliente

Para identificar quem é o cliente do escritório:
1. Verificar qual credencial foi utilizada no acesso ao TRT
2. Buscar nos `representantes` de cada polo (ATIVO ou PASSIVO)
3. O polo que contém o advogado da credencial = **nosso cliente**
4. O outro polo = **parte contrária**

**Exemplo**:
- Credencial: Pedro Zattar Eugenio (CPF 075.292.946-10)
- Advogado encontrado nos representantes do polo ATIVO
- **Resultado**: ATIVO = Cliente | PASSIVO = Parte Contrária

### 2. Destino dos Dados

| Polo PJE | Nosso Papel | Tabela Destino |
|----------|-------------|----------------|
| ATIVO (com nosso advogado) | Cliente | `clientes` |
| PASSIVO | Parte Contrária | `partes_contrarias` |
| ATIVO | Parte Contrária | `partes_contrarias` |
| PASSIVO (com nosso advogado) | Cliente | `clientes` |
| TERCEIROS | Terceiro Interessado | `terceiros` (nova) |

### 3. Representantes (Advogados)

Os advogados listados nos `representantes` serão:
- Salvos ou atualizados na tabela `advogados` existente
- Vinculados ao processo através de tabela de relacionamento (a definir)

## Estruturas de Dados

### Tabelas Existentes a Modificar

#### 1. clientes
#### 2. partes_contrarias

Ambas terão os mesmos campos novos adicionados:

**Novos Campos**:

```sql
-- Identificação PJE
id_pje BIGINT,
id_pessoa_pje BIGINT,
id_tipo_parte BIGINT,
tipo_parte TEXT,
polo TEXT,

-- Status
principal BOOLEAN DEFAULT false,
status_pje TEXT,
situacao_pje TEXT,
ordem INTEGER,
autoridade BOOLEAN DEFAULT false,

-- Endereço Expandido
endereco_desconhecido BOOLEAN DEFAULT false,
endereco_id_pje BIGINT,
endereco_situacao TEXT,
endereco_correspondencia BOOLEAN,

-- Contato Expandido
emails JSONB,
ddd_celular TEXT,
numero_celular TEXT,
ddd_residencial TEXT,
numero_residencial TEXT,
ddd_comercial TEXT,
numero_comercial TEXT,

-- Pessoa Física
sexo TEXT,
nome_genitora TEXT,
uf_nascimento TEXT,
naturalidade_municipio TEXT,
pais_nascimento TEXT,
escolaridade_codigo INTEGER,
situacao_cpf_receita TEXT,

-- Pessoa Jurídica
data_abertura DATE,
data_fim_atividade DATE,
orgao_publico BOOLEAN DEFAULT false,
ds_tipo_pessoa TEXT,
ramo_atividade TEXT,
cpf_responsavel TEXT,
situacao_cnpj_receita TEXT,
porte_codigo INTEGER,
porte_descricao TEXT,

-- Controle de Captura
trt codigo_tribunal,
grau grau_tribunal,
processo_id BIGINT REFERENCES acervo(id),
ultima_atualizacao_pje TIMESTAMP WITH TIME ZONE
```

### Nova Tabela: terceiros

**Propósito**: Armazenar terceiros interessados (peritos, ministério público, assistentes, etc)

**Estrutura Completa**:

```sql
CREATE TABLE terceiros (
  -- Chave primária
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Identificação PJE
  id_pje BIGINT NOT NULL,
  id_pessoa_pje BIGINT NOT NULL,
  id_tipo_parte BIGINT,
  tipo_parte TEXT NOT NULL,
  polo TEXT NOT NULL,

  -- Relacionamento com processo
  processo_id BIGINT REFERENCES acervo(id),
  trt codigo_tribunal NOT NULL,
  grau grau_tribunal NOT NULL,
  numero_processo TEXT NOT NULL,

  -- Dados básicos
  tipo_pessoa tipo_pessoa NOT NULL,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  cpf TEXT,
  cnpj TEXT,

  -- Status
  principal BOOLEAN DEFAULT false,
  status_pje TEXT,
  situacao_pje TEXT,
  ordem INTEGER,
  autoridade BOOLEAN DEFAULT false,

  -- Contato
  emails JSONB,
  email TEXT,
  ddd_celular TEXT,
  numero_celular TEXT,
  ddd_residencial TEXT,
  numero_residencial TEXT,
  ddd_comercial TEXT,
  numero_comercial TEXT,

  -- Endereço
  endereco_desconhecido BOOLEAN DEFAULT false,
  endereco JSONB,
  endereco_id_pje BIGINT,
  endereco_situacao TEXT,
  endereco_correspondencia BOOLEAN,

  -- Pessoa Física
  sexo TEXT,
  rg TEXT,
  data_nascimento DATE,
  genero genero_usuario,
  estado_civil estado_civil,
  nome_genitora TEXT,
  uf_nascimento TEXT,
  naturalidade_municipio TEXT,
  pais_nascimento TEXT,
  escolaridade_codigo INTEGER,
  situacao_cpf_receita TEXT,
  nacionalidade TEXT,

  -- Pessoa Jurídica
  data_abertura DATE,
  data_fim_atividade DATE,
  orgao_publico BOOLEAN DEFAULT false,
  ds_tipo_pessoa TEXT,
  ramo_atividade TEXT,
  cpf_responsavel TEXT,
  situacao_cnpj_receita TEXT,
  porte_codigo INTEGER,
  porte_descricao TEXT,
  inscricao_estadual TEXT,

  -- Controle
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  dados_anteriores JSONB,
  ultima_atualizacao_pje TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Unicidade
  UNIQUE(id_pje, trt, grau, numero_processo)
);

-- Índices
CREATE INDEX idx_terceiros_processo_id ON terceiros(processo_id);
CREATE INDEX idx_terceiros_trt_grau ON terceiros(trt, grau);
CREATE INDEX idx_terceiros_numero_processo ON terceiros(numero_processo);
CREATE INDEX idx_terceiros_tipo_parte ON terceiros(tipo_parte);
CREATE INDEX idx_terceiros_cpf ON terceiros(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_terceiros_cnpj ON terceiros(cnpj) WHERE cnpj IS NOT NULL;
```

## Mapeamento de Campos: JSON PJE → Banco de Dados

### Campos Principais

| Campo JSON | Campo BD | Tipo | Observações |
|------------|----------|------|-------------|
| `id` | `id_pje` | bigint | ID da parte no PJE |
| `idPessoa` | `id_pessoa_pje` | bigint | ID da pessoa no PJE |
| `idTipoParte` | `id_tipo_parte` | bigint | ID do tipo de parte |
| `tipo` | `tipo_parte` | text | AUTOR, RÉU, PERITO, etc |
| `polo` | `polo` | text | ativo, passivo, outros |
| `nome` | `nome` | text | Nome completo ou razão social |
| `documento` | `cpf` ou `cnpj` | text | Depende do tipoDocumento |
| `tipoDocumento` | - | - | Usado para determinar se é CPF/CNPJ |
| `principal` | `principal` | boolean | Se é parte principal |
| `status` | `status_pje` | text | Status no PJE |
| `situacao` | `situacao_pje` | text | Situação no PJE |
| `ordem` | `ordem` | integer | Ordem da parte |
| `autoridade` | `autoridade` | boolean | Se é autoridade |
| `enderecoDesconhecido` | `endereco_desconhecido` | boolean | Endereço desconhecido |

### Pessoa Física (pessoaFisica)

| Campo JSON | Campo BD | Tipo |
|------------|----------|------|
| `sexo` | `sexo` | text |
| `dataNascimento` | `data_nascimento` | date |
| `nomeGenitora` | `nome_genitora` | text |
| `ufNascimento.sigla` | `uf_nascimento` | text |
| `naturalidade.nome` | `naturalidade_municipio` | text |
| `paisNascimento.descricao` | `pais_nascimento` | text |
| `escolaridade` | `escolaridade_codigo` | integer |
| `situacaoCpfReceitaFederal.descricao` | `situacao_cpf_receita` | text |
| `dddCelular` | `ddd_celular` | text |
| `numeroCelular` | `numero_celular` | text |
| `dddResidencial` | `ddd_residencial` | text |
| `numeroResidencial` | `numero_residencial` | text |
| `dddComercial` | `ddd_comercial` | text |
| `numeroComercial` | `numero_comercial` | text |

### Pessoa Jurídica (pessoaJuridica)

| Campo JSON | Campo BD | Tipo |
|------------|----------|------|
| `nomeFantasia` | `nome_fantasia` | text |
| `dataAbertura` | `data_abertura` | date |
| `dataFimAtividade` | `data_fim_atividade` | date |
| `orgaoPublico` | `orgao_publico` | boolean |
| `dsTipoPessoa` | `ds_tipo_pessoa` | text |
| `dsRamoAtividade` | `ramo_atividade` | text |
| `numeroCpfResponsavel` | `cpf_responsavel` | text |
| `situacaoCnpjReceitaFederal.descricao` | `situacao_cnpj_receita` | text |
| `porteCodigo` | `porte_codigo` | integer |
| `porteLabel` | `porte_descricao` | text |

### Endereço (endereco)

O campo `endereco` será armazenado como JSONB com a estrutura completa:

```json
{
  "id": 6441049,
  "logradouro": "RUA TEOFILO CASTILHO",
  "numero": "94",
  "bairro": "ITAIPU (BARREIRO)",
  "complemento": "",
  "municipio": "BELO HORIZONTE",
  "municipioIbge": "3106200",
  "estado": {
    "id": 14,
    "sigla": "MG",
    "descricao": "MINAS GERAIS"
  },
  "pais": {
    "id": 25,
    "codigo": "076",
    "descricao": "Brasil"
  },
  "nroCep": "30662-650",
  "correspondencia": false,
  "situacao": "P"
}
```

Campos extras:
- `endereco_id_pje`: `endereco.id`
- `endereco_situacao`: `endereco.situacao`
- `endereco_correspondencia`: `endereco.correspondencia`

### Contato

| Campo JSON | Campo BD | Tipo |
|------------|----------|------|
| `emails` | `emails` | jsonb (array) |
| `email` | `email` | text (principal) |

## Migrations Necessárias

### Migration 1: Adicionar campos em `clientes`

```sql
-- Adicionar todos os campos novos listados acima
ALTER TABLE clientes ADD COLUMN ...
```

### Migration 2: Adicionar campos em `partes_contrarias`

```sql
-- Adicionar os mesmos campos de clientes
ALTER TABLE partes_contrarias ADD COLUMN ...
```

### Migration 3: Criar tabela `terceiros`

```sql
-- Criar tabela completa conforme especificação acima
CREATE TABLE terceiros (...);
```

### Migration 4: Criar tabela de relacionamento para representantes

```sql
-- A definir: tabela para vincular advogados aos processos/partes
```

## Próximos Passos

1. ✅ Analisar estruturas das tabelas existentes
2. ✅ Identificar campos novos necessários
3. ✅ Planejar estrutura da tabela `terceiros`
4. ⏳ Criar migrations SQL
5. ⏳ Implementar serviço de captura de partes
6. ⏳ Implementar lógica de identificação do cliente
7. ⏳ Implementar endpoint de API
8. ⏳ Testes

## Observações Importantes

1. **Unicidade**:
   - Em `clientes` e `partes_contrarias`: considerar unicidade por CPF/CNPJ
   - Em `terceiros`: unicidade por (id_pje, trt, grau, numero_processo)

2. **RLS (Row Level Security)**:
   - Manter consistência com as políticas existentes
   - Service role tem acesso total
   - Usuários autenticados podem ler
   - Backend verifica permissões granulares

3. **Auditoria**:
   - Usar campo `dados_anteriores` para histórico
   - Registrar alterações em `logs_alteracao`
   - Timestamp de última atualização do PJE

4. **Performance**:
   - Criar índices apropriados
   - Considerar cache para consultas frequentes
   - Otimizar queries de relacionamento

5. **Representantes**:
   - Implementação pendente de definição
   - Avaliar se criar tabela de relacionamento ou usar JSONB
   - Considerar sincronização com tabela `advogados`
