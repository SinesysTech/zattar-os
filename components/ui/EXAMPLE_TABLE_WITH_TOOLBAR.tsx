/**
 * EXEMPLO DE USO DO COMPONENTE UNIFICADO TableWithToolbar
 * 
 * Este arquivo mostra como usar o componente TableWithToolbar
 * para substituir o padrão antigo de TableToolbar + ResponsiveTable separados.
 * 
 * Baseado na página de usuários (/app/(dashboard)/usuarios/page.tsx)
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { TableWithToolbar, type ResponsiveTableColumn } from '@/components/ui/table-with-toolbar';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { buildUsuariosFilterOptions, buildUsuariosFilterGroups, parseUsuariosFilters } from '@/app/(dashboard)/usuarios/components/usuarios-toolbar-filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Settings, KeyRound } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import type { UsuariosFilters } from '@/app/_lib/types/usuarios';
import {
    formatarCpf,
    formatarTelefone,
    formatarOab,
    formatarNomeExibicao,
} from '@/app/_lib/utils/format-usuarios';

/**
 * Define as colunas da tabela de usuários
 */
function criarColunas(
    onRedefinirSenha: (usuario: Usuario) => void
): ResponsiveTableColumn<Usuario>[] {
    return [
        {
            accessorKey: 'nomeExibicao',
            header: ({ column }) => (
                <div className="flex items-center justify-start">
                    <DataTableColumnHeader column={column} title="Nome" />
                </div>
            ),
            enableSorting: true,
            size: 250,
            priority: 1,
            sticky: true,
            cardLabel: 'Nome',
            meta: { align: 'left' },
            cell: ({ row }) => (
                <div className="min-h-10 flex items-center justify-start text-sm">
                    {formatarNomeExibicao(row.getValue('nomeExibicao'))}
                </div>
            ),
        },
        {
            accessorKey: 'emailCorporativo',
            header: ({ column }) => (
                <div className="flex items-center justify-start">
                    <DataTableColumnHeader column={column} title="E-mail" />
                </div>
            ),
            enableSorting: true,
            size: 200,
            priority: 2,
            cardLabel: 'E-mail',
            meta: { align: 'left' },
            cell: ({ row }) => (
                <div className="min-h-10 flex items-center justify-start text-sm">
                    {row.getValue('emailCorporativo')}
                </div>
            ),
        },
        {
            accessorKey: 'cpf',
            header: () => (
                <div className="flex items-center justify-center">
                    <div className="text-sm font-medium">CPF</div>
                </div>
            ),
            enableSorting: false,
            size: 150,
            priority: 5,
            cardLabel: 'CPF',
            cell: ({ row }) => (
                <div className="min-h-10 flex items-center justify-center text-sm">
                    {formatarCpf(row.getValue('cpf'))}
                </div>
            ),
        },
        {
            accessorKey: 'ativo',
            header: ({ column }) => (
                <div className="flex items-center justify-center">
                    <DataTableColumnHeader column={column} title="Status" />
                </div>
            ),
            enableSorting: true,
            size: 100,
            priority: 3,
            cardLabel: 'Status',
            cell: ({ row }) => {
                const ativo = row.getValue('ativo') as boolean;
                return (
                    <div className="min-h-10 flex items-center justify-center">
                        <Badge tone={ativo ? 'success' : 'neutral'} variant={ativo ? 'soft' : 'outline'}>
                            {ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                    </div>
                );
            },
        },
    ];
}

/**
 * EXEMPLO: Página de usuários usando TableWithToolbar
 */
export default function ExemploUsuariosPage() {
    const router = useRouter();

    // Estados de busca e filtros
    const [busca, setBusca] = React.useState('');
    const [pagina, setPagina] = React.useState(0);
    const [limite, setLimite] = React.useState(50);
    const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>(['ativo_true']);

    // Estados de dialogs
    const [createOpen, setCreateOpen] = React.useState(false);
    const [cargosManagementOpen, setCargosManagementOpen] = React.useState(false);
    const [redefinirSenhaOpen, setRedefinirSenhaOpen] = React.useState(false);

    // Preparar opções e grupos de filtros
    const filterOptions = React.useMemo(() => buildUsuariosFilterOptions(), []);
    const filterGroups = React.useMemo(() => buildUsuariosFilterGroups(), []);

    // Debounce da busca
    const buscaDebounced = useDebounce(busca, 500);
    const isSearching = busca !== buscaDebounced && busca.length > 0;

    // Handler para mudança de filtros
    const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
        setSelectedFilterIds(selectedIds);
        const newFilters = parseUsuariosFilters(selectedIds);
        setFiltros(newFilters);
        setPagina(0);
    }, []);

    const handleRedefinirSenha = React.useCallback((usuario: Usuario) => {
        // Lógica para redefinir senha
        console.log('Redefinir senha para:', usuario.nomeExibicao);
    }, []);

    // Colunas da tabela
    const colunas = React.useMemo(() => criarColunas(handleRedefinirSenha), [handleRedefinirSenha]);

    // Dados mockados para exemplo
    const usuarios: Usuario[] = [];
    const isLoading = false;
    const error = null;
    const total = 0;
    const totalPaginas = 0;

    return (
        <div className="space-y-3">
            {/* 
        ✨ COMPONENTE UNIFICADO TableWithToolbar
        
        Substitui o padrão antigo de:
        <div className="space-y-4">
          <TableToolbar ... />
          <ResponsiveTable ... />
        </div>
        
        Por um único componente que integra toolbar + tabela
      */}
            <TableWithToolbar
                // ===== DADOS E COLUNAS =====
                data={usuarios}
                columns={colunas}

                // ===== BUSCA =====
                searchValue={busca}
                onSearchChange={(value) => {
                    setBusca(value);
                    setPagina(0);
                }}
                isSearching={isSearching}
                searchPlaceholder="Buscar por nome, CPF ou e-mail..."

                // ===== FILTROS =====
                filterOptions={filterOptions}
                filterGroups={filterGroups}
                selectedFilters={selectedFilterIds}
                onFiltersChange={handleFilterIdsChange}
                filterButtonsMode="buttons" // "single" | "buttons" | "panel"

                // ===== BOTÃO DE CRIAR =====
                onNewClick={() => setCreateOpen(true)}
                newButtonTooltip="Novo Usuário"

                // ===== BOTÕES EXTRAS NA TOOLBAR =====
                extraButtons={
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCargosManagementOpen(true)}
                                aria-label="Gerenciar Cargos"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Gerenciar Cargos
                        </TooltipContent>
                    </Tooltip>
                }

                // ===== PAGINAÇÃO (server-side) =====
                pagination={{
                    pageIndex: pagina,
                    pageSize: limite,
                    total: total,
                    totalPages: totalPaginas,
                    onPageChange: setPagina,
                    onPageSizeChange: setLimite,
                }}

                // ===== ESTADOS =====
                isLoading={isLoading}
                error={error}

                // ===== CONFIGURAÇÕES RESPONSIVAS =====
                mobileLayout="cards" // "cards" | "scroll"
                stickyFirstColumn={true}
                emptyMessage="Nenhum usuário encontrado."

                // ===== AÇÕES DE LINHA (mobile) =====
                rowActions={[
                    {
                        label: 'Visualizar',
                        icon: <Eye className="h-4 w-4" />,
                        onClick: (usuario: Usuario) => {
                            router.push(`/usuarios/${usuario.id}`);
                        },
                    },
                    {
                        label: 'Redefinir Senha',
                        icon: <KeyRound className="h-4 w-4" />,
                        onClick: handleRedefinirSenha,
                    },
                ]}

            // ===== CUSTOMIZAÇÃO DE ESTILOS (opcional) =====
            // className="espaçamento-custom"
            // toolbarClassName="estilos-toolbar"
            // tableClassName="estilos-tabela"
            />

            {/* Resto dos dialogs e componentes auxiliares */}
        </div>
    );
}

/**
 * BENEFÍCIOS DO COMPONENTE UNIFICADO:
 * 
 * 1. ✅ Consistência Visual Total
 *    - Todos os estilos vêm do mesmo componente
 *    - Mudanças de design são aplicadas em todas as tabelas automaticamente
 * 
 * 2. ✅ Menos Código Repetitivo
 *    - Antes: ~20 linhas (toolbar + tabela + wrapper)
 *    - Depois: 1 componente com todas as props
 * 
 * 3. ✅ Manutenção Centralizada
 *    - Ajustes de espaçamento em um único lugar
 *    - Atualizações de tema aplicadas automaticamente
 * 
 * 4. ✅ Tipagem Completa
 *    - Todos os tipos exportados
 *    - Autocomplete do TypeScript funciona perfeitamente
 * 
 * 5. ✅ Todas as Features Mantidas
 *    - Busca com debounce
 *    - Filtros (3 modos: single, buttons, panel)
 *    - Paginação server-side
 *    - Ordenação server-side
 *    - Seleção de linhas
 *    - Ações de linha
 *    - Layout responsivo
 *    - Estados de loading/erro
 *    - Empty states
 */
