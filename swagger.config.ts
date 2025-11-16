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
          required: ['credential_id', 'trt_codigo', 'grau'],
          properties: {
            credential_id: {
              type: 'integer',
              description: 'ID da credencial no banco de dados',
              example: 1,
            },
            trt_codigo: {
              type: 'string',
              description: 'Código do TRT (ex: TRT1, TRT2, TRT3)',
              example: 'TRT3',
            },
            grau: {
              type: 'string',
              enum: ['1g', '2g'],
              description: 'Grau do processo',
              example: '1g',
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
    ],
  },
  apis: [
    './app/api/**/*.ts', // Caminho para os arquivos de rotas da API
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

