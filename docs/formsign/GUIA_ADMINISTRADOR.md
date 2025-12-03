# Guia do Administrador - Assinatura Digital

## Índice
1. Introdução
2. Pré-requisitos
3. Conceitos Fundamentais
4. Passo a Passo: Criando seu Primeiro Formulário
5. Gerenciamento de Segmentos
6. Gerenciamento de Templates
7. Gerenciamento de Formulários
8. Testando o Fluxo Completo
9. Boas Práticas
10. Perguntas Frequentes

## 1. Introdução

Bem-vindo ao módulo de Assinatura Digital do Sinesys! Este guia irá ajudá-lo a configurar e gerenciar formulários digitais com assinatura manuscrita, captura de foto e geolocalização.

### O que você pode fazer como administrador:

- **Criar segmentos**: Organizar formulários em categorias (ex: trabalhista, previdenciário)
- **Criar templates**: Fazer upload de PDFs e adicionar campos variáveis (texto, assinatura, foto)
- **Criar formulários**: Combinar templates com schemas dinâmicos de dados
- **Gerenciar permissões**: Controlar quem pode criar, editar ou deletar
- **Testar fluxos**: Simular o preenchimento completo pelos usuários finais

O módulo permite criar formulários públicos acessíveis via URL, onde usuários podem preencher dados, capturar foto/geolocalização (opcional), visualizar PDFs e assinar digitalmente.

## 2. Pré-requisitos

### Permissões Necessárias

Você precisa ter as seguintes permissões no recurso `formsign_admin`:

- **Listar**: Visualizar listas de templates, formulários e segmentos
- **Visualizar**: Ver detalhes de itens específicos
- **Criar**: Criar novos templates, formulários e segmentos
- **Editar**: Modificar itens existentes
- **Deletar**: Remover itens

**Nota:** Super admins têm todas as permissões automaticamente.

### Como Verificar se Você Tem Acesso

1. Faça login no Sinesys
2. Acesse qualquer página do módulo (ex: `/assinatura-digital/admin/templates`)
3. Se você conseguir acessar, tem pelo menos permissão de "listar"
4. Para verificar permissões específicas, consulte seu administrador

### Como Solicitar Permissões

1. Entre em contato com um super admin do sistema
2. Forneça seu nome de usuário e as permissões necessárias
3. Aguarde a aprovação (pode levar alguns minutos)

**Sem as permissões adequadas, você verá erros 403 ou botões desabilitados/ocultos.**

## 3. Conceitos Fundamentais

### Segmentos

**O que são:** Categorias organizacionais para agrupar formulários relacionados.

**Para que servem:**
- Organização lógica (ex: todos os formulários trabalhistas juntos)
- URLs amigáveis (`/formulario/trabalhista/procuração`)
- Controle de acesso (futuramente)

**Exemplos:**
- `trabalhista` - Ações trabalhistas
- `previdenciario` - Ações previdenciárias
- `civel` - Ações cíveis

### Templates

**O que são:** Modelos de PDF com campos variáveis que serão preenchidos automaticamente.

**Tipos de campos:**
- **Texto**: Campos simples (nome, CPF, etc.)
- **Imagem**: Campos para assinatura ou foto
- **Texto Composto**: Blocos de texto formatado com variáveis inline

**Variáveis disponíveis:**
- **Cliente**: Dados pessoais (nome, CPF, endereço, etc.)
- **Ação**: Dados específicos do formulário (reclamada, modalidade, etc.)
- **Sistema**: Data/hora atual
- **Assinatura**: Imagem da assinatura, IP, localização

**Editor visual vs Markdown:**
- **Editor Visual**: Interface drag-and-drop para posicionar campos no PDF
- **Markdown**: Alternativa para templates simples (não implementado ainda)

### Formulários

**O que são:** Combinação de um ou mais templates com um schema dinâmico de dados.

**Schema dinâmico:** Conjunto de campos personalizados que o usuário preenche antes de assinar.

**Opções:**
- **Foto necessária**: Exige captura de foto durante o preenchimento
- **Geolocalização necessária**: Exige captura de coordenadas GPS

## 4. Passo a Passo: Criando seu Primeiro Formulário

Vamos criar um formulário completo de "Procuração Trabalhista" como exemplo.

### Passo 1: Criar um Segmento

1. Acesse `/assinatura-digital/admin/segmentos`
2. Clicar em "Novo Segmento"
3. Preencher:
   - Nome: "Trabalhista"
   - Slug: gerado automaticamente ("trabalhista")
   - Descrição: "Formulários para ações trabalhistas"
   - Ativo: Sim
