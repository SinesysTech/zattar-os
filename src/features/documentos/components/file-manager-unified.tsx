'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
    Folder,
    File,
    FileText,
    Home,
    UploadIcon,
    FolderPlus,
    MoreHorizontalIcon,
    XIcon,
    ImageIcon,
    FileVideoIcon,
    FileAudioIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

import { FileUploadDialogUnified } from './file-upload-dialog-unified';
import { CreateFolderDialog } from './create-folder-dialog';
import { CreateDocumentDialog } from './create-document-dialog';
import {
    actionListarItensUnificados,
    actionDeletarArquivo,
    actionBuscarCaminhoPasta,
} from '../actions/arquivos-actions';
import { actionDeletarDocumento } from '../actions/documentos-actions';
import type { ItemDocumento } from '../domain';

type SortOption = 'name' | 'date' | 'size';
type SortDirection = 'asc' | 'desc';

function getItemIcon(item: ItemDocumento) {
    if (item.tipo === 'pasta') {
        return <Folder className="h-5 w-5 text-yellow-600" />;
    } else if (item.tipo === 'documento') {
        return <FileText className="h-5 w-5 text-blue-600" />;
    } else {
        const mime = item.dados.tipo_mime;
        if (mime.startsWith('image/')) {
            return <ImageIcon className="h-5 w-5 text-green-600" />;
        } else if (mime.startsWith('video/')) {
            return <FileVideoIcon className="h-5 w-5 text-purple-600" />;
        } else if (mime.startsWith('audio/')) {
            return <FileAudioIcon className="h-5 w-5 text-orange-600" />;
        } else if (mime === 'application/pdf') {
            return (
                <div className="flex h-5 w-5 items-center justify-center rounded bg-red-600 text-xs font-bold text-white">
                    PDF
                </div>
            );
        }
        return <File className="h-5 w-5 text-gray-500" />;
    }
}

