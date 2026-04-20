'use client';

import { useFormularioStore } from '@/shared/assinatura-digital/store';
import type { ContratoPendente } from '@/shared/assinatura-digital/types/store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChevronRight, Plus } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Text } from '@/components/ui/typography';
import FormStepLayout from './form-step-layout';

export default function ContratosPendentesStep() {
  const {
    dadosCPF,
    contratosPendentes,
    stepConfigs,
    setDadosPessoais,
    setDadosContrato,
    setEtapaAtual,
    proximaEtapa,
    etapaAnterior,
  } = useFormularioStore();

  const handleSelecionarContrato = (contrato: ContratoPendente) => {
    if (!dadosCPF?.dadosCliente || !dadosCPF.clienteId) {
      toast.error('Erro', { description: 'Dados do cliente não encontrados.' });
      return;
    }

    const cliente = dadosCPF.dadosCliente;

    // Popula dadosPessoais a partir dos dados do cliente existente
    setDadosPessoais({
      cliente_id: dadosCPF.clienteId,
      nome_completo: cliente.nome,
      cpf: cliente.cpf ?? dadosCPF.cpf,
      rg: cliente.rg ?? undefined,
      data_nascimento: cliente.data_nascimento ?? '',
      estado_civil: cliente.estado_civil ?? '',
      genero: cliente.genero ?? '',
      nacionalidade: cliente.nacionalidade ?? '',
      email: cliente.email ?? '',
      celular: cliente.celular ?? '',
      telefone: cliente.telefone ?? undefined,
      endereco_cep: cliente.cep ?? '',
      endereco_logradouro: cliente.logradouro ?? '',
      endereco_numero: cliente.numero ?? '',
      endereco_complemento: cliente.complemento ?? undefined,
      endereco_bairro: cliente.bairro ?? '',
      endereco_cidade: cliente.cidade ?? '',
      endereco_uf: cliente.uf ?? '',
    });

    // Popula dadosContrato com o contrato selecionado + parte contrária
    const parteContraria = contrato.partes?.find(
      (p) => p.tipo_entidade === 'parte_contraria'
    );
    setDadosContrato({
      contrato_id: contrato.id,
      ...(parteContraria?.nome_snapshot && {
        parte_contraria_dados: [{
          id: 0,
          nome: parteContraria.nome_snapshot,
          cpf: parteContraria.cpf_cnpj_snapshot || null,
        }],
      }),
    });

    // Pular para a etapa de visualizacao do PDF
    const visualizacaoStep = stepConfigs?.find(
      (s) => s.component === 'VisualizacaoPdfStep'
    );

    if (visualizacaoStep) {
      setEtapaAtual(visualizacaoStep.index);
      toast.success('Contrato selecionado', {
        description: 'Revise o contrato antes de assinar.',
      });
    } else {
      // Fallback: avanca normalmente
      proximaEtapa();
    }
  };

  const handleNovoContrato = () => {
    // Não chamar clearContratosPendentes() aqui — isso dispara um rebuild de
    // stepConfigs no FormularioContainer (remove o step pendentes), o que muda
    // todos os índices. O proximaEtapa() usa o índice antigo e acaba pulando
    // DadosPessoais, indo direto para DynamicFormStep.
    proximaEtapa();
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getParteContraria = (contrato: ContratoPendente) => {
    const parte = contrato.partes?.find(
      (p) => p.tipo_entidade === 'parte_contraria'
    );
    return parte?.nome_snapshot || null;
  };

  if (!contratosPendentes || contratosPendentes.length === 0) {
    proximaEtapa();
    return null;
  }

  return (
    <FormStepLayout
      title="Contratos pendentes"
      onPrevious={etapaAnterior}
      hideNext
    >
      <div className="flex flex-col gap-3">
        {contratosPendentes.map((contrato) => {
          const parteContraria = getParteContraria(contrato);
          const tipo = contrato.segmento_nome?.trim();
          const metadataParts = [
            tipo,
            `Criado em ${formatDate(contrato.cadastrado_em)}`,
          ].filter(Boolean);

          return (
            <button
              key={contrato.id}
              type="button"
              onClick={() => handleSelecionarContrato(contrato)}
              className="group cursor-pointer text-left"
              aria-label={`Assinar contrato de ${parteContraria ?? 'parte contrária não informada'}`}
            >
              <GlassPanel
                depth={1}
                className="flex items-center gap-3 p-4 transition-all duration-200 group-hover:border-primary/40 group-hover:bg-primary/3 group-focus-visible:border-primary/60 group-focus-visible:ring-2 group-focus-visible:ring-primary/20 sm:p-5"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Text
                    variant="label"
                    className="truncate text-[15px] font-semibold text-foreground"
                  >
                    {parteContraria ?? 'Contrato sem parte contrária'}
                  </Text>
                  {metadataParts.length > 0 && (
                    <Text
                      variant="caption"
                      className="truncate text-[12px] text-muted-foreground"
                    >
                      {metadataParts.join(' · ')}
                    </Text>
                  )}
                  {contrato.observacoes && (
                    <Text
                      variant="caption"
                      className="truncate text-[11.5px] text-muted-foreground/70"
                    >
                      {contrato.observacoes}
                    </Text>
                  )}
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                  strokeWidth={2}
                />
              </GlassPanel>
            </button>
          );
        })}

        <Button
          variant="glass-outline"
          onClick={handleNovoContrato}
          className="mt-2 h-11 w-full cursor-pointer gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Criar novo contrato
        </Button>
      </div>
    </FormStepLayout>
  );
}
