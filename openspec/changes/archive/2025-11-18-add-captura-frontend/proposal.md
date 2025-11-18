# Change: Adicionar Front-end do Serviço de Raspagem

## Why
O sistema possui um back-end completo de captura/raspagem de dados do PJE-TRT com 4 endpoints REST funcionais, mas não possui interface de usuário para que os usuários possam iniciar e monitorar capturas. É necessário criar uma interface front-end que permita aos usuários:
- Iniciar capturas de diferentes tipos (acervo geral, arquivados, audiências, pendências)
- Selecionar parâmetros de captura (advogado, TRT, grau)
- Monitorar o progresso e status das capturas
- Visualizar resultados e erros

## What Changes
- Criação de página de captura em `/app/(dashboard)/captura/page.tsx`
- Componentes React para formulários de captura por tipo
- Integração com APIs REST existentes (`/api/captura/trt/*`)
- Componentes de feedback visual (loading, sucesso, erro)
- Listagem de histórico de capturas (futuro)
- Manutenção de desacoplamento total: front-end comunica apenas via API REST

## Impact
- Affected specs: `captura-trt` (adiciona requisitos de front-end)
- Affected code:
  - `app/(dashboard)/captura/` (nova página e componentes)
  - `components/captura/` (componentes reutilizáveis de captura)
  - `lib/api/captura.ts` (cliente API para endpoints de captura)
- Não afeta back-end existente - apenas consome APIs REST

