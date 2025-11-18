# Change: Adicionar Múltiplas Visualizações para Página de Audiências

## Why
A página de audiências atualmente possui apenas uma visualização de tabela simples. Para melhorar a experiência do usuário e facilitar o planejamento e visualização das audiências agendadas, precisamos implementar múltiplas visualizações que permitam aos usuários visualizar as audiências de diferentes formas: por semana, por mês e por ano. Além disso, precisamos reorganizar as colunas da tabela para melhor exibir informações importantes como classe processual e órgão julgador.

## What Changes
- Reorganizar colunas da visualização de tabela atual:
  - Primeira coluna: Hora (somente hora, sem data)
  - Segunda coluna composta "Processo": Classe processual + número do processo + TRT + grau + órgão julgador
  - Terceira coluna composta "Tipo/Local": Tipo de audiência + sala de audiência
  - Quarta coluna: Responsável (componente de seleção existente)
  - Remover coluna "Fim" (hora final)
  - Remover coluna "Status" da tabela e mover para filtro
- Adicionar dropdown de filtro de status após filtros avançados:
  - Opções: Marcada, Realizada, Cancelada
  - Default: Marcada
- Implementar múltiplas visualizações:
  - **Visualização Atual**: Tabela com todas as audiências (já existe, apenas reorganizar)
  - **Visualização por Semana**: Tabs por dia da semana (Segunda a Sexta) mostrando tabela de audiências do dia
  - **Visualização por Mês**: Calendário mensal tamanho da página com audiências nos dias
  - **Visualização por Ano**: Calendário anual com 12 meses pequenos mostrando dias com audiências
- Adicionar componente de seleção de visualização (tabs ou botões)
- Buscar órgão julgador via JOIN com tabela orgao_julgador
- Buscar classe processual via JOIN com tabela acervo

## Impact
- Affected specs: `audiencias`
- Affected code:
  - `app/(dashboard)/audiencias/page.tsx` - Adicionar múltiplas visualizações e reorganizar colunas
  - `components/audiencias-visualizacao-semana.tsx` - Criar componente de visualização por semana
  - `components/audiencias-visualizacao-mes.tsx` - Criar componente de visualização por mês
  - `components/audiencias-visualizacao-ano.tsx` - Criar componente de visualização por ano
  - `backend/audiencias/services/persistence/listar-audiencias.service.ts` - Adicionar JOINs para buscar orgao_julgador e classe_judicial
  - `backend/types/audiencias/types.ts` - Adicionar campos orgao_julgador_descricao e classe_judicial
  - `lib/types/audiencias.ts` - Adicionar tipos para as novas visualizações
