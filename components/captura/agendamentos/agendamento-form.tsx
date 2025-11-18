'use client';

import { useState } from 'react';
import { CapturaFormBase, validarCamposCaptura } from '../captura-form-base';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { criarAgendamento } from '@/lib/api/agendamentos';
import type { TipoCaptura } from '@/backend/types/captura/trt-types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

interface AgendamentoFormProps {
  onSuccess?: () => void;
}

const TIPOS_CAPTURA: Array<{ value: TipoCaptura; label: string }> = [
  { value: 'acervo_geral', label: 'Acervo Geral' },
  { value: 'arquivados', label: 'Arquivados' },
  { value: 'audiencias', label: 'Audiências' },
  { value: 'pendentes', label: 'Pendentes' },
];

export function AgendamentoForm({ onSuccess }: AgendamentoFormProps) {
  const [advogadoId, setAdvogadoId] = useState<number | null>(null);
  const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
  const [tipoCaptura, setTipoCaptura] = useState<TipoCaptura | ''>('');
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
      setResult({ success: false, error: 'Para pendentes, selecione o filtro de prazo.' });
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

      const response = await criarAgendamento({
        tipo_captura: tipoCaptura,
        advogado_id: advogadoId!,
        credenciais_ids: credenciaisSelecionadas,
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
        {/* Tipo de Captura */}
        <div className="space-y-2">
          <Label htmlFor="tipo-captura">Tipo de Captura *</Label>
          <Select value={tipoCaptura} onValueChange={(value) => setTipoCaptura(value as TipoCaptura)}>
            <SelectTrigger id="tipo-captura">
              <SelectValue placeholder="Selecione o tipo de captura" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_CAPTURA.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          >
            <SelectTrigger id="periodicidade">
              <SelectValue placeholder="Selecione a periodicidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">Diário (todos os dias)</SelectItem>
              <SelectItem value="a_cada_N_dias">A cada N dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dias Intervalo (apenas se a_cada_N_dias) */}
        {periodicidade === 'a_cada_N_dias' && (
          <div className="space-y-2">
            <Label htmlFor="dias-intervalo">A cada quantos dias? *</Label>
            <Input
              id="dias-intervalo"
              type="number"
              min="1"
              value={diasIntervalo}
              onChange={(e) => setDiasIntervalo(parseInt(e.target.value, 10) || 1)}
              placeholder="Ex: 2, 3, 5, 7..."
            />
            <p className="text-sm text-muted-foreground">
              Informe quantos dias entre cada execução (ex: 2 = a cada 2 dias, 3 = a cada 3 dias)
            </p>
          </div>
        )}

        {/* Horário */}
        <div className="space-y-2">
          <Label htmlFor="horario">Horário de Execução *</Label>
          <Input
            id="horario"
            type="time"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">Horário em que a captura será executada (formato HH:mm)</p>
        </div>

        {/* Parâmetros extras para Audiências */}
        {tipoCaptura === 'audiencias' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data Início *</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Fim *</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Parâmetros extras para Pendentes */}
        {tipoCaptura === 'pendentes' && (
          <div className="space-y-2">
            <Label htmlFor="filtro-prazo">Filtro de Prazo *</Label>
            <Select value={filtroPrazo} onValueChange={(value) => setFiltroPrazo(value as 'no_prazo' | 'sem_prazo')}>
              <SelectTrigger id="filtro-prazo">
                <SelectValue placeholder="Selecione o filtro de prazo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_prazo">No Prazo</SelectItem>
                <SelectItem value="sem_prazo">Sem Prazo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CapturaFormBase>

      <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
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