4. Salvar

### Passo 2: Criar um Template

1. Acessar `/assinatura-digital/admin/templates`
2. Clicar em "Novo Template"
3. Upload de PDF:
   - Arrastar arquivo PDF ou clicar para selecionar
   - Validação: 10KB - 10MB, formato PDF
4. Preencher metadados:
   - Nome: "Procuração Trabalhista"
   - Descrição: "Modelo de procuração para ações trabalhistas"
   - Status: Rascunho (até finalizar edição)
5. Salvar e abrir editor visual

### Passo 3: Editar Template no Editor Visual

1. **Adicionar campos de texto:**
   - Clicar em "Adicionar Texto"
   - Posicionar no PDF (arrastar)
   - Redimensionar (8 handles)
   - Abrir propriedades (botão "Propriedades")
   - Selecionar variável: `{{cliente.nome}}`
   - Ajustar fonte e tamanho

2. **Adicionar campo de assinatura:**
   - Clicar em "Adicionar Imagem"
   - Posicionar onde vai a assinatura
   - Propriedades → Variável: `{{assinatura.imagem}}`

3. **Adicionar texto composto (rich text):**
   - Clicar em "Adicionar Texto Composto"
   - Posicionar
   - Editar conteúdo com editor Tiptap
   - Inserir variáveis inline: `{{cliente.cpf}}`

4. **Testar preview:**
   - Clicar em "Gerar Preview de Teste"
   - Visualizar PDF preenchido com dados mock
   - Alternar entre "Original" e "Preenchido"

5. **Salvar e ativar:**
   - Autosave a cada 5 segundos
   - Alterar status para "Ativo" (botão "Informações do Template")

### Passo 4: Criar um Formulário

1. Acessar `/assinatura-digital/admin/formularios`
2. Clicar em "Novo Formulário"
3. Preencher:
   - Nome: "Procuração Trabalhista - Reclamante"
   - Slug: gerado automaticamente
   - Segmento: Selecionar "Trabalhista"
   - Templates: Selecionar "Procuração Trabalhista" (multi-select)
   - Descrição: "Formulário para procuração de reclamante"
   - Foto necessária: Sim
   - Geolocalização necessária: Não
   - Ativo: Sim
4. Salvar

### Passo 5: Editar Schema do Formulário

1. Na lista de formulários, clicar em "Editar Schema"
2. **Adicionar seção:**
   - Clicar em "+ Adicionar Seção"
   - Nome: "Dados da Ação"
   - Descrição: "Informações sobre a ação trabalhista"

3. **Adicionar campos (arrastar da paleta):**
   - Arrastar "Texto" para a seção
   - Configurar no painel de propriedades:
     - ID: `reclamada_nome`
     - Label: "Nome da Reclamada"
     - Placeholder: "Ex: Empresa XYZ Ltda"
     - Obrigatório: Sim
     - Largura: 100%

   - Arrastar "Select" para a seção
   - Configurar:
     - ID: `modalidade`
     - Label: "Modalidade"
     - Opções:
       - `CLT` → "CLT"
       - `AUTONOMO` → "Autônomo"
       - `ESTAGIARIO` → "Estagiário"
     - Obrigatório: Sim

4. **Adicionar campo condicional:**
   - Arrastar "Texto" para a seção
   - Configurar:
     - ID: `empresa_cnpj`
     - Label: "CNPJ da Empresa"
     - Condicional: Sim
     - Condição: `modalidade` = `CLT`

5. **Preview do formulário:**
   - Clicar em "Preview"
   - Testar preenchimento
   - Verificar validações

6. **Salvar schema**

### Passo 6: Testar Fluxo Completo

1. Copiar URL pública: `/formulario/trabalhista/procuracao-trabalhista-reclamante`
2. Abrir em aba anônima (simular usuário final)
3. Preencher:
   - CPF
   - Dados pessoais
   - Dados da ação (schema dinâmico)
   - Capturar foto
   - Visualizar PDF
   - Assinar
4. Baixar PDFs gerados
5. Verificar se todos os campos foram preenchidos corretamente

## 5. Gerenciamento de Segmentos

### Criar Segmento

- Botão "Novo Segmento"
- Campos obrigatórios: nome, slug
- Slug: gerado automaticamente, pode ser editado
- Validação: slug único

### Editar Segmento

- Clicar no segmento na lista ou botão "Editar" no dropdown
- Alterar nome, descrição, status ativo
- Slug não pode ser alterado após criação (evitar quebrar URLs públicas)

### Duplicar Segmento

