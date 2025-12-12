export type VariableOption = {
  value: string;
  label: string;
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
  { value: 'cliente.nome_completo', label: 'Cliente: Nome completo' },
  { value: 'cliente.cpf', label: 'Cliente: CPF' },
  { value: 'cliente.email', label: 'Cliente: E-mail' },
  { value: 'cliente.telefone', label: 'Cliente: Telefone' },
  { value: 'cliente.endereco_completo', label: 'Cliente: Endereço completo' },
  { value: 'segmento.nome', label: 'Segmento: Nome' },
  { value: 'sistema.protocolo', label: 'Sistema: Protocolo' },
  { value: 'sistema.ip_cliente', label: 'Sistema: IP do cliente' },
  { value: 'sistema.user_agent', label: 'Sistema: User-Agent' },
  { value: 'acao.data_inicio', label: 'Ação: Data início' },
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
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: text ? [{ type: 'text', text }] : [],
      },
    ],
  };
}

export function tiptapJSONToMarkdown(doc: TiptapDocument): string {
  const parts: string[] = [];

  const walk = (node: TiptapNode) => {
    if (typeof node.text === 'string') parts.push(node.text);
    if (Array.isArray(node.content)) node.content.forEach(walk);
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


