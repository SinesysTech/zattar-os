// Script para executar correções no Windows via Node.js
const fs = require('fs');
const path = require('path');

console.log('Iniciando correção dos erros de TypeScript...\n');

// 1. Corrige partes-capture.service.ts
const capturaPath = path.join('E:\\Development\\zattar-advogados\\src\\features\\captura\\services\\partes\\partes-capture.service.ts');
if (fs.existsSync(capturaPath)) {
  let content = fs.readFileSync(capturaPath, 'utf8');
  const originalLength = content.length;
  
  content = content.replace(/result\.sucesso && result\.endereco/g, 'result.success && result.data');
  content = content.replace(/result\.endereco\.id/g, 'result.data.id');
  
  if (content.length !== originalLength) {
    fs.writeFileSync(capturaPath, content, 'utf8');
    console.log('✓ partes-capture.service.ts - Corrigido');
  } else {
    console.log('- partes-capture.service.ts - Nenhuma correção necessária');
  }
}

// 2. Corrige endereco-recovery.service.ts
const enderecoRecoveryPath = path.join('E:\\Development\\zattar-advogados\\src\\features\\captura\\services\\recovery\\endereco-recovery.service.ts');
if (fs.existsSync(enderecoRecoveryPath)) {
  let content = fs.readFileSync(enderecoRecoveryPath, 'utf8');
  const originalLength = content.length;
  
  // Corrige import
  content = content.replace(
    'type UpsertEnderecoPorIdPjeParams,',
    'type UpsertEnderecoPorIdPjeParams ='
  );
  
  // Corrige propriedades do resultado
  content = content.replace(/resultado\.sucesso/g, 'resultado.success');
  content = content.replace(/resultado\.endereco/g, 'resultado.data');
  content = content.replace(/resultado\.erro/g, 'resultado.error');
  
  if (content.length !== originalLength) {
    fs.writeFileSync(enderecoRecoveryPath, content, 'utf8');
    console.log('✓ endereco-recovery.service.ts - Corrigido');
  } else {
    console.log('- endereco-recovery.service.ts - Nenhuma correção necessária');
  }
}

// 3. Corrige tribunal-config-persistence.service.ts
const tribunalPath = path.join('E:\\Development\\zattar-advogados\\src\\features\\captura\\services\\persistence\\tribunal-config-persistence.service.ts');
if (fs.existsSync(tribunalPath)) {
  let content = fs.readFileSync(tribunalPath, 'utf8');
  const originalLength = content.length;
  
  // Remove null values do array
  content = content.replace(
    'return data',
    'return data.filter(config => config !== null)'
  );
  
  if (content.length !== originalLength) {
    fs.writeFileSync(tribunalPath, content, 'utf8');
    console.log('✓ tribunal-config-persistence.service.ts - Corrigido');
  } else {
    console.log('- tribunal-config-persistence.service.ts - Nenhuma correção necessária');
  }
}

// 4. Corrige add-todo-sheet.tsx
const tasksAddPath = path.join('E:\\Development\\zattar-advogados\\src\\features\\tasks\\components\\todo-list\\add-todo-sheet.tsx');
if (fs.existsSync(tasksAddPath)) {
  let content = fs.readFileSync(tasksAddPath, 'utf8');
  const originalLength = content.length;
  
  content = content.replace(/EnumTodoStatus\.Pending/g, '"todo"');
  content = content.replace(/EnumTodoPriority\.Medium/g, '"medium"');
  
  if (content.length !== originalLength) {
    fs.writeFileSync(tasksAddPath, content, 'utf8');
    console.log('✓ add-todo-sheet.tsx - Corrigido');
  } else {
    console.log('- add-todo-sheet.tsx - Nenhuma correção necessária');
  }
}

// 5. Corrige todo-item.tsx
const todoItemPath = path.join('E:\\Development\\zattar-advogados\\src\\features\\tasks\\components\\todo-list\\todo-item.tsx');
if (fs.existsSync(todoItemPath)) {
  let content = fs.readFileSync(todoItemPath, 'utf8');
  const originalLength = content.length;
  
  content = content.replace(/"completed"/g, '"done"');
  content = content.replace(/todo\.status === "done"/g, 'todo.status === "done"');
  
  if (content.length !== originalLength) {
    fs.writeFileSync(todoItemPath, content, 'utf8');
    console.log('✓ todo-item.tsx - Corrigido');
  } else {
    console.log('- todo-item.tsx - Nenhuma correção necessária');
  }
}

// 6. Corrige todo-list.tsx
const todoListPath = path.join('E:\\Development\\zattar-advogados\\src\\features\\tasks\\components\\todo-list\\todo-list.tsx');
if (fs.existsSync(todoListPath)) {
  let content = fs.readFileSync(todoListPath, 'utf8');
  const originalLength = content.length;
  
  // Corrige a chamada reorderTodos
  content = content.replace(
    'reorderTodos(positions);',
    'reorderTodos(positions.sourceIndex, positions.destinationIndex);'
  );
  
  if (content.length !== originalLength) {
    fs.writeFileSync(todoListPath, content, 'utf8');
    console.log('✓ todo-list.tsx - Corrigido');
  } else {
    console.log('- todo-list.tsx - Nenhuma correção necessária');
  }
}

console.log('\n✅ Correções concluídas com sucesso!');
console.log('\nResumo das correções aplicadas:');
console.log('- Captura: result.sucesso → result.success, result.endereco → result.data');
console.log('- Tasks: Enums para strings, status "completed" → "done"');
console.log('- Tribunal: Filtragem de valores nulos');
console.log('- Recovery: Correção de imports e propriedades');
