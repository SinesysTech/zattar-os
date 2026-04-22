# Template WhatsApp — Prestação de Contas

Guia para cadastro do template de mensagem de utilidade no **Meta Business Manager** para envio do link público de prestação de contas via Chatwoot.

---

## Categoria: UTILITY

Conforme a documentação oficial da Meta WhatsApp Business Platform, esta mensagem se enquadra na categoria **UTILITY** (mensagem de utilidade) porque:

- Está diretamente relacionada a uma **transação específica** do cliente (repasse financeiro de uma parcela recebida em um processo judicial).
- É uma **notificação/alerta transacional**, não promoção.
- Contém informações **específicas do cliente** (nome, processo) para uma ação **que o cliente espera** (receber a declaração de prestação de contas que autoriza o depósito).

Templates UTILITY têm custo por conversa mais baixo que MARKETING e podem iniciar uma nova janela de atendimento de 24 horas quando a janela está fechada.

> Referência oficial: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/

---

## Passo 1 — Cadastrar o template no Meta Business Manager

1. Acesse o [Meta Business Manager](https://business.facebook.com/) → WhatsApp Manager → Templates de mensagem.
2. Clique em **"Criar template"**.
3. Preencha:

### Configuração

| Campo | Valor |
|-------|-------|
| **Nome do template** | `prestacao_contas_link_utility` |
| **Categoria** | `Utilidade` (UTILITY) |
| **Idioma** | `Português (BR)` (pt_BR) |
| **Nome para exibição (opcional)** | Deixe em branco (usa o business profile) |

### Corpo (Body) — obrigatório

Cole o texto exato abaixo na seção **"Corpo"**:

```
Olá, {{1}}! O escritório {{2}} disponibilizou a sua declaração de prestação de contas referente ao processo {{3}}.

Para conferir os valores, informar seus dados bancários e assinar digitalmente, acesse o link seguro abaixo:

{{4}}

Este link é pessoal e expira em 30 dias. Em caso de dúvida, responda esta mensagem.
```

### Amostras das variáveis (Sample variables)

A Meta exige que você forneça exemplos para cada variável na hora do cadastro (são usados apenas para aprovação, não aparecem no envio real):

| Variável | Exemplo |
|----------|---------|
| `{{1}}` | `Maria Silva` |
| `{{2}}` | `Synthropic Advocacia` |
| `{{3}}` | `1234567-89.2024.5.02.0001` |
| `{{4}}` | `https://app.zattar.com.br/prestacao-contas/a1b2c3d4-...` |

### Cabeçalho, rodapé e botões

- **Cabeçalho (Header)**: não use, para simplicidade. Se quiser, pode adicionar TEXT: `Prestação de Contas`.
- **Rodapé (Footer)**: opcional — sugestão: `ZattarOS · Synthropic`.
- **Botões**: não adicione. O link já está no corpo.

---

## Passo 2 — Submeter para aprovação

Clique em **"Enviar"**. A Meta costuma aprovar templates UTILITY em **1–24 horas** quando:

- O texto é objetivo e diretamente transacional.
- Não há linguagem promocional ou call-to-actions vagos.
- Variáveis estão bem contextualizadas (nome do cliente, do escritório, do processo, link específico).

**Se for rejeitado**, os motivos mais comuns são:
- Template parece marketing (evite palavras como "promoção", "oferta", "economize").
- Variáveis parecem placeholders não explicativos — nossa versão usa variáveis claramente contextuais.

---

## Passo 3 — Configurar o ZattarOS

Depois que o template for **aprovado**, o Chatwoot o listará automaticamente nos templates disponíveis da inbox WhatsApp. Para o ZattarOS chamá-lo, configure no `.env` ou na tabela `integracoes`:

### Opção A — variáveis de ambiente (mais simples para v1)

```bash
# ID do inbox WhatsApp no Chatwoot (Settings → Inboxes → WhatsApp → veja o ID na URL)
CHATWOOT_WHATSAPP_INBOX_ID=3

# Nome do template aprovado pela Meta (deve bater com o que você cadastrou no passo 1)
CHATWOOT_PRESTACAO_CONTAS_TEMPLATE_NAME=prestacao_contas_link_utility

# Idioma do template (deve ser o mesmo cadastrado na Meta)
CHATWOOT_PRESTACAO_CONTAS_TEMPLATE_LANGUAGE=pt_BR
```

### Opção B — tabela `integracoes` (estendendo a config existente do Chatwoot)

Alternativamente, adicione no campo `configuracao` JSONB da linha `integracoes.tipo = 'chatwoot'`:

```json
{
  "api_url": "...",
  "api_key": "...",
  "account_id": 1,
  "default_inbox_id": 2,
  "whatsapp_inbox_id": 3,
  "prestacao_contas_template_name": "prestacao_contas_link_utility",
  "prestacao_contas_template_language": "pt_BR"
}
```

Implementação atual lê de env vars primeiro e depois faz fallback para `integracoes.configuracao`.

---

## Passo 4 — Como o ZattarOS usa o template

Quando o operador clica em **"Enviar por WhatsApp"** no dialog de link gerado:

1. Sistema busca/cria o contato no Chatwoot pelo telefone do cliente (tabela `clientes.numero_celular` + DDD).
2. Cria uma nova conversa na inbox WhatsApp configurada, com o payload abaixo:

```json
{
  "source_id": "+5511987654321",
  "inbox_id": 3,
  "contact_id": 42,
  "message": {
    "content": "Olá, Maria Silva! O escritório Synthropic Advocacia disponibilizou...",
    "template_params": {
      "name": "prestacao_contas_link_utility",
      "category": "UTILITY",
      "language": "pt_BR",
      "processed_params": {
        "1": "Maria Silva",
        "2": "Synthropic Advocacia",
        "3": "1234567-89.2024.5.02.0001",
        "4": "https://app.zattar.com.br/prestacao-contas/a1b2c3d4-..."
      }
    }
  }
}
```

O campo `content` é a mensagem renderizada localmente (usada pelo Chatwoot como fallback visual no painel do agente); `template_params` é o que realmente vai para a API oficial do WhatsApp.

3. O Chatwoot encaminha à Cloud API da Meta, que entrega a mensagem ao cliente.
4. Quando o cliente responde, a janela de 24h abre e é possível conversar livremente sem template.

---

## Limitações e observações

- **Mudanças no texto**: qualquer alteração no corpo do template exige **reaprovação** pela Meta. Para pequenas correções, crie uma versão nova com sufixo (`prestacao_contas_link_utility_v2`) em vez de editar a aprovada.
- **Categoria bloqueada**: se a Meta detectar uso promocional no template UTILITY, pode reclassificar para MARKETING e cobrar mais por conversa. Mantenha o corpo estritamente transacional.
- **Janela de conversação**: após o cliente responder, você tem 24h para conversar livremente sem template. Depois disso, apenas templates aprovados.
- **Número do WhatsApp**: o número do cliente deve estar em `clientes.numero_celular` no formato E.164 (`+5511987654321`) ou o ZattarOS converte de `DDD + número` automaticamente via `formatPhoneForSourceId()`.

---

## Referências oficiais

- Meta — Message templates: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/
- Meta — Template categorias e preços: https://developers.facebook.com/docs/whatsapp/pricing/
- Chatwoot — Create conversation with template: `docs/conversations.md` (neste repo)
- Chatwoot — Inboxes API: `docs/inboxes.md` (neste repo)
