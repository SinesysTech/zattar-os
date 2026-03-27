import Image from "next/image";

export const Logo = () => (
  <div className="relative w-[320px] md:w-[600px] h-20 md:h-28 -my-2 md:-my-2">
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
