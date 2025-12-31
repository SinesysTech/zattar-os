# Exemplos Práticos - Tools MCP Documentos e Usuários

Este documento fornece exemplos de casos de uso reais para as tools MCP de Documentos e Usuários.

## Índice

- [Casos de Uso - Documentos](#casos-de-uso---documentos)
  - [1. Encontrar e usar um template de petição](#1-encontrar-e-usar-um-template-de-petição)
  - [2. Buscar documentos de um processo específico](#2-buscar-documentos-de-um-processo-específico)
  - [3. Descobrir templates populares](#3-descobrir-templates-populares)
- [Casos de Uso - Usuários](#casos-de-uso---usuários)
  - [4. Verificar permissões de um usuário](#4-verificar-permissões-de-um-usuário)
  - [5. Encontrar advogados ativos no escritório](#5-encontrar-advogados-ativos-no-escritório)
  - [6. Buscar usuário por documento ou email](#6-buscar-usuário-por-documento-ou-email)

---

## Casos de Uso - Documentos

### 1. Encontrar e usar um template de petição

**Cenário**: Um agente de IA precisa criar uma nova petição inicial trabalhista usando um template existente.

**Fluxo**:

```typescript
// Passo 1: Listar categorias disponíveis
const categorias = await executeMcpTool('listar_categorias_templates', {});
console.log('Categorias:', categorias.data.categorias);
// Resultado: ["peticao", "contrato", "recurso", "parecer"]

// Passo 2: Listar templates de petição
const templates = await executeMcpTool('listar_templates', {
  categoria: 'peticao',
  visibilidade: 'publico',
  limite: 10
});

console.log('Templates de petição:', templates.data.templates);
/*
Resultado:
[
  {
    id: 1,
    titulo: "Petição Inicial - Trabalhista",
    categoria: "peticao"
  },
  {
    id: 2,
    titulo: "Petição Inicial - Cível",
    categoria: "peticao"
  }
]
*/

// Passo 3: Usar o template selecionado
const novoDocumento = await executeMcpTool('usar_template', {
  template_id: 1,
  titulo: 'Reclamação Trabalhista - João Silva vs Empresa XYZ',
  pasta_id: 42  // Pasta do processo
});

console.log('Documento criado:', novoDocumento.data);
// Resultado: { documento_id: 123, titulo: "Reclamação...", pasta_id: 42 }
```

**Resultado**: Documento criado com sucesso a partir do template.

---

### 2. Buscar documentos de um processo específico

**Cenário**: Recuperar todos os contratos relacionados a um processo específico.

**Fluxo**:

```typescript
// Buscar documentos por pasta e tags
const documentos = await executeMcpTool('listar_documentos', {
  pasta_id: 42,  // ID da pasta do processo
  tags: ['contrato', 'trabalhista'],
  limite: 50
});

console.log(`Encontrados ${documentos.data.total} contratos trabalhistas`);
console.log('Documentos:', documentos.data.documentos);

/*
Resultado:
[
  {
    id: 10,
    titulo: "Contrato de Trabalho - João Silva",
    tags: ["contrato", "trabalhista"],
    data_criacao: "2025-01-15"
  },
  {
    id: 15,
    titulo: "Termo de Rescisão",
    tags: ["contrato", "trabalhista", "rescisao"],
    data_criacao: "2025-01-20"
  }
]
*/
```

**Resultado**: Lista de contratos trabalhistas filtrados por pasta e tags.

---

### 3. Descobrir templates populares

**Cenário**: Um agente precisa sugerir templates mais usados para criação rápida de documentos.

**Fluxo**:

```typescript
// Listar os 5 templates mais populares
const maisUsados = await executeMcpTool('listar_templates_mais_usados', {
  limite: 5
});

console.log('Templates mais usados:', maisUsados.data.templates);

/*
Resultado:
[
  { id: 1, titulo: "Petição Inicial - Trabalhista", usos: 142 },
  { id: 3, titulo: "Contrato de Prestação de Serviços", usos: 98 },
  { id: 5, titulo: "Recurso Ordinário", usos: 76 },
  { id: 2, titulo: "Petição Inicial - Cível", usos: 65 },
  { id: 7, titulo: "Procuração", usos: 54 }
]
*/

// Sugestão ao usuário
console.log('Recomendação: Use o template "Petição Inicial - Trabalhista" (mais popular com 142 usos)');
```

**Resultado**: Lista de templates ordenados por popularidade.

---

## Casos de Uso - Usuários

### 4. Verificar permissões de um usuário

**Cenário**: Antes de atribuir uma tarefa, o agente precisa verificar se o usuário tem permissões adequadas.

**Fluxo**:

```typescript
// Passo 1: Buscar usuário por email
const usuario = await executeMcpTool('buscar_usuario_por_email', {
  email: 'joao.silva@escritorio.com.br'
});

console.log('Usuário encontrado:', usuario.data);
// Resultado: { id: 5, nome: "João Silva", email: "joao.silva@...", ativo: true }

// Passo 2: Verificar permissões
const permissoes = await executeMcpTool('listar_permissoes_usuario', {
  usuarioId: usuario.data.id
});

console.log('Permissões:', permissoes.data.permissoes);

/*
Resultado:
[
  { recurso: "processos", operacoes: ["leitura", "escrita"] },
  { recurso: "documentos", operacoes: ["leitura", "escrita", "exclusao"] },
  { recurso: "expedientes", operacoes: ["leitura"] }
]
*/

// Verificar se pode editar documentos
const podeEditarDocumentos = permissoes.data.permissoes
  .find(p => p.recurso === 'documentos')
  ?.operacoes.includes('escrita');

if (podeEditarDocumentos) {
  console.log('✅ Usuário pode editar documentos');
} else {
  console.log('❌ Usuário não tem permissão para editar documentos');
}
```

**Resultado**: Verificação de permissões antes de atribuir tarefa.

---

### 5. Encontrar advogados ativos no escritório

**Cenário**: Listar todos os advogados ativos para atribuição de processos.

**Fluxo**:

```typescript
// Buscar advogados ativos (cargo ID 2 = Advogado)
const advogados = await executeMcpTool('listar_usuarios', {
  ativo: true,
  cargoId: 2,
  limite: 50
});

console.log(`Encontrados ${advogados.data.total} advogados ativos`);

advogados.data.usuarios.forEach(adv => {
  console.log(`- ${adv.nome} (${adv.email})`);
});

/*
Resultado:
Encontrados 12 advogados ativos
- João Silva (joao.silva@escritorio.com.br)
- Maria Santos (maria.santos@escritorio.com.br)
- Pedro Oliveira (pedro.oliveira@escritorio.com.br)
...
*/
```

**Resultado**: Lista de advogados disponíveis para atribuição.

---

### 6. Buscar usuário por documento ou email

**Cenário**: Encontrar um usuário usando diferentes métodos de busca.

**Fluxo**:

```typescript
// Método 1: Buscar por email
async function buscarPorEmail(email: string) {
  try {
    const resultado = await executeMcpTool('buscar_usuario_por_email', {
      email
    });

    if (resultado.success) {
      console.log('✅ Usuário encontrado por email:', resultado.data.nome);
      return resultado.data;
    }
  } catch (error) {
    console.log('❌ Usuário não encontrado por email');
    return null;
  }
}

// Método 2: Buscar por CPF
async function buscarPorCpf(cpf: string) {
  try {
    const resultado = await executeMcpTool('buscar_usuario_por_cpf', {
      cpf: cpf.replace(/\D/g, '')  // Remove formatação
    });

    if (resultado.success) {
      console.log('✅ Usuário encontrado por CPF:', resultado.data.nome);
      return resultado.data;
    }
  } catch (error) {
    console.log('❌ Usuário não encontrado por CPF');
    return null;
  }
}

// Método 3: Busca textual genérica
async function buscarPorNome(nome: string) {
  const resultado = await executeMcpTool('listar_usuarios', {
    busca: nome,
    limite: 10
  });

  console.log(`Encontrados ${resultado.data.total} usuários com "${nome}"`);
  return resultado.data.usuarios;
}

// Uso
await buscarPorEmail('joao.silva@escritorio.com.br');
await buscarPorCpf('123.456.789-01');
await buscarPorNome('Silva');
```

**Resultado**: Múltiplas formas de encontrar usuários no sistema.

---

## Padrões de Uso Recomendados

### 1. Sempre Verificar Sucesso

```typescript
const resultado = await executeMcpTool('listar_documentos', { limite: 10 });

if (resultado.success) {
  // Processar dados
  console.log('Documentos:', resultado.data);
} else {
  // Tratar erro
  console.error('Erro:', resultado.error);
}
```

### 2. Usar Paginação para Grandes Listas

```typescript
async function listarTodosDocumentos() {
  const limite = 50;
  let offset = 0;
  let todosDocumentos = [];

  while (true) {
    const resultado = await executeMcpTool('listar_documentos', { limite, offset });

    todosDocumentos.push(...resultado.data.documentos);

    if (todosDocumentos.length >= resultado.data.total) {
      break;
    }

    offset += limite;
  }

  return todosDocumentos;
}
```

### 3. Combinar Tools para Workflows Complexos

```typescript
async function criarDocumentoDeTemplatePopular() {
  // 1. Descobrir template mais usado de petição
  const maisUsados = await executeMcpTool('listar_templates_mais_usados', { limite: 1 });
  const templateId = maisUsados.data.templates[0].id;

  // 2. Criar documento a partir do template
  const documento = await executeMcpTool('usar_template', {
    template_id: templateId,
    titulo: 'Nova Petição'
  });

  // 3. Confirmar criação
  console.log(`✅ Documento ${documento.data.documento_id} criado com sucesso`);

  return documento.data;
}
```

### 4. Validar Entradas Antes de Chamar Tools

```typescript
function validarCpf(cpf: string): boolean {
  const cpfNumeros = cpf.replace(/\D/g, '');
  return /^\d{11}$/.test(cpfNumeros);
}

async function buscarUsuarioPorCpfSeguro(cpf: string) {
  if (!validarCpf(cpf)) {
    throw new Error('CPF inválido (deve ter 11 dígitos)');
  }

  const cpfLimpo = cpf.replace(/\D/g, '');
  return await executeMcpTool('buscar_usuario_por_cpf', { cpf: cpfLimpo });
}
```

---

## Referências

- **Documentação Técnica**: [mcp-tools-documentos-usuarios.md](./mcp-tools-documentos-usuarios.md)
- **Scripts de Teste**:
  - [test-documentos-tools.ts](../scripts/mcp/test-documentos-tools.ts)
  - [test-usuarios-tools.ts](../scripts/mcp/test-usuarios-tools.ts)
- **Registry MCP**: [src/lib/mcp/registry.ts](../src/lib/mcp/registry.ts)
