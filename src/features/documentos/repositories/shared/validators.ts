/**
 * Valida se usuário tem acesso a documento
 */
export function validateDocumentAccess(
  documento: { criado_por: number },
  usuario_id: number,
  compartilhamento?: { permissao: string }
): { temAcesso: boolean; permissao: string } {
  // Proprietário tem acesso total
  if (documento.criado_por === usuario_id) {
    return { temAcesso: true, permissao: "proprietario" };
  }

  // Verifica compartilhamento
  if (compartilhamento) {
    return { temAcesso: true, permissao: compartilhamento.permissao };
  }

  return { temAcesso: false, permissao: "nenhuma" };
}

/**
 * Valida se usuário tem acesso a pasta
 */
export function validateFolderAccess(
  pasta: { tipo: string; criado_por: number },
  usuario_id: number
): boolean {
  // Pastas comuns são acessíveis a todos
  if (pasta.tipo === "comum") return true;

  // Pastas privadas apenas para o criador
  return pasta.criado_por === usuario_id;
}

/**
 * Valida se usuário pode editar um recurso
 */
export function validateEditPermission(
  permissao: "proprietario" | "editar" | "visualizar" | null
): boolean {
  return permissao === "proprietario" || permissao === "editar";
}

/**
 * Valida se usuário é proprietário de um recurso
 */
export function validateOwnership(
  recurso: { criado_por: number },
  usuario_id: number
): boolean {
  return recurso.criado_por === usuario_id;
}

/**
 * Valida se um template é acessível ao usuário
 */
export function validateTemplateAccess(
  template: { visibilidade: string; criado_por: number },
  usuario_id: number
): boolean {
  // Templates públicos são acessíveis a todos
  if (template.visibilidade === "publico") return true;

  // Templates privados apenas para o criador
  return template.criado_por === usuario_id;
}

/**
 * Verifica se permissão inclui visualização
 * (editar e proprietário incluem visualizar)
 */
export function canView(
  permissao: "proprietario" | "editar" | "visualizar" | null
): boolean {
  return (
    permissao === "proprietario" ||
    permissao === "editar" ||
    permissao === "visualizar"
  );
}

/**
 * Verifica se permissão inclui edição
 */
export function canEdit(
  permissao: "proprietario" | "editar" | "visualizar" | null
): boolean {
  return permissao === "proprietario" || permissao === "editar";
}

/**
 * Verifica se permissão inclui deleção
 */
export function canDelete(
  permissao: "proprietario" | "editar" | "visualizar" | null,
  pode_deletar?: boolean
): boolean {
  if (permissao === "proprietario") return true;
  return pode_deletar === true;
}
