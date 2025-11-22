# Change: Unificação de Processos Multi-Instância na Visualização

## Why

Nos Tribunais Regionais do Trabalho (TRT), quando um processo passa do primeiro grau para o segundo grau (ou para o TST - terceiro grau), ele mantém o mesmo número de processo, mas é cadastrado novamente no sistema do grau superior. Isso resulta em duplicação/triplicação de registros no nosso banco de dados, cada um com sua própria timeline acumulativa:

- **Primeiro grau**: Timeline inicial do processo
- **Segundo grau**: Timeline do primeiro grau + novos movimentos do segundo grau
- **TST (terceiro grau)**: Timeline completa (primeiro + segundo + TST)

Quando o processo retorna para o primeiro grau após tramitar no segundo, o sistema do tribunal adiciona todos os movimentos do segundo grau à timeline do primeiro.

**Problema**: Atualmente, a API e o frontend listam esses processos como registros separados, resultando em:
- Contagem inflacionada (um processo contado 2 ou 3 vezes)
- Listagem duplicada/triplicada confusa para o usuário
- Visualização de timeline com dados repetidos

Essa duplicação é **intencional no banco de dados** para manter consistência com os sistemas dos tribunais, mas **não deve ser exposta ao usuário final**.

## What Changes

**Backend (API)**:
- Adicionar agrupamento de processos pelo número (campo `numero_processo`)
- Retornar processos unificados identificando todos os graus em que o processo existe
- Ajustar contagem total para refletir processos únicos (não instâncias)
- Fornecer metadados sobre os graus/instâncias de cada processo unificado

**Frontend (Visualização)**:
- Unificar processos com mesmo número em uma única linha na tabela
- Exibir indicadores visuais de múltiplos graus (badges/ícones)
- Ajustar paginação e contagem para processos únicos
- Na visualização detalhada, agregar timelines deduplicando eventos repetidos
- Mostrar claramente em qual(is) grau(s) o processo está ativo

**Não altera**:
- Estrutura do banco de dados (mantém registros separados)
- Lógica de captura do PJE (continua capturando todas as instâncias)
- Sistema de permissões ou autenticação

## Impact

**Specs afetadas**:
- `acervo` - Adicionar requirements para agrupamento e unificação de processos
- `frontend-processos` - Modificar visualização para processos unificados

**Código afetado**:
- `app/api/acervo/route.ts` - Implementar agrupamento SQL
- `app/(dashboard)/processos/page.tsx` - Ajustar rendering para processos unificados
- Componentes de tabela e visualização de processos
- Possível adição de helper/service para lógica de deduplicação de timeline

**Benefícios**:
- Contagem precisa de processos únicos
- Melhor experiência do usuário (menos confusão)
- Visualização consolidada de processos multi-instância
- Mantém integridade dos dados originais no banco

**Riscos**:
- Mudança na estrutura de resposta da API pode impactar código existente que consome `/api/acervo`
- Lógica de agregação de timeline pode ser complexa
- Performance: queries de agrupamento podem ser mais lentas (mitigado com índices adequados)
