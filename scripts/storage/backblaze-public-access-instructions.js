/**
 * Instruções para configurar o bucket Backblaze B2 para acesso público
 * 
 * Execute este script para ver as instruções completas de configuração.
 * 
 * Uso:
 * node dev_data/scripts/backblaze-public-access-instructions.js
 */

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║             CONFIGURAÇÃO DE ACESSO PÚBLICO - BACKBLAZE B2                  ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

O erro "UnauthorizedAccess bucket is not authorized" ocorre porque o bucket
precisa estar configurado como PÚBLICO e ter regras CORS habilitadas.

📋 PASSOS PARA CONFIGURAÇÃO:

┌────────────────────────────────────────────────────────────────────────────┐
│ 1. TORNAR O BUCKET PÚBLICO                                                 │
└────────────────────────────────────────────────────────────────────────────┘

   a) Acesse: https://secure.backblaze.com/b2_buckets.htm
   
   b) Faça login na sua conta Backblaze
   
   c) Encontre o bucket "zattar-advogados" na lista
   
   d) Clique no nome do bucket para abrir as configurações
   
   e) Na seção "Bucket Info":
      - Procure por "Files in Bucket" ou "Bucket Type"
      - Altere de "Private" para "Public"
   
   f) Clique em "Update Bucket" ou "Save"

┌────────────────────────────────────────────────────────────────────────────┐
│ 2. CONFIGURAR REGRAS CORS (JÁ EXECUTADO)                                   │
└────────────────────────────────────────────────────────────────────────────┘

   ✅ As regras CORS já foram aplicadas com sucesso via script!
   
   Regras configuradas:
   - AllowedOrigins: * (qualquer origem)
   - AllowedMethods: GET, HEAD
   - AllowedHeaders: * (todos)
   - MaxAgeSeconds: 3600

┌────────────────────────────────────────────────────────────────────────────┐
│ 3. VERIFICAR CONFIGURAÇÃO                                                  │
└────────────────────────────────────────────────────────────────────────────┘

   Após tornar o bucket público, você pode testar:
   
   a) Execute o script de teste:
      npx tsx dev_data/scripts/test-backblaze-connection.ts
   
   b) Teste acessando uma URL de arquivo diretamente no navegador:
      https://s3.us-east-005.backblazeb2.com/zattar-advogados/[caminho-do-arquivo]

┌────────────────────────────────────────────────────────────────────────────┐
│ 4. ALTERNATIVA: USAR CLI DO BACKBLAZE                                      │
└────────────────────────────────────────────────────────────────────────────┘

   Se preferir usar linha de comando:
   
   a) Instale o CLI do Backblaze:
      pip install b2
   
   b) Autorize:
      b2 authorize-account [keyID] [applicationKey]
   
   c) Atualize o bucket:
      b2 update-bucket zattar-advogados allPublic

┌────────────────────────────────────────────────────────────────────────────┐
│ 5. IMPORTANTE: CRIAR NOVA APPLICATION KEY (SE NECESSÁRIO)                  │
└────────────────────────────────────────────────────────────────────────────┘

   Se o erro persistir, a chave de aplicação pode não ter as permissões
   necessárias. Para criar uma nova chave com todas as permissões:
   
   a) Vá para: https://secure.backblaze.com/app_keys.htm
   
   b) Clique em "Add a New Application Key"
   
   c) Configure:
      - Name: zattar-advogados-full-access
      - Bucket: zattar-advogados
      - Type of Access: Read and Write
      - Allow List All Bucket Names: ✓ (checked)
   
   d) Clique em "Create New Key"
   
   e) Copie o keyID e applicationKey gerados
   
   f) Atualize seu arquivo .env.local:
      B2_KEY_ID=seu_novo_key_id
      B2_APPLICATION_KEY=sua_nova_application_key

╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║  ⚠️  ATENÇÃO DE SEGURANÇA                                                  ║
║                                                                            ║
║  Tornar o bucket público significa que QUALQUER PESSOA pode acessar       ║
║  os arquivos sem autenticação. Certifique-se de que:                      ║
║                                                                            ║
║  1. Não há documentos sensíveis/confidenciais no bucket                   ║
║  2. Os PDFs são de processos públicos                                     ║
║  3. Você tem controle sobre o que é enviado para o bucket                 ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

📞 PRECISA DE AJUDA?

   Documentação oficial do Backblaze:
   - CORS: https://www.backblaze.com/docs/cloud-storage-enable-and-manage-cors-rules
   - Public Buckets: https://www.backblaze.com/docs/cloud-storage-buckets
   - API: https://www.backblaze.com/apidocs/introduction-to-the-b2-native-api

✅ PRÓXIMOS PASSOS:

   1. Execute os passos acima para tornar o bucket público
   2. Teste o acesso com: npx tsx dev_data/scripts/test-backblaze-connection.ts
   3. Se funcionar, teste a visualização de PDFs na interface de expedientes

`);
