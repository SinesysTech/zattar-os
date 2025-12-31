/**
 * Script de teste para tools MCP de Usuários
 *
 * Testa as seguintes tools:
 * - listar_usuarios
 * - buscar_usuario_por_email
 * - buscar_usuario_por_cpf
 * - listar_permissoes_usuario
 *
 * Uso:
 *   npx tsx scripts/mcp/test-usuarios-tools.ts
 */

import { executeMcpTool } from '@/lib/mcp';

async function testUsuariosTools() {
  console.log('\n🧪 Testando Tools MCP - Usuários\n');
  console.log('='.repeat(80));

  try {
    // 1. Listar usuários
    console.log('\n👥 1. Listar usuários (limite: 5)');
    console.log('-'.repeat(80));
    const usuarios = await executeMcpTool('listar_usuarios', { limite: 5 });
    console.log('Resultado:', JSON.stringify(usuarios, null, 2));

    // 2. Listar usuários ativos
    console.log('\n✅ 2. Listar usuários ativos (ativo: true, limite: 5)');
    console.log('-'.repeat(80));
    const usuariosAtivos = await executeMcpTool('listar_usuarios', {
      limite: 5,
      ativo: true,
    });
    console.log('Resultado:', JSON.stringify(usuariosAtivos, null, 2));

    // 3. Buscar usuário por email
    console.log('\n📧 3. Buscar usuário por email');
    console.log('-'.repeat(80));
    console.log('⚠️  Pule este teste se não houver email válido no sistema.');
    console.log('   Exemplo de uso:');
    console.log('   await executeMcpTool("buscar_usuario_por_email", {');
    console.log('     email: "usuario@example.com"');
    console.log('   });');
    console.log('\n   Para testar, substitua pelo email real de um usuário.');

    // Exemplo comentado (descomente e ajuste o email para testar):
    /*
    const porEmail = await executeMcpTool('buscar_usuario_por_email', {
      email: 'usuario@example.com'
    });
    console.log('Resultado:', JSON.stringify(porEmail, null, 2));
    */

    // 4. Buscar usuário por CPF
    console.log('\n🆔 4. Buscar usuário por CPF');
    console.log('-'.repeat(80));
    console.log('⚠️  Pule este teste se não houver CPF válido no sistema.');
    console.log('   Exemplo de uso:');
    console.log('   await executeMcpTool("buscar_usuario_por_cpf", {');
    console.log('     cpf: "12345678901"');
    console.log('   });');
    console.log('\n   Para testar, substitua pelo CPF real de um usuário (11 dígitos, apenas números).');

    // Exemplo comentado (descomente e ajuste o CPF para testar):
    /*
    const porCpf = await executeMcpTool('buscar_usuario_por_cpf', {
      cpf: '12345678901'
    });
    console.log('Resultado:', JSON.stringify(porCpf, null, 2));
    */

    // 5. Listar permissões de usuário
    console.log('\n🔐 5. Listar permissões de usuário');
    console.log('-'.repeat(80));
    console.log('⚠️  Pule este teste se não houver usuário válido no sistema.');
    console.log('   Exemplo de uso:');
    console.log('   await executeMcpTool("listar_permissoes_usuario", {');
    console.log('     usuarioId: 1');
    console.log('   });');
    console.log('\n   Para testar, substitua pelo ID real de um usuário.');

    // Exemplo comentado (descomente e ajuste o ID para testar):
    /*
    const permissoes = await executeMcpTool('listar_permissoes_usuario', {
      usuarioId: 1
    });
    console.log('Resultado:', JSON.stringify(permissoes, null, 2));
    */

    // 6. Validação de CPF inválido (teste de schema)
    console.log('\n❌ 6. Teste de validação - CPF inválido');
    console.log('-'.repeat(80));
    console.log('Testando CPF com formato incorreto (deve falhar)...');
    try {
      await executeMcpTool('buscar_usuario_por_cpf', {
        cpf: '123' // CPF inválido (deve ter 11 dígitos)
      });
      console.log('⚠️  Erro: validação deveria ter falhado!');
    } catch (error) {
      console.log('✅ Validação funcionou corretamente:', error instanceof Error ? error.message : String(error));
    }

    // 7. Validação de email inválido (teste de schema)
    console.log('\n❌ 7. Teste de validação - Email inválido');
    console.log('-'.repeat(80));
    console.log('Testando email com formato incorreto (deve falhar)...');
    try {
      await executeMcpTool('buscar_usuario_por_email', {
        email: 'email-invalido' // Email inválido
      });
      console.log('⚠️  Erro: validação deveria ter falhado!');
    } catch (error) {
      console.log('✅ Validação funcionou corretamente:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Testes concluídos com sucesso!\n');
    console.log('💡 Dica: Para testar buscas específicas, edite o script e descomente os exemplos.');
    console.log('\n');
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
    console.error('\nDetalhes:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Executar testes
testUsuariosTools().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
