# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e5]:
    - img "Zattar Advogados" [ref=e8]
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]:
          - generic [ref=e13]: Email
          - textbox "Email" [ref=e14]:
            - /placeholder: m@example.com
        - generic [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e17]: Senha
            - link "Esqueceu sua senha?" [ref=e18] [cursor=pointer]:
              - /url: /auth/forgot-password
          - textbox "Senha" [ref=e19]
        - button "Entrar" [ref=e20]
      - generic [ref=e21]:
        - text: Não tem uma conta?
        - link "Cadastre-se" [ref=e22] [cursor=pointer]:
          - /url: /auth/sign-up
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e28] [cursor=pointer]:
    - img [ref=e29]
  - alert [ref=e33]
```