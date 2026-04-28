import type { Value, Descendant } from 'platejs';

export type VariableOption = {
  value: string;
  label: string;
  category?: string;
};

export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
};

export type TiptapDocument = {
  type: 'doc';
  content: TiptapNode[];
};

const BASE_VARIABLES: VariableOption[] = [
  // Cliente - Identificação
  { value: 'cliente.nome_completo', label: 'Cliente: Nome completo' },
  { value: 'cliente.nome', label: 'Cliente: Nome' },
  { value: 'cliente.nome_social_fantasia', label: 'Cliente: Nome social/Fantasia' },
  { value: 'cliente.cpf', label: 'Cliente: CPF' },
  { value: 'cliente.cnpj', label: 'Cliente: CNPJ' },
  { value: 'cliente.rg', label: 'Cliente: RG' },
  { value: 'cliente.tipo_pessoa', label: 'Cliente: Tipo de pessoa' },
  
  // Cliente - Contato
  { value: 'cliente.email', label: 'Cliente: E-mail' },
  { value: 'cliente.emails', label: 'Cliente: E-mails' },
  { value: 'cliente.telefone', label: 'Cliente: Telefone' },
  { value: 'cliente.celular', label: 'Cliente: Celular' },
  { value: 'cliente.ddd_celular', label: 'Cliente: DDD Celular' },
  { value: 'cliente.numero_celular', label: 'Cliente: Número Celular' },
  { value: 'cliente.telefone_residencial', label: 'Cliente: Telefone Residencial' },
  { value: 'cliente.ddd_residencial', label: 'Cliente: DDD Residencial' },
  { value: 'cliente.numero_residencial', label: 'Cliente: Número Residencial' },
  { value: 'cliente.telefone_comercial', label: 'Cliente: Telefone Comercial' },
  { value: 'cliente.ddd_comercial', label: 'Cliente: DDD Comercial' },
  { value: 'cliente.numero_comercial', label: 'Cliente: Número Comercial' },
  
  // Cliente - Dados Pessoais (PF)
  { value: 'cliente.data_nascimento', label: 'Cliente: Data de nascimento' },
  { value: 'cliente.genero', label: 'Cliente: Gênero' },
  { value: 'cliente.sexo', label: 'Cliente: Sexo' },
  { value: 'cliente.estado_civil', label: 'Cliente: Estado civil' },
  { value: 'cliente.nacionalidade', label: 'Cliente: Nacionalidade' },
  { value: 'cliente.nome_genitora', label: 'Cliente: Nome da genitora' },
  
  // Cliente - Endereço
  { value: 'cliente.endereco_completo', label: 'Cliente: Endereço completo' },
  { value: 'cliente.endereco_logradouro', label: 'Cliente: Logradouro' },
  { value: 'cliente.endereco_numero', label: 'Cliente: Número' },
  { value: 'cliente.endereco_complemento', label: 'Cliente: Complemento' },
  { value: 'cliente.endereco_bairro', label: 'Cliente: Bairro' },
  { value: 'cliente.endereco_cidade', label: 'Cliente: Cidade' },
  { value: 'cliente.endereco_uf', label: 'Cliente: UF' },
  { value: 'cliente.endereco_estado', label: 'Cliente: Estado' },
  { value: 'cliente.endereco_cep', label: 'Cliente: CEP' },
  
  // Cliente - Dados Empresariais (PJ)
  { value: 'cliente.inscricao_estadual', label: 'Cliente: Inscrição Estadual' },
  { value: 'cliente.data_abertura', label: 'Cliente: Data de abertura' },
  { value: 'cliente.data_fim_atividade', label: 'Cliente: Data fim atividade' },
  { value: 'cliente.ramo_atividade', label: 'Cliente: Ramo de atividade' },
  { value: 'cliente.porte', label: 'Cliente: Porte' },
  { value: 'cliente.cpf_responsavel', label: 'Cliente: CPF do responsável' },
  
  // Cliente - Outros
  { value: 'cliente.observacoes', label: 'Cliente: Observações' },
  
  // Parte Contrária
  { value: 'parte_contraria.nome', label: 'Parte Contrária: Nome' },
  
  // Segmento
  { value: 'segmento.nome', label: 'Segmento: Nome' },
  { value: 'segmento.slug', label: 'Segmento: Slug' },
  { value: 'segmento.descricao', label: 'Segmento: Descrição' },
  
  // Sistema
  { value: 'sistema.protocolo', label: 'Sistema: Protocolo' },
  { value: 'sistema.ip_cliente', label: 'Sistema: IP do cliente' },
  { value: 'sistema.user_agent', label: 'Sistema: User-Agent' },
  
  // Contrato
  { value: 'contrato.tipo_contrato', label: 'Contrato: Tipo' },
  { value: 'contrato.tipo_cobranca', label: 'Contrato: Tipo cobrança' },
  { value: 'contrato.status', label: 'Contrato: Status' },
  { value: 'contrato.cadastrado_em', label: 'Contrato: Data cadastro' },
];

