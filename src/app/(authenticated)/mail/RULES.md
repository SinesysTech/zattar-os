# Regras de Negocio - Mail

## Contexto
Cliente de e-mail integrado com servidor Cloudron via IMAP/SMTP. Permite leitura, composicao e gerenciamento de e-mails diretamente no sistema.

## Estrutura
- `use-mail.ts` — Zustand store central com estado de contas, mensagens, pastas, paginacao e UI
- `components/` — UI: mail principal, lista, display, editor, composicao, navegacao (desktop/mobile), account switcher
- `configurar/` — Pagina de configuracao de credenciais IMAP/SMTP
- `hooks/` — Hooks auxiliares
- `lib/` — Constantes e helpers de exibicao

## Regras Principais
- **Multi-conta**: Suporta multiplas contas de e-mail, com switch via `selectedAccountId`. Trocar conta reseta estado (mensagens, pastas, folder)
- **Cloudron defaults**: IMAP porta 993, SMTP porta 587, host `my.zattaradvogados.com`
- **Credenciais via API**: CRUD em `/api/mail/credentials` com teste de conexao em `/api/mail/credentials/test`
- **Layout persistido**: Tamanhos dos paineis (resizable panels) salvos em cookie `react-resizable-panels:layout:mail-app`
- **Layout minimos**: left >= 15%, middle >= 34%, right >= 38%. Fallback: [16, 36, 48]
- **Paginacao**: Mensagens carregadas com paginacao, append sem duplicatas (filtro por UID)
- **Selecao em massa**: `selectedUids` para operacoes em lote
- **Composicao**: Flag `isComposing` limpa mensagem selecionada ao ativar
