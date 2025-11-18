# Change: Reorganizar Fluxo de Captura com Serviços de Advogados e Credenciais

## Why
O fluxo atual de captura possui redundâncias e não segue uma hierarquia lógica. As credenciais já contêm tribunal e grau, mas o sistema ainda permite seleção redundante desses campos. Além disso, o frontend acessa diretamente o Supabase para buscar credenciais, violando a arquitetura de camadas. É necessário reorganizar o fluxo para: (1) Selecionar advogado primeiro, (2) Listar credenciais do advogado selecionado, (3) Selecionar credenciais (que já contêm tribunal/grau), (4) Remover redundância de seleção de tribunal/grau, (5) Criar serviços backend completos para gerenciar advogados e credenciais, (6) Adaptar endpoints de captura para usar `credencial_id` ao invés de `trt_codigo` + `grau`, (7) Implementar sistema de histórico de capturas para operações assíncronas.

## What Changes
- **BREAKING**: Criar serviços backend completos de CRUD para advogados e credenciais
- **BREAKING**: Criar endpoints API REST para gerenciar advogados e credenciais
- **BREAKING**: Adaptar endpoints de captura para receber `credencial_ids[]` ao invés de `trt_codigo` + `grau`
- Refatorar frontend para novo fluxo: Advogado → Credenciais (sem seleção redundante de tribunal/grau)
- Remover seções de seleção de Tribunal e Grau do `CapturaFormBase`
- Criar sistema de histórico de capturas com tabela `capturas_log`
- Implementar resposta assíncrona para capturas longas
- Criar página de histórico de capturas no frontend

## Impact
- Affected specs: `captura-trt` (modificado), `advogados` (novo), `credenciais` (novo)
- Affected code:
  - Backend: `backend/advogados/` (novo), `backend/captura/credentials/` (expandido)
  - API: `app/api/advogados/` (novo), `app/api/captura/trt/*` (modificado)
  - Frontend: `components/captura/` (refatorado), `app/(dashboard)/captura/` (modificado)
  - Database: Nova tabela `capturas_log` (migration)

