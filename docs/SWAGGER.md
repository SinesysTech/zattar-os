# 📚 Documentação Swagger - Sinesys API

Este documento explica como usar e manter a documentação Swagger da API do Sinesys.

## 🚀 Acesso à Documentação

Após iniciar o servidor de desenvolvimento (`npm run dev`), acesse:

- **Interface Swagger UI**: http://localhost:3000/docs
- **Especificação OpenAPI JSON**: http://localhost:3000/api/docs/openapi.json

## 📝 Como Documentar uma Nova Rota

Para documentar uma nova rota de API, adicione comentários JSDoc no formato Swagger acima da função que implementa a rota:

```typescript
/**
 * @swagger
 * /api/captura/trt/acervo-geral:
 *   post:
 *     summary: Captura dados do acervo geral do TRT
 *     description: Descrição detalhada do que a rota faz
 *     tags:
 *       - Captura TRT
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential_id
 *               - trt_codigo
 *             properties:
 *               credential_id:
 *                 type: integer
 *                 example: 1
 *               trt_codigo:
 *                 type: string
 *                 example: "TRT3"
 *     responses:
 *       200:
 *         description: Sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  // Implementação da rota
}
```

## 🏗️ Estrutura de Arquivos

```
├── swagger.config.ts              # Configuração do Swagger
├── app/
│   ├── docs/
│   │   └── page.tsx               # Página Swagger UI
│   └── api/
│       ├── docs/
│       │   └── openapi.json/
│       │       └── route.ts       # Endpoint que retorna JSON OpenAPI
│       └── captura/
│           └── trt/
│               └── acervo-geral/
│                   └── route.ts   # Rotas documentadas com JSDoc
```

## 🔧 Configuração

A configuração do Swagger está em `swagger.config.ts` e inclui:

- **Informações da API**: título, versão, descrição
- **Servidores**: URLs de desenvolvimento e produção
- **Esquemas de segurança**: Bearer Token e Session Auth
- **Schemas reutilizáveis**: Error, SuccessResponse, BaseCapturaTRTParams
- **Caminhos de busca**: `./app/api/**/*.ts`

## 📦 Dependências

- `swagger-ui-react`: Interface visual do Swagger
- `swagger-jsdoc`: Gera especificação OpenAPI a partir de comentários JSDoc
- `@types/swagger-jsdoc`: Tipos TypeScript
- `@types/swagger-ui-react`: Tipos TypeScript

## 🎯 Schemas Disponíveis

Você pode reutilizar os seguintes schemas definidos em `swagger.config.ts`:

- `Error`: Resposta de erro padrão
- `SuccessResponse`: Resposta de sucesso padrão
- `BaseCapturaTRTParams`: Parâmetros base para captura TRT

Exemplo de uso:

```yaml
schema:
  $ref: '#/components/schemas/Error'
```

## 🔐 Autenticação

A documentação suporta dois métodos de autenticação:

1. **Bearer Token**: Token JWT no header `Authorization: Bearer <token>`
2. **Session Auth**: Cookie de sessão do Supabase (`sb-access-token`)

Ambos estão configurados como padrão em todas as rotas que requerem autenticação.

## 📚 Recursos Adicionais

- [Documentação OpenAPI 3.0](https://swagger.io/specification/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI React](https://github.com/swagger-api/swagger-ui)

## 🐛 Troubleshooting

### A documentação não aparece

1. Verifique se o servidor está rodando (`npm run dev`)
2. Confirme que os comentários JSDoc estão no formato correto
3. Verifique o console do navegador para erros

### Erro ao carregar especificação OpenAPI

1. Verifique se `swagger.config.ts` está configurado corretamente
2. Confirme que os caminhos em `apis` estão corretos
3. Verifique se há erros de sintaxe nos comentários JSDoc

### Rotas não aparecem na documentação

1. Confirme que os arquivos estão no diretório `app/api/**/*.ts`
2. Verifique se os comentários JSDoc começam com `@swagger`
3. Certifique-se de que o caminho da rota está correto no comentário

