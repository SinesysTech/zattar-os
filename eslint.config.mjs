import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Auto-generated service worker files (next-pwa)
    "public/sw.js",
    "public/workbox-*.js",
    "public/fallback-*.js",
    // Library folder (component library, not part of main app)
    "library/**",
  ]),
  {
    rules: {
      // Permitir variáveis não utilizadas com prefixo underscore (ex: _description, _program)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Prevenir imports diretos de caminhos internos de features
      // NOTA: Imports relativos dentro da mesma feature são permitidos (ex: ../hooks/use-x)
      // Mas imports absolutos de caminhos internos de outras features são bloqueados
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Bloqueia imports absolutos de caminhos internos de features
              // Exemplo proibido: import { X } from '@/features/partes/components/...'
              // Exemplo permitido: import { X } from '@/features/partes'
              // Exemplo permitido (dentro da feature): import { X } from '../hooks/...'
              group: [
                "@/features/*/components/**",
                "@/features/*/hooks/**",
                "@/features/*/actions/**",
                "@/features/*/utils/**",
                "@/features/*/types/**",
                "@/features/*/domain.ts",
                "@/features/*/service.ts",
                "@/features/*/repository.ts",
              ],
              message:
                "Use barrel exports (@/features/{modulo}) instead of direct internal paths. For imports within the same feature, use relative paths (../hooks/...). Example: import { Component } from '@/features/partes'",
            },
            {
              // Bloqueia imports de pastas legadas em src/ (exceto em backend/ e core/)
              group: ["**/backend/**", "@/core/**", "@/app/_lib/**"],
              message:
                "Legacy imports are not allowed in src/. Use features from @/features/{modulo} instead. If you need backend functionality, it should be migrated to a feature module.",
            },
          ],
        },
      ],
    },
  },
  // Scripts utilitários (não fazem parte do bundle do app) — permitir usos pragmáticos de `any` e padrões Node.
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-assign-module-variable": "off",
      "prefer-const": "off",
    },
  },
  // Endpoints de recovery (debug/diagnóstico) — permitem parsing flexível de JSON.
  {
    files: ["src/app/api/captura/recovery/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Serviços de recovery/análise (internos) — permitir `any` para lidar com payloads heterogêneos.
  {
    files: ["src/features/captura/services/recovery/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Governança do Design System: impedir uso direto do Badge em features.
  // Use SemanticBadge / wrappers semânticos para manter consistência.
  {
    files: ["src/features/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/components/ui/badge",
              message:
                "Do not import Badge directly in feature code. Use SemanticBadge (or specialized semantic wrappers) so badge styles remain consistent across the app.",
            },
          ],
        },
      ],
    },
  },
  // Governança do Design System (Tipografia):
  // Para evitar estilos ad hoc, obrigamos o uso de `Typography.*` (ou classes `typography-*`)
  // nas telas/componentes de Usuários (escopo inicial, para não gerar milhares de erros no repo).
  {
    files: [
      "src/features/usuarios/**/*.{ts,tsx}",
      "src/app/**/usuarios/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='h1']",
          message:
            "Não use <h1> direto. Use `Typography.H1` (ou `className=\"typography-h1\"`).",
        },
        {
          selector: "JSXOpeningElement[name.name='h2']",
          message:
            "Não use <h2> direto. Use `Typography.H2` (ou `className=\"typography-h2\"`).",
        },
        {
          selector: "JSXOpeningElement[name.name='h3']",
          message:
            "Não use <h3> direto. Use `Typography.H3` (ou `className=\"typography-h3\"`).",
        },
        {
          selector: "JSXOpeningElement[name.name='h4']",
          message:
            "Não use <h4> direto. Use `Typography.H4` (ou `className=\"typography-h4\"`).",
        },
        {
          selector: "JSXOpeningElement[name.name='h5']",
          message:
            "Não use <h5> direto. Use `Typography.H4` (ou `className=\"typography-h4\"`) para títulos menores.",
        },
        {
          selector: "JSXOpeningElement[name.name='h6']",
          message:
            "Não use <h6> direto. Use `Typography.H4` (ou `className=\"typography-h4\"`) para títulos menores.",
        },
      ],
    },
  },
]);

export default eslintConfig;
