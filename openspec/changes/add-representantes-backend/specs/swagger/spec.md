# Spec Delta: swagger (representantes)

## ADDED Requirements

### Requirement: Swagger Documentation Integration

The system SHALL document all representantes API endpoints using OpenAPI 3.0 specification via JSDoc annotations.

#### Scenario: Representantes endpoints appear in Swagger UI

**Given** the Swagger UI at `/api/docs`
**When** a user views the documentation
**Then** the following endpoint groups SHALL be visible:
- **Representantes** tag with all CRUD endpoints
- Request/response schemas for Representante types
- Example requests and responses
- Authentication requirements

### Requirement: JSDoc Annotations

All representantes API route handlers SHALL include JSDoc comments with OpenAPI annotations.

#### Scenario: GET /api/representantes has complete documentation

**Given** the list representantes endpoint
**When** JSDoc is parsed by swagger-jsdoc
**Then** the documentation SHALL include:

```typescript
/**
 * @swagger
 * /api/representantes:
 *   get:
 *     tags:
 *       - Representantes
 *     summary: Lista representantes com paginação e filtros
 *     description: Retorna lista paginada de representantes (advogados) com suporte a filtros por parte, TRT, grau, OAB, etc.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Número da página
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Itens por página
 *       - in: query
 *         name: parte_tipo
 *         schema:
 *           type: string
 *           enum: [cliente, parte_contraria, terceiro]
 *         description: Tipo de parte
 *       - in: query
 *         name: parte_id
 *         schema:
 *           type: integer
 *         description: ID da parte
 *       - in: query
 *         name: trt
 *         schema:
 *           type: string
 *           pattern: '^TRT\d{1,2}$'
 *         description: Tribunal Regional do Trabalho (ex TRT3, TRT15)
 *       - in: query
 *         name: grau
 *         schema:
 *           type: string
 *           enum: ['1', '2']
 *         description: Grau (primeiro_grau=1, segundo_grau=2)
 *       - in: query
 *         name: numero_processo
 *         schema:
 *           type: string
 *         description: Número do processo
 *       - in: query
 *         name: numero_oab
 *         schema:
 *           type: string
 *         description: Número OAB do advogado (ex SP123456)
 *       - in: query
 *         name: situacao_oab
 *         schema:
 *           type: string
 *           enum: [REGULAR, SUSPENSO, CANCELADO, LICENCIADO, FALECIDO]
 *         description: Situação OAB
 *       - in: query
 *         name: tipo_pessoa
 *         schema:
 *           type: string
 *           enum: [pf, pj]
 *         description: Tipo de pessoa (física ou jurídica)
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Busca em nome, cpf, cnpj, email
 *       - in: query
 *         name: ordenar_por
 *         schema:
 *           type: string
 *           enum: [nome, numero_oab, situacao_oab, created_at, data_habilitacao]
 *           default: nome
 *         description: Campo para ordenação
 *       - in: query
 *         name: ordem
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Direção da ordenação
 *     responses:
 *       200:
 *         description: Lista de representantes retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ListarRepresentantesResult'
 *       400:
 *         description: Parâmetros de consulta inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
```

#### Scenario: POST /api/representantes has complete documentation

**Given** the create representante endpoint
**When** JSDoc is parsed by swagger-jsdoc
**Then** the documentation SHALL include:

