# Estrutura de Resposta Padronizada

<cite>
**Arquivos Referenciados neste Documento**  
- [swagger.config.ts](file://swagger.config.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Estrutura de Resposta da API](#estrutura-de-resposta-da-api)
3. [Schema SuccessResponse](#schema-successresponse)
4. [Schema Error](#schema-error)
5. [Exemplos de Respostas](#exemplos-de-respostas)
6. [Orientações para Clientes da API](#orientações-para-clientes-da-api)
7. [Dicas de Tratamento no Frontend](#dicas-de-tratamento-no-frontend)
8. [Boas Práticas de Logging](#boas-práticas-de-logging)

## Introdução

Este documento detalha a estrutura de resposta padronizada utilizada pela API Sinesys, conforme definido no arquivo de configuração do Swagger. A padronização das respostas é fundamental para garantir consistência, previsibilidade e facilidade de consumo por parte dos clientes da API. O sistema implementa dois schemas principais para todas as respostas: `SuccessResponse` para operações bem-sucedidas e `Error` para situações de falha. Esta documentação explica em detalhes os campos, seu uso, e fornece exemplos práticos para diferentes cenários.

## Estrutura de Resposta da API

A API Sinesys adota uma estrutura de resposta padronizada que facilita a interpretação dos resultados pelas aplicações cliente. Todas as respostas seguem um padrão consistente, utilizando dois schemas principais definidos no componente OpenAPI: `SuccessResponse` para indicar sucesso e `Error` para indicar falhas.

A estrutura é projetada para ser simples, clara e informativa, permitindo que os clientes da API determinem rapidamente o resultado de uma operação e acessem os dados relevantes ou mensagens de erro. O campo principal que determina o estado da resposta é o `success`, um booleano que indica se a operação foi concluída com êxito.

**Section sources**
- [swagger.config.ts](file://swagger.config.ts#L57-L70)

## Schema SuccessResponse

O schema `SuccessResponse` é utilizado para todas as respostas de sucesso (códigos de status HTTP 200-299). Ele é definido como um objeto com dois campos principais:

- **success**: Um campo booleano obrigatório que indica se a operação foi bem-sucedida. Para respostas de sucesso, este campo sempre terá o valor `true`.
- **data**: Um campo opcional do tipo objeto que contém os dados retornados pela operação. Este campo pode conter qualquer estrutura de dados relevante, como um objeto, uma lista, ou estar ausente em operações que não retornam dados.

O campo `data` é flexível e pode conter diferentes tipos de conteúdo dependendo do endpoint, mas sempre será um objeto ou uma estrutura aninhada. Em operações de criação, atualização ou leitura, o campo `data` conterá os dados relevantes. Em operações de deleção ou ações que não retornam dados, o campo `data` pode ser omitido ou conter um objeto vazio, dependendo da implementação específica.

**Section sources**
- [swagger.config.ts](file://swagger.config.ts#L57-L70)

## Schema Error

O schema `Error` é utilizado para todas as respostas de erro (códigos de status HTTP 400-599). Ele é definido como um objeto simples com um único campo obrigatório:

- **error**: Uma string que contém uma mensagem descritiva do erro ocorrido. Esta mensagem é destinada a desenvolvedores e deve ser clara e informativa, explicando a causa do erro (por exemplo, parâmetros ausentes, credenciais inválidas, recurso não encontrado).

Este schema é referenciado em todos os códigos de status de erro nos endpoints da API, garantindo que todas as mensagens de erro sejam retornadas em um formato consistente. Isso simplifica o tratamento de erros no lado do cliente, pois o desenvolvedor sabe exatamente onde encontrar a mensagem de erro, independentemente do tipo de falha.

**Section sources**
- [swagger.config.ts](file://swagger.config.ts#L47-L56)

## Exemplos de Respostas

A seguir estão exemplos de respostas JSON para diferentes cenários comuns, ilustrando como os schemas `SuccessResponse` e `Error` são aplicados na prática.

### Resposta de Sucesso com Dados

Este exemplo mostra uma resposta bem-sucedida de um endpoint que retorna uma lista de audiências capturadas. O campo `success` é `true` e o campo `data` contém um objeto com os dados da captura, incluindo a lista de audiências, contadores e informações de persistência.

```json
{
  "success": true,
  "data": {
    "audiencias": [
      {
        "id": 1,
        "numero_processo": "0010014-94.2025.5.03.0022",
        "data_audiencia": "2025-02-15T14:00:00.000Z",
        "orgao_julgador": "1ª Vara do Trabalho de São Paulo"
      }
    ],
    "total": 45,
    "dataInicio": "2024-01-01",
    "dataFim": "2024-12-31",
    "persistencia": {
      "total": 45,
      "atualizados": 40,
      "erros": 5,
      "orgaosJulgadoresCriados": 2
    }
  }
}
```

### Resposta de Sucesso sem Dados

Este exemplo representa uma resposta bem-sucedida de uma operação de atualização, como a atribuição de um responsável a um processo. O campo `success` é `true`, indicando que a operação foi concluída com êxito, e o campo `data` contém um objeto com os dados atualizados da entidade modificada.

```json
{
  "success": true,
  "data": {
    "id": 123,
    "responsavel_id": 15
  }
}
```

### Erro de Validação

Este exemplo mostra uma resposta de erro 400 (Bad Request) quando parâmetros obrigatórios estão ausentes na requisição. O campo `success` está ausente (pois não é parte do schema `Error`) e o campo `error` contém uma mensagem clara explicando o problema.

```json
{
  "error": "Missing required parameters: advogado_id, trt_codigo, grau"
}
```

### Erro de Servidor

Este exemplo representa uma resposta de erro 500 (Internal Server Error). O campo `error` contém uma mensagem genérica de erro de servidor, que pode ser mais detalhada em ambientes de desenvolvimento, mas deve ser genérica em produção para segurança.

```json
{
  "error": "Internal server error"
}
```

**Section sources**
- [swagger.config.ts](file://swagger.config.ts#L47-L70)

## Orientações para Clientes da API

Para consumir a API Sinesys de forma robusta, os clientes devem seguir estas orientações:

1. **Verifique o campo `success` primeiro**: Antes de tentar acessar o campo `data`, verifique sempre o valor do campo `success`. Se a resposta não seguir o schema `SuccessResponse` (por exemplo, em erros 401 ou 500), o campo `success` não estará presente, e o cliente deve procurar o campo `error`.

2. **Trate todos os códigos de status de erro**: A API utiliza o schema `Error` para todos os códigos de status de erro (4xx e 5xx). O cliente deve estar preparado para lidar com mensagens de erro em todos esses casos.

3. **Valide os dados retornados**: Mesmo em respostas de sucesso, valide a estrutura dos dados no campo `data` antes de usá-los, pois a estrutura pode variar entre endpoints.

4. **Implemente retry lógico para erros 5xx**: Erros de servidor (5xx) geralmente indicam problemas temporários. Implemente uma lógica de retry com backoff exponencial para esses casos.

5. **Forneça feedback ao usuário**: Use as mensagens de erro para fornecer feedback claro ao usuário final, mas evite exibir mensagens técnicas diretamente. Traduza-as para uma linguagem amigável.

**Section sources**
- [swagger.config.ts](file://swagger.config.ts#L47-L70)

## Dicas de Tratamento no Frontend

Ao implementar o consumo da API no frontend, considere as seguintes dicas:

- **Crie um wrapper de API**: Implemente uma camada de serviço que encapsule todas as chamadas à API. Esta camada deve tratar a lógica de autenticação, parsing de respostas e tratamento de erros de forma centralizada.

- **Use tipagem forte**: Defina interfaces TypeScript para os schemas `SuccessResponse` e `Error` para garantir segurança de tipo e melhorar a experiência de desenvolvimento.

- **Exiba notificações de erro**: Utilize um sistema de notificações (snackbars, toasts) para exibir mensagens de erro ao usuário de forma não intrusiva.

- **Trate loading states**: Mostre estados de carregamento durante as requisições para melhorar a experiência do usuário.

- **Logue erros localmente**: Em ambiente de desenvolvimento, logue as respostas de erro completas no console para facilitar a depuração.

**Section sources**
- [swagger.config.ts](file://swagger.config.ts#L47-L70)

## Boas Práticas de Logging

Para fins de depuração e monitoramento, siga estas boas práticas de logging:

- **Logue requisições e respostas em desenvolvimento**: Durante o desenvolvimento, logue as requisições enviadas e as respostas recebidas para entender o fluxo de dados.

- **Evite logar dados sensíveis em produção**: Nunca logue tokens de autenticação, credenciais ou dados pessoais em ambientes de produção.

- **Use níveis de log apropriados**: Utilize níveis de log como DEBUG, INFO, WARN e ERROR de forma consistente. Erros de validação (400) podem ser WARN, enquanto erros de servidor (500) devem ser ERROR.

- **Inclua contexto nas mensagens de log**: Sempre que possível, inclua informações contextuais como ID da requisição, endpoint chamado e parâmetros relevantes (sem dados sensíveis) para facilitar a investigação de problemas.

**Section sources**
- [swagger.config.ts](file://swagger.config.ts#L47-L70)