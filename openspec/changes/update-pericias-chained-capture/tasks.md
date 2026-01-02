## 1. Implementation
- [ ] 1.1 Atualizar serviço `periciasCapture` para extrair processos únicos e buscar dados complementares (timeline + partes) na mesma sessão autenticada
- [ ] 1.2 Implementar obtenção/atualização de processos do acervo para os processos vinculados às perícias (com estratégia de busca e fallback)
- [ ] 1.3 Ajustar ordem de persistência para: acervo → timeline → partes → perícias
- [ ] 1.4 Garantir logs e raw logs coerentes (payload bruto perícias + payload bruto partes por processo)
- [ ] 1.5 Adicionar testes/unit checks (quando viável) e validar comportamento via script/endpoint existente


