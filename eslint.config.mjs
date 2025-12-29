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
]);

export default eslintConfig;
