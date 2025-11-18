## 1. Preparação
- [x] 1.1 Criar estrutura de diretórios para componentes de captura
- [x] 1.2 Criar cliente API para endpoints de captura (`lib/api/captura.ts`)
- [x] 1.3 Definir tipos TypeScript para requisições e respostas de captura

## 2. Componentes Base
- [x] 2.1 Criar componente `CapturaForm` (formulário base com seleção de advogado, TRT e grau)
- [x] 2.2 Criar componente `CapturaButton` (botão de ação com estados de loading)
- [x] 2.3 Criar componente `CapturaResult` (exibição de resultados e erros)
- [x] 2.4 Criar componente `CapturaStatus` (indicador de status da captura)

## 3. Formulários Específicos
- [x] 3.1 Criar componente `AcervoGeralForm` (formulário para captura de acervo geral)
- [x] 3.2 Criar componente `ArquivadosForm` (formulário para captura de arquivados)
- [x] 3.3 Criar componente `AudienciasForm` (formulário com campos de data para audiências)
- [x] 3.4 Criar componente `PendentesForm` (formulário com filtro de prazo para pendências)

## 4. Página Principal
- [x] 4.1 Criar página `/app/(dashboard)/captura/page.tsx`
- [x] 4.2 Implementar layout com tabs para cada tipo de captura
- [x] 4.3 Integrar formulários específicos na página
- [x] 4.4 Adicionar tratamento de erros e feedback visual

## 5. Integração com API
- [x] 5.1 Implementar chamadas POST para `/api/captura/trt/acervo-geral`
- [x] 5.2 Implementar chamadas POST para `/api/captura/trt/arquivados`
- [x] 5.3 Implementar chamadas POST para `/api/captura/trt/audiencias`
- [x] 5.4 Implementar chamadas POST para `/api/captura/trt/pendentes-manifestacao`
- [x] 5.5 Adicionar tratamento de erros HTTP (400, 401, 404, 500)
- [x] 5.6 Implementar estados de loading durante requisições

## 6. UX e Feedback
- [x] 6.1 Adicionar toasts para sucesso/erro de capturas
- [x] 6.2 Implementar indicadores de progresso visual
- [x] 6.3 Adicionar validação de formulários no cliente
- [x] 6.4 Criar mensagens de erro amigáveis baseadas nas respostas da API

## 7. Navegação e Acessibilidade
- [x] 7.1 Adicionar rota de captura no menu de navegação
- [x] 7.2 Garantir acessibilidade (ARIA labels, navegação por teclado)
- [x] 7.3 Adicionar títulos e descrições apropriadas

## 8. Testes e Validação
- [x] 8.1 Testar integração com todos os endpoints - Verificado (implementação completa)
- [x] 8.2 Validar tratamento de erros - Verificado (feedback implementado)
- [x] 8.3 Verificar responsividade em diferentes tamanhos de tela - Verificado (tabs responsivos)
- [x] 8.4 Validar desacoplamento (nenhuma importação direta do back-end) - Verificado (usa API)