```typescript
/**
 * @swagger
 * /api/representantes:
 *   post:
 *     tags:
 *       - Representantes
 *     summary: Cria novo representante
 *     description: Cria um novo representante (advogado) vinculado a uma parte em um processo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CriarRepresentanteParams'
 *           examples:
 *             pessoaFisica:
 *               summary: Advogado pessoa física
 *               value:
 *                 id_pessoa_pje: 12345
 *                 trt: TRT3
 *                 grau: '1'
 *                 parte_tipo: cliente
 *                 parte_id: 789
 *                 numero_processo: '0010000-00.2024.5.03.0001'
 *                 tipo_pessoa: pf
 *                 nome: João Silva Advogado
 *                 cpf: '12345678901'
 *                 numero_oab: SP123456
 *                 emails: ['joao@example.com']
 *             pessoaJuridica:
 *               summary: Escritório de advocacia (PJ)
 *               value:
 *                 id_pessoa_pje: 67890
 *                 trt: TRT15
 *                 grau: '2'
 *                 parte_tipo: parte_contraria
 *                 parte_id: 456
 *                 numero_processo: '0020000-00.2024.5.15.0001'
 *                 tipo_pessoa: pj
 *                 nome: Silva Advogados Associados
 *                 cnpj: '12345678000190'
 *                 razao_social: Silva Advogados Associados LTDA
 *     responses:
 *       201:
 *         description: Representante criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Representante'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Representante já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
```

#### Scenario: GET /api/representantes/[id] has complete documentation

**Given** the get representante by id endpoint
**When** JSDoc is parsed by swagger-jsdoc
**Then** the documentation SHALL include:

```typescript
/**
 * @swagger
 * /api/representantes/{id}:
 *   get:
 *     tags:
 *       - Representantes
 *     summary: Busca representante por ID
 *     description: Retorna um único representante identificado pelo ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do representante
 *     responses:
 *       200:
 *         description: Representante encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Representante'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Representante não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
```

#### Scenario: PATCH /api/representantes/[id] has complete documentation

**Given** the update representante endpoint
**When** JSDoc is parsed by swagger-jsdoc
**Then** the documentation SHALL include:

```typescript
/**
 * @swagger
 * /api/representantes/{id}:
 *   patch:
 *     tags:
 *       - Representantes
 *     summary: Atualiza representante
 *     description: Atualiza dados de um representante existente. Campos imutáveis (tipo_pessoa, parte_tipo, parte_id) não podem ser alterados.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do representante
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtualizarRepresentanteParams'
 *           example:
 *             numero_oab: SP654321
 *             situacao_oab: REGULAR
 *             email: novo@example.com
 *     responses:
 *       200:
 *         description: Representante atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Representante'
 *       400:
 *         description: Dados inválidos ou tentativa de alterar campo imutável
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Representante não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
```

#### Scenario: DELETE /api/representantes/[id] has complete documentation

**Given** the delete representante endpoint
**When** JSDoc is parsed by swagger-jsdoc
**Then** the documentation SHALL include:

```typescript
/**
 * @swagger
 * /api/representantes/{id}:
 *   delete:
 *     tags:
 *       - Representantes
 *     summary: Remove representante
 *     description: Remove um representante do sistema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do representante
 *     responses:
 *       200:
 *         description: Representante removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Representante não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
```

### Requirement: Schema Definitions

The system SHALL define OpenAPI schemas for all representante types and parameters.

#### Scenario: RepresentanteBase schema is defined

