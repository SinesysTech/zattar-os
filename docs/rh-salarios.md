# Módulo de RH / Salários

## Visão Geral
- Cadastro de salários vigentes para funcionários.
- Geração manual de folhas de pagamento mensais.
- Aprovação de folha cria lançamentos financeiros de despesa (`origem=folha_pagamento`).
- Pagamento confirma lançamentos vinculados.
- Integração com contas bancárias, plano de contas e centros de custo.

## Conceitos
- **Salário vigente**: salário ativo em uma data, entre `data_inicio_vigencia` e `data_fim_vigencia` (ou sem fim).
- **Vigência**: período de validade do salário; novas vigências não devem sobrepor vigências ativas.
- **Folha de pagamento**: consolidação mensal de salários vigentes; possui status `rascunho`, `aprovada`, `paga` ou `cancelada`.
- **Item da folha**: vínculo salário/usuário na folha, opcionalmente ligado a um lançamento financeiro.

## Fluxo de Uso
1) **Cadastrar salário**: informar usuário, cargo, valor bruto e início da vigência.
2) **Gerar folha mensal**: escolher mês/ano (sem duplicar período). Sistema inclui todos os salários vigentes. Permite gerar folhas para o mês atual e próximo mês (planejamento).
3) **Aprovar folha**: exige conta bancária e conta contábil; cria lançamentos financeiros por item.
4) **Pagar folha**: define forma de pagamento, confirma lançamentos e registra `data_pagamento`.
5) **Cancelar**: permitido para rascunho/aprovada (cancela lançamentos se existirem).  

## Endpoints (resumo)
- `GET /api/rh/salarios`: lista salários com filtros (`usuarioId`, `cargoId`, `ativo`, `vigente`).
- `POST /api/rh/salarios`: cria salário.
- `GET/PUT/DELETE /api/rh/salarios/{id}`: busca/atualiza/encerra-inativa-exclui salário.
- `GET /api/rh/salarios/usuario/{usuarioId}`: histórico ou salário vigente (`vigente=true`).
- `GET/POST /api/rh/folhas-pagamento`: lista folhas, gera nova.
- `GET/PUT/DELETE /api/rh/folhas-pagamento/{id}`: detalhes, atualização de rascunho, cancelamento/remoção.
- `POST /api/rh/folhas-pagamento/{id}/aprovar`: aprova e gera lançamentos.
- `POST /api/rh/folhas-pagamento/{id}/pagar`: confirma pagamentos.
- `GET /api/rh/folhas-pagamento/periodo/{ano}/{mes}`: busca folha específica.

## Permissões
- **salarios**: `listar`, `visualizar`, `criar`, `editar`, `deletar`, `visualizar_todos`.
- **folhas_pagamento**: `listar`, `visualizar`, `editar`, `criar`, `aprovar`, `pagar`, `cancelar`, `deletar`, `visualizar_todos`.
- Padrões por cargo (seed):
  - Administrador: acesso total a salários e folhas.
  - Gerente: listar/visualizar todos, gerar/aprovar folhas.
  - Funcionário: listar/visualizar apenas próprio.

## Troubleshooting
- **Duplicidade de folha**: verifique período e se já existe registro em `folhas_pagamento`.
- **Erro ao aprovar**: garanta contas contábil/bancária válidas e itens existentes.
- **Salário sobreposto**: vigências não podem conflitar; encerre vigência anterior antes de criar nova.
- **Acesso negado**: confirme permissões `visualizar_todos` para ver dados de outros usuários.
- **Período futuro inválido**: folhas podem ser geradas para o mês atual e próximo mês apenas; períodos mais distantes no futuro são bloqueados.
