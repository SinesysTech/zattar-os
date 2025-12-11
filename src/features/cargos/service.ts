/**
 * Service Layer for Cargos Feature
 */

import {
  listarCargos as listarCargosDb,
  buscarCargoPorId as buscarCargoPorIdDb,
  buscarCargoPorNome as buscarCargoPorNomeDb,
  criarCargo as criarCargoDb,
  atualizarCargo as atualizarCargoDb,
  deletarCargo as deletarCargoDb,
  contarUsuariosComCargo as contarUsuariosComCargoDb,
  listarUsuariosComCargo as listarUsuariosComCargoDb,
} from './repository';

import type {
  CriarCargoDTO,
  AtualizarCargoDTO,
  ListarCargosParams,
  CargoComUsuariosError,
} from './types';

// ============================================================================
// Business Logic
// ============================================================================

export async function listarCargos(params: ListarCargosParams) {
  return listarCargosDb(params);
}

export async function buscarCargo(id: number) {
  return buscarCargoPorIdDb(id);
}

export async function criarCargo(data: CriarCargoDTO, usuarioId: number) {
  // Check if name exists (optional if DB constraint exists, but cleaner error)
  const exists = await buscarCargoPorNomeDb(data.nome.trim());
  if (exists) {
    throw new Error(`Cargo com nome "${data.nome}" já existe.`);
  }

  return criarCargoDb(data, usuarioId);
}

export async function atualizarCargo(id: number, data: AtualizarCargoDTO) {
  // Check existence
  const current = await buscarCargoPorIdDb(id);
  if (!current) throw new Error('Cargo não encontrado');

  // Check name uniqueness if changed
  if (data.nome && data.nome.trim().toLowerCase() !== current.nome.toLowerCase()) {
      const exists = await buscarCargoPorNomeDb(data.nome.trim());
      if (exists) {
        throw new Error(`Cargo com nome "${data.nome}" já existe.`);
      }
  }

  return atualizarCargoDb(id, data);
}

export async function deletarCargo(id: number) {
  const current = await buscarCargoPorIdDb(id);
  if (!current) throw new Error('Cargo não encontrado');

  const count = await contarUsuariosComCargoDb(id);
  if (count > 0) {
      const usuarios = await listarUsuariosComCargoDb(id);
      
      const error: CargoComUsuariosError = {
          error: 'Não é possível excluir cargo com usuários associados',
          cargoId: id,
          cargoNome: current.nome,
          totalUsuarios: count,
          usuarios: usuarios.map(u => ({
              id: u.id,
              nome_completo: u.nome_completo, // Assuming these fields exist in repository output
              email_corporativo: u.email_corporativo,
          })),
      };
      
      // We throw a specific object or stringify it? 
      // Throwing error message is standard, or custom error class.
      // For simplicity, throw Error with message, actions need to handle it.
      // Or Actions can catch specific structure.
      // Be careful: passing complex object in Error message is messy.
      
      // Option: Throw JSON string
      throw new Error(JSON.stringify(error)); 
  }

  return deletarCargoDb(id);
}
