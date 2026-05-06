import type { Metadata } from "next"
import { FullScreenLayoutClient } from "./layout-client"
import { fetchAuthenticatedUserContext } from "@/app/_shared/fetch-authenticated-user"

export const metadata: Metadata = {
  title: {
    template: "%s · Zattar OS",
    default: "Zattar OS",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function FullScreenLayout({ children }: { children: React.ReactNode }) {
  const { initialUser, initialPermissoes } = await fetchAuthenticatedUserContext()

  return (
    <FullScreenLayoutClient initialUser={initialUser} initialPermissoes={initialPermissoes}>
      {children}
    </FullScreenLayoutClient>
  )
}
