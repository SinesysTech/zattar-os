import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variable: {
      insertVariable: (options: { key: string }) => ReturnType;
    };
  }
}

export const Variable = Node.create({
  name: 'variable',

  group: 'inline',

  atom: true,

  selectable: false,

  inline: true,

  addAttributes() {
    return {
      key: {
        default: null,
        parseHTML: element => element.getAttribute('data-variable-key'),
        renderHTML: attributes => {
          if (!attributes.key) {
            return {};
          }
          return {
            'data-variable-key': attributes.key,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable-key]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'variable' }), 0];
  },

  renderText({ node }) {
    return `{{${node.attrs.key}}}`;
  },

  addCommands() {
    return {
      insertVariable: (options: { key: string }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});