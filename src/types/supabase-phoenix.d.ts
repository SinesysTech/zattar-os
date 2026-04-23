/**
 * Type shim para subpaths profundos de @supabase/phoenix usados pelo @supabase/realtime-js.
 *
 * Bug upstream: o @supabase/realtime-js (>=2.103.0, ainda presente em 2.104.1) emite
 * declarações .d.ts com imports profundos:
 *   - import("@supabase/phoenix/priv/static/types/timer").default
 *   - import("@supabase/phoenix/priv/static/types/types").Vsn (Encode, Decode, etc.)
 *
 * Porém o package.json do @supabase/phoenix@0.4.x só expõe a raiz no campo "exports",
 * não os subpaths acima. Com `resolvePackageJsonExports: true` (obrigatório para Next 16),
 * o TypeScript respeita o encapsulamento Node.js e bloqueia a resolução desses caminhos,
 * propagando TS2307 para todo arquivo consumidor de @supabase/supabase-js no editor.
 *
 * Como `@supabase/phoenix` raiz já re-exporta `Timer` (named) e todos os tipos
 * (`Vsn`, `Encode`, `Decode`, `HeartbeatCallback`, `ChannelBindingCallback`, etc.) via
 * `priv/static/types/index.d.ts`, este shim apenas redireciona os subpaths para a raiz,
 * preservando assinaturas públicas idênticas.
 *
 * Remover quando o upstream:
 *  - Substituir os deep imports por imports via root no .d.ts emitido, OU
 *  - Declarar os subpaths em "exports" do @supabase/phoenix.
 */

declare module '@supabase/phoenix/priv/static/types/timer' {
  import { Timer } from '@supabase/phoenix';
  export default Timer;
}

declare module '@supabase/phoenix/priv/static/types/types' {
  export * from '@supabase/phoenix';
}