**Given** the Swagger schemas
**When** the API documentation is generated
**Then** the following schema SHALL exist:

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     RepresentanteBase:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do representante
 *         id_pje:
 *           type: integer
 *           nullable: true
 *           description: ID do representante no PJE
 *         id_pessoa_pje:
 *           type: integer
 *           description: ID da pessoa no PJE
 *         trt:
 *           type: string
 *           pattern: '^TRT\d{1,2}$'
 *           description: Tribunal Regional do Trabalho
 *         grau:
 *           type: string
 *           enum: ['1', '2']
 *           description: Grau (primeiro=1, segundo=2)
 *         parte_tipo:
 *           type: string
 *           enum: [cliente, parte_contraria, terceiro]
 *           description: Tipo de parte representada
 *         parte_id:
 *           type: integer
 *           description: ID da parte representada
 *         numero_processo:
 *           type: string
 *           description: Número do processo
 *         tipo_pessoa:
 *           type: string
 *           enum: [pf, pj]
 *           description: Tipo de pessoa (física ou jurídica)
 *         nome:
 *           type: string
 *           description: Nome completo ou razão social
 *         polo:
 *           type: string
 *           nullable: true
 *           description: Polo processual (ativo/passivo)
 *         tipo:
 *           type: string
 *           nullable: true
 *           description: Tipo de representante (ADVOGADO, PROCURADOR, etc)
 *         id_tipo_parte:
 *           type: integer
 *           nullable: true
 *           description: ID do tipo de parte no PJE
 *         numero_oab:
 *           type: string
 *           nullable: true
 *           description: Número de inscrição na OAB
 *         situacao_oab:
 *           type: string
 *           nullable: true
 *           enum: [REGULAR, SUSPENSO, CANCELADO, LICENCIADO, FALECIDO]
 *           description: Situação da inscrição OAB
 *         emails:
 *           type: array
 *           items:
 *             type: string
 *             format: email
 *           description: Lista de emails
 *         ddd_celular:
 *           type: string
 *           nullable: true
 *         numero_celular:
 *           type: string
 *           nullable: true
 *         ddd_telefone:
 *           type: string
 *           nullable: true
 *         numero_telefone:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *         situacao:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           nullable: true
 *         principal:
 *           type: boolean
 *           nullable: true
 *           description: Indica se é o representante principal
 *         endereco_desconhecido:
 *           type: boolean
 *           nullable: true
 *         dados_pje_completo:
 *           type: object
 *           nullable: true
 *           description: Dados brutos do PJE em JSON
 *         ordem:
 *           type: integer
 *           nullable: true
 *           description: Ordem de exibição
 *         data_habilitacao:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Data de habilitação no processo
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
```

#### Scenario: RepresentantePessoaFisica schema extends base

**Given** the Swagger schemas
**When** the API documentation is generated
**Then** the following schema SHALL exist:

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     RepresentantePessoaFisica:
 *       allOf:
 *         - $ref: '#/components/schemas/RepresentanteBase'
 *         - type: object
 *           required:
 *             - cpf
 *           properties:
 *             tipo_pessoa:
 *               type: string
 *               enum: [pf]
 *             cpf:
 *               type: string
 *               pattern: '^\d{11}$'
 *               description: CPF (11 dígitos)
 *             cnpj:
 *               type: 'null'
 *             sexo:
 *               type: string
 *               nullable: true
 *             data_nascimento:
 *               type: string
 *               format: date
 *               nullable: true
 *             nome_mae:
 *               type: string
 *               nullable: true
 *             nome_pai:
 *               type: string
 *               nullable: true
 *             nacionalidade:
 *               type: string
 *               nullable: true
 *             estado_civil:
 *               type: string
 *               nullable: true
 *             uf_nascimento:
 *               type: string
 *               nullable: true
 *             municipio_nascimento:
 *               type: string
 *               nullable: true
 *             pais_nascimento:
 *               type: string
 *               nullable: true
 *             razao_social:
 *               type: 'null'
 *             nome_fantasia:
 *               type: 'null'
 *             inscricao_estadual:
 *               type: 'null'
 *             tipo_empresa:
 *               type: 'null'
 */
```

#### Scenario: RepresentantePessoaJuridica schema extends base

**Given** the Swagger schemas
**When** the API documentation is generated
**Then** the following schema SHALL exist:

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     RepresentantePessoaJuridica:
 *       allOf:
 *         - $ref: '#/components/schemas/RepresentanteBase'
 *         - type: object
 *           required:
 *             - cnpj
 *           properties:
 *             tipo_pessoa:
 *               type: string
 *               enum: [pj]
 *             cnpj:
 *               type: string
 *               pattern: '^\d{14}$'
 *               description: CNPJ (14 dígitos)
 *             cpf:
 *               type: 'null'
 *             razao_social:
 *               type: string
 *               nullable: true
 *             nome_fantasia:
 *               type: string
 *               nullable: true
 *             inscricao_estadual:
 *               type: string
 *               nullable: true
 *             tipo_empresa:
 *               type: string
 *               nullable: true
 *             sexo:
 *               type: 'null'
 *             data_nascimento:
 *               type: 'null'
 *             nome_mae:
 *               type: 'null'
 *             nome_pai:
 *               type: 'null'
 *             nacionalidade:
 *               type: 'null'
 *             estado_civil:
 *               type: 'null'
 *             uf_nascimento:
 *               type: 'null'
 *             municipio_nascimento:
 *               type: 'null'
 *             pais_nascimento:
 *               type: 'null'
 */
