# Regras de Negocio - Expedientes

## Contexto
Modulo de expedientes judiciais do PJE/TRT. Gerencia intimacoes, notificacoes e prazos processuais vindos de captura automatizada, Comunica CNJ ou cadastro manual.

## Entidades Principais
- **Expediente**: Registro de expediente judicial vinculado a um processo, com prazo, responsavel e tipo

## Enums e Constantes
- **OrigemExpediente**: `captura` (PJE), `manual`, `comunica_cnj`
- **GrauTribunal**: `primeiro_grau`, `segundo_grau`, `tribunal_superior`
- **CodigoTribunal**: TRT1 a TRT24
- **ResultadoDecisao**: `desfavoravel`, `parcialmente_favoravel`, `favoravel`

## Regras de Validacao
- `numeroProcesso`: obrigatorio
- `trt`: obrigatorio (enum CodigoTribunal)
- `grau`: obrigatorio (enum GrauTribunal)
- `dataPrazoLegalParte`: obrigatorio
- `origem`: default `manual`

### Baixa de Expediente
- Requer `protocoloId` OU `justificativaBaixa` (pelo menos um)
- `dataBaixa` nao pode ser futura
- `resultadoDecisao`: opcional (enum)

## Regras de Negocio
- **Criacao**: valida existencia do processo (`processoId`) e tipo de expediente (`tipoExpedienteId`) se informados
- **Atualizacao**: preserva historico em `dados_anteriores` (JSONB) para auditoria, evitando aninhamento recursivo
- **Baixa**: impede baixa duplicada ("Expediente ja esta baixado"); registra log de auditoria via RPC `registrar_baixa_expediente`
- **Reversao de baixa**: so permite reverter expediente que esta baixado; registra log via RPC `registrar_reversao_baixa_expediente`
- **Atribuicao de responsavel**: via RPC `atribuir_responsavel_pendente` com log de auditoria
- **Atualizacao tipo/descricao**: registra alteracao em `logs_alteracao` com dados anteriores e novos
- **Paginacao**: default 50 itens, max 1000; ordenacao default por `data_prazo_legal_parte ASC`
- **Filtro de prazo com `incluirSemPrazo`**: inclui expedientes sem prazo (legado do calendario)
- **Busca por CPF**: normaliza CPF (11 digitos), busca via relacao `clientes -> processo_partes -> processos -> expedientes`
- **View `expedientes_com_origem`**: utilizada para leitura, traz dados do 1o grau (fonte da verdade)

## Revalidacao de Cache
- `/app/expedientes`, `/app/expedientes/quadro`, `/app/expedientes/semana`, `/app/expedientes/mes`, `/app/expedientes/ano`, `/app/expedientes/lista`
