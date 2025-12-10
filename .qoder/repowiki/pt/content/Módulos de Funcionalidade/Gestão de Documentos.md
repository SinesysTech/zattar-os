# Gestão de Documentos

<cite>
**Arquivos Referenciados neste Documento**
</cite>

## Sumário
1. [Aviso de Descontinuação](#aviso-de-descontinuação)
2. [Detalhes da Remoção](#detalhes-da-remoção)
3. [Impacto no Sistema](#impacto-no-sistema)
4. [Alternativas Recomendadas](#alternativas-recomendadas)

## Aviso de Descontinuação
A funcionalidade de Gestão de Documentos foi descontinuada e removida do sistema Sinesys. Esta funcionalidade, que incluía a criação, organização em pastas, compartilhamento e controle de versões de documentos, foi completamente eliminada da base de código. Todos os arquivos relacionados ao módulo de documentos foram excluídos, incluindo serviços de backend, componentes de frontend, testes e documentação específica. Esta decisão foi tomada como parte de uma reestruturação do sistema para focar em funcionalidades jurídicas centrais.

## Detalhes da Remoção
O módulo de gestão de documentos foi completamente removido do sistema, conforme evidenciado pela exclusão de 27 arquivos. A remoção incluiu todos os componentes essenciais do sistema:

- **Serviços de Backend**: Todos os serviços relacionados a documentos foram eliminados, incluindo `documentos-persistence.service.ts`, `compartilhar-documento.service.ts`, `criar-pasta.service.ts` e seus respectivos arquivos de persistência.
- **Componentes de Frontend**: As interfaces de usuário para gestão de documentos foram removidas, incluindo páginas de listagem, compartilhamento e lixeira.
- **Testes**: Os testes de integração e unitários relacionados à funcionalidade de documentos foram excluídos.
- **Rotas de API**: Todas as rotas da API relacionadas à gestão de documentos foram desativadas e removidas.

A análise do catálogo do repositório confirma que o diretório `backend/documentos` e seus subdiretórios foram completamente eliminados, indicando uma remoção intencional e abrangente da funcionalidade.

## Impacto no Sistema
A remoção do módulo de gestão de documentos tem implicações significativas para os usuários e a arquitetura do sistema:

- **Funcionalidades Indisponíveis**: Todos os recursos relacionados à gestão de documentos estão permanentemente indisponíveis, incluindo criação de documentos, organização em pastas hierárquicas, compartilhamento com permissões específicas e controle de versões.
- **Dependências Removidas**: O sistema não depende mais de serviços externos específicos para armazenamento de documentos que eram utilizados anteriormente.
- **Navegação Alterada**: O menu de navegação do sistema foi atualizado para remover a opção de "Documentos", refletindo a descontinuação da funcionalidade.
- **Documentação Obsoleta**: Qualquer documentação existente relacionada à gestão de documentos está agora obsoleta e deve ser tratada como histórica.

## Alternativas Recomendadas
Com a descontinuação da funcionalidade de gestão de documentos, recomenda-se que os usuários adotem as seguintes alternativas:

- **Utilizar a Funcionalidade de Assinatura Digital**: Para documentos que precisam ser criados e assinados, utilize o módulo de Assinatura Digital, que oferece recursos robustos para criação, edição e assinatura de documentos com validade jurídica.
- **Integração com Sistemas Externos**: Considere a integração com sistemas de gestão de documentos externos que possam ser conectados ao Sinesys através de APIs.
- **Armazenamento em Expedientes**: Utilize o módulo de Expedientes para anexar e organizar documentos relacionados a processos jurídicos, que continua sendo suportado e mantido.

A equipe de desenvolvimento está focada em aprimorar os módulos existentes e desenvolver novas funcionalidades que atendam melhor às necessidades jurídicas dos usuários, com ênfase em integração com sistemas PJE/TRT e automação de processos jurídicos.