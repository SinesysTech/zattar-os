import { AvatarStack } from "@/components/ui/avatar-stack";
import type { MembroProjeto } from "../../lib/domain";

interface MemberAvatarGroupProps {
  membros: Pick<MembroProjeto, "usuarioNome" | "usuarioAvatar">[];
  max?: number;
  orientation?: "vertical" | "horizontal";
}

export function MemberAvatarGroup({
  membros,
  max = 4,
  orientation = "vertical",
}: MemberAvatarGroupProps) {
  if (membros.length === 0) return null;

  const avatars = membros.map((m) => ({
    name: m.usuarioNome ?? "Membro",
    image: m.usuarioAvatar ?? "",
  }));

  return (
    <AvatarStack
      avatars={avatars}
      maxAvatarsAmount={max}
      orientation={orientation}
    />
  );
}
