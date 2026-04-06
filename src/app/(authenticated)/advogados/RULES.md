# Regras de Negocio - Advogados

## Contexto
Modulo de cadastro de advogados e suas credenciais de acesso aos tribunais (PJE). Um advogado pode ter multiplas inscricoes na OAB e multiplas credenciais para diferentes tribunais/graus.

## Entidades Principais
- **Advogado**: Cadastro do advogado (nome, CPF, OABs)
- **Credencial**: Credencial de acesso a um tribunal/grau especifico
- **CredencialComAdvogado**: Credencial com dados do advogado (JOIN)

## Enums e Tipos

### Grau Credencial
- `1`: 1o Grau
- `2`: 2o Grau

### Modo Duplicata (criacao em lote)
- `pular`: Ignora credenciais ja existentes
- `sobrescrever`: Atualiza senha de credenciais existentes

## Regras de Validacao

### Advogado
- `nome_completo`: minimo 3 caracteres
- `cpf`: 11 digitos (normalizado, sem pontuacao)
- `oabs`: array com pelo menos 1 OAB
  - `numero`: string nao vazia
  - `uf`: exatamente 2 caracteres, deve ser UF valida do Brasil

### Credencial
- `advogado_id`: obrigatorio
- `tribunal`: string do codigo TRT (TRT1-24)
- `grau`: enum ['1', '2']
- `senha`: obrigatoria, minimo 1 caractere
- `usuario`: opcional (login PJE, se diferente do CPF do advogado)
- `active`: boolean, default true

### Credenciais em Lote
- `advogado_id`: numero positivo
- `tribunais`: array com pelo menos 1 tribunal
- `graus`: array com pelo menos 1 grau ['1', '2']
- `senha`: obrigatoria

## Regras de Negocio

### Criacao de Advogado
1. Normalizar CPF (remover pontuacao)
2. Validar CPF com 11 digitos
3. Normalizar OABs (trim numero, uppercase UF)
4. Verificar unicidade de CPF (unique constraint)

### Atualizacao de Advogado
1. Se CPF informado, validar e normalizar
2. Se OABs informadas, validar cada uma (numero + UF)
3. Manter pelo menos 1 OAB
4. Verificar unicidade de CPF (constraint 23505)

### Criacao de Credencial
1. Verificar que advogado existe
2. Verificar unicidade: nao pode ter credencial ativa para mesmo advogado + tribunal + grau
3. Conversao de grau: UI ('1'/'2') -> banco (primeiro_grau/segundo_grau)
4. Senha NUNCA retornada nas respostas

### Credenciais em Lote
1. Validar que advogado existe
2. Gerar todas combinacoes tribunal x grau
3. Buscar credenciais existentes
4. Para cada combinacao:
   - Se existe e modo=pular: pular
   - Se existe e modo=sobrescrever: atualizar senha e reativar
   - Se nao existe: criar nova
5. Retornar resumo detalhado (criadas, atualizadas, puladas, erros)

### Atualizacao de Status em Lote
- Maximo 500 credenciais por operacao
- Ativa ou desativa todas de uma vez

## Filtros Disponiveis

### Advogados
- **Busca**: nome_completo, cpf (ilike)
- **OAB**: oab (numero) + uf_oab (JSONB containment)
- **Com credenciais**: com_credenciais (true = apenas com credenciais ativas)
- **Ordenacao**: nome_completo (asc)
- **Paginacao**: max 100 por pagina

### Credenciais
- **Advogado**: advogado_id
- **Status**: active (boolean)
- **Tribunal**: tribunal
- **Grau**: grau
- **Ordenacao**: tribunal (asc), grau (asc)

## Revalidacao de Cache
Apos mutacoes, revalidar:
- `/app/captura/advogados` - Lista de advogados
- `/app/captura/credenciais` - Lista de credenciais
