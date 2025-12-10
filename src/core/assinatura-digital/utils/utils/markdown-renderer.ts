/**
 * Utilitário para renderização segura de Markdown com variáveis
 *
 * Este módulo fornece funções para processar conteúdo Markdown de templates,
 * substituindo variáveis {{...}} por valores reais e aplicando sanitização
 * de segurança.
 *
 * **Funcionalidades:**
 * - Substituição de variáveis usando infraestrutura existente (parseRichTextContent)
 * - Sanitização contra XSS e injeção de código
 * - Configuração de plugins react-markdown (remark-gfm, rehype-raw, rehype-sanitize)
 * - Classes Tailwind responsivas para estilização
 *
 * **Uso:**
 * ```typescript
 * import { renderMarkdownWithVariables, getMarkdownPlugins, getMarkdownStyles } from '@/lib/utils/markdown-renderer';
 *
 * const content = renderMarkdownWithVariables(template.conteudo_markdown, dadosGeracao);
 * const plugins = getMarkdownPlugins();
 * const styles = getMarkdownStyles();
 *
 * <div className={styles.container}>
 *   <ReactMarkdown
 *     className={styles.prose}
 *     remarkPlugins={plugins.remarkPlugins}
 *     rehypePlugins={plugins.rehypePlugins}
 *   >
 *     {content}
 *   </ReactMarkdown>
 * </div>
 * ```
 *
 * @module lib/utils/markdown-renderer
 */

import { parseRichTextContent } from '@/lib/assinatura-digital/utils/rich-text-parser';
import { DadosGeracao } from '@/types/assinatura-digital/template.types';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize';
import type { Pluggable } from 'unified';

/**
 * Renderiza conteúdo Markdown substituindo variáveis {{...}} por valores reais.
 *
 * Esta função reutiliza `parseRichTextContent` para garantir consistência com geração de PDF.
 * Todas as variáveis são formatadas automaticamente:
 * - CPF/CNPJ com máscara (123.456.789-00)
 * - Datas em pt-BR (01/01/2024)
 * - Telefone com máscara ((11) 98765-4321)
 * - CEP com máscara (12345-678)
 * - Coordenadas GPS com 6 casas decimais e símbolo de grau (-23.550500°)
 *
 * **Variáveis suportadas incluem:**
 * - Cliente: nome_completo, cpf, email, telefone, endereço, etc.
 * - Ação: dados específicos de Apps ou Trabalhista
 * - Sistema: data_geracao, ip_cliente, user_agent, numero_contrato, protocolo
 * - Assinatura: assinatura_base64, foto_base64, latitude, longitude
 * - Escritório: nome, razao_social, oab, endereço, telefone, email
 *
 * **Estratégias de fallback:**
 * - `'empty'` (padrão): Variáveis sem valor são substituídas por string vazia
 * - `'placeholder'`: Variáveis sem valor mantém o placeholder {{variavel}}
 *
 * @param markdownContent - Conteúdo Markdown com variáveis {{...}}
 * @param dadosGeracao - Dados para substituição (cliente, ação, sistema, etc.)
 * @param options - Opções de renderização
 * @returns String Markdown com variáveis substituídas
 *
 * @example
 * ```typescript
 * const markdown = '# Contrato\n\nCliente: {{cliente.nome_completo}}\nCPF: {{cliente.cpf}}\nAssinado em {{assinatura.latitude}}, {{assinatura.longitude}} usando {{sistema.user_agent}}';
 * const rendered = renderMarkdownWithVariables(markdown, dadosGeracao);
 * // Resultado: '# Contrato\n\nCliente: João Silva\nCPF: 123.456.789-00\nAssinado em -23.550500°, -46.633300° usando Mozilla/5.0...'
 * ```
 */
