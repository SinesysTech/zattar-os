"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import {
  createExpedienteSchema,
  updateExpedienteSchema,
  ListarExpedientesParams,
} from "./domain";
import {
  criarExpediente,
  atualizarExpediente,
  realizarBaixa,
  reverterBaixa,
  listarExpedientes,
} from "./service";
import { after } from "next/server";
import { indexDocument } from "@/features/ai/services/indexing.service";
import { authenticateRequest } from "@/lib/auth";
import { listarUploads } from "@/features/documentos/service";

// =============================================================================
// TIPOS DE RETORNO DAS ACTIONS
// =============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | {
    success: false;
    error: string;
    errors?: Record<string, string[]>;
    message: string;
  };

// =============================================================================
// HELPERS
// =============================================================================

function formatZodErrors(
  zodError: z.ZodError<unknown>
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const err of zodError.errors) {
    const key = err.path.join(".");
    if (!errors[key]) {
      errors[key] = [];
    }
    errors[key].push(err.message);
  }
  return errors;
}

// =============================================================================
// SERVER ACTIONS
// =============================================================================

export async function actionCriarExpediente(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await authenticateRequest();
    const rawData = {
      numeroProcesso: formData.get("numeroProcesso"),
      trt: formData.get("trt"),
      grau: formData.get("grau"),
      dataPrazoLegalParte: formData.get("dataPrazoLegalParte"),
      origem: formData.get("origem"),
      advogadoId: formData.get("advogadoId")
        ? parseInt(formData.get("advogadoId") as string, 10)
        : undefined,
      processoId: formData.get("processoId")
        ? parseInt(formData.get("processoId") as string, 10)
        : undefined,
      descricaoOrgaoJulgador: formData.get("descricaoOrgaoJulgador"),
      classeJudicial: formData.get("classeJudicial"),
      numero: formData.get("numero"),
      segredoJustica: formData.get("segredoJustica") === "true",
      codigoStatusProcesso: formData.get("codigoStatusProcesso"),
      prioridadeProcessual: formData.get("prioridadeProcessual") === "true",
      nomeParteAutora: formData.get("nomeParteAutora"),
      qtdeParteAutora: formData.get("qtdeParteAutora")
        ? parseInt(formData.get("qtdeParteAutora") as string, 10)
        : undefined,
      nomeParteRe: formData.get("nomeParteRe"),
      qtdeParteRe: formData.get("qtdeParteRe")
        ? parseInt(formData.get("qtdeParteRe") as string, 10)
        : undefined,
      dataAutuacao: formData.get("dataAutuacao"),
      juizoDigital: formData.get("juizoDigital") === "true",
      dataArquivamento: formData.get("dataArquivamento"),
      idDocumento: formData.get("idDocumento"),
      dataCienciaParte: formData.get("dataCienciaParte"),
      responsavelId: formData.get("responsavelId")
        ? parseInt(formData.get("responsavelId") as string, 10)
        : undefined,
      tipoExpedienteId: formData.get("tipoExpedienteId")
        ? parseInt(formData.get("tipoExpedienteId") as string, 10)
        : undefined,
      observacoes: formData.get("observacoes"),
    };

    const validation = createExpedienteSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validação",
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || "Dados inválidos",
      };
    }

    const result = await criarExpediente(validation.data);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/expedientes");
    revalidatePath("/app/expedientes/semana");
    revalidatePath("/app/expedientes/mes");
    revalidatePath("/app/expedientes/ano");
    revalidatePath("/app/expedientes/lista");
    // revalidatePath('/app/dashboard'); // Uncomment if dashboard has expedited widget

    // 🆕 AI Indexing Hook
    if (result.success && user) {
      const expedienteId = result.data.id;
      const idDocumentoStr = formData.get("idDocumento") as string;
      const idDocumento = idDocumentoStr ? parseInt(idDocumentoStr, 10) : null;

      after(async () => {
        try {
          // Se tiver documento vinculado, tentar encontrar o arquivo para indexar
          if (idDocumento) {
            const { uploads } = await listarUploads(idDocumento, user.id);
            const latestUpload = uploads[0]; // Pega o mais recente

            if (latestUpload && latestUpload.b2_key) {
              console.log(
                `🧠 [AI] Indexando expediente ${expedienteId} via documento ${idDocumento}`
              );
              await indexDocument({
                entity_type: "expediente",
                entity_id: expedienteId,
                parent_id: null, // Expediente é raiz? Ou vinculado a processo?
                storage_provider: "backblaze",
                storage_key: latestUpload.b2_key,
                content_type: latestUpload.tipo_mime,
                metadata: {
                  ...result.data, // Metadados do expediente
                  indexed_by: user.id,
                  linked_document_id: idDocumento,
                },
              });
            }
          }
          // TODO: Se não tiver documento, poderíamos indexar apenas os metadados como texto?
          // Por enquanto, seguimos o padrão de indexar se houver conteúdo/arquivo.
        } catch (error) {
          console.error(
            `❌ [AI] Erro ao indexar expediente ${expedienteId}:`,
            error
          );
        }
      });
    }

    return {
      success: true,
      data: result.data,
      message: "Expediente criado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao criar expediente:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao criar expediente. Tente novamente.",
    };
  }
}

