import { Header } from "./layout/header";
import { Hero } from "./home/hero";
import { Services } from "./home/services";
import { About } from "./home/about";
import { Testimonials } from "./home/testimonials";
import { Footer } from "./layout/footer";

export function HomePage() {
  return (
    <main className="min-h-screen bg-background dark selection:bg-primary selection:text-on-primary">
      <Header />
      <Hero />
      <Services />
      <About />
      <Testimonials />
      <Footer />
    </main>
  );
}