export function getAvailableVariables(formularios: string[]): VariableOption[] {
  const formVars: VariableOption[] = (formularios ?? [])
    .filter((f) => typeof f === 'string' && f.trim())
    .map((f) => ({
      value: `formulario.${f.trim()}`,
      label: `Formulário: ${f.trim()}`,
    }));

  // evita duplicatas por value
  const map = new Map<string, VariableOption>();
  for (const v of [...BASE_VARIABLES, ...formVars]) map.set(v.value, v);
  return [...map.values()];
}

export function markdownToTiptapJSON(markdown: string): TiptapDocument {
  const text = markdown ?? '';
  if (!text) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
  }

  // Processar variáveis no formato {{variavel}}
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const parts: TiptapNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = variableRegex.exec(text)) !== null) {
    // Adicionar texto antes da variável
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push({ type: 'text', text: textBefore });
      }
    }

    // Adicionar nó de variável
    const variableKey = match[1].trim();
    if (variableKey) {
      parts.push({
        type: 'variable',
        attrs: { key: variableKey },
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Adicionar texto restante
  if (lastIndex < text.length) {
    const textAfter = text.substring(lastIndex);
    if (textAfter) {
      parts.push({ type: 'text', text: textAfter });
    }
  }

  // Se não encontrou variáveis, retornar como texto simples
  if (parts.length === 0) {
    parts.push({ type: 'text', text });
  }

  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: parts,
      },
    ],
  };
}

export function tiptapJSONToMarkdown(doc: TiptapDocument): string {
  const parts: string[] = [];

  const walk = (node: TiptapNode) => {
    // Processar nós de variável
    if (node.type === 'variable' && node.attrs?.key) {
      parts.push(`{{${node.attrs.key}}}`);
      return;
    }
    
    // Processar nós de texto
    if (typeof node.text === 'string') {
      parts.push(node.text);
    }
    
    // Processar conteúdo recursivamente
    if (Array.isArray(node.content)) {
      node.content.forEach(walk);
    }
  };

  doc.content.forEach(walk);
  return parts.join('');
}

export function validateMarkdownForForm(markdown: string): { valid: boolean; error?: string } {
  const text = markdown ?? '';
  if (!text.trim()) return { valid: true };

  const opens = (text.match(/\{\{/g) ?? []).length;
  const closes = (text.match(/\}\}/g) ?? []).length;
  if (opens !== closes) {
    return { valid: false, error: 'Markdown inválido: variáveis "{{...}}" não estão balanceadas.' };
  }

  return { valid: true };
}

// ─── Storage format types (TipTap-compatible JSON, stored in DB) ─────────────

export type StorageNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: StorageNode[];
  text?: string;
  marks?: { type: string }[];
};

