## Visão Geral
- Tornar idêntica a organização da tabela nas visões Semana e Lista.
- Reestruturar a coluna Processo para incluir Classe Judicial e Partes.
- Criar coluna Detalhes (Tipo, Sala, Endereço) e mover o ícone de Ata para dentro dela.
- Corrigir o status Virtual com regra de sobrescrita e trigger automático.
- Centralizar conteúdo da coluna Responsável (já está centralizado; manter).

## Onde está hoje
- Lista: `app/(dashboard)/audiencias/page.tsx` — colunas em `criarColunas(...)` (756), Processo (792–823), Partes (825–845), Tipo/Local (847–872), Endereço (874–888), Responsável (906–915).
- Semana: `app/(dashboard)/audiencias/components/audiencias-visualizacao-semana.tsx` — colunas em `criarColunasSemanais(...)` (345), Processo (363–396), Partes (398–421), Tipo/Local (423–451), Ata (453–485), Endereço (487–500), Responsável (519–531).
- Listagem backend: `backend/audiencias/services/persistence/listar-audiencias.service.ts` — computa `tipo_is_virtual` a partir de `dados_anteriores` (193–205).
- Atualização de endereço: `app/api/audiencias/[id]/endereco/route.ts` — PATCH (76–213).
- Atualização de URL virtual: `app/api/audiencias/[id]/url-virtual/route.ts` (61–131) + service `backend/audiencias/services/atualizar-url-virtual.service.ts` (17–64).
- Persistência tipo PJE: `backend/captura/services/persistence/tipo-audiencia-persistence.service.ts` — grava `is_virtual` (96–110).

## Alterações de Frontend (Semana e Lista)
- Coluna Processo: aplicar nova composição e ordem de exibição em ambas as visões.
  - Linha 1: badges `TRT` e `Grau` (mantém estilos existentes).
  - Linha 2: `Classe Judicial` + `Número do Processo` (já exibimos classe antes do número; manter fonte/layout).
  - Linha 3: Partes (Autora e Ré), um por linha, incorporadas dentro de Processo.
  - Linha 4: `Vara` (`orgao_julgador_descricao`).
- Remover a coluna Partes, evitando duplicação (ordenar por partes pode continuar disponível via menu do cabeçalho de Processo, se necessário).
- Nova coluna Detalhes (substitui Tipo/Local, Endereço e Ata):
  - Linha 1: `Tipo da Audiência`.
  - Linha 2: `Sala da Audiência`.
  - Linha 3: conteúdo condicional:
    - Virtual: mostrar logo da plataforma (Zoom/Meet/Webex) detectada pela URL; hover mostra botões `Copiar` e `Editar` (reutilizar lógica de `EnderecoCell`).
    - Presencial: mostrar Endereço (string construída de `endereco_presencial`); aplicar o mesmo hover com `Copiar` e `Editar` (copy desabilitado se não houver URL).
  - Ícone de Ata: incluir à direita dentro da célula Detalhes com `PdfViewerDialog` (reutilizar implementação de Semana).
- Responsável: manter células centralizadas em ambas as visões; ajustar somente se algum CSS divergir.
- Ordenação/headers: remover headers Partes e Tipo/Local; o header Processo permanece com popover de ordenação por `trt`, `grau`, `orgao_julgador_descricao`. Se precisarmos ordenar por Partes ou Tipo/Sala, podemos incluir opções adicionais no popover de Processo e Detalhes.

## Lógica de Virtual (backend)
- Problema: `tipo_is_virtual` vindo do PJE pode ser `false` mesmo quando é virtual.
- Regra de sobrescrita:
  - Se a última alteração de `Virtual` tiver sido feita pelo nosso sistema e estiver `true`, não sobrescrever com dado do PJE.
- Trigger automático:
  - Se `tipo_descricao` contiver "videoconferência" OU existir `url_audiencia_virtual`, e `Virtual` estiver `false`, atualizar para `true`.

