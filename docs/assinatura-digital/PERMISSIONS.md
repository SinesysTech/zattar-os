{
  "permissoes": [
    { "recurso": "assinatura_digital", "operacao": "listar", "permitido": true },
    { "recurso": "assinatura_digital", "operacao": "visualizar", "permitido": true },
    { "recurso": "assinatura_digital", "operacao": "criar", "permitido": true },
    { "recurso": "assinatura_digital", "operacao": "editar", "permitido": true },
    { "recurso": "assinatura_digital", "operacao": "deletar", "permitido": true }
  ]
}
```

**Exemplo - Permissão somente leitura:**
```json
{
  "permissoes": [
    { "recurso": "assinatura_digital", "operacao": "listar", "permitido": true },
    { "recurso": "assinatura_digital", "operacao": "visualizar", "permitido": true }
  ]
}