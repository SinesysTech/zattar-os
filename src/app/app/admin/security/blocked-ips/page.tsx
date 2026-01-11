"use client";

import { PageShell } from "@/components/shared/page-shell";
import { BlockedIpsContent } from "./components/blocked-ips-content";

export default function BlockedIpsPage() {
  return (
    <PageShell
      title="IPs Bloqueados"
      description="Gerenciamento de IPs bloqueados e whitelist de segurança"
    >
      <BlockedIpsContent />
    </PageShell>
  );
}