export type StorageDocument = {
  type: 'doc';
  content: StorageNode[];
};

// ─── Converters: TipTap Storage JSON ↔ Plate.js Value ────────────────────────

function storageNodeToPlate(node: StorageNode): Descendant | null {
  if (node.type === 'text') {
    const marks: Record<string, boolean> = {};
    for (const m of node.marks ?? []) {
      if (m.type === 'bold') marks.bold = true;
      if (m.type === 'italic') marks.italic = true;
      if (m.type === 'underline') marks.underline = true;
      if (m.type === 'strike') marks.strikethrough = true;
    }
    return { text: node.text ?? '', ...marks };
  }

  if (node.type === 'variable') {
    return {
      type: 'variable',
      key: (node.attrs?.key as string) ?? '',
      children: [{ text: '' }],
    } as unknown as Descendant;
  }

  if (node.type === 'hardBreak') {
    return { text: '\n' };
  }

  const TYPE_MAP: Record<string, string> = {
    paragraph: 'p',
    blockquote: 'blockquote',
    bulletList: 'ul',
    orderedList: 'ol',
    listItem: 'li',
    horizontalRule: 'hr',
  };

  let plateType = TYPE_MAP[node.type] ?? node.type;

  if (node.type === 'heading' && node.attrs?.level) {
    plateType = `h${node.attrs.level}`;
  }

  const children = (node.content ?? [])
    .map(storageNodeToPlate)
    .filter((n): n is Descendant => n !== null);

  const element: Record<string, unknown> = {
    type: plateType,
    children: children.length > 0 ? children : [{ text: '' }],
  };

  if (node.attrs?.textAlign) {
    element.align = node.attrs.textAlign;
  }

  return element as unknown as Descendant;
}

function plateNodeToStorage(node: Descendant): StorageNode | null {
  if ('text' in node) {
    const n = node as Record<string, unknown>;
    if (n.text === '\n') return { type: 'hardBreak' };
    const marks: { type: string }[] = [];
    if (n.bold) marks.push({ type: 'bold' });
    if (n.italic) marks.push({ type: 'italic' });
    if (n.underline) marks.push({ type: 'underline' });
    if (n.strikethrough) marks.push({ type: 'strike' });
    return {
      type: 'text',
      text: n.text as string,
      ...(marks.length > 0 && { marks }),
    };
  }

  const n = node as Record<string, unknown>;
  const plateType = n.type as string;

  if (plateType === 'variable') {
    return {
      type: 'variable',
      attrs: { key: (n.key as string) ?? '' },
    };
  }

  const TYPE_MAP: Record<string, string> = {
    p: 'paragraph',
    blockquote: 'blockquote',
    hr: 'horizontalRule',
    ul: 'bulletList',
    ol: 'orderedList',
    li: 'listItem',
  };

  let storageType = TYPE_MAP[plateType] ?? plateType;
  const attrs: Record<string, unknown> = {};

  if (/^h[1-6]$/.test(plateType)) {
    storageType = 'heading';
    attrs.level = parseInt(plateType[1], 10);
  }

  const align = n.align;
  if (align) attrs.textAlign = align;

  const rawChildren = n.children as Descendant[] | undefined;
  const content = (rawChildren ?? [])
    .map(plateNodeToStorage)
    .filter((c): c is StorageNode => c !== null);

  return {
    type: storageType,
    ...(Object.keys(attrs).length > 0 && { attrs }),
    ...(content.length > 0 && { content }),
  };
}

export function tiptapJsonToPlateValue(doc: StorageDocument): Value {
  return (doc.content ?? [])
    .map(storageNodeToPlate)
    .filter((n): n is Descendant => n !== null) as Value;
}

export function plateValueToTiptapJson(value: Value): StorageDocument {
  return {
    type: 'doc',
    content: value
      .map(plateNodeToStorage)
      .filter((n): n is StorageNode => n !== null),
  };
}


