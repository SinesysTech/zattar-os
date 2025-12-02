# Rationale para Inline Styles em Componentes React

Este documento explica os casos específicos onde inline styles são **necessários e apropriados** no projeto Sinesys.

## Princípio Geral

Por padrão, **evitamos inline styles** e preferimos:
- Classes Tailwind CSS para estilização estática
- CSS Modules ou classes globais para estilos complexos
- CSS custom properties para valores temáticos

## Exceções Justificadas

### 1. `components/ui/cursor-overlay.tsx`

**Por que inline styles são necessários:**
- Valores de posicionamento (`top`, `left`, `width`, `height`) calculados dinamicamente pelo plugin Plate.js em tempo real
- Cada cursor/seleção tem posição única baseada no conteúdo do editor
- Impossível predefinir classes CSS para posições arbitrárias

**Exemplo:**
```tsx
style={{
  ...selectionStyle,
  ...position, // { top: 120, left: 340, width: 200, height: 24 }
}}
```

### 2. `components/formsign/form/form-step-layout.tsx`

**Por que inline styles são necessários:**
- Largura da barra de progresso calculada dinamicamente: `(currentStep / totalSteps) * 100%`
- Valor muda a cada step do formulário
- Usamos CSS custom property (`--progress-width`) para melhor manutenibilidade

**Solução implementada:**
```tsx
// Define a variável CSS
style={{ '--progress-width': `${(currentStep / totalSteps) * 100}%` }}

// Usa a variável CSS
style={{ width: 'var(--progress-width)' }}
```

**Alternativa não viável:**
- Criar 100+ classes CSS (`.progress-1`, `.progress-2`, ..., `.progress-100`) seria verboso e não escalável
- Tailwind JIT não pode gerar classes baseadas em valores de runtime

## Configuração do Linter

### Microsoft Edge Tools / Webhint (VS Code)
Configurado em `.vscode/settings.json`:
```json
{
  "webhint.enableHints": {
    "no-inline-styles": "off"
  },
  "vscode-edge-devtools.webhint": false
}
```

**Por que desabilitado:**
1. Os casos de inline styles são legítimos e necessários
2. Webhint do Edge Tools não suporta exceções por arquivo
3. Os inline styles estão bem documentados no código

### ESLint
Supressões locais com `eslint-disable-next-line react/forbid-dom-props` foram adicionadas nos locais específicos para consistência.

## Revisão de Novos Casos

Antes de adicionar novos inline styles, pergunte:

1. ✅ **O valor é calculado em runtime?** → Inline style pode ser apropriado
2. ✅ **O valor vem de fonte externa/dinâmica?** → Inline style pode ser apropriado
3. ❌ **O valor é estático ou temático?** → Use Tailwind ou CSS custom property
4. ❌ **O valor poderia ser uma classe condicional?** → Use `cn()` com classes Tailwind

## Referências

- [React Docs: Inline Styles](https://react.dev/learn/javascript-in-jsx-with-curly-braces#using-double-curlies-css-and-other-objects-in-jsx)
- [CSS Custom Properties (CSS Variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Tailwind CSS: Dynamic Values](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values)

---

**Última atualização:** Dezembro 2024  
**Revisado por:** AI Assistant (Claude)