export function renderMarkdownWithVariables(
  markdownContent: string,
  dadosGeracao: DadosGeracao,
  options?: {
    fallbackStrategy?: 'empty' | 'placeholder';
    preserveNewlines?: boolean;
  }
): string {
  // Validação de entrada
  if (!markdownContent || typeof markdownContent !== 'string') {
    return '';
  }

  // Substituição de variáveis usando infraestrutura existente
  let processed = parseRichTextContent(
    markdownContent,
    dadosGeracao,
    options?.fallbackStrategy || 'empty'
  );

  // Converter data URLs de imagens em tags <img> do Markdown
  // Isso evita que assinaturas e fotos apareçam como texto base64
  processed = processed.replace(
    /(data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+)/g,
    (match) => {
      // Se já está dentro de uma tag ![](data:...), não substituir
      const beforeMatch = processed.substring(Math.max(0, processed.indexOf(match) - 3), processed.indexOf(match));
      if (beforeMatch.includes('](')) {
        return match;
      }
      // Converter para sintaxe Markdown de imagem
      return `![Imagem](${match})`;
    }
  );

  // Preservação de formatação (quebras de linha duplas)
  if (options?.preserveNewlines) {
    // Garantir que quebras de linha duplas são mantidas
    processed = processed.replace(/\n\n+/g, '\n\n');
  }

  return processed;
}

/**
 * Sanitiza conteúdo Markdown removendo padrões perigosos de XSS.
 *
 * **IMPORTANTE:** Esta é uma sanitização **básica** - a sanitização principal
 * é feita por `rehype-sanitize` durante a renderização. Esta função é uma
 * camada adicional de segurança.
 *
 * **Padrões removidos:**
 * - Tags perigosas: `<script>`, `<iframe>`, `<object>`, `<embed>`
 * - Atributos de eventos: `onclick`, `onerror`, `onload`, etc.
 * - Protocolos perigosos: `javascript:`, `data:text/html`, `vbscript:`
 *
 * **Markdown válido é preservado:** Sintaxe Markdown legítima (headings, listas,
 * links, etc.) não é afetada.
 *
 * **WARNING:** Esta função não substitui validação no backend. Sempre valide
 * entrada do usuário no servidor.
 *
 * @param content - Conteúdo Markdown a ser sanitizado
 * @returns String sanitizada
 *
 * @example
 * ```typescript
 * const unsafe = '<script>alert("XSS")</script># Título';
 * const safe = sanitizeMarkdown(unsafe);
 * // Resultado: '# Título' (script removido)
 * ```
 */
export function sanitizeMarkdown(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Detectar se contém HTML-like tags antes de sanitizar
  // Isso reduz falsos positivos em blocos de código que contenham exemplos de HTML
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);

  // Se não contém tags HTML, retornar conteúdo sem modificação
  if (!hasHtmlTags) {
    return content;
  }

  let sanitized = content;

  // Remover tags perigosas (case-insensitive)
  const dangerousTags = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
  ];

  dangerousTags.forEach((regex) => {
    sanitized = sanitized.replace(regex, '');
  });

  // Remover atributos de eventos (onclick, onerror, etc.)
  // Suporta valores entre aspas simples, duplas, ou sem aspas
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, '');

  // Remover protocolos perigosos
  const dangerousProtocols = [
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
  ];

  dangerousProtocols.forEach((regex) => {
    sanitized = sanitized.replace(regex, '');
  });

  return sanitized;
}

