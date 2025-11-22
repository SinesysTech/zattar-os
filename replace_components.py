#!/usr/bin/env python3
import re

# Ler o arquivo original
with open('app/(dashboard)/audiencias/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Ler os novos componentes
with open('temp_endereco_observacoes.tsx', 'r', encoding='utf-8') as f:
    new_components = f.read()

# Extrair os dois componentes do arquivo temporário
endereco_match = re.search(r'(/\*\*\s*\* Componente para editar endereço.*?\n\*/\nfunction EnderecoCell.*?^\})', new_components, re.DOTALL | re.MULTILINE)
observacoes_match = re.search(r'(/\*\*\s*\* Componente para editar observações.*?\n\*/\nfunction ObservacoesCell.*?^\})', new_components, re.DOTALL | re.MULTILINE)

if not endereco_match or not observacoes_match:
    print("Erro: Não foi possível extrair os componentes")
    exit(1)

new_endereco = endereco_match.group(1)
new_observacoes = observacoes_match.group(1)

# Substituir o componente EnderecoCell
old_endereco_pattern = r'(/\*\*\s*\* Componente para editar endereço.*?\n\*/\nfunction EnderecoCell.*?^\})'
content = re.sub(old_endereco_pattern, new_endereco, content, count=1, flags=re.DOTALL | re.MULTILINE)

# Substituir o componente ObservacoesCell
old_observacoes_pattern = r'(/\*\*\s*\* Componente para editar observações.*?\n\*/\nfunction ObservacoesCell.*?^\})'
content = re.sub(old_observacoes_pattern, new_observacoes, content, count=1, flags=re.DOTALL | re.MULTILINE)

# Escrever o arquivo modificado
with open('app/(dashboard)/audiencias/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Componentes substituídos com sucesso!")
