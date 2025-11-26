// Script para organizar migrations em pastas aplicadas/nao-aplicadas
import { readFileSync, renameSync, existsSync } from 'fs';
import { join } from 'path';

const statusFile = join(process.cwd(), 'migration-status.json');
const status = JSON.parse(readFileSync(statusFile, 'utf8'));

const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
const aplicadasDir = join(migrationsDir, 'aplicadas');
const naoAplicadasDir = join(migrationsDir, 'nao-aplicadas');

console.log('📦 Organizando migrations...\n');

let movidosAplicadas = 0;
let movidosNaoAplicadas = 0;
let erros = 0;

// Mover migrations aplicadas
console.log('✅ Movendo migrations aplicadas...\n');
for (const migration of status.applied) {
  const source = join(migrationsDir, migration);
  const dest = join(aplicadasDir, migration);

  if (!existsSync(source)) {
    console.log(`⚠️  Arquivo não encontrado: ${migration}`);
    erros++;
    continue;
  }

  try {
    renameSync(source, dest);
    console.log(`   ✓ ${migration}`);
    movidosAplicadas++;
  } catch (error: any) {
    console.log(`   ✗ ${migration} - Erro: ${error.message}`);
    erros++;
  }
}

// Mover migrations não aplicadas
console.log('\n❌ Movendo migrations NÃO aplicadas...\n');
for (const migration of status.notApplied) {
  const source = join(migrationsDir, migration);
  const dest = join(naoAplicadasDir, migration);

  if (!existsSync(source)) {
    console.log(`⚠️  Arquivo não encontrado: ${migration}`);
    erros++;
    continue;
  }

  try {
    renameSync(source, dest);
    console.log(`   ✓ ${migration}`);
    movidosNaoAplicadas++;
  } catch (error: any) {
    console.log(`   ✗ ${migration} - Erro: ${error.message}`);
    erros++;
  }
}

console.log('\n' + '━'.repeat(80));
console.log('\n📊 Resumo da Organização:\n');
console.log(`✅ Migrations aplicadas movidas: ${movidosAplicadas}`);
console.log(`❌ Migrations não aplicadas movidas: ${movidosNaoAplicadas}`);
console.log(`⚠️  Erros: ${erros}`);
console.log(`📂 Total processado: ${movidosAplicadas + movidosNaoAplicadas + erros}`);

console.log('\n📁 Estrutura final:');
console.log(`   supabase/migrations/aplicadas/ (${movidosAplicadas} arquivos)`);
console.log(`   supabase/migrations/nao-aplicadas/ (${movidosNaoAplicadas} arquivos)`);

if (movidosNaoAplicadas > 0) {
  console.log('\n⚠️  ATENÇÃO: Você tem migrations NÃO aplicadas!');
  console.log('   Revise os arquivos em supabase/migrations/nao-aplicadas/');
  console.log('   e aplique-os manualmente se necessário.');
}
