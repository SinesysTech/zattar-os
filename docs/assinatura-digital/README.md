# 📄 Módulo de Assinatura Digital

## 📋 Visão Geral do Módulo

O **Módulo de Assinatura Digital** é uma solução completa integrada ao Sinesys para criação, gerenciamento e preenchimento de formulários digitais com assinatura manuscrita. Permite transformar documentos PDF em formulários interativos, coletar dados estruturados e gerar PDFs assinados digitalmente.

### Principais Funcionalidades

- **Templates PDF Visuais**: Editor drag-and-drop para adicionar campos variáveis em PDFs existentes
- **Formulários Dinâmicos**: Construtor de schemas JSON para formulários personalizados com validações
- **Segmentos Organizados**: Categorização de formulários com URLs amigáveis
- **Fluxo Público Seguro**: Preenchimento anônimo com captura de foto, geolocalização e assinatura manuscrita
- **Geração de PDFs**: Renderização automática de PDFs preenchidos e assinados

### Arquitetura de Alto Nível

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │   API Backend   │    │   Public Flow   │
│                 │    │                 │    │                 │
│ • Templates     │◄──►│ • CRUD          │◄──►│ • Form Fill     │
│ • Formulários   │    │ • PDF Gen       │    │ • Signature     │
│ • Segmentos     │    │ • Validation    │    │ • Download      │
│ • Editor Visual │    │ • Storage       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Início Rápido

### Pré-requisitos

- **Permissões**: Acesso ao módulo `assinatura_digital` (consulte [Permissões](./PERMISSIONS.md))
- **Navegador**: Chrome, Firefox, Safari ou Edge (últimas versões)
- **Conectividade**: Internet estável para uploads e geração de PDFs

### Primeiro Acesso ao Módulo

1. **Acesse o Dashboard**: Faça login no Sinesys e navegue para **Assinatura Digital**
2. **Verifique Permissões**: Confirme que você tem acesso às funcionalidades desejadas
3. **Explore as Seções**: Templates, Formulários e Segmentos

### Fluxo Básico: Criar seu Primeiro Formulário

1. **Criar Segmento** (`/assinatura-digital/segmentos`)
   - Exemplo: "Trabalhista" (slug: `trabalhista`)

2. **Criar Template** (`/assinatura-digital/templates`)
   - Upload de PDF
   - Editor visual: adicionar campos como `{{cliente.nome}}`, `{{assinatura.imagem}}`
   - Salvar como ativo

3. **Criar Formulário** (`/assinatura-digital/formularios`)
   - Vincular ao segmento e template
   - Construir schema: campos como "Nome da Reclamada", "CPF"
   - Configurar opções: foto necessária, geolocalização

4. **Testar Fluxo Público**
   - URL: `/formulario/trabalhista/[slug-do-formulario]`
   - Preencher como usuário final
   - Verificar geração de PDFs

## 🧩 Componentes Principais

### Templates PDF

**Editor Visual Drag-and-Drop**
- Upload de PDFs (10KB - 10MB)
- Canvas interativo com zoom e navegação de páginas
- Campos suportados: texto, imagem, texto composto (rich text)
- Variáveis dinâmicas: cliente, ação, sistema, assinatura
- Autosave automático e preview de teste

**Exemplo de Uso:**
```
Campo: Texto
Variável: {{cliente.nome}}
Posição: X=100, Y=200, Página=1
Fonte: Helvetica, 12pt
```

### Formulários Dinâmicos

**Schema Builder Visual**
- Paleta de campos: texto, select, radio, checkbox, CPF, telefone, etc.
- Validações customizadas: obrigatório, min/max, regex, condicional
- Layout responsivo: larguras 33%, 50%, 100%
- Preview em tempo real do formulário renderizado

**Exemplo de Schema:**
```json
{
  "sections": [
    {
      "title": "Dados Pessoais",
      "fields": [
        {
          "id": "nome",
          "type": "text",
          "label": "Nome Completo",
          "required": true,
          "width": 100
        }
      ]
    }
  ]
}
```

