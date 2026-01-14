"use client";

import { PageShell } from "@/components/shared/page-shell";
import { BlockedIpsContent } from "./components/blocked-ips-content";

export default function BlockedIpsPage() {
  return (
    <PageShell>
      <BlockedIpsContent />
    </PageShell>
  );
}
