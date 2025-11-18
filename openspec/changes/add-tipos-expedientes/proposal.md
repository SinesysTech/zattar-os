# Change: Adicionar Tipos de Expedientes e Campos de Descrição

## Why
Precisamos categorizar os expedientes pendentes de manifestação por tipo (ex: "Audiência", "Manifestação", "Recurso Ordinário", etc.) e permitir que os usuários adicionem descrições/arquivos relacionados a cada expediente. Isso facilitará a organização, busca e gestão dos expedientes, permitindo melhor rastreabilidade e documentação dos processos.

## What Changes
- Criar nova tabela `tipos_expedientes` com campo `tipo_expediente` (texto único) e `created_by` (referência ao usuário criador)
- Inserir 33 tipos de expedientes pré-definidos na tabela
- Adicionar duas novas colunas em `pendentes_manifestacao`:
  - `tipo_expediente_id` (FK para `tipos_expedientes`, nullable)
  - `descricao_arquivos` (texto, nullable)
- Criar serviço backend completo de CRUD para tipos de expedientes
- Criar endpoints API REST para gerenciar tipos de expedientes
- Atualizar frontend para exibir coluna composta "Tipo/Descrição" na página de expedientes
- **BREAKING**: Atualizar tipos TypeScript e serviços de pendentes para incluir novos campos
- Atualizar documentação Swagger com novos endpoints

## Impact
- Affected specs: `pendentes-manifestacao` (modificado), `tipos-expedientes` (novo)
- Affected code:
  - Database: Nova tabela `tipos_expedientes`, modificação em `pendentes_manifestacao`
  - Backend: `backend/tipos-expedientes/` (novo), `backend/pendentes/` (modificado)
  - API: `app/api/tipos-expedientes/` (novo)
  - Frontend: `app/(dashboard)/expedientes/page.tsx` (modificado), `components/expedientes-*.tsx` (modificado)
  - Types: `backend/types/pendentes/types.ts` (modificado), `backend/types/tipos-expedientes/types.ts` (novo)