function getItemName(item: ItemDocumento): string {
    if (item.tipo === 'pasta') return item.dados.nome;
    if (item.tipo === 'documento') return item.dados.titulo;
    return item.dados.nome;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function FileManagerUnified() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();

    const [items, setItems] = useState<ItemDocumento[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<ItemDocumento | null>(null);
    const [showMobileDetails, setShowMobileDetails] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Dialogs
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [createDocumentOpen, setCreateDocumentOpen] = useState(false);

    // Path handling
    const pathParam = searchParams.get('pasta');
    const currentPastaId = pathParam ? parseInt(pathParam) : null;
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null; nome: string }[]>([]);

    const loadItems = useCallback(async () => {
        setLoading(true);
        try {
            const result = await actionListarItensUnificados({
                pasta_id: currentPastaId,
                busca: searchQuery || undefined,
                limit: 100,
                offset: 0,
            });

            if (result.success && result.data) {
                setItems(result.data);
            } else {
                toast.error(result.error || 'Erro ao carregar itens');
            }
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
            toast.error('Erro ao carregar itens');
        } finally {
            setLoading(false);
        }
    }, [currentPastaId, searchQuery]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    // Carregar breadcrumbs
    useEffect(() => {
        if (!currentPastaId) {
            setBreadcrumbs([]);
            return;
        }

        const loadBreadcrumbs = async () => {
            try {
                const result = await actionBuscarCaminhoPasta(currentPastaId);
                if (result.success && result.data) {
                    setBreadcrumbs(result.data.map(p => ({ id: p.id, nome: p.nome })));
                } else {
                    console.error('Erro ao carregar breadcrumbs:', result.error);
                }
            } catch (error) {
                console.error('Erro ao carregar breadcrumbs:', error);
            }
        };

        loadBreadcrumbs();
    }, [currentPastaId]);

    useEffect(() => {
        setSelectedItem(null);
        setShowMobileDetails(false);
    }, [currentPastaId]);

    const handleItemClick = (item: ItemDocumento) => {
        if (item.tipo === 'pasta') {
            router.push(`/documentos?pasta=${item.dados.id}`);
        } else if (item.tipo === 'documento') {
            router.push(`/documentos/${item.dados.id}`);
        } else {
            setSelectedItem(item);
            if (isMobile) {
                setShowMobileDetails(true);
            }
        }
    };

    const handleDeleteItem = async (item: ItemDocumento, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (item.tipo === 'documento') {
                const result = await actionDeletarDocumento(item.dados.id);
                if (!result.success) throw new Error(result.error);
            } else if (item.tipo === 'arquivo') {
                const result = await actionDeletarArquivo(item.dados.id);
                if (!result.success) throw new Error(result.error);
            }
            toast.success('Item movido para a lixeira');
            loadItems();
        } catch (error) {
            console.error('Erro ao deletar:', error);
            toast.error('Erro ao deletar item');
        }
    };

    const handleSortChange = (option: SortOption) => {
        if (sortBy === option) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(option);
            setSortDirection('asc');
        }
    };

    const getSortLabel = () => {
        const icon = sortDirection === 'asc' ? '↑' : '↓';
        const labels = { name: 'Nome', date: 'Data', size: 'Tamanho' };
        return `${labels[sortBy]} ${icon}`;
    };

    const sortedItems = [...items].sort((a, b) => {
        // Pastas sempre primeiro
        if (a.tipo === 'pasta' && b.tipo !== 'pasta') return -1;
        if (a.tipo !== 'pasta' && b.tipo === 'pasta') return 1;

        let comparison = 0;
        switch (sortBy) {
            case 'name':
                comparison = getItemName(a).localeCompare(getItemName(b));
                break;
            case 'date':
                comparison = new Date(a.dados.created_at).getTime() - new Date(b.dados.created_at).getTime();
                break;
            case 'size':
                const sizeA = a.tipo === 'arquivo' ? a.dados.tamanho_bytes : 0;
                const sizeB = b.tipo === 'arquivo' ? b.dados.tamanho_bytes : 0;
                comparison = sizeA - sizeB;
                break;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    const filteredItems = sortedItems.filter(item =>
        getItemName(item).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full w-full">
            <div className="border-border min-w-0 flex-1 space-y-4 p-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold tracking-tight">Arquivos</h1>
                        {currentPastaId && (
                            <>
                                <Separator orientation="vertical" className="h-6" />
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem
                                            className="cursor-pointer hover:text-primary"
                                            onClick={() => router.push('/documentos')}
                                        >
                                            <Home className="h-4 w-4" />
                                        </BreadcrumbItem>
                                        {breadcrumbs.map((bc) => (
                                            <div key={bc.id || 'root'} className="flex items-center">
                                                <BreadcrumbSeparator />
                                                <BreadcrumbItem
                                                    className="cursor-pointer hover:text-primary"
                                                    onClick={() =>
                                                        router.push(bc.id ? `/documentos?pasta=${bc.id}` : '/documentos')
                                                    }
                                                >
                                                    {bc.nome}
                                                </BreadcrumbItem>
                                            </div>
                                        ))}
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCreateFolderOpen(true)}>
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Nova Pasta
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCreateDocumentOpen(true)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Novo Documento
                        </Button>
                        <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
                            <UploadIcon className="mr-2 h-4 w-4" />
                            Upload
                        </Button>
                    </div>
                </div>

                {/* Search and Sort */}
                <div className="flex items-center justify-between gap-4 border-b pb-4">
                    <Input
                        placeholder="Buscar arquivos e pastas..."
                        className="max-w-sm"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                Ordenar: {getSortLabel()}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSortChange('name')}>Nome</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSortChange('date')}>Data</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSortChange('size')}>Tamanho</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Content */}
                <div className="flex">
                    <div className="min-w-0 flex-1">
                        {loading ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex h-64 flex-col items-center justify-center text-center">
                                <FolderPlus className="mx-auto h-12 w-12 opacity-50" />
                                <h2 className="mt-4 text-muted-foreground">
                                    {searchQuery ? 'Nenhum item encontrado' : 'Esta pasta está vazia'}
                                </h2>
                                {!searchQuery && (
                                    <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
                                        <UploadIcon className="mr-2 h-4 w-4" />
                                        Fazer Upload
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredItems.map(item => (
                                    <div
                                        key={`${item.tipo}-${item.dados.id}`}
                                        className={cn(
                                            'flex cursor-pointer items-center justify-between p-4 hover:bg-muted',
                                            selectedItem?.dados.id === item.dados.id &&
                                            selectedItem?.tipo === item.tipo &&
                                            'bg-muted'
                                        )}
                                        onClick={() => handleItemClick(item)}
                                    >
                                        <div className="flex min-w-0 items-center gap-4">
                                            <div className="shrink-0">{getItemIcon(item)}</div>
                                            <div className="min-w-0">
                                                <div className="truncate font-medium">{getItemName(item)}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.tipo === 'pasta'
                                                        ? `${item.dados.total_documentos} documentos`
                                                        : item.tipo === 'arquivo'
                                                            ? formatFileSize(item.dados.tamanho_bytes)
                                                            : 'Documento'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="hidden w-32 text-right lg:inline">
                                                {new Date(item.dados.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-xs">
                                                    {item.dados.criador?.nomeCompleto?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontalIcon className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {item.tipo === 'arquivo' && (
                                                        <DropdownMenuItem
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                window.open(item.dados.b2_url, '_blank');
                                                            }}
                                                        >
                                                            Abrir
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem>Compartilhar</DropdownMenuItem>
                                                    <DropdownMenuItem>Mover</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {item.tipo !== 'pasta' && (
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={e => handleDeleteItem(item, e)}
                                                        >
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop Details Panel */}
                    {selectedItem && !isMobile && (
                        <div className="relative w-80 border-l p-6">
                            <Button
                                onClick={() => setSelectedItem(null)}
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2"
                            >
                                <XIcon className="h-4 w-4" />
                            </Button>

                            <div className="space-y-6">
                                <div className="flex flex-col items-center gap-4 py-4">
                                    <div className="scale-[2]">{getItemIcon(selectedItem)}</div>
                                    <h2 className="text-center font-medium">{getItemName(selectedItem)}</h2>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tipo</span>
                                        <span className="capitalize">{selectedItem.tipo}</span>
                                    </div>
                                    {selectedItem.tipo === 'arquivo' && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tamanho</span>
                                            <span>{formatFileSize(selectedItem.dados.tamanho_bytes)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Criado em</span>
                                        <span>{new Date(selectedItem.dados.created_at).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>

                                {selectedItem.tipo === 'arquivo' && (
                                    <Button
                                        className="w-full"
                                        onClick={() => window.open(selectedItem.dados.b2_url, '_blank')}
                                    >
                                        Abrir Arquivo
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <FileUploadDialogUnified
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                pastaId={currentPastaId}
                onSuccess={loadItems}
            />

            <CreateFolderDialog
                open={createFolderOpen}
                onOpenChange={setCreateFolderOpen}
                pastaPaiId={currentPastaId}
                onSuccess={loadItems}
            />

            <CreateDocumentDialog
                open={createDocumentOpen}
                onOpenChange={setCreateDocumentOpen}
                pastaId={currentPastaId}
                onSuccess={loadItems}
            />

            {/* Mobile Sheet */}
            {selectedItem && isMobile && (
                <Sheet open={showMobileDetails} onOpenChange={setShowMobileDetails}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Detalhes</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-4">
                            <div className="flex flex-col items-center gap-4">
                                <div className="scale-[2]">{getItemIcon(selectedItem)}</div>
                                <h2 className="text-center font-medium">{getItemName(selectedItem)}</h2>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </div>
    );
}
