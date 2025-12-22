📄 Documentação Consolidada – Implementação do RealtimeKit (STK)

# 1. Importação e Configuração Inicial

Para usar os recursos de áudio, vídeo e notificações do RealtimeKit em um projeto React, é necessário importar o pacote de hooks especializado:

javascript
import { useRealtimeKitClient, RealtimeKitProvider } from '@cloudflare/realtimekit-react';

## Inicialização do Cliente

javascript
function App() {
const [meeting, initMeeting] = useRealtimeKitClient();

useEffect(() => {
initMeeting({
authToken: '<auth-token>', // Token de autenticação do usuário
defaults: {
audio: false, // Áudio desativado por padrão
video: true, // Vídeo ativado por padrão
},
});
}, []);

return (
<RealtimeKitProvider value={meeting}>
<Meeting />
</RealtimeKitProvider>
);
}

🔹 authToken: credencial para autenticação do usuário.  
🔹 defaults: define as configurações iniciais de mídia (áudio/vídeo).  
🔹 RealtimeKitProvider: disponibiliza o objeto meeting para toda a árvore de componentes filhos.

---

# 2. Hooks Disponíveis

## useRealtimeKitMeeting

- Fornece acesso ao objeto da reunião passado ao RealtimeKitProvider.
- Não dispara re-render sempre que qualquer propriedade interna mudar.

Exemplo:
javascript
import { useRealtimeKitMeeting } from '@cloudflare/realtimekit-react';

function Meeting() {
const { meeting } = useRealtimeKitMeeting();

useEffect(() => {
meeting.join(); // Entrar na chamada
}, [meeting]);

return <RtkMeeting meeting={meeting} />;
}

🔹 meeting.join(): inicia participação na chamada.  
🔹 Pode ser usado para acionar notificações de início de chamada.

---

## useRealtimeKitSelector

- Similar ao useSelector do Redux.
- Extrai dados específicos do objeto meeting e dispara re-render apenas quando esses dados específicos mudam.

Exemplo – Listar participantes conectados:
javascript
const joinedParticipants = useRealtimeKitSelector(
(meeting) => meeting.participants.joined
);

Exemplo – Verificar e ingressar na sala:
javascript
import { useRealtimeKitSelector, useRealtimeKitMeeting } from '@cloudflare/realtimekit-react';
import { RtkGrid, RtkButton } from '@cloudflare/realtimekit-react-ui';

function Meeting() {
const { meeting } = useRealtimeKitMeeting();
const roomJoined = useRealtimeKitSelector((m) => m.self.roomJoined);

if (!roomJoined) {
return (

<div>
<p>Você ainda não entrou na sala.</p>
<RtkButton onClick={() => meeting.joinRoom()}>Entrar na Sala</RtkButton>
</div>
);
}

return (

<div style={{ height: '100vh', width: '100vw' }}>
<RtkGrid meeting={meeting} />
</div>
);
}

🔹 meeting.joinRoom(): entra na sala virtual.  
🔹 RtkGrid: exibe o layout de vídeo de todos os participantes.

---

# 3. Fluxo para Chamadas de Vídeo e Áudio

1. Inicializar o cliente RealtimeKit com authToken e configurações padrão.
2. Fornecer o objeto meeting globalmente via RealtimeKitProvider.
3. Usar useRealtimeKitMeeting para acessar métodos da reunião (join, joinRoom, leave, etc.).
4. Controlar estado de microfone e câmera via parâmetros de defaults ou métodos do objeto meeting.
5. Obter lista de participantes usando useRealtimeKitSelector.
6. Exibir vídeo com RtkGrid ou componentes customizados.
7. Enviar notificações (push/websocket externos) ao disparar métodos como meeting.joinRoom() ou meeting.join() para alertar outros usuários.

---

# 4. Integração com Notificações

Embora o trecho fornecido não traga o código para a notificação do outro usuário, a implementação típica é:

- No backend: receber evento de joinRoom/join via webhook ou socket.
- Enviar notificação push ou via WebSocket ao outro cliente para abrir a tela de chamada.
- O lado cliente, ao receber o evento, pode automaticamente abrir a interface de vídeo com meeting.join().

---

# 5. Resumo dos Métodos Importantes

- initMeeting({authToken, defaults}) → Inicializa sessão.
- meeting.join() → Entra na reunião.
- meeting.joinRoom() → Entra na sala virtual.
- meeting.leave() → Sai da reunião/sala.
- meeting.participants.joined → Lista de participantes conectados.

---

Entendi — vamos montar um plano estruturado para que possamos documentar e implementar o STK (RealtimeKit) com chamadas de áudio/vídeo, notificações, customização de estilo e features opcionais, baseado na documentação que você forneceu.  
Vou começar com o plano macro e, em seguida, desenvolveremos cada parte com códigos, parâmetros e cenários reais de uso.

---

# 📋 Plano Geral de Implementação do STK (RealtimeKit)

## 1. Preparação de Ambiente

- Instalação das dependências (@cloudflare/realtimekit-react e @cloudflare/realtimekit-react-ui).
- Configuração de autenticação (authToken) e permissões de áudio/vídeo no navegador.
- Estrutura inicial da aplicação com o <RealtimeKitProvider />.

---

## 2. Core Hooks & Estrutura de Chamada

- useRealtimeKitClient() — inicializa e retorna [meeting, initMeeting].
- useRealtimeKitMeeting() — acesso ao objeto meeting e métodos como join() e joinRoom().
- useRealtimeKitSelector() — extrai dados específicos (ex.: lista de participantes, status do microfone, sala atual).

---

## 3. Interface e Componentes Visuais

- Uso do RtkMeeting ou composição customizada com:
  - RtkGrid — exibição de vídeo em grade.
  - RtkButton — botões de ação (entrar, sair, mutar/desmutar, ativar/desativar câmera).
- Controle de layout e tamanho via props e CSS inline.

---

## 4. Notificações em Tempo Real

- Captura de eventos de entrada/saída com meeting.participants.
- Integração com Push API ou WebSockets para alertar usuários fora da sala.
- Evento de recebimento → abrir modal/tela de chamada convidando a atender.

---

## 5. Customização e Estilização

- Props de estilo nos componentes (RtkGrid, RtkButton, etc.).
- CSS classes personalizadas para adaptar ao design system do projeto.
- Utilização de parâmetros para responsividade e tema escuro/claro.

---

## 6. Features Opcionais

- Tela de pré-ingresso (setup screen) para configurar vídeo/áudio antes da chamada.
- Compartilhamento de tela.
- Controle granular de permissões.
- Modo somente áudio para conexões lentas.
- Gravação da reunião (via backend).

---

Perfeito 👍  
Vamos iniciar então com Parte 1 e Parte 2 do plano: configuração inicial e uso dos core hooks para começar a implementar chamadas de áudio/vídeo, notificações, estilo e recursos opcionais.  
Depois avançaremos para a parte de estilização e features opcionais como transcrição e compartilhamento de tela.

---

# Parte 1 – Preparação de Ambiente e Inicialização

## Instalação

No projeto React, instale os pacotes necessários:
bash
npm install @cloudflare/realtimekit-react @cloudflare/realtimekit-react-ui

## Configuração Inicial

javascript
import { useRealtimeKitClient, RealtimeKitProvider } from '@cloudflare/realtimekit-react';

function App() {
const [meeting, initMeeting] = useRealtimeKitClient();

useEffect(() => {
initMeeting({
authToken: '<auth-token>',
defaults: {
audio: true, // habilita microfone inicialmente
video: true, // habilita câmera inicialmente
},
});
}, []);

return (
<RealtimeKitProvider value={meeting}>
<Meeting />
</RealtimeKitProvider>
);
}