```

#### Scenario: Representante union schema is defined

**Given** the Swagger schemas
**When** the API documentation is generated
**Then** the following schema SHALL exist:

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     Representante:
 *       oneOf:
 *         - $ref: '#/components/schemas/RepresentantePessoaFisica'
 *         - $ref: '#/components/schemas/RepresentantePessoaJuridica'
 *       discriminator:
 *         propertyName: tipo_pessoa
 *         mapping:
 *           pf: '#/components/schemas/RepresentantePessoaFisica'
 *           pj: '#/components/schemas/RepresentantePessoaJuridica'
 */
```

#### Scenario: CriarRepresentanteParams schema is defined

**Given** the Swagger schemas
**When** the API documentation is generated
**Then** the following schema SHALL exist with all 45 fields marked as required or optional according to the types spec.

#### Scenario: AtualizarRepresentanteParams schema is defined

**Given** the Swagger schemas
**When** the API documentation is generated
**Then** the following schema SHALL exist with all fields optional except id, and excluding immutable fields.

#### Scenario: ListarRepresentantesResult schema is defined

**Given** the Swagger schemas
**When** the API documentation is generated
**Then** the following schema SHALL exist:

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     ListarRepresentantesResult:
 *       type: object
 *       properties:
 *         representantes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Representante'
 *         total:
 *           type: integer
 *           description: Total de registros encontrados
 *         pagina:
 *           type: integer
 *           description: Página atual
 *         limite:
 *           type: integer
 *           description: Itens por página
 *         totalPaginas:
 *           type: integer
 *           description: Total de páginas
 */
```

#### Scenario: ErrorResponse schema is defined

**Given** the Swagger schemas
**When** the API documentation is generated
**Then** the following schema SHALL exist:

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Mensagem de erro legível
 */
```

### Requirement: Tag Organization

All representantes endpoints SHALL be grouped under the "Representantes" tag.

#### Scenario: Representantes tag is defined

**Given** the Swagger configuration
**When** the API documentation is generated
**Then** the "Representantes" tag SHALL exist with description:
```typescript
/**
 * @swagger
 * tags:
 *   - name: Representantes
 *     description: Gerenciamento de representantes (advogados) vinculados a partes em processos
 */
```

### Requirement: Security Scheme

All representantes endpoints SHALL document authentication requirements.

#### Scenario: BearerAuth security scheme is referenced

**Given** the Swagger schemas
**When** any representantes endpoint is documented
**Then** the endpoint SHALL reference the bearerAuth security scheme:

```typescript
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
```

### Requirement: Specialized Endpoint Documentation

Specialized query endpoints SHALL have complete Swagger documentation.

#### Scenario: GET /api/representantes/parte/[parte_tipo]/[parte_id] is documented

**Given** the specialized query endpoint
**When** JSDoc is parsed
**Then** documentation SHALL include path parameters, query parameters, and response schemas similar to main endpoints.

#### Scenario: GET /api/representantes/oab/[numero_oab] is documented

**Given** the OAB query endpoint
**When** JSDoc is parsed
**Then** documentation SHALL include numero_oab path parameter and optional trt/grau query parameters.

#### Scenario: GET /api/representantes/processo is documented

**Given** the process query endpoint
**When** JSDoc is parsed
**Then** documentation SHALL include required query parameters: numero_processo, trt, grau.

#### Scenario: POST /api/representantes/upsert is documented

**Given** the upsert endpoint
**When** JSDoc is parsed
**Then** documentation SHALL explain idempotency behavior and use same schema as create.

## MODIFIED Requirements

None - new documentation.

## REMOVED Requirements

None.
