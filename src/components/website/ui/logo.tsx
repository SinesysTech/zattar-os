import Image from "next/image";

export const Logo = () => (
  <div className="relative w-[260px] md:w-[480px] h-16 md:h-24">
    <Image
      src="/logos/logomarca-light.svg"
      alt="Logo Zattar Advogados"
      fill
      className="object-contain object-center dark:hidden"
      priority
    />
    <Image
      src="/logos/logomarca-dark.svg"
      alt="Logo Zattar Advogados"
      fill
      className="object-contain object-center hidden dark:block"
      priority
    />
  </div>
);
