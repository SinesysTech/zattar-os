/**
 * Testes Unitários para Themes
 *
 * Valida configurações de tema
 */

import { DEFAULT_THEME, THEMES, type ThemeType } from '@/lib/themes';

describe('Themes - Unit Tests', () => {
  describe('DEFAULT_THEME', () => {
    it('deve ter preset "default"', () => {
      expect(DEFAULT_THEME.preset).toBe('default');
    });

    it('deve ter radius "default"', () => {
      expect(DEFAULT_THEME.radius).toBe('default');
    });

    it('deve ter scale "none"', () => {
      expect(DEFAULT_THEME.scale).toBe('none');
    });

    it('deve ter contentLayout "default"', () => {
      expect(DEFAULT_THEME.contentLayout).toBe('default');
    });

    it('deve ter todas as propriedades do tipo ThemeType', () => {
      const theme: ThemeType = DEFAULT_THEME;
      expect(theme).toHaveProperty('preset');
      expect(theme).toHaveProperty('radius');
      expect(theme).toHaveProperty('scale');
      expect(theme).toHaveProperty('contentLayout');
    });

    it('não deve ter propriedades extras', () => {
      const keys = Object.keys(DEFAULT_THEME);
      expect(keys).toHaveLength(4);
      expect(keys).toEqual(['preset', 'radius', 'scale', 'contentLayout']);
    });
  });

  describe('THEMES', () => {
    it('deve ser um array não vazio', () => {
      expect(Array.isArray(THEMES)).toBe(true);
      expect(THEMES.length).toBeGreaterThan(0);
    });

    it('deve conter tema "default"', () => {
      const defaultTheme = THEMES.find(t => t.value === 'default');
      expect(defaultTheme).toBeDefined();
    });

    it('tema default deve ter estrutura correta', () => {
      const defaultTheme = THEMES.find(t => t.value === 'default');

      expect(defaultTheme).toHaveProperty('name', 'default');
      expect(defaultTheme).toHaveProperty('value', 'default');
      expect(defaultTheme).toHaveProperty('colors');
      expect(Array.isArray(defaultTheme?.colors)).toBe(true);
    });

    it('tema default deve ter cores HSL válidas', () => {
      const defaultTheme = THEMES.find(t => t.value === 'default');

      expect(defaultTheme?.colors).toHaveLength(2);
      expect(defaultTheme?.colors[0]).toBe('hsl(0, 0%, 0%)'); // Preto
      expect(defaultTheme?.colors[1]).toBe('hsl(0, 0%, 100%)'); // Branco
    });

    it('todos os temas devem ter propriedades obrigatórias', () => {
      THEMES.forEach(theme => {
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('value');
        expect(theme).toHaveProperty('colors');
        expect(typeof theme.name).toBe('string');
        expect(typeof theme.value).toBe('string');
        expect(Array.isArray(theme.colors)).toBe(true);
      });
    });

    it('todos os temas devem ter cores válidas', () => {
      THEMES.forEach(theme => {
        expect(theme.colors.length).toBeGreaterThan(0);
        theme.colors.forEach(color => {
          expect(typeof color).toBe('string');
          expect(color).toMatch(/^hsl\(/); // Deve começar com hsl(
        });
      });
    });

    it('valores de temas devem ser únicos', () => {
      const values = THEMES.map(t => t.value);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });

    it('nomes de temas devem ser não vazios', () => {
      THEMES.forEach(theme => {
        expect(theme.name.length).toBeGreaterThan(0);
        expect(theme.value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integração', () => {
    it('DEFAULT_THEME.preset deve corresponder a um tema em THEMES', () => {
      const matchingTheme = THEMES.find(t => t.value === DEFAULT_THEME.preset);
      expect(matchingTheme).toBeDefined();
    });

    it('deve ser possível aplicar DEFAULT_THEME', () => {
      const applyTheme = (theme: ThemeType) => {
        return {
          preset: theme.preset,
          radius: theme.radius,
          scale: theme.scale,
          contentLayout: theme.contentLayout,
        };
      };

      const applied = applyTheme(DEFAULT_THEME);
      expect(applied).toEqual(DEFAULT_THEME);
    });
  });

  describe('Tipo ThemeType', () => {
    it('deve aceitar tema válido', () => {
      const validTheme: ThemeType = {
        preset: 'default',
        radius: 'default',
        scale: 'none',
        contentLayout: 'default',
      };

      expect(validTheme.preset).toBe('default');
    });

    it('deve ter todas as propriedades obrigatórias', () => {
      const theme: ThemeType = DEFAULT_THEME;

      // TypeScript garante que todas as propriedades existem
      expect(theme.preset).toBeDefined();
      expect(theme.radius).toBeDefined();
      expect(theme.scale).toBeDefined();
      expect(theme.contentLayout).toBeDefined();
    });
  });

  describe('Validação de Cores HSL', () => {
    it('cores default devem ser preto e branco', () => {
      const defaultTheme = THEMES.find(t => t.value === 'default');

      // Preto: hsl(0, 0%, 0%)
      expect(defaultTheme?.colors[0]).toContain('0%'); // Lightness 0%

      // Branco: hsl(0, 0%, 100%)
      expect(defaultTheme?.colors[1]).toContain('100%'); // Lightness 100%
    });

    it('cores devem estar em formato HSL válido', () => {
      const hslRegex = /^hsl\(\d+,\s*\d+%,\s*\d+%\)$/;

      THEMES.forEach(theme => {
        theme.colors.forEach(color => {
          expect(color).toMatch(hslRegex);
        });
      });
    });
  });
});
