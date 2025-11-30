'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { useListarAdvogados } from '@/app/_lib/hooks/use-advogado';
import type { Credencial, CodigoTRT, GrauTRT } from '@/app/_lib/types/credenciais';

interface CredenciaisDialogProps {
  credencial: Credencial | null; // null = criar nova
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Lista de tribunais disponíveis (TRTs + TST)
const TRIBUNAIS: CodigoTRT[] = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19',
  'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24', 'TST',
];

const GRAUS: { value: GrauTRT; label: string }[] = [
  { value: 'primeiro_grau', label: '1º Grau' },
  { value: 'segundo_grau', label: '2º Grau' },
  { value: 'tribunal_superior', label: 'Tribunal Superior' },
];

/**
 * Dialog para criar ou editar credenciais
 */
export function CredenciaisDialog({
  credencial,
  open,
  onOpenChange,
  onSuccess,
}: CredenciaisDialogProps) {
  const { advogados, buscarAdvogados } = useListarAdvogados();
  const [isSaving, setIsSaving] = useState(false);

  // Estados do formulário
  const [advogadoId, setAdvogadoId] = useState<string>('');
  const [tribunal, setTribunal] = useState<CodigoTRT | ''>('');
  const [grau, setGrau] = useState<GrauTRT | ''>('');
  const [senha, setSenha] = useState('');
  const [active, setActive] = useState(true);
  const [buscaAdvogado, setBuscaAdvogado] = useState('');

  const isEditMode = credencial !== null;

  // Carregar lista de advogados ao abrir
  useEffect(() => {
    if (open) {
      buscarAdvogados();
    }
  }, [open, buscarAdvogados]);

  // Preencher formulário em modo edição
  useEffect(() => {
    if (credencial) {
      setAdvogadoId(credencial.advogado_id.toString());
      setTribunal(credencial.tribunal);
      setGrau(credencial.grau);
      setActive(credencial.active);
      setSenha(''); // Não carregar senha por segurança
    } else {
      // Limpar formulário em modo criação
      setAdvogadoId('');
      setTribunal('');
      setGrau('');
      setSenha('');
      setActive(true);
      setBuscaAdvogado('');
    }
  }, [credencial, open]);

  // Lógica especial para TST: grau é automaticamente "Tribunal Superior"
  useEffect(() => {
    if (tribunal === 'TST') {
      setGrau('tribunal_superior');
    } else if (grau === 'tribunal_superior') {
      // Se mudou de TST para outro tribunal, limpa o grau
      setGrau('');
    }
  }, [tribunal]);

  // TST tem grau fixo (Tribunal Superior)
  const isTST = tribunal === 'TST';

  const handleSave = async () => {
    // Validações
    if (!advogadoId) {
      toast.error('Selecione um advogado');
      return;
    }

    if (!tribunal) {
      toast.error('Selecione um tribunal');
      return;
    }

    if (!grau) {
      toast.error('Selecione um grau');
      return;
    }

    if (!isEditMode && !senha) {
      toast.error('Informe a senha');
      return;
    }

    setIsSaving(true);

    try {
      const advogadoIdNum = parseInt(advogadoId, 10);

      if (isEditMode && credencial) {
        // Atualizar credencial existente
        const body: {
          tribunal: CodigoTRT;
          grau: GrauTRT;
          active: boolean;
          senha?: string;
        } = {
          tribunal,
          grau,
          active,
        };

        // Só incluir senha se foi fornecida
        if (senha) {
          body.senha = senha;
        }

        const response = await fetch(
          `/api/advogados/${advogadoIdNum}/credenciais/${credencial.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        toast.success('Credencial atualizada com sucesso!');
      } else {
        // Criar nova credencial
        const response = await fetch(`/api/advogados/${advogadoIdNum}/credenciais`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tribunal,
            grau,
            senha,
            active,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        toast.success('Credencial criada com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao salvar credencial'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrar advogados por busca
  const advogadosFiltrados = advogados.filter((adv) => {
    if (!buscaAdvogado) return true;
    const busca = buscaAdvogado.toLowerCase();
    return (
      adv.nome_completo.toLowerCase().includes(busca) ||
      adv.cpf.includes(busca) ||
      adv.oab.toLowerCase().includes(busca)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(92vw,25rem)] sm:max-w-[min(92vw,34.375rem)]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Credencial' : 'Nova Credencial'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Atualize as informações da credencial de acesso ao tribunal'
              : 'Cadastre uma nova credencial de acesso ao tribunal para o advogado'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Seleção de Advogado */}
          <div className="grid gap-2">
            <Label htmlFor="advogado">Advogado *</Label>
            {isEditMode && credencial ? (
              <Input
                value={`${credencial.advogado_nome} - OAB: ${credencial.advogado_oab}/${credencial.advogado_uf_oab}`}
                disabled
                className="bg-muted"
              />
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Buscar por nome, CPF ou OAB..."
                  value={buscaAdvogado}
                  onChange={(e) => setBuscaAdvogado(e.target.value)}
                />
                <Select value={advogadoId} onValueChange={setAdvogadoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um advogado" />
                  </SelectTrigger>
                  <SelectContent>
                    {advogadosFiltrados.map((adv) => (
                      <SelectItem key={adv.id} value={adv.id.toString()}>
                        {adv.nome_completo} - OAB: {adv.oab}/{adv.uf_oab}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Tribunal */}
          <div className="grid gap-2">
            <Label htmlFor="tribunal">Tribunal *</Label>
            <Select value={tribunal} onValueChange={(value) => setTribunal(value as CodigoTRT)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tribunal" />
              </SelectTrigger>
              <SelectContent>
                {TRIBUNAIS.map((trt) => (
                  <SelectItem key={trt} value={trt}>
                    {trt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grau */}
          <div className="grid gap-2">
            <Label htmlFor="grau">Grau *</Label>
            <Select
              value={grau}
              onValueChange={(value) => setGrau(value as GrauTRT)}
              disabled={isTST}
            >
              <SelectTrigger className={isTST ? 'bg-muted' : ''}>
                <SelectValue placeholder="Selecione o grau" />
              </SelectTrigger>
              <SelectContent>
                {GRAUS.filter((g) => isTST ? g.value === 'tribunal_superior' : g.value !== 'tribunal_superior').map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isTST && (
              <p className="text-xs text-muted-foreground">
                O TST possui apenas o grau Tribunal Superior
              </p>
            )}
          </div>

          {/* Senha */}
          <div className="grid gap-2">
            <Label htmlFor="senha">
              Senha {isEditMode ? '(deixe em branco para manter a atual)' : '*'}
            </Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={isEditMode ? 'Digite para alterar a senha' : 'Digite a senha'}
            />
          </div>

          {/* Status Ativo */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="active">Credencial Ativa</Label>
              <p className="text-sm text-muted-foreground">
                Credenciais inativas não serão utilizadas nas capturas
              </p>
            </div>
            <Switch id="active" checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner className="mr-2" />
                Salvando...
              </>
            ) : isEditMode ? (
              'Atualizar'
            ) : (
              'Criar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
