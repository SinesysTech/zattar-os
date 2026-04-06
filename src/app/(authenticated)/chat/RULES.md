# Regras de Negocio - Chat

## Contexto
Modulo de comunicacao interna com salas de chat, mensagens em tempo real (Supabase Realtime), chamadas de audio/video (Dyte) e upload de arquivos. Suporta salas gerais, privadas, de grupo e vinculadas a documentos.

## Entidades Principais
- **SalaChat**: Sala de conversa (geral, privada, grupo, documento)
- **MensagemChat**: Mensagem enviada em uma sala
- **Chamada**: Chamada de audio/video com integracao Dyte
- **ChamadaParticipante**: Participante de uma chamada

## Enums e Tipos

### Tipo de Sala
| Tipo | Descricao |
|------|-----------|
| `geral` | Sala publica compartilhada por todos |
| `documento` | Vinculada a um documento especifico |
| `privado` | Conversa 1-para-1 |
| `grupo` | Grupo criado manualmente |

### Tipo de Mensagem
- `texto`: Mensagem de texto
- `arquivo`: Mensagem com anexo
- `imagem`: Imagem
- `video`: Video
- `audio`: Audio
- `sistema`: Notificacao do sistema

### Status de Mensagem
- `sending`: Enviando (temporario, nao persistido)
- `sent`: Enviada
- `forwarded`: Encaminhada
- `read`: Lida
- `failed`: Falhou (temporario, nao persistido)

### Tipo de Chamada
- `audio`: Chamada de audio
- `video`: Chamada de video

### Status de Chamada
- `iniciada`: Chamada criada, aguardando participantes
- `em_andamento`: Pelo menos um participante ativo
- `finalizada`: Encerrada normalmente
- `cancelada`: Cancelada antes de iniciar
- `recusada`: Recusada pelo convidado

## Regras de Validacao

### Criar Sala
- `nome`: 1-200 caracteres
- `tipo`: enum TipoSalaChat
- Se tipo `documento`: `documentoId` obrigatorio
- Se tipo `privado`: `participanteId` obrigatorio

### Criar Mensagem
- `salaId`: obrigatorio (numero)
- `conteudo`: minimo 1 caractere
- `tipo`: default `texto`
- `data`: objeto opcional com metadados de midia (fileName, fileUrl, mimeType, size, etc.)

### Criar Chamada
- `salaId`: obrigatorio
- `tipo`: audio ou video
- `meetingId`: string Dyte

## Regras de Negocio

### Sala Geral
- Existe apenas UMA por sistema
- Criada via seed/migracao (NUNCA via API)
- Nao pode ser deletada nem removida da lista

### Criacao de Sala Privada
1. Verificar se ja existe sala entre os dois usuarios
2. Se existe: retornar sala existente e garantir memberships
3. Se nao existe: criar nova sala
4. Adicionar criador e participante como membros

### Criacao de Grupo
1. Nome obrigatorio e nao vazio
2. Pelo menos 1 membro alem do criador
3. Criador automaticamente adicionado como membro

### Permissoes de Sala
- Apenas grupos podem ter nome editado
- Apenas criador pode editar nome do grupo
- Apenas criador pode fazer hard delete
- Arquivar/desarquivar: criador ou participante
- Sala Geral: nao pode ser removida por ninguem

### Envio de Mensagem
1. Validar schema
2. Verificar que sala existe
3. Salvar mensagem (Supabase Realtime dispara evento automaticamente)
4. Status default: `sent`

### Remocao de Conversa
- Soft delete: marca como inativo apenas para o usuario (via membros)
- Conversa continua existindo para outros participantes
- Sala Geral nao pode ser removida

### Fluxo de Chamada
1. **Iniciar**: verificar sala existe, usuario e membro, criar chamada com status `iniciada`
2. **Entrar**: registrar entrada, mudar status para `em_andamento` se era `iniciada`
3. **Responder**: aceitar ou recusar (recusa muda status para `recusada`)
4. **Sair**: registrar saida, se nenhum participante ativo finaliza automaticamente
5. **Finalizar**: apenas iniciador pode forcar finalizacao, calcula duracao
6. Chamadas encerradas/canceladas nao aceitam novas entradas

### Transcricao e Resumo
- Salvar transcricao: apenas iniciador ou participante confirmado
- Gerar resumo: via IA (`gerarResumoTranscricao`), requer transcricao existente
- Historico de chamadas: max 100 por consulta

## Filtros Disponiveis

### Salas
- **Tipo**: tipo (geral, privado, grupo, documento)
- **Documento**: documentoId
- **Arquivadas**: arquivadas (boolean)
- **Paginacao**: limite, offset

### Chamadas
- **Tipo**: tipo (audio, video)
- **Status**: status
- **Datas**: dataInicio, dataFim
- **Usuario**: usuarioId
- **Paginacao**: limite, offset, pagina

## Revalidacao de Cache
Apos mutacoes, revalidar:
- `/app/chat` - Lista de salas
- `/app/chat/{salaId}` - Sala especifica
