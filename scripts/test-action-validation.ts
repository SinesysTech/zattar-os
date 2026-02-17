/**
 * Script de teste para verificar a validação do schema da action
 * 
 * Uso: npx tsx scripts/test-action-validation.ts
 */

import { z } from 'zod';

const actionListDocumentosSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  status: z.enum(["rascunho", "pronto", "concluido", "cancelado"]).optional(),
});

async function testValidation() {
  console.log('🔍 Testando validação do schema...\n');

  // Teste 1: Parâmetros válidos
  console.log('1️⃣ Teste com parâmetros válidos:');
  const valid1 = { page: 1, pageSize: 20 };
  const result1 = actionListDocumentosSchema.safeParse(valid1);
  console.log(`   Input: ${JSON.stringify(valid1)}`);
  console.log(`   Resultado: ${result1.success ? '✅ Válido' : '❌ Inválido'}`);
  if (!result1.success) {
    console.log(`   Erros:`, result1.error.errors);
  }
  console.log('');

  // Teste 2: Sem parâmetros (todos opcionais)
  console.log('2️⃣ Teste sem parâmetros:');
  const valid2 = {};
  const result2 = actionListDocumentosSchema.safeParse(valid2);
  console.log(`   Input: ${JSON.stringify(valid2)}`);
  console.log(`   Resultado: ${result2.success ? '✅ Válido' : '❌ Inválido'}`);
  if (!result2.success) {
    console.log(`   Erros:`, result2.error.errors);
  }
  console.log('');

  // Teste 3: Page inválido (zero)
  console.log('3️⃣ Teste com page = 0 (inválido):');
  const invalid1 = { page: 0, pageSize: 20 };
  const result3 = actionListDocumentosSchema.safeParse(invalid1);
  console.log(`   Input: ${JSON.stringify(invalid1)}`);
  console.log(`   Resultado: ${result3.success ? '✅ Válido' : '❌ Inválido'}`);
  if (!result3.success) {
    console.log(`   Erros:`, result3.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }
  console.log('');

  // Teste 4: PageSize maior que 100
  console.log('4️⃣ Teste com pageSize = 200 (inválido):');
  const invalid2 = { page: 1, pageSize: 200 };
  const result4 = actionListDocumentosSchema.safeParse(invalid2);
  console.log(`   Input: ${JSON.stringify(invalid2)}`);
  console.log(`   Resultado: ${result4.success ? '✅ Válido' : '❌ Inválido'}`);
  if (!result4.success) {
    console.log(`   Erros:`, result4.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }
  console.log('');

  // Teste 5: Status inválido
  console.log('5️⃣ Teste com status inválido:');
  const invalid3 = { page: 1, pageSize: 20, status: 'invalido' };
  const result5 = actionListDocumentosSchema.safeParse(invalid3);
  console.log(`   Input: ${JSON.stringify(invalid3)}`);
  console.log(`   Resultado: ${result5.success ? '✅ Válido' : '❌ Inválido'}`);
  if (!result5.success) {
    console.log(`   Erros:`, result5.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }
  console.log('');

  console.log('✅ Testes de validação concluídos!');
}

testValidation();
