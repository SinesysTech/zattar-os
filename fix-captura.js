const fs = require('fs');
const path = require('path');

// Lê o arquivo
const filePath = path.join('E:\\Development\\zattar-advogados\\src\\features\\captura\\services\\partes\\partes-capture.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Faz as substituições
content = content.replace(/result\.sucesso && result\.endereco/g, 'result.success && result.data');
content = content.replace(/result\.endereco\.id/g, 'result.data.id');

// Salva o arquivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('Arquivo corrigido com sucesso!');