### Segmentos

**Organização Hierárquica**
- Categorias para agrupar formulários relacionados
- Slugs únicos para URLs públicas (ex: `trabalhista`, `previdenciario`)
- Contagem automática de formulários por segmento

### Fluxo Público

**Experiência do Usuário Final**
- Verificação de CPF com carregamento automático de dados
- Formulário dinâmico renderizado do schema
- Captura opcional de foto (câmera) e geolocalização (GPS)
- Assinatura manuscrita com canvas interativo
- Geração e download de PDFs assinados

## 📚 Links para Documentação Detalhada

- **[Guia do Administrador](./GUIA_ADMINISTRADOR.md)**: Tutorial completo para criar e gerenciar templates, formulários e segmentos
- **[Guia do Usuário](./GUIA_USUARIO.md)**: Como preencher formulários públicos passo a passo
- **[Arquitetura Técnica](./ARQUITETURA.md)**: Documentação completa da arquitetura, APIs e banco de dados
- **[Troubleshooting](./TROUBLESHOOTING.md)**: Problemas comuns e soluções
- **[Permissões](./PERMISSIONS.md)**: Sistema de permissões granulares

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** + **Next.js 14** (App Router): Framework moderno com SSR/SSG
- **TypeScript**: Tipagem estática para maior segurança
- **Zustand**: State management leve e performático
- **Tailwind CSS**: Styling utilitário responsivo

### PDF e Documentos
- **react-pdf** + **pdfjs-dist**: Renderização e manipulação de PDFs no navegador
- **Tiptap**: Editor rich text para campos compostos
- **react-signature-canvas**: Captura de assinatura manuscrita

### Interação e UX
- **@dnd-kit**: Drag-and-drop moderno e acessível
- **react-webcam**: Captura de foto via câmera
- **react-imask**: Máscaras de input (CPF, telefone, CEP)

### Validação e Forms
- **Zod**: Schema validation TypeScript-first
- **react-hook-form**: Gerenciamento de formulários performático
- **@hookform/resolvers**: Integração Zod + react-hook-form

### Utilitários
- **jszip**: Geração de arquivos ZIP para downloads múltiplos
- **uuid**: Geração de identificadores únicos
- **sonner**: Notificações toast elegantes

## 📁 Estrutura de Diretórios

```
sinesys/
├── app/
│   ├── (dashboard)/assinatura-digital/
│   │   ├── templates/           # CRUD templates
│   │   ├── formularios/         # CRUD formulários
│   │   └── segmentos/           # CRUD segmentos
│   └── formulario/[segmento]/[formulario]/
│       └── page.tsx             # Página pública
├── components/assinatura-digital/
│   ├── editor/                  # Editor de templates
│   ├── schema-builder/          # Construtor de schemas
│   ├── form/                    # Fluxo público
│   ├── signature/               # Assinatura
│   ├── capture/                 # Captura foto/GPS
│   └── inputs/                  # Inputs formatados
├── lib/assinatura-digital/
│   ├── validators/              # Validações de negócio
│   ├── formatters/              # Formatadores BR
│   ├── utils/                   # Utilitários
│   └── constants/               # Constantes
├── types/assinatura-digital/    # Tipos TypeScript
└── backend/assinatura-digital/  # Lógica backend
```

## 🔐 Permissões e Segurança

O módulo Assinatura Digital utiliza o sistema de permissões granulares do Sinesys. Para configurar acesso de usuários às funcionalidades administrativas, consulte:

📖 **[Documentação de Permissões](./PERMISSIONS.md)**

**Resumo rápido:**
- Recurso: `assinatura_digital`
- Operações: `listar`, `visualizar`, `criar`, `editar`, `deletar`
- Super admins têm acesso total automaticamente
- Permissões são verificadas no frontend (UX) e backend (segurança)