# Tasks: Integrar Website com Design System

## 1. Corrigir Imports no Website

- [x] 1.1 Atualizar imports em `src/app/website/page.tsx` para caminhos relativos
- [x] 1.2 Atualizar imports em `src/app/website/layout.tsx` (CSS global e componentes)
- [x] 1.3 Verificar e corrigir imports em `src/app/website/components/header.tsx`
- [x] 1.4 Verificar e corrigir imports em `src/app/website/components/hero.tsx`
- [x] 1.5 Verificar e corrigir imports em todos os componentes restantes

## 2. Integrar Design System do Sinesys

- [x] 2.1 Atualizar layout do website para usar fontes do sistema (Inter, Montserrat, Geist_Mono)
- [x] 2.2 Atualizar componentes para usar tokens de espacamento (`gap-4`, `space-y-6`, etc.)
- [x] 2.3 Atualizar componentes UI para usar transicoes do sistema (`transition-colors duration-200`)
- [x] 2.4 Atualizar Button component para alinhar com design system (manter cor `#5523eb`)
- [x] 2.5 Revisar e padronizar demais componentes UI (card, input, badge)

## 3. Configurar Variaveis de Ambiente para URLs

- [x] 3.1 Adicionar variaveis em `.env.example` (`NEXT_PUBLIC_DASHBOARD_URL`, `NEXT_PUBLIC_MEU_PROCESSO_URL`, `NEXT_PUBLIC_WEBSITE_URL`)
- [x] 3.2 Criar arquivo `src/lib/urls.ts` com constantes e helpers
- [x] 3.3 Documentar uso das variaveis em `docs/multi-app-setup.md`

## 4. Adicionar Link para Meu Processo

- [x] 4.1 Atualizar botao "Consultar Processo" no Hero para usar Link com `getMeuProcessoUrl()`
- [x] 4.2 Adicionar link no Header para "Meu Processo"

## 5. Validacao e Testes

- [x] 5.1 Executar `npm run build` e verificar que nao ha erros
- [ ] 5.2 Testar navegacao entre apps
- [ ] 5.3 Validar carregamento de fontes e consistencia visual
