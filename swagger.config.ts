import swaggerJsdoc, { type Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sinesys API',
      version: '1.0.0',
      description: 'Documentação da API do Sinesys - Sistema de captura de dados do PJE/TRT',
      contact: {
        name: 'Sinesys',
        email: 'suporte@sinesys.com.br',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
      {
        url: 'https://api.sinesys.com.br',
        description: 'Servidor de produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token de autenticação Bearer (JWT)',
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sb-access-token',
          description: 'Autenticação via sessão do Supabase',
        },
        serviceApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-service-api-key',
          description: 'API Key para autenticação de jobs do sistema. Usado por scripts automatizados e processos agendados.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro',
            },
          },
          required: ['error'],
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Dados da resposta',
            },
          },
          required: ['success'],
        },
        BaseCapturaTRTParams: {
          type: 'object',
          required: ['advogado_id', 'trt_codigo', 'grau'],
          properties: {
            advogado_id: {
              type: 'integer',
              description: 'ID do advogado na tabela advogados. O backend buscará automaticamente a credencial correspondente para este advogado, TRT e grau.',
              example: 1,
            },
            trt_codigo: {
              type: 'string',
              description: 'Código do TRT (ex: TRT1, TRT2, TRT3)',
              enum: ['TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24'],
              example: 'TRT3',
            },
            grau: {
              type: 'string',
              enum: ['primeiro_grau', 'segundo_grau'],
              description: 'Grau do processo (primeiro_grau ou segundo_grau)',
              example: 'primeiro_grau',
            },
          },
        },
        AudienciasParams: {
          type: 'object',
          required: ['advogado_id', 'trt_codigo', 'grau'],
          properties: {
            advogado_id: {
              type: 'integer',
              description: 'ID do advogado na tabela advogados. O backend buscará automaticamente a credencial correspondente para este advogado, TRT e grau.',
              example: 1,
            },
            trt_codigo: {
              type: 'string',
              description: 'Código do TRT (ex: TRT1, TRT2, TRT3)',
              enum: ['TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24'],
              example: 'TRT3',
            },
            grau: {
              type: 'string',
              enum: ['primeiro_grau', 'segundo_grau'],
              description: 'Grau do processo (primeiro_grau ou segundo_grau)',
              example: 'primeiro_grau',
            },
            dataInicio: {
              type: 'string',
              format: 'date',
              description: 'Data inicial do período de busca (formato: YYYY-MM-DD). Se não fornecido, usa hoje',
              example: '2024-01-01',
            },
            dataFim: {
              type: 'string',
              format: 'date',
              description: 'Data final do período de busca (formato: YYYY-MM-DD). Se não fornecido, usa hoje + 365 dias',
              example: '2024-12-31',
            },
          },
        },
        PendentesManifestacaoParams: {
          type: 'object',
          required: ['advogado_id', 'trt_codigo', 'grau'],
          properties: {
            advogado_id: {
              type: 'integer',
              description: 'ID do advogado na tabela advogados. O backend buscará automaticamente a credencial correspondente para este advogado, TRT e grau.',
              example: 1,
            },
            trt_codigo: {
              type: 'string',
              description: 'Código do TRT (ex: TRT1, TRT2, TRT3)',
              enum: ['TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24'],
              example: 'TRT3',
            },
            grau: {
              type: 'string',
              enum: ['primeiro_grau', 'segundo_grau'],
              description: 'Grau do processo (primeiro_grau ou segundo_grau)',
              example: 'primeiro_grau',
            },
            filtroPrazo: {
              type: 'string',
              enum: ['no_prazo', 'sem_prazo'],
              description: 'Filtro de prazo para processos pendentes. Padrão: sem_prazo',
              example: 'sem_prazo',
            },
          },
        },
        AtribuirResponsavelRequest: {
          type: 'object',
          properties: {
            responsavelId: {
              type: 'integer',
              nullable: true,
              description: 'ID do usuário responsável. Use null para desatribuir responsável. Se omitido, mantém o responsável atual.',
              example: 15,
            },
          },
        },
        AtualizarTipoDescricaoRequest: {
          type: 'object',
          properties: {
            tipoExpedienteId: {
              type: 'integer',
              nullable: true,
              description: 'ID do tipo de expediente. Use null para remover tipo.',
              example: 1,
            },
            descricaoArquivos: {
              type: 'string',
              nullable: true,
              description: 'Descrição ou referência a arquivos relacionados',
              example: 'Documentos anexados: petição inicial, documentos pessoais',
            },
          },
        },
        AtribuirResponsavelResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Dados atualizados da entidade',
              properties: {
                id: {
                  type: 'integer',
                },
                responsavel_id: {
                  type: 'integer',
                  nullable: true,
                },
              },
            },
          },
        },
        TipoExpediente: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do tipo de expediente',
              example: 1,
            },
            tipo_expediente: {
              type: 'string',
              description: 'Nome do tipo de expediente',
              example: 'Audiência',
            },
            created_by: {
              type: 'integer',
              description: 'ID do usuário que criou o tipo',
              example: 19,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora de criação',
              example: '2024-01-15T10:30:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora da última atualização',
              example: '2024-01-15T10:30:00Z',
            },
          },
          required: ['id', 'tipo_expediente', 'created_by', 'created_at', 'updated_at'],
        },
        CriarTipoExpedienteParams: {
          type: 'object',
          required: ['tipo_expediente'],
          properties: {
            tipo_expediente: {
              type: 'string',
              description: 'Nome do tipo de expediente (deve ser único)',
              example: 'Audiência',
            },
          },
        },
        AtualizarTipoExpedienteParams: {
          type: 'object',
          properties: {
            tipo_expediente: {
              type: 'string',
              description: 'Novo nome do tipo de expediente (deve ser único)',
              example: 'Audiência Judicial',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        sessionAuth: [],
      },
      {
        serviceApiKey: [],
      },
    ],
  },
  apis: [
    './app/api/**/*.ts', // Caminho para os arquivos de rotas da API
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

