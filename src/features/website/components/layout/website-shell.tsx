import { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";

interface WebsiteShellProps {
  children: ReactNode;
}

export function WebsiteShell({ children }: WebsiteShellProps) {
  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary/30 selection:text-primary">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