### Implementação técnica
- Schema (Supabase/Postgres):
  - Adicionar campos em `audiencias`:
    - `virtual_status boolean default false` — estado efetivo usado pelo frontend e filtros.
    - `virtual_updated_by text default 'pje'` — origem da última atualização (`'pje'` | `'system'`).
    - Opcional: `virtual_updated_at timestamptz` — auditoria.
- Triggers/Functions:
  - BEFORE INSERT/UPDATE em `audiencias`:
    - Calcular `virtual_candidate := (coalesce(new.tipo_is_virtual,false) OR lower(coalesce(new.tipo_descricao,'')) LIKE '%videoconferência%' OR new.url_audiencia_virtual IS NOT NULL)`.
    - Se `virtual_candidate` = true e `new.virtual_status` = false, definir `new.virtual_status = true` (quando não houver bloqueio).
    - Exceção: se `old.virtual_updated_by = 'system'` e `old.virtual_status = true`, manter `new.virtual_status = true` mesmo se o PJE enviar falso.
- Services/Rotas:
  - `listar-audiencias.service.ts`: popular `tipo_is_virtual` do retorno usando `virtual_status` (ou a mesma lógica de derivação) para que o frontend continue lendo `row.original.tipo_is_virtual` sem alterações profundas.
  - `app/api/audiencias/[id]/endereco/route.ts`: quando `tipo='virtual'` e definirmos URL, também gravar `virtual_status = true`, `virtual_updated_by = 'system'`. Quando `tipo='presencial'` e limpar URL, gravar `virtual_status = false`, `virtual_updated_by = 'system'`.
  - `backend/audiencias/services/atualizar-url-virtual.service.ts`: ao definir uma URL não-nula, setar `virtual_status = true`, `virtual_updated_by = 'system'`; ao remover, `virtual_status = false`, `virtual_updated_by = 'system'`.
  - Captura PJE: na persistência de audiências, se necessário, preencher `virtual_status` pela derivação (`tipo_audiencia.is_virtual`/descrição/URL) respeitando a exceção do `'system'`.

## Reuso e Consistência de UI
- Reutilizar `detectarPlataforma` e logos (Zoom/Meet/Webex) já existentes no frontend.
- Reaproveitar `EditarEnderecoDialog` e `PdfViewerDialog` para embutir na coluna Detalhes.
- Manter fontes, badges e espaçamentos usados em Processo/Partes atuais para consistência visual.

## Testes e Verificação
- Frontend:
  - Verificar Semana e Lista com dados virtuais e presenciais, validando composição da coluna Processo e novo Detalhes.
  - Confirmar hover com `Copiar` e `Editar` e ícone de Ata dentro de Detalhes (Arquivo disponível quando `status === 'F'`).
  - Garantir alinhamento central em Responsável.
- Backend:
  - Criar casos:
    - PJE envia `false`, mas temos URL → `virtual_status` deve ficar `true`.
    - PJE envia `false`, nosso sistema setou `true` previamente → permanecer `true` (exceção).
    - `tipo_descricao` contém "videoconferência" sem URL → `virtual_status` `true`.
  - Validar filtros por virtual no listing (se usados) com `virtual_status`.

## Entregáveis
- Refatoração das colunas nas duas visões com unificação visual.
- Nova coluna Detalhes com comportamento condicional e ícone de Ata embutido.
- Mecanismo robusto de status Virtual com sobrescrita segura e trigger automático.
- Atualizações nos services/rotas para refletir a origem `'system'` quando aplicável.

## Observações
- A coluna Partes será removida para evitar duplicação, já que seu conteúdo passa para Processo. Se preferir manter, posso deixá-la opcional (escondida por padrão).
- Não há mudanças de layout das Tabs de Semana; apenas o conteúdo das colunas.
- Mantemos a ordenação atual e podemos evoluir os popovers de cabeçalho conforme necessidade.

Confirma que seguimos com este plano? 