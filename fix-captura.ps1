# Corrige os erros no arquivo partes-capture.service.ts
$filePath = "E:\Development\zattar-advogados\src\features\captura\services\partes\partes-capture.service.ts"
$content = Get-Content -Path $filePath -Raw

# Faz as substituições
$content = $content -replace 'result\.sucesso && result\.endereco', 'result.success && result.data'
$content = $content -replace 'result\.endereco\.id', 'result.data.id'

# Salva o arquivo
$content | Set-Content -Path $filePath -Encoding UTF8

Write-Host "Arquivo corrigido com sucesso!"
