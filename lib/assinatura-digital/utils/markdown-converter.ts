// Type definitions for Tiptap JSON structure
export interface TiptapDocument {
  type: 'doc';
  content: TiptapNode[];
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

/**
 * Converts Markdown string to Tiptap JSON document
 */
export function markdownToTiptapJSON(markdown: string): TiptapDocument {
  const lines = markdown.split('\n');
  const content: TiptapNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd(); // Keep trailing spaces for lists, but trim end

    if (line.startsWith('### ')) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: parseInline(line.slice(4))
      });
      i++;
    } else if (line.startsWith('## ')) {
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: parseInline(line.slice(3))
      });
      i++;
    } else if (line.startsWith('# ')) {
      content.push({
        type: 'heading',
        attrs: { level: 1 },
        content: parseInline(line.slice(2))
      });
      i++;
    } else if (line.match(/^-\s/)) {
      const listItems: TiptapNode[] = [];
      while (i < lines.length && lines[i].match(/^-\s/)) {
        const itemText = lines[i].slice(2);
        listItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: parseInline(itemText)
          }]
        });
        i++;
      }
      content.push({
        type: 'bulletList',
        content: listItems
      });
    } else if (line.match(/^\d+\.\s/)) {
      const listItems: TiptapNode[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        const match = lines[i].match(/^(\d+)\.\s(.*)$/);
        if (match) {
          listItems.push({
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: parseInline(match[2])
            }]
          });
        }
        i++;
      }
      content.push({
        type: 'orderedList',
        content: listItems
      });
    } else if (line.startsWith('> ')) {
      const quoteContent: TiptapNode[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteContent.push({
          type: 'paragraph',
          content: parseInline(lines[i].slice(2))
        });
        i++;
      }
      content.push({
        type: 'blockquote',
        content: quoteContent
      });
    } else if (line === '---' || line === '***' || line === '___') {
      content.push({
        type: 'horizontalRule'
      });
      i++;
    } else if (line.trim() === '') {
      i++;
    } else {
      // Paragraph: collect consecutive non-special lines
      const paraLines: string[] = [];
      while (i < lines.length &&
             !lines[i].startsWith('#') &&
             !lines[i].match(/^-\s/) &&
             !lines[i].match(/^\d+\.\s/) &&
             !lines[i].startsWith('> ') &&
             (lines[i] !== '---' && lines[i] !== '***' && lines[i] !== '___') &&
             lines[i].trim() !== '') {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        const paraText = paraLines.join('\n');
        content.push({
          type: 'paragraph',
          content: parseInline(paraText)
        });
      }
    }
  }

  return { type: 'doc', content };
}

/**
 * Parses inline Markdown elements within text
 */
