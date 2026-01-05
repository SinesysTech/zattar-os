import Image from "next/image";

export const Logo = () => (
  <div className="relative w-[200px] md:w-[400px] h-16 md:h-24">
    <Image
      src="/zattar.png"
      alt="Logo Zattar Advogados"
      fill
      className="object-contain object-center"
      priority
    />
  </div>
);
