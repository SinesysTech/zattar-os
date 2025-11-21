'use client';

// Componente de visualização de audiências por semana com tabs de dias

import * as React from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Copy, Pencil, Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Audiencia } from '@/backend/types/audiencias/types';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

/**
 * Formata apenas hora ISO para formato brasileiro (HH:mmh)
 */
const formatarHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }) + 'h';
  } catch {
    return '-';
  }
};

/**
 * Formata o grau para exibição
 */
const formatarGrau = (grau: 'primeiro_grau' | 'segundo_grau'): string => {
  return grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
};

/**
 * Retorna a classe CSS de cor para badge do TRT
 */
const getTRTColorClass = (trt: string): string => {
  const trtColors: Record<string, string> = {
    'TRT1': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    'TRT2': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    'TRT3': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    'TRT4': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800',
  };
  return trtColors[trt] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Retorna a classe CSS de cor para badge do grau
 */
const getGrauColorClass = (grau: 'primeiro_grau' | 'segundo_grau'): string => {
  const grauColors: Record<string, string> = {
    'primeiro_grau': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'segundo_grau': 'bg-amber-100 text-amber-800 border-amber-200',
  };
  return grauColors[grau] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Retorna a classe CSS de cor para badge da Parte Autora
 */
const getParteAutoraColorClass = (): string => {
  return 'bg-blue-100 text-blue-800 border-blue-200';
};

/**
 * Retorna a classe CSS de cor para badge da Parte Ré
 */
const getParteReColorClass = (): string => {
  return 'bg-red-100 text-red-800 border-red-200';
};

/**
 * Detecta qual plataforma de videoconferência baseado na URL
 */
type PlataformaVideo = 'zoom' | 'meet' | 'webex' | null;

const detectarPlataforma = (url: string | null): PlataformaVideo => {
  if (!url) return null;
  const urlLower = url.toLowerCase();
  if (urlLower.includes('zoom')) return 'zoom';
  if (urlLower.includes('meet')) return 'meet';
  if (urlLower.includes('webex')) return 'webex';
  return null;
};

/**
 * Retorna o caminho da logo para a plataforma
 */
const getLogoPlataforma = (plataforma: PlataformaVideo): string | null => {
  const logos: Record<string, string> = {
    zoom: '/Zoom_Logo.png',
    meet: '/meet_logo.png',
    webex: '/webex_logo.png',
  };
  return plataforma ? logos[plataforma] : null;
};

/**
 * Componente para editar endereço da audiência (URL virtual ou endereço físico)
 */
function EnderecoCell({ audiencia, onSuccess }: { audiencia: Audiencia; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [tipoEndereco, setTipoEndereco] = React.useState<'virtual' | 'presencial'>(
    audiencia.url_audiencia_virtual ? 'virtual' :
      audiencia.endereco_presencial ? 'presencial' : 'virtual'
  );
  const [url, setUrl] = React.useState(audiencia.url_audiencia_virtual || '');
  const [endereco, setEndereco] = React.useState({
    logradouro: audiencia.endereco_presencial?.logradouro || '',
    numero: audiencia.endereco_presencial?.numero || '',
    complemento: audiencia.endereco_presencial?.complemento || '',
    bairro: audiencia.endereco_presencial?.bairro || '',
    cidade: audiencia.endereco_presencial?.cidade || '',
    estado: audiencia.endereco_presencial?.estado || '',
    pais: audiencia.endereco_presencial?.pais || '',
    cep: audiencia.endereco_presencial?.cep || '',
  });
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setUrl(audiencia.url_audiencia_virtual || '');
    setEndereco({
      logradouro: audiencia.endereco_presencial?.logradouro || '',
      numero: audiencia.endereco_presencial?.numero || '',
      complemento: audiencia.endereco_presencial?.complemento || '',
      bairro: audiencia.endereco_presencial?.bairro || '',
      cidade: audiencia.endereco_presencial?.cidade || '',
      estado: audiencia.endereco_presencial?.estado || '',
      pais: audiencia.endereco_presencial?.pais || '',
      cep: audiencia.endereco_presencial?.cep || '',
    });
    setError(null);
  }, [audiencia.url_audiencia_virtual, audiencia.endereco_presencial]);

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let bodyData;

      if (tipoEndereco === 'virtual') {
        const urlToSave = url.trim() || null;

        // Validar URL se fornecida
        if (urlToSave) {
          try {
            new URL(urlToSave);
          } catch {
            setError('URL inválida. Use o formato: https://exemplo.com');
            setIsLoading(false);
            return;
          }
        }

        bodyData = {
          tipo: 'virtual',
          urlAudienciaVirtual: urlToSave
        };
      } else {
        // Validar se pelo menos logradouro ou cidade estão preenchidos
        if (!endereco.logradouro.trim() && !endereco.cidade.trim()) {
          setError('Informe pelo menos o logradouro ou a cidade');
          setIsLoading(false);
          return;
        }

        bodyData = {
          tipo: 'presencial',
          enderecoPresencial: endereco
        };
      }

      const response = await fetch(`/api/audiencias/${audiencia.id}/endereco`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atualizar endereço');
      }

      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar endereço');
      // Não chamar onSuccess() em caso de erro para evitar falsa impressão de sucesso
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUrl(audiencia.url_audiencia_virtual || '');
    setEndereco({
      logradouro: audiencia.endereco_presencial?.logradouro || '',
      numero: audiencia.endereco_presencial?.numero || '',
      complemento: audiencia.endereco_presencial?.complemento || '',
      bairro: audiencia.endereco_presencial?.bairro || '',
      cidade: audiencia.endereco_presencial?.cidade || '',
      estado: audiencia.endereco_presencial?.estado || '',
      pais: audiencia.endereco_presencial?.pais || '',
      cep: audiencia.endereco_presencial?.cep || '',
    });
    setError(null);
    setIsOpen(false);
  };

  const handleCopyUrl = async () => {
    if (!audiencia.url_audiencia_virtual) return;
    try {
      await navigator.clipboard.writeText(audiencia.url_audiencia_virtual);
    } catch (error) {
      console.error('Erro ao copiar URL:', error);
    }
  };

  const plataforma = detectarPlataforma(audiencia.url_audiencia_virtual);
  const logoPath = getLogoPlataforma(plataforma);

  // Exibir endereço atual
  const renderEnderecoAtual = () => {
    if (audiencia.url_audiencia_virtual) {
      return (
        <>
          {logoPath ? (
            <a
              href={audiencia.url_audiencia_virtual}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Acessar audiência virtual via ${plataforma}`}
              className="hover:opacity-70 transition-opacity flex items-center justify-center"
            >
              <Image
                src={logoPath}
                alt={plataforma || 'Plataforma de vídeo'}
                width={80}
                height={30}
                className="object-contain"
              />
            </a>
          ) : (
            <a
              href={audiencia.url_audiencia_virtual}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Acessar audiência virtual"
              className="text-xs text-blue-600 hover:underline truncate max-w-[100px]"
            >
              {audiencia.url_audiencia_virtual}
            </a>
          )}
        </>
      );
    } else if (audiencia.endereco_presencial) {
      const enderecoStr = [
        audiencia.endereco_presencial.logradouro,
        audiencia.endereco_presencial.numero,
        audiencia.endereco_presencial.complemento,
        audiencia.endereco_presencial.bairro,
        audiencia.endereco_presencial.cidade,
        audiencia.endereco_presencial.estado,
        audiencia.endereco_presencial.pais,
        audiencia.endereco_presencial.cep
      ].filter(Boolean).join(', ');

      return (
        <span className="text-sm whitespace-pre-wrap wrap-break-word w-full">
          {enderecoStr || '-'}
        </span>
      );
    } else {
      return <span className="text-sm text-muted-foreground">-</span>;
    }
  };

  return (
    <div className="relative group h-full w-full min-h-[60px] flex items-center justify-center p-2">
      {renderEnderecoAtual()}
      <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {audiencia.url_audiencia_virtual && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyUrl}
            className="h-5 w-5 p-0 bg-gray-100 hover:bg-gray-200 shadow-sm"
            title="Copiar URL"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 bg-gray-100 hover:bg-gray-200 shadow-sm"
              title="Editar Endereço"
              disabled={isLoading}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[450px]" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Editar Endereço</h4>
                <p className="text-sm text-muted-foreground">
                  Escolha entre URL de videoconferência ou endereço físico
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={tipoEndereco === 'virtual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoEndereco('virtual')}
                  className="flex-1"
                >
                  URL Virtual
                </Button>
                <Button
                  variant={tipoEndereco === 'presencial' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoEndereco('presencial')}
                  className="flex-1"
                >
                  Endereço Físico
                </Button>
              </div>

              {tipoEndereco === 'virtual' ? (
                <div className="space-y-1">
                  <label htmlFor="url-input" className="text-sm font-medium">
                    URL da Audiência Virtual
                  </label>
                  <Input
                    ref={inputRef}
                    id="url-input"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://meet.google.com/..."
                    disabled={isLoading}
                    className="h-9 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="logradouro" className="text-sm font-medium">
                        Logradouro
                      </label>
                      <Input
                        id="logradouro"
                        value={endereco.logradouro}
                        onChange={(e) => {
                          setEndereco(prev => ({ ...prev, logradouro: e.target.value }));
                          setError(null);
                        }}
                        placeholder="Rua, Avenida, etc."
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="numero" className="text-sm font-medium">
                        Número
                      </label>
                      <Input
                        id="numero"
                        value={endereco.numero}
                        onChange={(e) => {
                          setEndereco(prev => ({ ...prev, numero: e.target.value }));
                          setError(null);
                        }}
                        placeholder="Nº"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="complemento" className="text-sm font-medium">
                      Complemento
                    </label>
                    <Input
                      id="complemento"
                      value={endereco.complemento}
                      onChange={(e) => {
                        setEndereco(prev => ({ ...prev, complemento: e.target.value }));
                        setError(null);
                      }}
                      placeholder="Apartamento, sala, etc."
                      disabled={isLoading}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="bairro" className="text-sm font-medium">
                        Bairro
                      </label>
                      <Input
                        id="bairro"
                        value={endereco.bairro}
                        onChange={(e) => {
                          setEndereco(prev => ({ ...prev, bairro: e.target.value }));
                          setError(null);
                        }}
                        placeholder="Bairro"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="cidade" className="text-sm font-medium">
                        Cidade
                      </label>
                      <Input
                        id="cidade"
                        value={endereco.cidade}
                        onChange={(e) => {
                          setEndereco(prev => ({ ...prev, cidade: e.target.value }));
                          setError(null);
                        }}
                        placeholder="Cidade"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="estado" className="text-sm font-medium">
                        Estado
                      </label>
                      <Input
                        id="estado"
                        value={endereco.estado}
                        onChange={(e) => {
                          setEndereco(prev => ({ ...prev, estado: e.target.value }));
                          setError(null);
                        }}
                        placeholder="UF"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="pais" className="text-sm font-medium">
                        País
                      </label>
                      <Input
                        id="pais"
                        value={endereco.pais}
                        onChange={(e) => {
                          setEndereco(prev => ({ ...prev, pais: e.target.value }));
                          setError(null);
                        }}
                        placeholder="País"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="cep" className="text-sm font-medium">
                        CEP
                      </label>
                      <Input
                        id="cep"
                        value={endereco.cep}
                        onChange={(e) => {
                          setEndereco(prev => ({ ...prev, cep: e.target.value }));
                          setError(null);
                        }}
                        placeholder="00000-000"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/**
 * Componente para editar observações da audiência
 */
function ObservacoesCell({ audiencia, onSuccess }: { audiencia: Audiencia; onSuccess: () => void }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [observacoes, setObservacoes] = React.useState(audiencia.observacoes || '');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setObservacoes(audiencia.observacoes || '');
  }, [audiencia.observacoes]);

  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const observacoesToSave = observacoes.trim() || null;

      const response = await fetch(`/api/audiencias/${audiencia.id}/observacoes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ observacoes: observacoesToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atualizar observações');
      }

      setIsEditing(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar observações:', error);
      // Não chamar onSuccess() em caso de erro para evitar falsa impressão de sucesso
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setObservacoes(audiencia.observacoes || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative h-full w-full min-h-[60px] p-2">
        <textarea
          ref={textareaRef}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Digite as observações..."
          disabled={isLoading}
          className="w-full h-full min-h-[60px] resize-none border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <div className="absolute bottom-2 right-2 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            className="h-5 w-5 p-0 bg-green-100 hover:bg-green-200 shadow-sm"
            title="Salvar"
          >
            <span className="text-green-700 text-xs font-bold">✓</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-5 w-5 p-0 bg-red-100 hover:bg-red-200 shadow-sm"
            title="Cancelar"
          >
            <span className="text-red-700 text-xs font-bold">✕</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group h-full w-full min-h-[60px] flex items-start justify-start p-2">
      <span className="text-sm whitespace-pre-wrap wrap-break-word w-full">
        {audiencia.observacoes || '-'}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1"
        title="Editar observações"
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}

/**
 * Componente para atribuir responsável a uma audiência
 */
function ResponsavelCell({
  audiencia,
  onSuccess,
  usuarios
}: {
  audiencia: Audiencia;
  onSuccess: () => void;
  usuarios: Usuario[];
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSelect = async (value: string) => {
    setIsLoading(true);
    try {
      const responsavelId = value === 'null' || value === '' ? null : parseInt(value, 10);

      const response = await fetch(`/api/audiencias/${audiencia.id}/responsavel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responsavelId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atribuir responsável');
      }

      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atribuir responsável:', error);
      // Não chamar onSuccess() em caso de erro para evitar falsa impressão de sucesso
    } finally {
      setIsLoading(false);
    }
  };

  const responsavelAtual = usuarios.find(u => u.id === audiencia.responsavel_id);

  return (
    <div className="relative group h-full w-full min-h-[60px] flex items-center justify-center p-2">
      <span className="text-sm">
        {responsavelAtual ? responsavelAtual.nomeExibicao : 'Sem responsável'}
      </span>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1"
            title="Editar responsável"
            disabled={isLoading}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-2">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => handleSelect('null')}
              disabled={isLoading}
            >
              Sem responsável
            </Button>
            {usuarios.map((usuario) => (
              <Button
                key={usuario.id}
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => handleSelect(usuario.id.toString())}
                disabled={isLoading}
              >
                {usuario.nomeExibicao}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Define as colunas da tabela de audiências para visualização semanal
 */
function criarColunasSemanais(onSuccess: () => void, usuarios: Usuario[]): ColumnDef<Audiencia>[] {
  return [
    {
      accessorKey: 'data_inicio',
      header: () => (
        <div className="relative flex items-center justify-center w-full after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
          <div className="text-sm font-medium text-center">Hora</div>
        </div>
      ),
      size: 80,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm font-medium">
          {formatarHora(row.getValue('data_inicio'))}
        </div>
      ),
    },
    {
      id: 'processo',
      header: () => (
        <div className="relative flex items-center justify-center w-full after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
          <div className="text-sm font-medium text-center">Processo</div>
        </div>
      ),
      size: 250,
      cell: ({ row }) => {
        const classeJudicial = row.original.classe_judicial || '';
        const numeroProcesso = row.original.numero_processo;
        const trt = row.original.trt;
        const grau = row.original.grau;
        const orgaoJulgador = row.original.orgao_julgador_descricao || '-';

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[250px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={`${getTRTColorClass(trt)} w-fit text-xs`}>
                {trt}
              </Badge>
              <Badge variant="outline" className={`${getGrauColorClass(grau)} w-fit text-xs`}>
                {formatarGrau(grau)}
              </Badge>
            </div>
            <div className="text-sm font-medium whitespace-nowrap">
              {classeJudicial && `${classeJudicial} `}{numeroProcesso}
            </div>
            <div className="text-xs text-muted-foreground max-w-full truncate">
              {orgaoJulgador}
            </div>
          </div>
        );
      },
    },
    {
      id: 'partes',
      header: () => (
        <div className="relative flex items-center justify-center w-full after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
          <div className="text-sm font-medium text-center">Partes</div>
        </div>
      ),
      size: 250,
      cell: ({ row }) => {
        const parteAutora = row.original.polo_ativo_nome || '-';
        const parteRe = row.original.polo_passivo_nome || '-';

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[250px]">
            <Badge variant="outline" className={`${getParteAutoraColorClass()} block whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-left`}>
              {parteAutora}
            </Badge>
            <Badge variant="outline" className={`${getParteReColorClass()} block whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-left`}>
              {parteRe}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'tipo_local',
      header: () => (
        <div className="relative flex items-center justify-center w-full after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
          <div className="text-sm font-medium text-center">Tipo/Local</div>
        </div>
      ),
      size: 280,
      cell: ({ row }) => {
        const tipo = row.original.tipo_descricao || '-';
        const isVirtual = row.original.tipo_is_virtual;
        const sala = row.original.sala_audiencia_nome || '-';

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1 max-w-[280px]">
            <div className="flex items-center gap-2">
              <span className="text-sm">{tipo}</span>
              {isVirtual && (
                <Badge variant="outline" className="text-xs">
                  Virtual
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-full">
              {sala}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'url_audiencia_virtual',
      header: () => (
        <div className="relative flex items-center justify-center w-full after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
          <div className="text-sm font-medium text-center">Endereço</div>
        </div>
      ),
      enableSorting: false,
      size: 120,
      cell: ({ row }) => (
        <div className="h-full w-full">
          <EnderecoCell audiencia={row.original} onSuccess={onSuccess} />
        </div>
      ),
    },
    {
      accessorKey: 'observacoes',
      header: () => (
        <div className="relative flex items-center justify-center w-full after:absolute after:-right-3 after:top-[20%] after:h-[60%] after:w-px after:bg-border">
          <div className="text-sm font-medium text-center">Observações</div>
        </div>
      ),
      enableSorting: false,
      size: 250,
      cell: ({ row }) => (
        <div className="h-full w-full">
          <ObservacoesCell audiencia={row.original} onSuccess={onSuccess} />
        </div>
      ),
    },
    {
      accessorKey: 'responsavel_id',
      header: () => (
        <div className="flex items-center justify-center w-full">
          <div className="text-sm font-medium text-center">Responsável</div>
        </div>
      ),
      size: 160,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center">
          <ResponsavelCell audiencia={row.original} onSuccess={onSuccess} usuarios={usuarios} />
        </div>
      ),
    },
  ];
}

interface AudienciasVisualizacaoSemanaProps {
  audiencias: Audiencia[];
  isLoading: boolean;
  semanaAtual: Date;
  usuarios: Usuario[];
  onRefresh: () => void;
}

export function AudienciasVisualizacaoSemana({ audiencias, isLoading, semanaAtual, usuarios, onRefresh }: AudienciasVisualizacaoSemanaProps) {
  const [diaAtivo, setDiaAtivo] = React.useState<string>('segunda');

  // Calcular início e fim da semana
  const inicioSemana = React.useMemo(() => {
    const date = new Date(semanaAtual);
    // Normalizar para meia-noite para comparação correta
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    // Calcular diferença para segunda-feira (1 = segunda, 0 = domingo)
    const diff = day === 0 ? -6 : 1 - day;
    const inicio = new Date(date);
    inicio.setDate(date.getDate() + diff);
    return inicio;
  }, [semanaAtual]);

  const fimSemana = React.useMemo(() => {
    const date = new Date(inicioSemana);
    date.setDate(date.getDate() + 4); // Até sexta-feira
    date.setHours(23, 59, 59, 999); // Fim do dia
    return date;
  }, [inicioSemana]);

  // Filtrar audiências por dia da semana, verificando se pertencem à semana atual
  const audienciasPorDia = React.useMemo(() => {
    const dias = {
      segunda: [] as Audiencia[],
      terca: [] as Audiencia[],
      quarta: [] as Audiencia[],
      quinta: [] as Audiencia[],
      sexta: [] as Audiencia[],
    };

    // Normalizar início e fim da semana para comparação apenas por data
    const inicioNormalizado = new Date(inicioSemana);
    inicioNormalizado.setHours(0, 0, 0, 0);

    const fimNormalizado = new Date(fimSemana);
    fimNormalizado.setHours(23, 59, 59, 999);

    audiencias.forEach((audiencia) => {
      const dataAudiencia = new Date(audiencia.data_inicio);

      // Normalizar data da audiência para comparação apenas por dia
      const dataAudienciaNormalizada = new Date(dataAudiencia);
      dataAudienciaNormalizada.setHours(0, 0, 0, 0);

      // Verificar se a audiência está dentro da semana atual (segunda a sexta)
      if (dataAudienciaNormalizada < inicioNormalizado || dataAudienciaNormalizada > fimNormalizado) {
        return; // Pular audiências fora da semana atual
      }

      const diaSemana = dataAudiencia.getDay();

      // Agrupar por dia da semana (1 = segunda, 5 = sexta)
      if (diaSemana === 1) dias.segunda.push(audiencia);
      else if (diaSemana === 2) dias.terca.push(audiencia);
      else if (diaSemana === 3) dias.quarta.push(audiencia);
      else if (diaSemana === 4) dias.quinta.push(audiencia);
      else if (diaSemana === 5) dias.sexta.push(audiencia);
    });

    // Ordenar audiências por horário em cada dia
    Object.values(dias).forEach((audienciasDia) => {
      audienciasDia.sort((a, b) => {
        const dataA = new Date(a.data_inicio).getTime();
        const dataB = new Date(b.data_inicio).getTime();
        return dataA - dataB;
      });
    });

    return dias;
  }, [audiencias, inicioSemana, fimSemana]);

  const colunas = React.useMemo(() => criarColunasSemanais(onRefresh, usuarios), [onRefresh, usuarios]);

  // Calcular datas de cada dia da semana
  const datasDiasSemana = React.useMemo(() => {
    const datas: Record<string, Date> = {};
    for (let i = 0; i < 5; i++) {
      const data = new Date(inicioSemana);
      data.setDate(inicioSemana.getDate() + i);
      const diaNome = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'][i];
      datas[diaNome] = data;
    }
    return datas;
  }, [inicioSemana]);

  const formatarDataTab = (data: Date) => {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatarDataCompleta = (data: Date) => {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Tabs value={diaAtivo} onValueChange={setDiaAtivo} className="gap-0">
      <TabsList className="bg-background justify-start rounded-t-lg rounded-b-none border-b p-0 w-full">
        <TabsTrigger
          value="segunda"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Segunda - {formatarDataTab(datasDiasSemana.segunda)}</span>
        </TabsTrigger>
        <TabsTrigger
          value="terca"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Terça - {formatarDataTab(datasDiasSemana.terca)}</span>
        </TabsTrigger>
        <TabsTrigger
          value="quarta"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Quarta - {formatarDataTab(datasDiasSemana.quarta)}</span>
        </TabsTrigger>
        <TabsTrigger
          value="quinta"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4 after:absolute after:right-0 after:top-[25%] after:h-[50%] after:w-px after:bg-border data-[state=active]:after:opacity-0"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Quinta - {formatarDataTab(datasDiasSemana.quinta)}</span>
        </TabsTrigger>
        <TabsTrigger
          value="sexta"
          className="relative bg-muted/50 border-b-border dark:data-[state=active]:bg-background data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5 px-4 py-4"
        >
          <span className="text-sm font-medium text-center whitespace-normal">Sexta - {formatarDataTab(datasDiasSemana.sexta)}</span>
        </TabsTrigger>
      </TabsList>

      {Object.entries(audienciasPorDia).map(([dia, audienciasDia]) => {
        const dataDia = datasDiasSemana[dia];
        const nomeDiaCompleto = {
          segunda: 'Segunda-feira',
          terca: 'Terça-feira',
          quarta: 'Quarta-feira',
          quinta: 'Quinta-feira',
          sexta: 'Sexta-feira',
        }[dia];

        return (
          <TabsContent key={dia} value={dia} className="mt-0">
            <div className="rounded-b-lg border border-t-0 bg-card text-card-foreground shadow-sm">
              <DataTable
                data={audienciasDia}
                columns={colunas}
                isLoading={isLoading}
                emptyMessage={`Nenhuma audiência agendada para ${nomeDiaCompleto}, ${formatarDataCompleta(dataDia)}.`}
                hideTableBorder={true}
                hideColumnBorders={true}
              />
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
