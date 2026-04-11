---
status: partial
phase: 03-input-context-bar-empty-state
source: [03-VERIFICATION.md]
started: 2026-04-10T21:09:00Z
updated: 2026-04-10T21:09:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Glass input focus ring
expected: Clicar no textarea de mensagem faz o container transicionar a borda para `primary/25` com um glow roxo suave de 3px ao redor do wrapper.
result: [pending]

### 2. Textarea auto-resize behavior
expected: Digitar múltiplas linhas no input faz a textarea expandir verticalmente até `max-h-[120px]` sem quebrar o layout, depois passa a rolar internamente.
result: [pending]

### 3. Context bar aparece para salas com documento vinculado
expected: Selecionar uma sala de chat que tenha `documentoId` exibe a barra roxa de vidro abaixo do header, com badge TRT, número do processo e link "Ver processo" apontando para `/processos/{id}`.
result: [pending]

### 4. Empty state no desktop sem conversa selecionada
expected: Abrir a página de chat em viewport > 768px sem nenhuma conversa selecionada exibe o ícone `MessageSquare` centralizado, heading "Suas conversas", subtexto e três cards de sugestão com glass styling.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
