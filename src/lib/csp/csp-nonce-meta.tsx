import { createElement } from "react";

export function CSPNonceMeta({ nonce }: { nonce?: string }) {
  if (!nonce) return null;
  return createElement("meta", { name: "csp-nonce", content: nonce });
}