/**
 * Retorna configuração de plugins para react-markdown.
 *
 * **Plugins incluídos:**
 *
 * 1. **remark-gfm** (GitHub Flavored Markdown):
 *    - Tabelas (| Header | Header |)
 *    - Listas de tarefas (- [ ] e - [x])
 *    - Strikethrough (~~texto~~)
 *    - Autolinks
 *
 * 2. **rehype-raw**:
 *    - Permite HTML inline no Markdown
 *    - Necessário para alguns casos de uso avançados
 *
 * 3. **rehype-sanitize**:
 *    - Sanitização de segurança contra XSS
 *    - Schema customizado balanceando segurança e funcionalidade
 *    - Remove scripts, event handlers, protocolos perigosos
 *    - Permite HTML seguro (divs, spans, formatação, tabelas)
 *
 * 4. **rehype-external-links** (custom):
 *    - Adiciona rel="noopener noreferrer" a links com target="_blank"
 *    - Previne tabnabbing e vulnerabilidades de segurança
 *
 * **Segurança:**
 * Esta configuração é otimizada para segurança sem sacrificar funcionalidade.
 * Atributos perigosos (`on*`) e protocolos inseguros (`javascript:`, `data:`)
 * são bloqueados automaticamente. Links externos são protegidos contra tabnabbing.
 *
 * @returns Objeto com arrays de plugins para remark e rehype
 *
 * @example
 * ```tsx
 * const plugins = getMarkdownPlugins();
 * <ReactMarkdown
 *   remarkPlugins={plugins.remarkPlugins}
 *   rehypePlugins={plugins.rehypePlugins}
 * >
 *   {content}
 * </ReactMarkdown>
 * ```
 */