export async function actionAtualizarExpediente(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "ID inválido",
        message: "ID do expediente é obrigatório",
      };
    }

    const rawData: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        const trimmed = value.trim();

        if (trimmed === 'true') {
          rawData[key] = true;
        } else if (trimmed === 'false') {
          rawData[key] = false;
        } else if (key.includes('Id')) {
          // Handle IDs: if empty/0 check if we should send null or undefined
          if (trimmed === '' || trimmed === '0') {
            rawData[key] = null; // Send null to clear the FK
          } else {
            const num = parseInt(trimmed, 10);
            if (!isNaN(num)) {
              rawData[key] = num;
            }
          }
        } else if (
          !isNaN(Number(trimmed)) &&
          trimmed !== '' &&
          (key.includes("qtde") ||
            key.includes("pagina") ||
            key.includes("limite"))
        ) {
          rawData[key] = parseInt(trimmed, 10);
        } else if (trimmed === '') {
          // If empty string, send null (to allow clearing text fields if supported by schema)
          // or send empty string depending on domain. 
          // Safest for most optional fields is null or undefined, but let's try null.
          rawData[key] = null;
        } else {
          rawData[key] = trimmed;
        }
      } else {
        // File or other types
        rawData[key] = value;
      }
    }

    const validation = updateExpedienteSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validação",
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || "Dados inválidos",
      };
    }

    const result = await atualizarExpediente(id, validation.data);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/expedientes");
    revalidatePath("/app/expedientes/semana");
    revalidatePath("/app/expedientes/mes");
    revalidatePath("/app/expedientes/ano");
    revalidatePath("/app/expedientes/lista");
    // revalidatePath('/app/dashboard'); // Uncomment if dashboard has expedited widget

    return {
      success: true,
      data: result.data,
      message: "Expediente atualizado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao atualizar expediente:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao atualizar expediente. Tente novamente.",
    };
  }
}

export async function actionBaixarExpediente(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // Ler o ID do expediente do FormData (enviado via hidden input)
    const expedienteIdStr = formData.get("expedienteId") as string | null;
    const id = expedienteIdStr ? parseInt(expedienteIdStr, 10) : 0;

    if (!id || id <= 0 || isNaN(id)) {
      return {
        success: false,
        error: "ID inválido",
        message: "ID do expediente é obrigatório para baixa",
      };
    }

    const supabase = await createSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return {
        success: false,
        error: "Não autenticado",
        message: "Usuário não autenticado para realizar a baixa.",
      };
    }

    // Buscar o ID numérico do usuário usando o auth_user_id
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    if (usuarioError || !usuario) {
      return {
        success: false,
        error: "Usuário não encontrado",
        message: "Usuário não encontrado no sistema.",
      };
    }

    // Monta objeto com tipagem superficial - validação será feita no service
    const rawData = {
      expedienteId: id,
      protocoloId: formData.get("protocoloId")
        ? (formData.get("protocoloId") as string).trim()
        : undefined,
      justificativaBaixa:
        (formData.get("justificativaBaixa") as string | null) || undefined,
      dataBaixa: (formData.get("dataBaixa") as string | null) || undefined,
    };

    // Delega validação para o service realizarBaixa
    const result = await realizarBaixa(id, rawData, usuario.id);

    if (!result.success) {
      // Mapeia erros de validação do service para ActionResult
      if (result.error.code === "VALIDATION_ERROR" && result.error.details) {
        return {
          success: false,
          error: result.error.message,
          errors: result.error.details as Record<string, string[]>,
          message: result.error.message,
        };
      }
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/expedientes");
    revalidatePath("/app/expedientes/semana");
    revalidatePath("/app/expedientes/mes");
    revalidatePath("/app/expedientes/ano");
    revalidatePath("/app/expedientes/lista");
    // revalidatePath('/app/dashboard'); // Uncomment if dashboard has expedited widget

    return {
      success: true,
      data: result.data,
      message: "Expediente baixado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao baixar expediente:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao baixar expediente. Tente novamente.",
    };
  }
}

export async function actionReverterBaixa(
  id: number,
  _prevState: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "ID inválido",
        message: "ID do expediente é obrigatório para reverter baixa",
      };
    }

    const supabase = await createSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return {
        success: false,
        error: "Não autenticado",
        message: "Usuário não autenticado para reverter a baixa.",
      };
    }

    // Buscar o ID numérico do usuário usando o auth_user_id
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    if (usuarioError || !usuario) {
      return {
        success: false,
        error: "Usuário não encontrado",
        message: "Usuário não encontrado no sistema.",
      };
    }

    const result = await reverterBaixa(id, usuario.id);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/expedientes");
    revalidatePath("/app/expedientes/semana");
    revalidatePath("/app/expedientes/mes");
    revalidatePath("/app/expedientes/ano");
    revalidatePath("/app/expedientes/lista");
    // revalidatePath('/app/dashboard'); // Uncomment if dashboard has expedited widget

    return {
      success: true,
      data: result.data,
      message: "Baixa de expediente revertida com sucesso",
    };
  } catch (error) {
    console.error("Erro ao reverter baixa de expediente:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao reverter baixa de expediente. Tente novamente.",
    };
  }
}

export async function actionListarExpedientes(
  params: ListarExpedientesParams
): Promise<ActionResult> {
  try {
    const result = await listarExpedientes(params);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: "Expedientes carregados com sucesso",
    };
  } catch (error) {
    console.error("Erro ao listar expedientes:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar expedientes. Tente novamente.",
    };
  }
}
