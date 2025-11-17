## 1. Preparação
- [ ] 1.1 Criar estrutura de diretórios para componentes de captura
- [ ] 1.2 Criar cliente API para endpoints de captura (`lib/api/captura.ts`)
- [ ] 1.3 Definir tipos TypeScript para requisições e respostas de captura

## 2. Componentes Base
- [ ] 2.1 Criar componente `CapturaForm` (formulário base com seleção de advogado, TRT e grau)
- [ ] 2.2 Criar componente `CapturaButton` (botão de ação com estados de loading)
- [ ] 2.3 Criar componente `CapturaResult` (exibição de resultados e erros)
- [ ] 2.4 Criar componente `CapturaStatus` (indicador de status da captura)

## 3. Formulários Específicos
- [ ] 3.1 Criar componente `AcervoGeralForm` (formulário para captura de acervo geral)
- [ ] 3.2 Criar componente `ArquivadosForm` (formulário para captura de arquivados)
- [ ] 3.3 Criar componente `AudienciasForm` (formulário com campos de data para audiências)
- [ ] 3.4 Criar componente `PendentesForm` (formulário com filtro de prazo para pendências)

## 4. Página Principal
- [ ] 4.1 Criar página `/app/(dashboard)/captura/page.tsx`
- [ ] 4.2 Implementar layout com tabs para cada tipo de captura
- [ ] 4.3 Integrar formulários específicos na página
- [ ] 4.4 Adicionar tratamento de erros e feedback visual

## 5. Integração com API
- [ ] 5.1 Implementar chamadas POST para `/api/captura/trt/acervo-geral`
- [ ] 5.2 Implementar chamadas POST para `/api/captura/trt/arquivados`
- [ ] 5.3 Implementar chamadas POST para `/api/captura/trt/audiencias`
- [ ] 5.4 Implementar chamadas POST para `/api/captura/trt/pendentes-manifestacao`
- [ ] 5.5 Adicionar tratamento de erros HTTP (400, 401, 404, 500)
- [ ] 5.6 Implementar estados de loading durante requisições

## 6. UX e Feedback
- [ ] 6.1 Adicionar toasts para sucesso/erro de capturas
- [ ] 6.2 Implementar indicadores de progresso visual
- [ ] 6.3 Adicionar validação de formulários no cliente
- [ ] 6.4 Criar mensagens de erro amigáveis baseadas nas respostas da API

## 7. Navegação e Acessibilidade
- [ ] 7.1 Adicionar rota de captura no menu de navegação
- [ ] 7.2 Garantir acessibilidade (ARIA labels, navegação por teclado)
- [ ] 7.3 Adicionar títulos e descrições apropriadas

## 8. Testes e Validação
- [ ] 8.1 Testar integração com todos os endpoints
- [ ] 8.2 Validar tratamento de erros
- [ ] 8.3 Verificar responsividade em diferentes tamanhos de tela
- [ ] 8.4 Validar desacoplamento (nenhuma importação direta do back-end)

