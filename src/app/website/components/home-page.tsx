import { WebsiteShell } from "./layout/website-shell";
import { Hero } from "./home/hero";
import { Services } from "./home/services";
import { About } from "./home/about";

export function HomePage() {
  return (
    <WebsiteShell>
      <Hero />
      <Services />
      <About />
    </WebsiteShell>
  );
}