- Botão "Duplicar" no dropdown
- Copia todos os campos exceto nome e slug
- Útil para criar variações

### Deletar Segmento

- Botão "Deletar" no dropdown ou seleção múltipla
- Validação: não pode deletar se houver formulários vinculados
- Mensagem de erro clara com quantidade de formulários

### Busca e Filtros

- Busca: nome, slug, descrição
- Filtro: Ativo (Sim/Não)
- Exportar CSV: todos ou selecionados

## 6. Gerenciamento de Templates

### Criar Template

- Upload de PDF (drag-and-drop ou clique)
- Validação: 10KB - 10MB, formato PDF
- Metadados: nome, descrição, status
- Abre automaticamente no editor visual

### Editor Visual de Templates

#### Modos de Edição

- **Selecionar:** Mover e redimensionar campos existentes
- **Adicionar Texto:** Criar campos de texto simples
- **Adicionar Imagem:** Criar campos de imagem (assinatura, foto)
- **Adicionar Texto Composto:** Criar campos de rich text com variáveis

#### Controles de Zoom

- 50%, 75%, 100%, 125%, 150%, 200%
- Atalhos: Ctrl + Scroll (mouse wheel)

#### Navegação de Páginas

- Setas para página anterior/próxima
- Indicador: "Página X de Y"
- Campos são filtrados automaticamente por página

#### Propriedades de Campos

- **Informações Gerais:**
  - Nome: identificador do campo
  - Variável: seletor com autocomplete
  - Tipo: texto, assinatura, foto, texto_composto

- **Posicionamento:**
  - X, Y: coordenadas (px)
  - Largura, Altura: dimensões (px)
  - Página: número da página

- **Estilo (apenas texto):**
  - Tamanho da fonte: 8-72pt
  - Fonte: Helvetica, Times, Courier

#### Variáveis Disponíveis

**Cliente:**
- `{{cliente.nome}}` - Nome completo
- `{{cliente.cpf}}` - CPF formatado
- `{{cliente.rg}}` - RG
- `{{cliente.data_nascimento}}` - Data de nascimento
- `{{cliente.nacionalidade}}` - Nacionalidade
- `{{cliente.estado_civil}}` - Estado civil
- `{{cliente.profissao}}` - Profissão
- `{{cliente.endereco_completo}}` - Endereço completo
- `{{cliente.endereco_logradouro}}` - Logradouro
- `{{cliente.endereco_numero}}` - Número
- `{{cliente.endereco_complemento}}` - Complemento
- `{{cliente.endereco_bairro}}` - Bairro
- `{{cliente.endereco_cidade}}` - Cidade
- `{{cliente.endereco_uf}}` - UF
- `{{cliente.endereco_cep}}` - CEP
- `{{cliente.telefone}}` - Telefone
- `{{cliente.email}}` - E-mail

**Ação (se aplicável):**
- `{{acao.reclamada_nome}}` - Nome da reclamada
- `{{acao.modalidade}}` - Modalidade
- `{{acao.trt}}` - TRT (calculado automaticamente)

**Sistema:**
- `{{sistema.data_atual}}` - Data atual
- `{{sistema.hora_atual}}` - Hora atual

**Assinatura:**
- `{{assinatura.imagem}}` - Imagem da assinatura
- `{{assinatura.data}}` - Data da assinatura
- `{{assinatura.ip}}` - IP do assinante
- `{{assinatura.localizacao}}` - Coordenadas GPS

#### Atalhos de Teclado

- `Delete`: Deletar campo selecionado
- `Escape`: Desselecionar campo / cancelar drag
- `Setas`: Mover campo (1px)
- `Shift + Setas`: Mover campo (10px)

#### Autosave

- Salva automaticamente a cada 5 segundos
- Indicador visual: "Salvando..." / "Salvo"
- Guarda de navegação: alerta se houver mudanças não salvas

#### Preview de Teste

- Gera PDF com dados mock
- Alterna entre "Original" e "Preenchido"
- Útil para verificar posicionamento e tamanho de campos

### Editar Template

- Clicar no template na lista ou botão "Editar"
- Abre editor visual
- Todas as funcionalidades de criação disponíveis

### Duplicar Template

- Botão "Duplicar" no dropdown
- Copia todos os campos, incluindo campos do editor
- Útil para criar variações

### Deletar Template

- Botão "Deletar" no dropdown ou seleção múltipla
- Confirmação obrigatória
- Não valida se há formulários vinculados (permite deletar)

### Substituir PDF

- Botão "Substituir PDF" no editor
- Upload de novo PDF
- Mantém campos existentes (pode precisar reposicionar)

