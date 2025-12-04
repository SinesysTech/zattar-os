# Proposta: Integração Comunica CNJ

## Why

O escritório precisa monitorar automaticamente as comunicações processuais publicadas no Diário de Justiça Eletrônico Nacional (Comunica CNJ) para garantir que nenhuma intimação seja perdida. Atualmente, o sistema captura expedientes apenas do PJE dos TRTs, mas comunicações importantes também são publicadas no CNJ e podem não ter correspondência direta com expedientes capturados.

## What Changes

### **BREAKING** - Renomear tabela `pendentes_manifestacao` para `expedientes`

A tabela será renomeada para refletir melhor o conceito de "expediente" (termo mais abrangente que "pendente de manifestação"). Adiciona coluna `origem` para distinguir a fonte do expediente.

### Nova tabela `comunica_cnj`

Armazena os dados brutos das comunicações capturadas da API do CNJ. Cada comunicação está vinculada 1:1 com um expediente.

### Migração de `expedientes_manuais`

Dados migrados para a tabela `expedientes` com `origem = 'manual'`, seguido do drop da tabela antiga.

### Novo tipo de captura `comunica_cnj`

Adicionado ao enum `tipo_captura` para permitir agendamentos de captura automática.

### Backend services para Comunica CNJ

- Cliente HTTP para API do CNJ
- Serviços de busca, captura e persistência
- Lógica de vinculação comunicação ↔ expediente

### API Routes

- `GET /api/comunica-cnj/consulta` - Busca manual na API CNJ
- `GET /api/comunica-cnj/certidao/[hash]` - Download de certidão PDF
- `GET /api/comunica-cnj/tribunais` - Lista tribunais (do BD)
- `POST /api/comunica-cnj/captura` - Executar captura

### MCP Tools

Criar tools no repositório MCP para permitir que agentes utilizem os endpoints do Comunica CNJ.

## Impact

### Specs afetadas
- `expedientes` (nova spec, substituindo referências a `pendentes_manifestacao`)
- `comunica-cnj` (nova spec)
- `agendamentos` (adiciona novo tipo de captura)

### Código afetado
- `backend/captura/` - Adicionar módulo comunica-cnj
- `app/api/` - Novas routes
- `supabase/migrations/` - Novas migrações
- `lib/types/` - Novos tipos TypeScript
- Referências a `pendentes_manifestacao` no código (renomear para `expedientes`)

### Tabelas do banco
- `pendentes_manifestacao` → `expedientes` (rename + add column)
- `expedientes_manuais` → migrar e dropar
- `comunica_cnj` (nova)
- `tipo_captura` enum (add value)
