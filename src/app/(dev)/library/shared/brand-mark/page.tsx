import { BrandMark } from '@/components/shared/brand-mark'
import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
  DemoLabel,
  UsageInProduction,
} from '../../_components/demo-section'

export default function BrandMarkPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Shared"
        title="BrandMark"
        description="Logo Zattar reutilizável. Cobre 6 padrões de uso (auth, sidebar, portal, header público, assinatura digital). 3 variantes (auto/light/dark) × 5 tamanhos (sm/md/lg/xl/custom) + opções para link e collapsible."
      />

      <DemoSection
        title="Variantes"
        description="auto faz swap automático light/dark via Tailwind. light/dark forçam uma versão (úteis quando o container já é dark)."
      >
        <div className="grid gap-6 sm:grid-cols-3">
          <DemoCanvas>
            <DemoLabel>variant=&quot;auto&quot;</DemoLabel>
            <BrandMark variant="auto" size="md" />
          </DemoCanvas>
          <DemoCanvas>
            <DemoLabel>variant=&quot;light&quot;</DemoLabel>
            <BrandMark variant="light" size="md" />
          </DemoCanvas>
          <DemoCanvas background="dark">
            <DemoLabel>variant=&quot;dark&quot;</DemoLabel>
            <BrandMark variant="dark" size="md" />
          </DemoCanvas>
        </div>
      </DemoSection>

      <DemoSection
        title="Tamanhos"
        description="sm=h-8 · md=h-10 · lg=h-16 · xl=h-20 sm:h-24 · custom=use className"
      >
        <DemoCanvas className="space-y-6">
          <div>
            <DemoLabel>sm</DemoLabel>
            <BrandMark variant="auto" size="sm" />
          </div>
          <div>
            <DemoLabel>md</DemoLabel>
            <BrandMark variant="auto" size="md" />
          </div>
          <div>
            <DemoLabel>lg</DemoLabel>
            <BrandMark variant="auto" size="lg" />
          </div>
          <div>
            <DemoLabel>xl</DemoLabel>
            <BrandMark variant="auto" size="xl" />
          </div>
        </DemoCanvas>
      </DemoSection>

      <DemoSection
        title="Como link"
        description="Passa href para envolver em <Link> com aria-label automático."
      >
        <DemoCanvas>
          <BrandMark variant="auto" size="md" href="/" />
        </DemoCanvas>
      </DemoSection>

      <DemoSection
        title="Collapsible (sidebar)"
        description="Quando dentro de um sidebar com data-collapsible=icon, troca automaticamente para o logo Z pequeno."
      >
        <DemoCanvas>
          <p className="mb-4 text-xs text-muted-foreground">
            Demo limitada — o swap acontece via{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
              group-data-[collapsible=icon]
            </code>
            . Veja em ação em <code>portal-app-sidebar.tsx</code>.
          </p>
          <BrandMark variant="dark" size="custom" collapsible className="h-10 w-40" />
        </DemoCanvas>
      </DemoSection>

      <UsageInProduction
        sites={[
          {
            file: 'src/app/portal/page.tsx',
            line: 12,
            snippet: '<BrandMark variant="dark" size="xl" priority className="object-center" />',
            note: 'Login do portal — dentro de container .dark, força variant="dark".',
          },
          {
            file: 'src/components/auth/v2/auth-layout.tsx',
            line: 24,
            snippet: '<BrandMark variant="auto" size="lg" priority />',
            note: 'Login interno (auth/v2) — usa variant="auto" para respeitar tema do usuário.',
          },
          {
            file: 'src/components/layout/sidebar/sidebar-logo.tsx',
            line: 14,
            snippet: `<BrandMark
  variant="dark"
  size="custom"
  collapsible
  priority
  className="h-auto w-full max-w-35 transition-all"
/>`,
            note: 'Sidebar do app — collapsible automático, size custom para deixar o aspect ratio livre.',
          },
          {
            file: 'src/app/website/components/layout/header.tsx',
            line: 64,
            snippet: `<Link href="/" className="flex border-none outline-none" aria-label="Logo Zattar Advogados">
  <BrandMark
    variant="auto"
    size="custom"
    priority
    className="h-8 sm:h-10 md:h-12 w-auto object-left"
  />
</Link>`,
            note: 'Header público — responsive com 3 breakpoints, custom + className para controle fino.',
          },
          {
            file: 'src/app/(authenticated)/assinatura-digital/feature/components/public/layout/PublicPageShell.tsx',
            line: 33,
            snippet: `<BrandMark
  variant="auto"
  size="custom"
  priority
  className="h-8 sm:h-10 w-auto"
/>`,
            note: 'Página pública de assinatura — sem fill, intrinsic dimensions garantem aspect ratio em qualquer container.',
          },
        ]}
      />

      <DemoSection title="Quando NÃO usar">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            Para o ícone/favicon ou logos parceiros — esses NÃO são marca
            Zattar e devem usar próprio asset.
          </li>
          <li>
            Para placeholders de avatar — use <code>Avatar</code> de
            shadcn/ui.
          </li>
        </ul>
      </DemoSection>
    </div>
  )
}