### Busca e Filtros

- Busca: nome, UUID, descrição
- Filtros:
  - Status: Ativo, Inativo, Rascunho
  - Ativo: Sim/Não
- Exportar CSV: todos ou selecionados

## 7. Gerenciamento de Formulários

### Criar Formulário

- Botão "Novo Formulário"
- Campos obrigatórios: nome, segmento
- Templates: multi-select (opcional, pode adicionar depois)
- Toggles:
  - Foto necessária: exige captura de foto no fluxo
  - Geolocalização necessária: exige captura de GPS no fluxo

### Editar Schema

- Botão "Editar Schema" no dropdown
- Abre FormSchemaBuilder

#### FormSchemaBuilder

**Paleta de Campos (esquerda):**
- **Texto:** text, email, textarea
- **Números:** number
- **Datas:** date
- **Seleção:** select, radio, checkbox
- **Formatados BR:** CPF, CNPJ, phone, CEP

**Canvas (centro):**
- Seções colapsáveis
- Campos arrastáveis
- Indicadores: Obrigatório, Condicional, N opções
- Ações: Editar, Duplicar, Deletar

**Painel de Propriedades (direita):**
- **Informações Gerais:**
  - ID: identificador único (usado como chave no JSON)
  - Label: rótulo exibido ao usuário
  - Placeholder: texto de exemplo
  - Descrição: texto de ajuda
  - Obrigatório: validação

- **Layout:**
  - Largura: 33%, 50%, 100%

- **Validação:**
  - Mínimo/Máximo (texto, número)
  - Padrão regex (texto)
  - Mensagem de erro customizada

- **Opções (select, radio, checkbox):**
  - Adicionar/remover opções
  - Valor e label de cada opção

- **Condicional:**
  - Mostrar se: campo X operador valor
  - Operadores: =, !=, >, <, contains, empty, notEmpty

**Modos:**
- **Editar:** Modificar schema
- **Preview:** Visualizar formulário renderizado

**Ações:**
- Salvar: Salva schema no backend
- Importar JSON: Carregar schema de arquivo
- Exportar JSON: Baixar schema como arquivo

### Duplicar Formulário

- Botão "Duplicar" no dropdown
- Copia todos os campos, incluindo schema
- Útil para criar variações

### Deletar Formulário

- Botão "Deletar" no dropdown ou seleção múltipla
- Confirmação obrigatória
- Não valida dependências

### Busca e Filtros

- Busca: nome, slug, descrição
- Filtros:
  - Segmento: multi-select
  - Ativo: Sim/Não
  - Foto necessária: Sim/Não
  - Geolocalização necessária: Sim/Não
- Exportar CSV: todos ou selecionados

## 8. Testando o Fluxo Completo

### Preparação

1. Criar segmento ativo
2. Criar template ativo com campos configurados
3. Criar formulário ativo vinculado ao segmento e template
4. Configurar schema do formulário

### Teste do Fluxo Público

**URL:** `/formulario/[slug-segmento]/[slug-formulario]`

Exemplo: `/formulario/trabalhista/procuracao-trabalhista-reclamante`

**Passos do Usuário:**

1. **Verificar CPF:**
   - Digitar CPF
   - Sistema verifica se cliente existe
   - Se existir: carrega dados
   - Se não existir: prossegue para cadastro

2. **Dados Pessoais:**
   - Preencher nome, RG, data de nascimento, etc.
   - CEP: auto-preenche endereço via ViaCEP
   - Validações em tempo real

3. **Formulário Dinâmico:**
   - Campos definidos no schema
   - Validações customizadas
   - Campos condicionais aparecem/desaparecem

4. **Captura de Foto (se necessário):**
   - Solicita permissão de câmera
   - Captura foto 500x500px
   - Permite recapturar
   - Validação: máximo 5MB

5. **Captura de Geolocalização (se necessário):**
   - Solicita permissão de localização
   - Captura coordenadas GPS
   - Exibe precisão
   - Permite recapturar

6. **Visualização de PDF:**
   - Gera preview do PDF preenchido
   - Permite voltar para editar

7. **Visualização de Markdown (alternativa):**
   - Exibe conteúdo markdown renderizado
   - Variáveis substituídas

8. **Assinatura Manuscrita:**
   - Canvas de assinatura
   - Captura métricas (pontos, traços, tempo)
   - Permite limpar e refazer
   - Validação: não pode estar vazio

9. **Sucesso:**
   - Exibe PDFs gerados
   - Botões de download individual
   - Botão de download ZIP (todos)
   - Opção de preencher novo formulário

