# Visualização Detalhada de Captura

**Change ID:** `visualizacao-detalhada-captura`
**Type:** Feature Enhancement
**Status:** Proposed
**Author:** Claude
**Date:** 2025-01-21

## Problem Statement

Atualmente, a visualização dos detalhes de uma captura no histórico é feita através de um dialog modal (`CapturaDetailsDialog`). Este dialog exibe informações extensas incluindo:

- Informações básicas (ID, tipo, status, advogado)
- Credenciais utilizadas
- Datas e horários
- Resultado completo em JSON (pode ser muito grande)
- Mensagens de erro (quando aplicável)

O problema é que **o conteúdo é muito grande para um dialog**, especialmente quando o resultado JSON contém muitos dados. Isso resulta em uma experiência ruim para o usuário, com necessidade de scroll extensivo dentro de um modal.

## Proposed Solution

Substituir o dialog modal por uma **página dedicada de visualização** seguindo o padrão já estabelecido para processos (`/processos/[id]`).

### Arquitetura da Solução

1. **Nova Rota**: `/captura/historico/[id]`
   - Page (Server Component) para metadata e validação
   - Componente de visualização (Client Component) para conteúdo interativo

2. **Navegação**: Ao clicar no botão de visualização (olho) na tabela, o usuário será redirecionado para a página dedicada

3. **Layout**: Página full-width com cards organizados para melhor apresentação do conteúdo extenso

### Benefícios

- **Melhor UX**: Mais espaço para exibir informações extensas
- **Navegação**: URL compartilhável e navegação nativa do browser
- **SEO**: Metadata dinâmica para cada captura
- **Consistência**: Padrão similar à visualização de processos
- **Performance**: Melhor rendering de conteúdo grande

## Scope

### In Scope
- Criar nova rota `/captura/historico/[id]`
- Criar componente de visualização `CapturaVisualizacao`
- Modificar `HistoricoCapturas` para navegar ao invés de abrir dialog
- Remover `CapturaDetailsDialog` e suas referências

### Out of Scope
- Adicionar novas funcionalidades além da visualização
- Modificar estrutura de dados da captura
- Adicionar edição de capturas

## Dependencies

- Nenhuma dependência externa
- Usa estrutura de rotas existente do Next.js App Router
- Usa componentes UI existentes (Card, Badge, Button)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Quebra de fluxo existente | Médio | Manter botão de voltar claro na página |
| SEO de páginas dinâmicas | Baixo | Implementar metadata dinâmica corretamente |
| Performance com JSON grande | Baixo | Usar pre com scroll limitado |

## Success Criteria

- [ ] Usuário pode visualizar detalhes completos da captura em página dedicada
- [ ] Navegação funciona corretamente (voltar, compartilhar link)
- [ ] Metadata dinâmica gerada corretamente
- [ ] Dialog removido sem quebrar funcionalidades
- [ ] Botão de deletar funciona na nova página
