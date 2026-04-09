# Phase 2: Header, Messages & Media - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 02-header-messages-media
**Areas discussed:** Agrupamento de mensagens, Audio waveform visual, Estrategia de migracao, Tamanhos custom de Avatar

---

## Agrupamento de Mensagens

### Posicao do Avatar no Grupo

| Option | Description | Selected |
|--------|-------------|----------|
| Na ultima mensagem | Avatar aparece alinhado a ultima bolha do grupo. WhatsApp/Telegram style | ✓ |
| Na primeira mensagem | Avatar aparece alinhado a primeira bolha. Discord/Slack style | |
| Voce decide | Claude escolhe baseado no MOC e UI-SPEC | |

**User's choice:** Na ultima mensagem (Recomendado)
**Notes:** Ancora visual no fim do turno, nao distrai durante leitura

### Nome do Sender em Grupos

| Option | Description | Selected |
|--------|-------------|----------|
| So na primeira bolha do grupo | Nome 1x por grupo de mensagens consecutivas | ✓ |
| Em toda bolha | Nome sempre visivel | |
| Nunca mostrar nome | Avatar basta para identificar | |

**User's choice:** So na primeira bolha do grupo (Recomendado)
**Notes:** Reduz ruido visual

### Intervalo de Tempo para Quebra de Grupo

| Option | Description | Selected |
|--------|-------------|----------|
| 5 minutos | Mensagens com >5min de diferenca viram grupo novo | ✓ |
| 2 minutos | Grupos mais curtos, mais separadores | |
| Sem limite de tempo | Agrupa tudo do mesmo sender ate mudar de pessoa | |

**User's choice:** 5 minutos (Recomendado)
**Notes:** Balanceia densidade vs contexto temporal

### Visibilidade do Timestamp

| Option | Description | Selected |
|--------|-------------|----------|
| So na ultima do grupo | Menos ruido, hover revela hora individual | ✓ |
| Em toda bolha | Hora sempre visivel | |
| Voce decide | Claude escolhe | |

**User's choice:** So na ultima do grupo (Recomendado)
**Notes:** Hover nas demais pode revelar hora individual

---

## Audio Waveform Visual

### Abordagem Tecnica do Waveform

| Option | Description | Selected |
|--------|-------------|----------|
| Barras estaticas decorativas | Padrao fixo ou random seed, progresso por cor. Zero dependencia | ✓ |
| Web Audio API real | Decodifica audio para waveform real. Pesado e complexo | |
| Voce decide | Claude escolhe | |

**User's choice:** Barras estaticas decorativas (Recomendado)
**Notes:** WhatsApp usa este approach. Leve, visual consistente

### Exibicao de Duracao

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, ambos | "0:23 / 1:45" — usuario sabe quanto falta | ✓ |
| So duracao total | "1:45" fixo, progresso so pelas barras | |
| Voce decide | Claude decide baseado no espaco | |

**User's choice:** Sim, ambos (Recomendado)
**Notes:** —

### Posicao do Play Button

| Option | Description | Selected |
|--------|-------------|----------|
| Dentro da bolha, a esquerda | Icone play/pause circular antes das barras | ✓ |
| No lugar do avatar | Avatar vira botao play | |

**User's choice:** Dentro da bolha, a esquerda (Recomendado)
**Notes:** Localizado e claro

---

## Estrategia de Migracao

### Abordagem de Refatoracao

| Option | Description | Selected |
|--------|-------------|----------|
| Big bang in-place | Refatorar arquivos existentes diretamente | ✓ |
| Novos componentes + swap | Criar v2 como novos arquivos, depois swappar | |
| Voce decide | Claude avalia risco | |

**User's choice:** Big bang in-place (Recomendado)
**Notes:** Mesmo approach da Phase 1. Evita duplicacao

### DateSeparator e MessageGroup

| Option | Description | Selected |
|--------|-------------|----------|
| Componentes separados | Arquivos proprios em chat/components/ | ✓ |
| Inline no chat-content | Sub-componentes dentro de chat-content.tsx | |
| Voce decide | Claude decide | |

**User's choice:** Componentes separados (Recomendado)
**Notes:** Testabilidade e reutilizacao clara

### Divisao de Plans

| Option | Description | Selected |
|--------|-------------|----------|
| 3 plans | Header / Bolhas texto + grouping / Media bubbles | ✓ |
| 2 plans | Header + estrutura / Todas as bolhas | |
| Voce decide | Claude determina | |

**User's choice:** 3 plans (Recomendado)
**Notes:** —

---

## Tamanhos Custom de Avatar

### Abordagem para Sizes Nao-Padrao

| Option | Description | Selected |
|--------|-------------|----------|
| className override pontual | size='md' + className='size-9' ou 'size-7'. Zero mudanca no shared | ✓ |
| Adicionar novos sizes ao Avatar | Estender variants map com 'chat-header' e 'chat-msg' | |
| Voce decide | Claude escolhe | |

**User's choice:** className override pontual (Recomendado)
**Notes:** Impacto isolado ao chat

### Border-Radius do Avatar

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, rounded-xl | Consistente com Phase 1 e IconContainer | ✓ |
| Rounded custom por contexto | Header 10px, mensagens 8px per UI-SPEC | |
| Voce decide | Claude harmoniza | |

**User's choice:** Sim, rounded-xl (Recomendado)
**Notes:** Consistencia com Phase 1

---

## Claude's Discretion

- Numero de barras no waveform e algoritmo de distribuicao
- Logica interna da funcao de agrupamento de mensagens
- CSS do glassmorphism (pseudo-elements vs backdrop-filter direto)
- Animacao play/pause no audio
- Hover para timestamp em bolhas intermediarias

## Deferred Ideas

None — discussion stayed within phase scope
