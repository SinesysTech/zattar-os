# Troubleshooting - Sinesys MCP Server

## Problemas de Configuração

### Arquivo de configuração não encontrado
**Sintoma:** Erro "Config file not found" ao iniciar servidor

**Causas possíveis:**
- Arquivo `~/.sinesys/config.json` não existe
- Variáveis de ambiente não configuradas
- Path incorreto

**Soluções:**
1. Criar arquivo de configuração: `mkdir -p ~/.sinesys && cp mcp/.sinesys.config.example.json ~/.sinesys/config.json`
2. Editar com valores reais
3. Ou configurar variáveis de ambiente: `export SINESYS_BASE_URL=... SINESYS_API_KEY=...`
4. Verificar permissões: `chmod 600 ~/.sinesys/config.json`

### Configuração inválida
**Sintoma:** Erro de parsing JSON ou validação

**Causas possíveis:**
- JSON malformado (vírgula extra, aspas faltando)
- Campos obrigatórios faltando
- Tipos incorretos

**Soluções:**
1. Validar JSON: `cat ~/.sinesys/config.json | jq .`
2. Verificar campos obrigatórios: baseUrl e (apiKey ou sessionToken)
3. Usar exemplo como base: `mcp/.sinesys.config.example.json`

## Problemas de Autenticação

### 401 Unauthorized
**Sintoma:** Todas as tools retornam erro 401

**Causas possíveis:**
- API Key inválida ou expirada
- Bearer Token inválido ou expirado
- Nenhum método de autenticação configurado

**Soluções:**
1. Verificar API Key no Sinesys: `/api/admin` ou banco de dados
2. Testar autenticação com curl: `curl -H "x-service-api-key: SUA_KEY" https://seu-sinesys.com/api/health`
3. Gerar nova API Key se necessário
4. Verificar se API Key tem permissões adequadas

### 403 Forbidden
**Sintoma:** Algumas tools retornam erro 403

**Causas possíveis:**
- API Key sem permissões suficientes
- Tentando acessar recurso restrito
- Tools de admin sem privilégios

**Soluções:**
1. Verificar permissões da API Key no banco
2. Usar API Key com permissões de admin para tools administrativas
3. Verificar se usuário associado tem cargo adequado

## Problemas de Conexão

### ECONNREFUSED
**Sintoma:** Erro "connect ECONNREFUSED" ao chamar tools

**Causas possíveis:**
- Servidor Sinesys não está rodando
- baseUrl incorreta
- Firewall bloqueando conexão
- Porta incorreta

**Soluções:**
1. Verificar se servidor está rodando: `curl https://seu-sinesys.com/api/health`
2. Verificar baseUrl na configuração (sem trailing slash)
3. Testar conectividade: `ping seu-sinesys.com`
4. Verificar firewall/proxy
5. Em desenvolvimento, garantir que `npm run dev` está rodando

### Timeout
**Sintoma:** Requisições demoram muito e falham com timeout

**Causas possíveis:**
- Servidor sobrecarregado
- Operação de captura muito longa
- Rede lenta
- Timeout configurado muito baixo

**Soluções:**
1. Para capturas, usar `sinesys_aguardar_captura_concluir` com timeout maior
2. Verificar logs do servidor Sinesys
3. Aumentar timeout no retry logic (modificar `src/client/retry-logic.ts`)
4. Verificar latência de rede

## Problemas de Validação

### Erro de validação Zod
**Sintoma:** "Erro de validação: campo X: mensagem"

**Causas possíveis:**
- Tipo de dado incorreto (string em vez de number)
- Campo obrigatório faltando
- Formato inválido (data, enum)
- Valor fora do range permitido

**Soluções:**
1. Verificar schema da tool no README ou código fonte
2. Conferir tipos de dados: números devem ser number, não string
3. Verificar campos obrigatórios marcados sem .optional()
4. Para datas, usar formato ISO 8601: "2024-01-01"
5. Para enums, usar valores exatos listados na documentação

### Discriminated Union Error
**Sintoma:** Erro ao criar cliente PF/PJ

**Causas possíveis:**
- tipoPessoa não especificado ou inválido
- Campos obrigatórios para o tipo faltando (cpf para PF, cnpj para PJ)

**Soluções:**
1. Sempre especificar tipoPessoa: "pf" ou "pj"
2. Para PF: incluir nome e cpf
3. Para PJ: incluir nome e cnpj
4. Verificar exemplo em `mcp/README.md` seção Clientes

## Problemas de Build

