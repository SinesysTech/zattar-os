'use client';

import emojiMartData from '@emoji-mart/data';
import type { EmojiMartData } from '@platejs/emoji';
import { EmojiInputPlugin, EmojiPlugin } from '@platejs/emoji/react';

import { EmojiInputElement } from '@/components/editor/plate-ui/emoji-node';

const emojiData = (
  (emojiMartData as unknown as { default?: EmojiMartData }).default ??
    (emojiMartData as unknown)
) as EmojiMartData;

export const EmojiKit = [
  EmojiPlugin.configure({
    options: {
      data: emojiData,
      i18n: {
        search: 'Buscar',
        clear: 'Limpar',
        pick: 'Escolha um emoji',
        searchResult: 'Resultados da busca',
        searchNoResultsTitle: 'Nenhum emoji encontrado',
        searchNoResultsSubtitle: 'Tente outro termo de busca.',
        categories: {
          activity: 'Atividade',
          custom: 'Personalizados',
          flags: 'Bandeiras',
          foods: 'Comidas e bebidas',
          frequent: 'Frequentes',
          nature: 'Natureza',
          objects: 'Objetos',
          people: 'Pessoas',
          places: 'Lugares',
          symbols: 'Símbolos',
        },
      },
    },
  }),
  EmojiInputPlugin.withComponent(EmojiInputElement),
];
