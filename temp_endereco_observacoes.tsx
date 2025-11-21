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
        <>
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
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsOpen(true)}
                        className="h-5 w-5 p-0 bg-gray-100 hover:bg-gray-200 shadow-sm"
                        title="Editar Endereço"
                        disabled={isLoading}
                    >
                        <Pencil className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Endereço</DialogTitle>
                        <DialogDescription>
                            Escolha entre URL de videoconferência ou endereço físico
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
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
                            <div className="space-y-2">
                                <Label htmlFor="url-input">URL da Audiência Virtual</Label>
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
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSave();
                                        if (e.key === 'Escape') handleCancel();
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="logradouro">Logradouro</Label>
                                        <Input
                                            id="logradouro"
                                            value={endereco.logradouro}
                                            onChange={(e) => {
                                                setEndereco(prev => ({ ...prev, logradouro: e.target.value }));
                                                setError(null);
                                            }}
                                            placeholder="Rua, Avenida, etc."
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="numero">Número</Label>
                                        <Input
                                            id="numero"
                                            value={endereco.numero}
                                            onChange={(e) => {
                                                setEndereco(prev => ({ ...prev, numero: e.target.value }));
                                                setError(null);
                                            }}
                                            placeholder="Nº"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="complemento">Complemento</Label>
                                    <Input
                                        id="complemento"
                                        value={endereco.complemento}
                                        onChange={(e) => {
                                            setEndereco(prev => ({ ...prev, complemento: e.target.value }));
                                            setError(null);
                                        }}
                                        placeholder="Apartamento, sala, etc."
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="bairro">Bairro</Label>
                                        <Input
                                            id="bairro"
                                            value={endereco.bairro}
                                            onChange={(e) => {
                                                setEndereco(prev => ({ ...prev, bairro: e.target.value }));
                                                setError(null);
                                            }}
                                            placeholder="Bairro"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cidade">Cidade</Label>
                                        <Input
                                            id="cidade"
                                            value={endereco.cidade}
                                            onChange={(e) => {
                                                setEndereco(prev => ({ ...prev, cidade: e.target.value }));
                                                setError(null);
                                            }}
                                            placeholder="Cidade"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="estado">Estado</Label>
                                        <Input
                                            id="estado"
                                            value={endereco.estado}
                                            onChange={(e) => {
                                                setEndereco(prev => ({ ...prev, estado: e.target.value }));
                                                setError(null);
                                            }}
                                            placeholder="UF"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pais">País</Label>
                                        <Input
                                            id="pais"
                                            value={endereco.pais}
                                            onChange={(e) => {
                                                setEndereco(prev => ({ ...prev, pais: e.target.value }));
                                                setError(null);
                                            }}
                                            placeholder="País"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cep">CEP</Label>
                                        <Input
                                            id="cep"
                                            value={endereco.cep}
                                            onChange={(e) => {
                                                setEndereco(prev => ({ ...prev, cep: e.target.value }));
                                                setError(null);
                                            }}
                                            placeholder="00000-000"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

/**
 * Componente para editar observações da audiência
 */
function ObservacoesCell({ audiencia, onSuccess }: { audiencia: Audiencia; onSuccess: () => void }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [observacoes, setObservacoes] = React.useState(audiencia.observacoes || '');
    const [error, setError] = React.useState<string | null>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        setObservacoes(audiencia.observacoes || '');
        setError(null);
    }, [audiencia.observacoes]);

    React.useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen]);

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
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

            setIsOpen(false);
            onSuccess();
        } catch (error) {
            console.error('Erro ao atualizar observações:', error);
            setError(error instanceof Error ? error.message : 'Erro ao salvar observações');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setObservacoes(audiencia.observacoes || '');
        setError(null);
        setIsOpen(false);
    };

    return (
        <>
            <div className="relative group h-full w-full min-h-[60px] flex items-start justify-start p-2">
                <span className="text-sm whitespace-pre-wrap wrap-break-word w-full">
                    {audiencia.observacoes || '-'}
                </span>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsOpen(true)}
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1 bg-gray-100 hover:bg-gray-200 shadow-sm"
                    title="Editar observações"
                    disabled={isLoading}
                >
                    <Pencil className="h-3 w-3" />
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Editar Observações</DialogTitle>
                        <DialogDescription>
                            Adicione observações sobre a audiência
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="observacoes-textarea">Observações</Label>
                            <Textarea
                                ref={textareaRef}
                                id="observacoes-textarea"
                                value={observacoes}
                                onChange={(e) => {
                                    setObservacoes(e.target.value);
                                    setError(null);
                                }}
                                placeholder="Digite as observações sobre a audiência..."
                                disabled={isLoading}
                                className="min-h-[200px] resize-y"
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') handleCancel();
                                }}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