### Validações a Verificar

**Dados:**
- CPF válido
- E-mail válido
- Telefone formatado
- CEP válido e auto-preenchimento
- Campos obrigatórios preenchidos
- Validações customizadas (min/max, regex)

**Captura:**
- Foto capturada corretamente
- Geolocalização com precisão aceitável
- Assinatura não vazia

**PDF:**
- Todos os campos preenchidos
- Formatação correta
- Imagens (assinatura, foto) renderizadas
- Múltiplas páginas (se aplicável)

**Download:**
- PDFs baixam corretamente
- ZIP contém todos os PDFs
- Nomes de arquivo corretos

## 9. Boas Práticas

### Segmentos

- Use nomes descritivos e curtos
- Slugs devem ser kebab-case (ex: `trabalhista`, `previdenciario`)
- Não altere slugs após publicação (quebra URLs públicas)
- Desative segmentos não utilizados ao invés de deletar

### Templates

- Nomeie templates de forma clara (ex: "Procuração - Reclamante")
- Use status "Rascunho" durante edição
- Teste preview antes de ativar
- Mantenha versões antigas desativadas (não delete)
- Use texto composto para blocos de texto com variáveis
- Evite campos muito pequenos (mínimo 50x20px)
- Posicione campos com margem de segurança (10px das bordas)

### Formulários

- Nomeie formulários de forma descritiva
- Vincule apenas templates necessários
- Use foto/geolocalização apenas quando realmente necessário
- Organize schema em seções lógicas
- Use campos condicionais para simplificar UX
- Adicione descrições e placeholders para ajudar usuários
- Teste fluxo completo antes de publicar

### Schemas

- Use IDs descritivos (ex: `reclamada_nome`, não `campo1`)
- Agrupe campos relacionados em seções
- Use validações apropriadas (min/max, regex)
- Evite schemas muito longos (máximo 20 campos por seção)
- Use campos condicionais para reduzir complexidade

### Segurança

- Não compartilhe URLs de formulários publicamente sem necessidade
- Revise permissões de usuários regularmente
- Monitore logs de assinaturas
- Valide dados no backend (não confie apenas no frontend)

## 10. Perguntas Frequentes

### Como adicionar um novo tipo de variável?

Atualmente não é possível via interface. Requer alteração no código backend.

### Posso usar o mesmo template em múltiplos formulários?

Sim! Um template pode ser vinculado a vários formulários.

### Como alterar o slug de um segmento/formulário?

Não é possível após criação para evitar quebrar URLs públicas. Crie um novo e desative o antigo.

### O que acontece se deletar um template usado em formulários?

O formulário continua funcionando, mas não conseguirá gerar PDFs. Recomenda-se desativar ao invés de deletar.

### Como exportar todos os formulários preenchidos?

Atualmente não há interface para isso. Consulte o banco de dados diretamente ou solicite ao suporte técnico.

### Posso ter múltiplos templates em um formulário?

Sim! Use o multi-select ao criar/editar o formulário. Todos os templates serão gerados no final.

### Como funciona o cálculo do TRT?

É calculado automaticamente com base no UF do endereço do cliente. Não é possível alterar manualmente.

### Posso personalizar as cores/estilos do fluxo público?

Atualmente não via interface. Requer alteração no código frontend.

### Como adicionar novos campos formatados (ex: CNPJ)?

Os campos formatados disponíveis são fixos. Para adicionar novos, requer desenvolvimento.

### O que fazer se o preview de teste não gerar?

Verifique:
1. Template tem campos configurados
2. Variáveis estão corretas
3. PDF original está acessível
4. Logs do backend para erros

### Como funciona o autosave no editor?

Salva automaticamente a cada 5 segundos. Não é necessário clicar em "Salvar" manualmente.

### Posso importar templates de outro sistema?

Não diretamente. É necessário recriar manualmente ou desenvolver script de importação.

### Como adicionar marca d'água nos PDFs?

Atualmente não suportado. Requer desenvolvimento backend.

### Posso enviar o PDF por e-mail automaticamente?

Atualmente não. O usuário deve baixar manualmente. Funcionalidade de e-mail pode ser desenvolvida.

### Como rastrear quem assinou um formulário?

Todos os dados são salvos no banco, incluindo IP, geolocalização, data/hora, e métricas da assinatura.

---

**Referências:**
- [Documentação de Permissões](./PERMISSIONS.md)
- [Guia do Usuário](./GUIA_USUARIO.md)
- [Arquitetura Técnica](./ARQUITETURA.md)
- [Troubleshooting](./TROUBLESHOOTING.md)