function parseInline(text: string): TiptapNode[] {
  const nodes: TiptapNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Find all possible matches
    const matches: Array<{
      index: number;
      length: number;
      type: string;
      content: string;
      attrs?: Record<string, any>;
    }> = [];

    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    if (boldMatch) {
      matches.push({
        index: boldMatch.index!,
        length: boldMatch[0].length,
        type: 'bold',
        content: boldMatch[1]
      });
    }

    // Italic: *text* (but not **)
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/);
    if (italicMatch) {
      matches.push({
        index: italicMatch.index!,
        length: italicMatch[0].length,
        type: 'italic',
        content: italicMatch[1]
      });
    }

    // Code: `text`
    const codeMatch = remaining.match(/`(.*?)`/);
    if (codeMatch) {
      matches.push({
        index: codeMatch.index!,
        length: codeMatch[0].length,
        type: 'code',
        content: codeMatch[1]
      });
    }

    // Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/~~(.*?)~~/);
    if (strikeMatch) {
      matches.push({
        index: strikeMatch.index!,
        length: strikeMatch[0].length,
        type: 'strike',
        content: strikeMatch[1]
      });
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      matches.push({
        index: linkMatch.index!,
        length: linkMatch[0].length,
        type: 'link',
        content: linkMatch[1],
        attrs: { href: linkMatch[2] }
      });
    }

    // Variable: {{key}}
    const varMatch = remaining.match(/\{\{([^}]+)\}\}/);
    if (varMatch) {
      matches.push({
        index: varMatch.index!,
        length: varMatch[0].length,
        type: 'variable',
        content: varMatch[1]
      });
    }

    // Hard break: \n
    const brIndex = remaining.indexOf('\n');
    if (brIndex !== -1) {
      matches.push({
        index: brIndex,
        length: 1,
        type: 'hardBreak',
        content: ''
      });
    }

    if (matches.length === 0) {
      // No more matches, add remaining as plain text
      nodes.push({ type: 'text', text: remaining });
      break;
    }

    // Sort by index and take the first (earliest)
    matches.sort((a, b) => a.index - b.index);
    const match = matches[0];

    // Add plain text before the match
    if (match.index > 0) {
      nodes.push({ type: 'text', text: remaining.slice(0, match.index) });
    }

    // Add the matched element
    if (match.type === 'variable') {
      nodes.push({
        type: 'variable',
        attrs: { key: match.content }
      });
    } else if (match.type === 'hardBreak') {
      nodes.push({ type: 'hardBreak' });
    } else {
      // Text with mark
      nodes.push({
        type: 'text',
        text: match.content,
        marks: [{ type: match.type, attrs: match.attrs }]
      });
    }

    // Remove processed part
    remaining = remaining.slice(match.index + match.length);
  }

  return nodes;
}

/**
 * Converts Tiptap JSON document to Markdown string
 */
export function tiptapJSONToMarkdown(json: TiptapDocument): string {
  return json.content.map(nodeToMarkdown).join('\n\n');
}

/**
 * Converts a Tiptap node to Markdown
 */
function nodeToMarkdown(node: TiptapNode): string {
  switch (node.type) {
    case 'heading':
      const level = node.attrs?.level || 1;
      const headingText = node.content ? node.content.map(inlineToMarkdown).join('') : '';
      return '#'.repeat(level) + ' ' + headingText;

    case 'paragraph':
      return node.content ? node.content.map(inlineToMarkdown).join('') : '';

    case 'bulletList':
      return node.content ?
        node.content.map(item =>
          '- ' + (item.content && item.content[0] && item.content[0].content ?
            item.content[0].content.map(inlineToMarkdown).join('') : '')
        ).join('\n') : '';

    case 'orderedList':
      return node.content ?
        node.content.map((item, index) =>
          `${index + 1}. ` + (item.content && item.content[0] && item.content[0].content ?
            item.content[0].content.map(inlineToMarkdown).join('') : '')
        ).join('\n') : '';

    case 'blockquote':
      return node.content ?
        node.content.map(para =>
          '> ' + (para.content ? para.content.map(inlineToMarkdown).join('') : '')
        ).join('\n') : '';

    case 'horizontalRule':
      return '---';

    case 'variable':
      return '{{' + (node.attrs?.key || '') + '}}';

    case 'text':
      return node.text || '';

    case 'hardBreak':
      return '\n';

    default:
      return '';
  }
}

/**
 * Converts inline Tiptap nodes to Markdown
 */
function inlineToMarkdown(node: TiptapNode): string {
  if (node.type === 'text') {
    let text = node.text || '';
    if (node.marks) {
      // Apply marks in reverse order to avoid conflicts
      const marks = [...node.marks].reverse();
      for (const mark of marks) {
        switch (mark.type) {
          case 'bold':
            text = '**' + text + '**';
            break;
          case 'italic':
            text = '*' + text + '*';
            break;
          case 'code':
            text = '`' + text + '`';
            break;
          case 'strike':
            text = '~~' + text + '~~';
            break;
          case 'link':
            text = '[' + text + '](' + (mark.attrs?.href || '') + ')';
            break;
        }
      }
    }
    return text;
  } else if (node.type === 'variable') {
    return '{{' + (node.attrs?.key || '') + '}}';
  } else if (node.type === 'hardBreak') {
    return '\n';
  }
  return '';
}
