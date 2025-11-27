# Sinesys MCP Server

Servidor MCP (Model Context Protocol) que expõe as APIs do Sinesys para agentes AI.

## Estrutura

- `src/tools/`: Contém as definições de ferramentas (tools) do MCP. Cada arquivo neste diretório representa um grupo de tools relacionadas (ex: `clientes.ts`, `contratos.ts`, `audiencias.ts`).
- `src/client/`: Contém o cliente HTTP que faz requisições para as APIs do Sinesys. Implementa autenticação via Service API Key e Bearer Token.
- `src/types/`: Contém definições de tipos TypeScript compartilhados entre os módulos do MCP Server (interfaces de resposta da API, tipos de configuração, etc.).

## Desenvolvimento

- `npm run mcp:dev`: Executa o MCP Server em modo desenvolvimento.
- `npm run mcp:build`: Compila o código TypeScript do MCP Server.

## Build

Para compilar o projeto, execute `npm run mcp:build`. Isso irá gerar os arquivos JavaScript no diretório `build/`.

Nota: Documentação completa será adicionada nas próximas fases.