import type { ReactNode } from 'react'
import { headers } from 'next/headers'

/**
 * Layout da rota pública de assinatura digital.
 *
 * Força o tema light independente da preferência do sistema — contexto externo
 * exige contraste máximo para leitura de documentos. O script inline roda
 * antes da hidratação para evitar flash de tema escuro.
 *
 * O nonce vem do middleware (x-nonce) para satisfazer o CSP strict-dynamic.
 */
export default async function PublicRouteLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <>
      <script
        nonce={nonce}
        data-zattar-theme="force-light"
        dangerouslySetInnerHTML={{
          __html: `
            try {
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.add('light');
              document.documentElement.setAttribute('data-theme', 'light');
              document.documentElement.style.colorScheme = 'light';
            } catch (e) {}
          `,
        }}
      />
      {children}
    </>
  )
}