export function getMarkdownPlugins(): {
  remarkPlugins: Pluggable[];
  rehypePlugins: Pluggable[];
} {
  // Schema customizado de sanitização
  const customSanitizeSchema: RehypeSanitizeOptions = {
    ...defaultSchema,
    tagNames: [
      ...(defaultSchema.tagNames || []),
      // Tags HTML seguras para estilização
      'div',
      'span',
      'br',
      'strong',
      'em',
      'u',
      // Tags de tabela (já incluídas no GFM, mas garantindo)
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    attributes: {
      ...defaultSchema.attributes,
      // Atributos permitidos para estilização
      '*': ['className', 'id'],
      // Links com protocolos seguros (target e rel permitidos)
      a: ['href', 'title', 'target', 'rel'],
      // Imagens com atributos de acessibilidade
      img: ['src', 'alt', 'title', 'width', 'height'],
      // Tabelas
      td: ['align', 'colSpan', 'rowSpan'],
      th: ['align', 'colSpan', 'rowSpan', 'scope'],
    },
    protocols: {
      href: ['http', 'https', 'mailto'],
      src: ['http', 'https', 'data'], // Permitir data URLs para assinaturas e fotos
    },
  };

  // Plugin customizado para adicionar rel="noopener noreferrer" a links externos
  const rehypeExternalLinks = () => {
    return (tree: { type: string; tagName?: string; properties?: Record<string, unknown>; children?: unknown[] }) => {
      const visit = (node: { type: string; tagName?: string; properties?: Record<string, unknown>; children?: unknown[] }) => {
        if (node.type === 'element' && node.tagName === 'a') {
          const props = node.properties || {};

          // Se o link tem target="_blank", adicionar rel seguro
          if (props.target === '_blank') {
            const existingRel = typeof props.rel === 'string' ? props.rel : '';
            const relValues = new Set(existingRel.split(' ').filter(Boolean));

            // Adicionar noopener e noreferrer
            relValues.add('noopener');
            relValues.add('noreferrer');

            node.properties = {
              ...props,
              rel: Array.from(relValues).join(' '),
            };
          }
        }

        // Visitar filhos recursivamente
        if (node.children) {
          node.children.forEach((child) => visit(child as typeof node));
        }
      };

      visit(tree);
    };
  };

  return {
    remarkPlugins: [
      // GitHub Flavored Markdown
      remarkGfm,
    ],
    rehypePlugins: [
      // Permite HTML inline
      rehypeRaw,
      // Sanitização com schema customizado
      [rehypeSanitize, customSanitizeSchema],
      // Adicionar rel="noopener noreferrer" a links externos
      rehypeExternalLinks,
    ],
  };
}

/**
 * Retorna classes Tailwind para estilização de Markdown.
 *
 * **Classes incluídas:**
 *
 * 1. **Container** (`container`):
 *    - Largura total (`w-full`)
 *    - Padding horizontal responsivo (`px-4 md:px-6 lg:px-8`)
 *    - Padding vertical (`py-6`)
 *
 * 2. **Prose** (`prose`):
 *    - Estilo base do Tailwind Typography
 *    - Tema de cores (`prose-slate`)
 *    - Suporte a modo escuro (`dark:prose-invert`)
 *    - Estilização de elementos:
 *      - Headings: negrito, espaçamento ajustado
 *      - Links: azul, sem sublinhado (sublinha no hover)
 *      - Código: background cinza, bordas arredondadas
 *      - Blocos de código: fundo escuro, texto claro
 *      - Imagens: bordas arredondadas, sombra
 *      - Tabelas: bordas colapsadas, headers com background
 *    - Tamanhos responsivos (`prose-sm md:prose-base lg:prose-lg`)
 *
 * **Nota:** Requer `@tailwindcss/typography` plugin instalado.
 *
 * @returns Objeto com classes para container e conteúdo prose
 *
 * @example
 * ```tsx
 * const styles = getMarkdownStyles();
 * <div className={styles.container}>
 *   <ReactMarkdown className={styles.prose}>
 *     {content}
 *   </ReactMarkdown>
 * </div>
 * ```
 *
 * **Customização:**
 * As classes podem ser customizadas conforme necessidade do projeto.
 * Para alterar o tema de cores, substitua `prose-slate` por `prose-gray`,
 * `prose-zinc`, `prose-stone`, etc.
 */
export function getMarkdownStyles(): {
  container: string;
  prose: string;
} {
  return {
    container: 'w-full max-w-none px-4 md:px-6 lg:px-8 py-6',
    prose: [
      // Base
      'prose',
      'prose-slate',
      'dark:prose-invert',
      'max-w-none', // Remover limite de largura

      // Tamanhos responsivos
      'prose-sm',
      'md:prose-base',
      'lg:prose-lg',

      // Texto justificado (para documentos formais)
      'text-justify',

      // Headings
      'prose-headings:font-bold',
      'prose-headings:tracking-tight',
      'prose-headings:mb-4', // Margem inferior em headings
      'prose-headings:mt-6', // Margem superior em headings

      // Parágrafos (espaçamento e altura de linha)
      'prose-p:mb-6',        // Margem inferior de parágrafos (24px - maior espaçamento entre parágrafos)
      'prose-p:leading-relaxed', // Altura de linha relaxada (1.625 - espaçamento intra-parágrafo)

      // Links
      'prose-a:text-blue-600',
      'prose-a:no-underline',
      'prose-a:hover:underline',

      // Formatação
      'prose-strong:font-bold',

      // Código inline
      'prose-code:bg-slate-100',
      'prose-code:px-1',
      'prose-code:rounded',
      'prose-code:text-slate-900',
      'dark:prose-code:bg-slate-800',
      'dark:prose-code:text-slate-100',

      // Blocos de código
      'prose-pre:bg-slate-900',
      'prose-pre:text-slate-50',
      'dark:prose-pre:bg-slate-950',

      // Imagens
      'prose-img:rounded-lg',
      'prose-img:shadow-md',

      // Tabelas
      'prose-table:border-collapse',
      'prose-th:bg-slate-100',
      'prose-th:border',
      'prose-th:border-slate-300',
      'prose-td:border',
      'prose-td:border-slate-300',
      'dark:prose-th:bg-slate-800',
      'dark:prose-th:border-slate-600',
      'dark:prose-td:border-slate-600',

      // Listas
      'prose-ul:mb-4',
      'prose-ol:mb-4',
      'prose-li:mb-2',
    ].join(' '),
  };
}

/**
 * Valida conteúdo Markdown e retorna erros/warnings.
 *
 * **OPCIONAL:** Esta função pode ser usada no admin UI para feedback durante
 * criação de templates. Não é necessária para renderização (sanitização já
 * protege).
 *
 * **Validações:**
 * - Verificar se contém pelo menos um placeholder `{{...}}` (warning)
 * - Verificar tamanho máximo (warning se > 50KB)
 * - Detectar HTML potencialmente perigoso (error)
 *
 * **Retorno:**
 * - `valid`: `false` se houver errors bloqueantes
 * - `errors`: Problemas que impedem uso do conteúdo
 * - `warnings`: Problemas que não impedem uso mas devem ser revisados
 *
 * @param content - Conteúdo Markdown a ser validado
 * @returns Objeto com status de validação e mensagens
 *
 * @example
 * ```typescript
 * const result = validateMarkdownContent(template.conteudo_markdown);
 * if (!result.valid) {
 *   console.error('Erros:', result.errors);
 * }
 * if (result.warnings.length > 0) {
 *   console.warn('Avisos:', result.warnings);
 * }
 * ```
 */
export function validateMarkdownContent(content: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validação de entrada
  if (!content || typeof content !== 'string') {
    errors.push('Conteúdo Markdown está vazio ou inválido');
    return { valid: false, errors, warnings };
  }

  // Verificar se contém placeholders
  const hasPlaceholders = /\{\{[^}]+\}\}/.test(content);
  if (!hasPlaceholders) {
    warnings.push(
      'Conteúdo não contém placeholders {{...}}. Template será estático.'
    );
  }

  // Verificar tamanho máximo (50KB)
  // Usar Buffer.byteLength em Node/SSR, fallback para string length * 2 em browsers
  let sizeInBytes: number;
  try {
    // Tentar usar Buffer (Node.js/SSR)
    sizeInBytes = Buffer.byteLength(content, 'utf8');
  } catch {
    // Fallback para browsers: estimativa usando string length * 2 (aproximação para UTF-8)
    sizeInBytes = content.length * 2;
  }
  const sizeInKB = sizeInBytes / 1024;
  if (sizeInKB > 50) {
    warnings.push(
      `Conteúdo é muito grande (${sizeInKB.toFixed(1)}KB). Considere dividir em múltiplos templates.`
    );
  }

  // Detectar HTML potencialmente perigoso
  const dangerousPatterns = [
    { pattern: /<script/i, message: 'Contém tag <script> - removida automaticamente' },
    { pattern: /<iframe/i, message: 'Contém tag <iframe> - removida automaticamente' },
    { pattern: /on\w+\s*=/i, message: 'Contém event handlers (onclick, etc.) - removidos automaticamente' },
  ];

  dangerousPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      errors.push(message);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * TESTES SUGERIDOS (para fase futura):
 *
 * 1. **Substituição de variáveis:**
 *    - Todas as categorias: cliente, ação, sistema, escritório
 *    - Formatação automática: CPF, CNPJ, datas, telefone, CEP
 *    - Fallback strategies: 'empty' vs 'placeholder'
 *
 * 2. **Sanitização:**
 *    - Scripts maliciosos (<script>alert('XSS')</script>)
 *    - Event handlers (onclick="malicious()")
 *    - Protocolos perigosos (javascript:, data:text/html)
 *    - HTML válido preservado (<strong>, <em>, <table>)
 *
 * 3. **Edge cases:**
 *    - Conteúdo vazio ou null
 *    - Variáveis inválidas ({{variavel.inexistente}})
 *    - HTML malicioso complexo (nested tags)
 *    - Markdown válido com HTML inline
 *
 * 4. **Validação:**
 *    - Conteúdo sem placeholders (warning)
 *    - Conteúdo muito grande (warning)
 *    - HTML perigoso (error)
 *
 * 5. **Plugins:**
 *    - remark-gfm: tabelas, listas de tarefas, strikethrough
 *    - rehype-raw: HTML inline permitido
 *    - rehype-sanitize: XSS bloqueado
 *
 * 6. **Estilos:**
 *    - Classes Tailwind aplicadas corretamente
 *    - Responsividade (prose-sm, md:prose-base, lg:prose-lg)
 *    - Modo escuro (dark:prose-invert)
 */