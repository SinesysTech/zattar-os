# Regras de Negocio - Captura

## Contexto
Modulo de automacao de captura de dados dos sistemas judiciais (PJE, TRT). Utiliza drivers polimorifcos (Playwright) para autenticar, navegar e extrair dados de processos, audiencias, pericias, partes e timelines dos tribunais.

## Entidades Principais
- **CapturaLog**: Log de execucao de captura (status, tipo, advogado, credenciais)
- **ConfigTribunal**: Configuracao de acesso a um tribunal (URL, sistema, timeouts)
- **Credencial**: Par CPF/senha para autenticacao no tribunal
- **ProcessoCapturado**: Processo extraido do tribunal
- **AudienciaCapturada**: Audiencia extraida do tribunal
- **MovimentacaoCapturada**: Movimentacao/timeline extraida

## Enums e Tipos

### Tipo de Captura
| Tipo | Descricao |
|------|-----------|
| `acervo_geral` | Processos ativos do acervo |
| `arquivados` | Processos arquivados |
| `audiencias` | Audiencias (generico) |
| `audiencias_designadas` | Audiencias marcadas (M) |
| `audiencias_realizadas` | Audiencias finalizadas (F) |
| `audiencias_canceladas` | Audiencias canceladas (C) |
| `expedientes_no_prazo` | Expedientes com prazo |
| `expedientes_sem_prazo` | Expedientes sem prazo |
| `pendentes` | Pendencias de manifestacao |
| `partes` | Partes de processos |
| `pericias` | Pericias |
| `timeline` | Timeline de movimentacoes |
| `combinada` | Captura combinada |

### Status de Captura
- `pending`: Aguardando inicio
- `in_progress`: Em execucao
- `completed`: Concluida com sucesso
- `failed`: Falhou

### Sistema Judicial
- `PJE`: Processo Judicial Eletronico
- `ESAJ`: e-SAJ (SP)
- `EPROC`: e-Proc
- `PROJUDI`: Projudi

### Tipo de Acesso ao Tribunal
- `primeiro_grau`: Acesso separado 1o grau
- `segundo_grau`: Acesso separado 2o grau
- `unificado`: Login unico com navegacao entre graus
- `unico`: Tribunais superiores (TST)

## Regras de Negocio

### Fluxo de Captura (Orchestrator)
1. Buscar credencial por ID
2. Buscar configuracao do tribunal (tribunais_config)
3. Obter driver via Factory (polimorfico por sistema)
4. Autenticar no sistema judicial
5. Buscar processos/audiencias conforme tipo
6. Persistir resultados no banco
7. Encerrar driver (fechar browser)
8. Registrar log de captura

### Configuracao de Tribunal
- Armazenada na tabela `tribunais_config`
- Busca por `tribunal_id` (obtido da tabela `tribunais` via codigo)
- Suporta custom timeouts por tribunal (login, redirect, networkIdle, api)

### Mapeamento de Origem
- `acervo_geral` -> `acervo_geral`
- `arquivados` -> `arquivado`
- Todos outros tipos -> `acervo_geral`

### Mapeamento de Grau
- `primeiro_grau` -> `primeiro_grau`
- `segundo_grau` -> `segundo_grau`
- `unificado` -> `primeiro_grau` (default)
- `unico` -> `tribunal_superior`

## Filtros Disponiveis (Log de Capturas)
- **Tipo**: tipo_captura
- **Advogado**: advogado_id
- **Status**: status
- **Datas**: data_inicio, data_fim
- **Paginacao**: pagina, limite

## Revalidacao de Cache
Apos mutacoes, revalidar:
- `/app/processos/{processoId}/timeline` - Timeline do processo
- `/app/processos/{processoId}` - Detalhe do processo
