"use client";

/**
 * Página de debug para verificar o erro de validação
 */

import { useEffect, useState } from "react";
import { actionListDocumentos } from "../../feature";

export function DebugPage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const hasResult = typeof result === "object" && result !== null;
  const resultObject = hasResult ? (result as Record<string, unknown>) : null;

  useEffect(() => {
    async function load() {
      try {
        console.log("🔍 Chamando actionListDocumentos...");
        const res = await actionListDocumentos({
          page: 1,
          pageSize: 10,
        });
        
        console.log("✅ Resultado:", res);
        setResult(res);
        
        if (!res.success) {
          setError(res.error || "Erro desconhecido");
        }
      } catch (err) {
        console.error("❌ Erro:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, []);

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Debug - Lista de Documentos</h1>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded">
          <h2 className="font-bold">Erro:</h2>
          <pre className="mt-2 text-sm">{error}</pre>
        </div>
      )}
      
      {hasResult ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-100 rounded">
            <h2 className="font-bold">Success:</h2>
            <p>{resultObject?.success ? "✅ true" : "❌ false"}</p>
          </div>

          {Boolean(resultObject?.data) && (
            <div className="p-4 bg-green-100 rounded">
              <h2 className="font-bold">Data:</h2>
              <pre className="mt-2 text-xs overflow-auto max-h-96">
                {JSON.stringify(resultObject?.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
