'use client';

import { useState } from 'react';
import { CapturaFormBase, validarCamposCaptura } from '../captura-form-base';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TipoCapturaSelect, type TipoCaptura as TipoCapturaUI } from '../tipo-captura-select';
import { criarAgendamento } from '@/core/app/api/captura/agendamentos/agendamentos';
import type { TipoCaptura } from '@/backend/types/captura/capturas-log-types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface AgendamentoFormProps {
  onSuccess?: () => void;
}

/**
 * Mapeia tipos de captura da UI (com hífen) para tipos do backend (com underscore)
 */
const mapTipoCapturaUIToBackend = (tipoUI: TipoCapturaUI): TipoCaptura => {
  const mapping: Record<TipoCapturaUI, TipoCaptura> = {
    'acervo-geral': 'acervo_geral',
    'arquivados': 'arquivados',
    'audiencias': 'audiencias',
    'pendentes': 'pendentes',
    'timeline': 'acervo_geral', // Timeline não tem agendamento específico, mapeia para acervo geral
    'partes': 'acervo_geral', // Partes não tem agendamento específico, mapeia para acervo geral
  };
  return mapping[tipoUI];
};

export function AgendamentoForm({ onSuccess }: AgendamentoFormProps) {
  const [advogadoId, setAdvogadoId] = useState<number | null>(null);
  const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
  const [tipoCaptura, setTipoCaptura] = useState<TipoCapturaUI | ''>('');
  const [periodicidade, setPeriodicidade] = useState<'diario' | 'a_cada_N_dias' | ''>('');
  const [diasIntervalo, setDiasIntervalo] = useState<number>(1);
  const [horario, setHorario] = useState<string>('07:00');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [filtroPrazo, setFiltroPrazo] = useState<'no_prazo' | 'sem_prazo' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean | null;
    error?: string;
  }>({ success: null });

  // Controle de campos habilitados/desabilitados
  const isTipoCapturaSelected = Boolean(tipoCaptura);
  const isPeriodicidadeSelected = Boolean(periodicidade);
  const needsAudienciasDates = tipoCaptura === 'audiencias';
  const needsPendentesFiltro = tipoCaptura === 'pendentes';
  const showDiasIntervalo = periodicidade === 'a_cada_N_dias';

  const handleSubmit = async () => {
    // Validações
    if (!validarCamposCaptura(advogadoId, credenciaisSelecionadas)) {
      setResult({ success: false, error: 'Selecione um advogado e pelo menos uma credencial.' });
      return;
    }

    if (!tipoCaptura) {
      setResult({ success: false, error: 'Selecione o tipo de captura.' });
      return;
    }

    if (!periodicidade) {
      setResult({ success: false, error: 'Selecione a periodicidade.' });
      return;
    }

    if (periodicidade === 'a_cada_N_dias' && (!diasIntervalo || diasIntervalo <= 0)) {
      setResult({ success: false, error: 'Informe o número de dias (deve ser maior que 0).' });
      return;
    }

    if (!horario || !horario.match(/^\d{2}:\d{2}$/)) {
      setResult({ success: false, error: 'Informe um horário válido (HH:mm).' });
      return;
    }

    // Validações específicas por tipo
    if (tipoCaptura === 'audiencias' && (!dataInicio || !dataFim)) {
      setResult({ success: false, error: 'Para audiências, informe data início e data fim.' });
      return;
    }

    if (tipoCaptura === 'pendentes' && !filtroPrazo) {
      setResult({ success: false, error: 'Para expedientes, selecione o filtro de prazo.' });
      return;
    }

    setIsLoading(true);
    setResult({ success: null });

    try {
      // Preparar parâmetros extras
      const parametrosExtras: Record<string, unknown> = {};
      if (tipoCaptura === 'audiencias') {
        parametrosExtras.dataInicio = dataInicio;
        parametrosExtras.dataFim = dataFim;
      }
      if (tipoCaptura === 'pendentes') {
        parametrosExtras.filtroPrazo = filtroPrazo;
      }

      // Converter tipo de captura UI para backend
      const tipoCapturaBackend = mapTipoCapturaUIToBackend(tipoCaptura);

      const response = await criarAgendamento({
        tipo_captura: tipoCapturaBackend,
        advogado_id: advogadoId!,
        credencial_ids: credenciaisSelecionadas,
        periodicidade: periodicidade as 'diario' | 'a_cada_N_dias',
        dias_intervalo: periodicidade === 'a_cada_N_dias' ? diasIntervalo : undefined,
        horario,
        ativo: true,
        parametros_extras: Object.keys(parametrosExtras).length > 0 ? parametrosExtras : undefined,
      });

      if (response.success) {
        setResult({ success: true });
        // Limpar formulário
        setAdvogadoId(null);
        setCredenciaisSelecionadas([]);
        setTipoCaptura('');
        setPeriodicidade('');
        setDiasIntervalo(1);
        setHorario('07:00');
        setDataInicio('');
        setDataFim('');
        setFiltroPrazo('');
        // Chamar callback de sucesso
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
            setResult({ success: null });
          }, 2000);
        }
      } else {
        setResult({ success: false, error: response.error || 'Erro ao criar agendamento.' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setResult({ success: false, error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <CapturaFormBase
        advogadoId={advogadoId}
        onAdvogadoChange={setAdvogadoId}
        credenciaisSelecionadas={credenciaisSelecionadas}
        onCredenciaisChange={setCredenciaisSelecionadas}
      >
        {/* Grid de 2 colunas para melhor aproveitamento do espaço */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna 1: Configurações Principais */}
          <div className="space-y-6">
            {/* Tipo de Captura */}
            <div className="space-y-2">
              <Label htmlFor="tipo-captura">Tipo de Captura *</Label>
              <TipoCapturaSelect
                value={tipoCaptura as TipoCapturaUI}
                onValueChange={(value) => {
                  setTipoCaptura(value);
                  // Resetar campos específicos quando mudar o tipo
                  setDataInicio('');
                  setDataFim('');
                  setFiltroPrazo('');
                }}
                disabled={false}
                apenasAgendaveis={true}
              />
              <p className="text-xs text-muted-foreground">
                Selecione o tipo de captura que será executada automaticamente
              </p>
            </div>

            {/* Periodicidade */}
            <div className="space-y-2">
              <Label htmlFor="periodicidade">Periodicidade *</Label>
              <Select
                value={periodicidade}
                onValueChange={(value) => {
                  setPeriodicidade(value as 'diario' | 'a_cada_N_dias');
                  if (value === 'diario') {
                    setDiasIntervalo(1);
                  }
                }}
                disabled={!isTipoCapturaSelected}
              >
                <SelectTrigger id="periodicidade" className="w-full">
                  <SelectValue placeholder="Selecione a periodicidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário (todos os dias)</SelectItem>
                  <SelectItem value="a_cada_N_dias">A cada N dias</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Frequência de execução do agendamento
              </p>
            </div>

            {/* Dias Intervalo (sempre renderizado) */}
            <div className="space-y-2">
              <Label htmlFor="dias-intervalo" className={!showDiasIntervalo ? 'text-muted-foreground' : ''}>
                Intervalo de Dias {showDiasIntervalo && '*'}
              </Label>
              <Input
                id="dias-intervalo"
                type="number"
                min="1"
                value={diasIntervalo}
                onChange={(e) => setDiasIntervalo(parseInt(e.target.value, 10) || 1)}
                placeholder="Ex: 2, 3, 5, 7..."
                disabled={!showDiasIntervalo}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {showDiasIntervalo
                  ? 'Quantos dias entre cada execução'
                  : 'Disponível quando selecionar "A cada N dias"'}
              </p>
            </div>

            {/* Horário */}
            <div className="space-y-2">
              <Label htmlFor="horario">
                <Clock className="inline h-4 w-4 mr-1" />
                Horário de Execução *
              </Label>
              <Input
                id="horario"
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                disabled={!isPeriodicidadeSelected}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Horário em que a captura será executada (formato HH:mm)
              </p>
            </div>
          </div>

          {/* Coluna 2: Parâmetros Específicos */}
          <div className="space-y-6">
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="text-sm font-semibold mb-4">Parâmetros Específicos do Tipo</h4>

              {/* Parâmetros para Audiências */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="data-inicio"
                    className={!needsAudienciasDates ? 'text-muted-foreground' : ''}
                  >
                    Data Início {needsAudienciasDates && '*'}
                  </Label>
                  <FormDatePicker
                    id="data-inicio"
                    value={dataInicio || undefined}
                    onChange={(v) => setDataInicio(v || '')}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {needsAudienciasDates
                      ? 'Data inicial do período de audiências'
                      : 'Necessário para tipo "Audiências"'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-fim" className={!needsAudienciasDates ? 'text-muted-foreground' : ''}>
                    Data Fim {needsAudienciasDates && '*'}
                  </Label>
                  <FormDatePicker
                    id="data-fim"
                    value={dataFim || undefined}
                    onChange={(v) => setDataFim(v || '')}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {needsAudienciasDates
                      ? 'Data final do período de audiências'
                      : 'Necessário para tipo "Audiências"'}
                  </p>
                </div>

                {/* Parâmetros para Pendentes/Expedientes */}
                <div className="space-y-2">
                  <Label
                    htmlFor="filtro-prazo"
                    className={!needsPendentesFiltro ? 'text-muted-foreground' : ''}
                  >
                    Filtro de Prazo {needsPendentesFiltro && '*'}
                  </Label>
                  <Select
                    value={filtroPrazo}
                    onValueChange={(value) => setFiltroPrazo(value as 'no_prazo' | 'sem_prazo')}
                    disabled={!needsPendentesFiltro}
                  >
                    <SelectTrigger id="filtro-prazo" className="w-full">
                      <SelectValue placeholder="Selecione o filtro de prazo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_prazo">No Prazo</SelectItem>
                      <SelectItem value="sem_prazo">Sem Prazo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {needsPendentesFiltro
                      ? 'Filtrar expedientes por situação de prazo'
                      : 'Necessário para tipo "Expedientes"'}
                  </p>
                </div>
              </div>

              {!needsAudienciasDates && !needsPendentesFiltro && (
                <p className="text-sm text-muted-foreground mt-2">
                  Nenhum parâmetro adicional necessário para este tipo de captura.
                </p>
              )}
            </div>
          </div>
        </div>
      </CapturaFormBase>

      <Button onClick={handleSubmit} disabled={isLoading} className="w-full" size="lg">
        {isLoading ? 'Criando Agendamento...' : 'Criar Agendamento'}
      </Button>

      {/* Resultado */}
      {result.success !== null && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          {result.success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Agendamento criado com sucesso!</AlertDescription>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              <AlertDescription>{result.error || 'Erro ao criar agendamento'}</AlertDescription>
            </>
          )}
        </Alert>
      )}
    </div>
  );
}

