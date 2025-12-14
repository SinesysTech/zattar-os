'use client'
import { useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { MagnetizeButton } from "./magnetize-button";
import { actionValidarCpf } from "../../actions/portal-actions";

export function CpfHeroForm() {
  const [titleNumber, setTitleNumber] = useState(0);
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const titles = useMemo(
    () => ["Contratos.", "Processos.", "Audiências.", "Pagamentos."],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  const handleConsultar = () => {
    if (!cpf || cpf.trim() === "") {
      setError("Por favor, insira um CPF para consultar.");
      return;
    }
    setError(null);
    
    startTransition(async () => {
        const result = await actionValidarCpf(cpf);
        if (result && !result.success) {
            setError(result.error || "Erro ao validar CPF");
        }
        // If success, it redirects, so no need to stop loading manually visually if redirect handles it
        // However, isPending will stay true until redirect happens or we return
    });
  };

  return (
    <div className="w-full -mt-12">
      <div className="container mx-auto">
        <div className="flex gap-8 py-12 lg:py-16 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-3xl tracking-tighter text-center font-regular">
              <span className="text-spektr-cyan-50">Consulte</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              Acesse de forma rápida e segura o andamento de seus processos no escritório Zattar Advogados.
            </p>
          </div>
          
          <div className="flex w-full max-w-md items-center gap-2">
            <Input 
              type="text" 
              placeholder="Digite seu CPF"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConsultar()}
              className="flex-1 py-6 px-4 text-base"
              disabled={isPending}
            />
            <MagnetizeButton 
              onClick={handleConsultar}
              disabled={isPending}
              className={isPending ? 'opacity-70 cursor-not-allowed' : ''}
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
