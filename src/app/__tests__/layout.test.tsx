import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  Montserrat: () => ({ variable: "--font-montserrat" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("../layout-client", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("RootLayout", () => {
  it("renders CSP nonce meta when x-nonce is present", async () => {
    const { headers } = await import("next/headers");
    (headers as unknown as jest.Mock).mockResolvedValue(
      new Headers({ "x-nonce": "test-nonce-123" })
    );

    const RootLayout = (await import("../layout")).default;

    const element = await RootLayout({ children: <div>content</div> });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('meta name="csp-nonce"');
    expect(html).toContain('content="test-nonce-123"');
  });
});