### Cannot find module
**Sintoma:** Erro "Cannot find module '@/...'" ou similar

**Causas possíveis:**
- Dependências não instaladas
- Build desatualizado
- tsconfig.json incorreto
- Imports com path errado

**Soluções:**
1. Instalar dependências: `cd mcp && npm install`
2. Rebuild: `npm run build`
3. Limpar build: `rm -rf build/ && npm run build`
4. Verificar tsconfig.json: paths devem estar corretos
5. Verificar que está usando imports ESM (.js no final)

### TypeScript Errors
**Sintoma:** Erros de tipo ao buildar

**Causas possíveis:**
- Tipos desatualizados
- Incompatibilidade de versões
- Código com erros de tipo

**Soluções:**
1. Atualizar @types: `npm update`
2. Verificar versão do TypeScript: deve ser 5.x
3. Limpar cache: `rm -rf node_modules package-lock.json && npm install`
4. Verificar erros específicos e corrigir tipos

## Problemas com Claude Desktop

### MCP não aparece na lista
**Sintoma:** Sinesys MCP não aparece em servidores disponíveis no Claude

**Causas possíveis:**
- Configuração não salva corretamente
- JSON inválido em claude_desktop_config.json
- Path do executável incorreto
- Claude não reiniciado

**Soluções:**
1. Validar JSON: `cat ~/.config/Claude/claude_desktop_config.json | jq .`
2. Usar path absoluto para index.js: `/home/user/sinesys/mcp/build/index.js`
3. Verificar que arquivo existe: `ls -la /path/to/index.js`
4. Fechar Claude completamente (não minimizar) e reabrir
5. Verificar logs do Claude (se disponíveis)

### Tools não respondem
**Sintoma:** Claude reconhece MCP mas tools falham

**Causas possíveis:**
- Servidor MCP não inicia corretamente
- Erro de autenticação
- Servidor Sinesys offline

**Soluções:**
1. Testar servidor manualmente: `node mcp/build/index.js` (deve ficar aguardando stdin)
2. Verificar configuração de autenticação
3. Testar API diretamente com curl
4. Verificar logs stderr do servidor

## Problemas com Capturas

### Captura fica em pending indefinidamente
**Sintoma:** Status nunca muda de pending

**Causas possíveis:**
- Worker de captura não está rodando
- Erro ao processar job
- Credenciais PJE inválidas

**Soluções:**
1. Verificar logs do servidor Sinesys
2. Verificar se workers estão rodando
3. Testar credenciais PJE manualmente
4. Verificar tabela de jobs no banco de dados

### Captura falha com erro
**Sintoma:** Status muda para failed

**Causas possíveis:**
- Credenciais PJE inválidas ou expiradas
- Erro no PJE/TRT
- Timeout na captura
- Erro de parsing de dados

**Soluções:**
1. Verificar mensagem de erro no resultado da captura
2. Verificar credenciais: `sinesys_listar_credenciais_pje`
3. Testar login manual no PJE
4. Verificar logs detalhados do servidor
5. Reportar erro se for bug do sistema

## Debug Avançado

### Habilitar logs detalhados
```bash
# Adicionar ao início do index.ts
console.error('Debug: Server starting...');

# Ou usar DEBUG env var se implementado
DEBUG=sinesys:* node build/index.js
```

### Testar tools manualmente via stdio
```bash
# Listar tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js

# Chamar tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"sinesys_listar_clientes","arguments":{}}}' | node build/index.js
```

### Verificar status do servidor
```bash
# Verificar se processo está rodando
ps aux | grep "node.*index.js"

# Verificar logs
tail -f /var/log/sinesys-mcp.log  # se configurado

# Testar health check
curl https://seu-sinesys.com/api/health
```

## Obtendo Ajuda

Se nenhuma solução acima resolver:

1. **Coletar informações:**
   - Versão do Node.js: `node --version`
   - Versão do MCP Server: `cat mcp/package.json | grep version`
   - Sistema operacional
   - Mensagem de erro completa
   - Logs relevantes

2. **Verificar documentação:**
   - README principal: `README.md`
   - README do MCP: `mcp/README.md`
   - Guia de integração: `mcp/INTEGRATION.md`

3. **Reportar problema:**
   - Abrir issue no repositório
   - Incluir todas as informações coletadas
   - Descrever passos para reproduzir
   - Incluir configuração (sem credenciais sensíveis)

4. **Contato:**
   - Email do time de desenvolvimento
   - Canal de suporte interno