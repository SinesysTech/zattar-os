# Regras de Negocio - Entrevistas Trabalhistas

## Contexto
Ficha de entrevista de investigacao trabalhista vinculada a um contrato. Suporta tres trilhas de litigio com modulos especificos, validacao progressiva e consolidacao final com IA.

## Entidades Principais
- **EntrevistaTrabalhista**: Entrevista com tipo de litigio, status, modulo atual e respostas JSONB por modulo

## Enums e Constantes
- **TipoLitigio**: `trabalhista_classico`, `gig_economy`, `pejotizacao`
- **StatusEntrevista**: `rascunho`, `em_andamento`, `concluida`
- **PerfilReclamante**: `domestica`, `comerciario`, `motorista_app`, `entregador`, `profissional_ti`, `profissional_saude`, `vendedor_pj`, `consultor_pj`, entre outros

### Trilhas e Modulos
- **Trilha A (Classico)**: `vinculo` -> `jornada` -> `saude_ambiente` -> `ruptura`
- **Trilha B (Gig Economy)**: `controle_algoritmico` -> `dependencia_economica` -> `condicoes_trabalho_gig` -> `desligamento_plataforma`
- **Trilha C (Pejotizacao)**: `contrato_pj` -> `subordinacao_real` -> `exclusividade_pessoalidade` -> `fraude_verbas`
- **Modulo final compartilhado**: `consolidacao_final`

## Regras de Negocio
- **Unicidade**: apenas uma entrevista por contrato; tentativa de duplicar retorna erro
- **Salvar modulo**: merge JSONB das respostas; valida contra schema Zod do modulo; pode avancar automaticamente para o proximo modulo da trilha
- **Entrevista concluida nao pode ser editada**: salvarModulo rejeita status `concluida`

### Finalizacao (validacao obrigatoria por trilha)
- **Classico**: exige CTPS, remuneracao, data admissao, funcao/cargo, motivo e data do desligamento
- **Gig Economy**: exige tipo plataforma, renda mensal media, data inicio, horas/dia, forma e data do desligamento
- **Pejotizacao**: exige origem PJ, data inicio, remuneracao liquida mensal, regime de ferias
- **Todas as trilhas**: exigem `relato_completo_texto` na consolidacao final
- Registra se testemunhas foram mapeadas (`testemunhasMapeadas`)

### Reabertura
- So permite reabrir entrevistas com status `concluida`; muda para `em_andamento`

## Revalidacao de Cache
- `revalidatePath("/app/contratos/{contratoId}")` em todas as mutacoes (iniciar, salvar, finalizar, reabrir, anexos)