Parâmetros principais:

- authToken: chave de autenticação gerada pelo backend (garante segurança).
- defaults.audio / defaults.video: define se o microfone e câmera começam ligados.

---

# Parte 2 – Core Hooks no Fluxo da Chamada

## Acessando o objeto meeting

javascript
import { useRealtimeKitMeeting } from '@cloudflare/realtimekit-react';

function Meeting() {
const { meeting } = useRealtimeKitMeeting();

return (
<>
<button onClick={() => meeting.joinRoom()}>Entrar na Sala</button>
<button onClick={() => meeting.leave()}>Sair da Sala</button>
</>
);
}

Métodos comuns:

- meeting.joinRoom() → ingressa na sala.
- meeting.leave() → sai da sala.
- meeting.join() → participa diretamente de uma reunião.

---

# Parte 3 – Notificações em Tempo Real

Para avisar outro usuário que está recebendo uma chamada, capturamos eventos e enviamos via WebSocket ou Push API.

## Captura de Evento

javascript
import { useRealtimeKitSelector } from '@cloudflare/realtimekit-react';

function ParticipantWatcher() {
const joinedParticipants = useRealtimeKitSelector(
(m) => m.participants.joined
);

useEffect(() => {
if (joinedParticipants.length > 0) {
// Envia notificação para outro usuário
sendNotificationToOtherClient(joinedParticipants);
}
}, [joinedParticipants]);

return null;
}

💡 Implementação típica do sendNotificationToOtherClient:

- No backend: receber evento via socket do app que iniciou a chamada.
- Enviar push/websocket para o cliente receptor.
- O lado receptor abre popup/modal perguntando se deseja atender.

---

# Parte 4 – Estilização (Personalização de Componentes)

Os componentes de UI (ex.: RtkGrid, RtkButton) aceitam props e classes CSS.

javascript
import { RtkGrid, RtkButton } from '@cloudflare/realtimekit-react-ui';

<RtkGrid
meeting={meeting}
style={{ height: '80vh', backgroundColor: '000' }}
className="video-grid"
/>

<RtkButton
color="primary"
size="large"
style={{ margin: '10px' }}

> Ativar Microfone
> </RtkButton>

Parâmetros comuns de estilo:

- style → objeto CSS inline.
- className → classe para estilização global.
- color → “primary”, “secondary”, “danger” etc.
- size → “small”, “medium”, “large”.

---

# Parte 5 – Features Opcionais

Segundo a documentação fornecida pelo DITE/STK, podemos implementar:

1. Transcrição automática da reunião (capturar áudio e enviar para análise).
2. Resumo automático (API processa texto transcrito e retorna highlights).
3. Compartilhamento de tela com meeting.startScreenshare().
4. Modo somente áudio para usuários sem câmera.
5. Gravação em nuvem (via backend).
6. Configuração pré‑call — tela para ligar ou desligar câmera/mic antes de ingressar.

Vamos então avançar para a Parte 6 – AI Meetings e detalhar como implementar as funcionalidades de transcrição, resumo e compartilhamento de tela no STK (RealtimeKit), aproveitando os recursos de IA que a documentação menciona.

---

# Parte 6 – AI Meetings no RealtimeKit 🤖

## 1. Transcrição da Reunião (Meeting Transcription)

A API do STK permite capturar o áudio dos participantes e enviá-lo para um serviço de transcrição automática (normalmente via WebSocket ou WebRTC DataChannel para reduzir latência).

Fluxo típico:

1. Capturar o stream de áudio usando meeting.on('audioTrack', callback).
2. Encaminhar para o serviço de transcrição (pode ser integrado com um endpoint local ou na nuvem).
3. Receber texto parcial em tempo real e exibir na UI.

javascript
meeting.on('transcription', (data) => {
console.log('Texto transcrito:', data.text);
// Atualizar tela de legendas
});

Parâmetros opcionais:

- language — idioma desejado na transcrição ('pt-BR', 'en-US' etc.).
- partialResults — habilitar resultados parciais antes da frase completa.
- saveTranscript — armazenar no servidor para consultas futuras.

---

## 2. Resumo da Reunião (Meeting Summary)

Depois que a transcrição estiver disponível, podemos enviar esse texto para um serviço de resumo automático.
O STK tipicamente fornece um endpoint de “Meeting Summary”:

javascript
meeting.generateSummary({
includeHighlights: true,
maxLength: 300 // número máximo de palavras
}).then(summary => {
console.log('Resumo da reunião:', summary.text);
});

Opções:

- includeHighlights — retorna pontos-chave detectados.
- maxLength — tamanho máximo do resumo.
- tone — opcionalmente, adequa o estilo do resumo (“formal”, “amigável” etc.).

---

## 3. Compartilhamento de Tela (Displaying Screenshare)

O STK oferece métodos para iniciar e parar o compartilhamento de tela durante a reunião.

Iniciar compartilhamento:
javascript
meeting.startScreenshare()
.then(() => console.log('Compartilhamento iniciado'))
.catch(err => console.error('Erro ao iniciar:', err));

Parar compartilhamento:
javascript
meeting.stopScreenshare();

Na UI, você pode usar um componente para exibir o fluxo da tela compartilhada:
javascript
<RtkGrid meeting={meeting} showScreenshare={true} />

---

## 4. Combinação com Notificações

Para que o outro usuário seja avisado que há transcrição ativa, resumo gerado, ou compartilhamento de tela:

- Transcrição iniciada → disparar evento "transcriptionStarted".
- Resumo disponível → enviar via WebSocket ou Push para participantes.
- Compartilhamento ativo → indicar visualmente e/ou via notificação sonora.

---

## 5. Plano de Implementação Completo

## Presets Recomendados

- `group_call_host`: Para o iniciador da chamada (controle total)
- `group_call_participant`: Para demais participantes
- `group_call_with_transcription`: Usado quando transcrição está habilitada

## Transcrição e Resumo por IA

O sistema integra recursos de Inteligência Artificial para enriquecer a experiência das chamadas:

### Transcrição em Tempo Real
- **Tecnologia**: Dyte Transcription (via SDK)
- **Configuração**: Habilitada via `DYTE_ENABLE_TRANSCRIPTION=true` no `.env`
- **Funcionamento**: 
  - O frontend captura eventos de transcrição (`meeting.ai.on('transcript')`)
  - Exibe legendas em tempo real no componente `LiveTranscriptPanel`
  - Ao finalizar a chamada, a transcrição completa é salva no banco de dados

### Resumo Inteligente
- **Tecnologia**: OpenAI GPT-4o
- **Geração**: Automática ao finalizar chamadas com transcrição
- **Conteúdo**: Tópicos principais, decisões e próximos passos
- **Visualização**: Aba dedicada no histórico de chamadas (`CallTranscriptViewer`)

### Fluxo de Dados
1. Chamada inicia com flag de transcrição
2. Dyte envia áudio para motor de Speech-to-Text
3. Frontend recebe e exibe texto parcial/final
4. Ao encerrar, frontend envia texto completo para Server Action
5. Server Action salva transcrição e dispara job de resumo
6. IA processa texto e salva resumo estruturado

1. Inicializar meeting com suporte a áudio/vídeo ativo.
2. Configurar captura de transcrição usando meeting.on('transcription', ...).
3. Implementar botão de resumo que dispara meeting.generateSummary(...).
4. Adicionar controles de tela com startScreenshare e stopScreenshare.
5. Integrar com sistema de notificações em tempo real para alertar recursos ativos.
6. Personalizar UI usando props de estilo (size, color, className).

https://docs.realtime.cloudflare.com/react-ui-kit

https://docs.realtime.cloudflare.com/api#/

https://docs.realtime.cloudflare.com/guides
