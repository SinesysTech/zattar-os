import Mustache from 'mustache';
import type { PrestacaoContasContext } from '../types';

// Output é Markdown, não HTML — evitamos escape de caracteres especiais
Mustache.escape = (text: string) => String(text);

export function resolveTemplate(
  template: string,
  context: PrestacaoContasContext,
): string {
  return Mustache.render(template, context);
}
