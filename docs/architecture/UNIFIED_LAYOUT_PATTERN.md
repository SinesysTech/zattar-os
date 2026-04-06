
### 2.3. Arquitetura de Informação Guiada à Decisão Rápida (Wireframing de Listas)

Para viabilizar a extinção do DetailSheet e a adoção de Quick Actions, os componentes de Card e ListRow de cada módúlo devem obrigatoriamente exibir os dados em ordem de relevância para tomada de decisão imediata (Bater o olho e agir). 

**Exemplo prático de Mapeamento (Caso Expediente):**
- **Máximo Peso:** Título principal em negrito (ex: Tipo do Expediente). Data do Prazo com cor semântica regressiva (ex: vermelho se <2 dias).
- **Alto Peso:** Identificador primário (Número do Processo), Nomes das Partes, Foto/Avatar do Responsável.
- **Peso Médio:** Badges de Tribunal, Grau. Ícone indicando que existem observações adicionais.

**O Layout Horizontal de Quick Action "ListRow":**
```text
[UrgencyDot] | TÍTULO PRINCIPAL DO OBJETO (ex: Intimação de Sentença) | [ Avatar Responsável ]  | 
             | Info Secundária: 12345-67... • João Silva x Apple Inc  | Vence Hoje (Cor: Red)   | 
             |----------------------------------------------------------------------------------|
             | Badge 1 • Badge 2    [Ícone Nota]                      | [AÇÃO 1]  [AÇÃO 2]      |
```
*Numa tela larga, a linha inteira fica lado a lado. Ao interagir, as Quick Actions (botões fantasmas com ícones) brilham na extrema direita.*

**O Layout Vertical "EntityCard":**
```text
╭──────────────────────────────────────────────────╮
│ 🔴 Intimação de Sentença                         │
│ ──────────────────────────────────────────────── │
│ ⚖️ 12345-67.2023.5.15.0001                       │
│ 👥 João Silva x Apple Inc                        │
│ 📆 Prazo Final: 28/Out (Vence Amanhã)            │
│ ──────────────────────────────────────────────── │
│ 👤 Jordan Medeiros (Resp)      [Ação 1] [Ação 2] │
╰──────────────────────────────────────────────────╯
```

Estas definições garantem a autonomia cognitiva na visão de lista, reduzindo o atrito operacional para os usuários que processam altos volumes de tarefas.
