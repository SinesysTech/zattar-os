# Implementação Dyte (Vídeo/Áudio)

## Visão Geral

O projeto utiliza o **Dyte SDK** para funcionalidades de chamadas de vídeo e áudio no módulo de chat.
A implementação segue a arquitetura Feature-Sliced Design, localizada em `src/features/chat`.

## Componentes

### CustomMeetingUI (Novo)
Substitui o componente padrão `<DyteMeeting>` para oferecer uma interface totalmente customizada e alinhada ao design system.

**Características:**
- **Layout Responsivo:** Adapta-se automaticamente a Mobile, Tablet e Desktop.
- **Modos de Visualização:** Grid, Spotlight (Foco) e Sidebar.
- **Controles Customizados:** Barra de controles com estilo shadcn/ui.
- **Animações:** Transições suaves de entrada/saída de participantes.

**Estrutura:**
```tsx
<CustomMeetingUI
  meeting={meeting}
  onLeave={handleExit}
  isRecording={isRecording}
  // ...outros hooks
/>
```

### Componentes Internos
- `CustomVideoGrid`: Renderiza os vídeos dos participantes.
- `CustomAudioGrid`: Variante para chamadas apenas de áudio.
- `CustomCallControls`: Barra de botões (Mic, Camera, Screen, Rec).
- `CustomParticipantList`: Lista lateral de participantes.
- `LayoutSwitcher`: Controle flutuante para trocar layouts.
- `NetworkQualityIndicator`: Exibe qualidade da conexão (Excelente, Boa, Ruim).
- `KeyboardShortcutsHelp`: Modal com lista de atalhos de teclado.
- `CallLoadingState`: Feedback visual durante conexão/inicialização.

### Dialogs
- `VideoCallDialog`: Wrapper para chamadas de vídeo.
- `CallDialog`: Wrapper para chamadas de áudio (usa `CustomMeetingUI` em modo `audioOnly`).

## Hooks

### Core Hooks
- `useDyteClient`: Hook oficial do Dyte para inicializar a conexão.
- `useRecording`: Gerencia estado de gravação e salva URL no banco após processamento.
- `useScreenshare`: Gerencia compartilhamento de tela.
- `useTranscription`: Gerencia legendas em tempo real e salvamento no banco.
- `useResponsiveLayout`: Calcula layout ideal (colunas, sidebar) baseado no tamanho da tela e número de participantes.

### UX & Performance Hooks (Novos)
- `useNetworkQuality`: Monitora latência e perda de pacotes, retornando score (0-5) e status.
- `useAdaptiveQuality`: Monitora a rede e sugere/aplica desativação de vídeo em conexões lentas.
- `useCallKeyboardShortcuts`: Gerencia atalhos globais (M, V, S, R, etc) durante a chamada.

## Atalhos de Teclado

| Ação | Atalho Principal | Atalho Alternativo |
|------|------------------|-------------------|
| Toggle Microfone | `M` | `Ctrl+D` |
| Toggle Câmera | `V` | `Ctrl+E` |
| Compartilhar Tela | `S` | `Ctrl+Shift+S` |
| Gravar | `R` | `Ctrl+Shift+R` |
| Transcrição | `T` | `Ctrl+Shift+T` |
| Participantes | `P` | `Ctrl+Shift+P` |
| Sair | `Esc` | - |
| Ajuda | `?` | `Ctrl+/` |

## Otimizações de Performance

1. **Code Splitting:** Componentes pesados (`VideoCallDialog`, `CallDialog`) são carregados via `React.lazy`.
2. **Memoization:** `CustomVideoGrid` e `CustomParticipantList` usam `React.memo` e `useMemo` para evitar re-renders em atualizações frequentes do Dyte store.
3. **Debounce:** Atualizações de qualidade de rede são debounced (500ms).

## Tratamento de Erros

Utilizamos um sistema centralizado (`call-error-handler.ts`) que converte erros técnicos do Dyte em notificações amigáveis (Toasts) com ações sugeridas (ex: "Permitir acesso à câmera").

## Configuração

As credenciais do Dyte são gerenciadas via UI em **Configurações > Integrações**.
A configuração é armazenada na tabela `integracoes` (tipo `dyte`).

## Customização de Estilos

Os estilos específicos da reunião estão em `custom-meeting-styles.css`.
O sistema utiliza variáveis CSS para temas (Claro/Escuro):
- `--meeting-bg`
- `--meeting-control-bg`
- `--meeting-accent`

## Fluxo de Gravação

1. Usuário clica em Gravar.
2. `CustomMeetingUI` verifica participantes.
3. Se houver >1 pessoa, exibe `RecordingConsentDialog`.
4. Após consentimento, chama `dyteClient.recording.start()`.
5. Ao finalizar, o webhook/hook captura o ID e salva no banco.
