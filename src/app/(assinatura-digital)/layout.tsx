import type { ReactNode } from 'react'

/**
 * Layout da rota pública de assinatura digital.
 *
 * Força o tema light independente da preferência do sistema — contexto externo
 * exige contraste máximo para leitura de documentos. O script inline roda
 * antes da hidratação para evitar flash de tema escuro.
 */
export default function PublicRouteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
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
