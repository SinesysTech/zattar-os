// import { Badge } from "./ui/badge";
import Link from "next/link";
import { Button } from "./ui/button";
import { BackgroundPattern } from "./ui/background-pattern";
import { Message, Search } from "@mynaui/icons-react";
import { getMeuProcessoUrl } from "@/lib/urls";

const Hero = () => {
  return (
    <section
      id="inicio"
      className="relative min-h-[80vh] flex items-center justify-center bg-background pt-32 md:pt-36 pb-12"
    >
      <div className="absolute inset-0">
        <BackgroundPattern />
      </div>

      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="mt-6 text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.2]! tracking-tight font-display">
            Uma vida digna se constrói sobre um trabalho justo.
          </h1>

          <p className="mt-6 text-[17px] md:text-lg text-muted-foreground max-w-3xl mx-auto">
            A legislação trabalhista estrutura as bases para essa relação. <br />
            Atuamos com especialização e rigor técnico para orientar e garantir que os direitos que
            promovem o respeito e a equidade no ambiente de trabalho sejam efetivados.
          </p>

          <div className="mt-12 flex items-center justify-center gap-4 flex-wrap">
            <Button asChild size="lg" className="rounded-full text-base">
              <Link href={getMeuProcessoUrl()}>
                Consultar Processo <Search className="h-5! w-5! ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full text-base shadow-none">
              <Message className="h-5! w-5! mr-2" /> Agendar Consulta
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
