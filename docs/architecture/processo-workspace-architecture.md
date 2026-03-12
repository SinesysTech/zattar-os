# Processo Workspace Architecture

## Objetivo

Transformar a página do processo em um workspace contínuo de leitura jurídica, removendo a quebra entre capa, abas de contexto e timeline/document viewer.

## Arquitetura Final da Página

### 1. Shell único

- Um único container visual agrupa `ProcessoHeader`, `ProcessoDetailsTabs`, barra de ações do workspace e o split principal.
- O usuário não deve perceber a página como "capa em cima" e "timeline embaixo"; tudo pertence ao mesmo contexto de trabalho.

### 2. Contexto progressivo

- O header apresenta metadados estratégicos: identificação do processo, órgão, graus, partes e responsável.
- O modo compacto recolhe esse contexto para privilegiar leitura da timeline e do documento.
- As tabs de `Expedientes`, `Audiências` e `Perícias` ficam no mesmo shell e desaparecem no modo focado.

### 3. Workspace operacional

- Coluna esquerda: navegação temporal e contextual da timeline.
- Coluna central: leitura do documento ou evento selecionado.
- Camada lateral direita: anotações contextuais sem trocar de página.

### 4. Camadas de interação

- Barra de ações do workspace concentra busca, alternância da camada de anotações e modo de leitura focada.
- Toolbar do viewer concentra ações do item selecionado: detalhes, download, abrir externamente e controle de anotações.

## Decisões de IA

- A timeline é o eixo primário de navegação.
- O header deixa de competir com a timeline; ele apenas contextualiza e pode ser recolhido.
- As tabs continuam acessíveis, mas passam a ser contexto secundário do mesmo workspace.
- A anotação não usa o módulo genérico de notas do produto, porque ele não modela vínculo com processo, item da timeline ou âncora documental.

## Estado das Anotações

- Persistência principal: tabela `public.processo_workspace_anotacoes`.
- Fallback de experiência: `localStorage` por processo, via chave `processo-workspace-annotations:<processoId>`.
- Escopo atual: anotações por item da timeline.
- Estrutura preparada para evolução de ancoragem via campo `anchor` em JSONB.

## Status Atual

- Migration aplicada no projeto Supabase remoto `cxxdivtgeslrujpfpivs`.
- Migration registrada em `supabase_migrations.schema_migrations` como `create_processo_workspace_anotacoes`.
- O hook do workspace já tenta persistência remota e degrada para cache local apenas se a action falhar.

## Próximas Etapas

1. Validar o fluxo de criação/remoção de anotações com dados reais de usuário em ambiente integrado.
2. Evoluir do modelo contextual para ancoragem real em página/trecho do documento.
3. Revisar o viewer baseado em iframe para suportar highlight de produção.
4. Adicionar edição e filtros de anotações por processo/documento.
