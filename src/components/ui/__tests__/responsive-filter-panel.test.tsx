/**
 * Tests for ResponsiveFilterPanel component
 * 
 * Feature: responsividade-frontend, Property 55: List filters collapsible
 * Validates: Requirements 12.3
 */

import * as React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResponsiveFilterPanel } from '@/components/ui/responsive-filter-panel'

// Mock the useIsMobile hook
const mockUseIsMobile = jest.fn()
jest.mock('@/hooks/use-breakpoint', () => ({
    useIsMobile: () => mockUseIsMobile(),
}))

const mockFilterGroups = [
    {
        label: 'Status',
        options: [
            { value: 'ativo', label: 'Ativo' },
            { value: 'inativo', label: 'Inativo' },
        ],
    },
    {
        label: 'Tipo',
        options: [
            { value: 'tipo1', label: 'Tipo 1' },
            { value: 'tipo2', label: 'Tipo 2' },
        ],
    },
]

describe('ResponsiveFilterPanel', () => {
    const mockOnFiltersChange = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        mockUseIsMobile.mockClear()
    })

    describe('Desktop behavior', () => {
        beforeEach(() => {
            mockUseIsMobile.mockReturnValue(false)
        })

        it('should render filters inline on desktop', () => {
            render(
                <ResponsiveFilterPanel
                    filterGroups={mockFilterGroups}
                    selectedFilters={[]}
                    onFiltersChange={mockOnFiltersChange}
                />
            )

            // Should show filter groups directly
            expect(screen.getByText('Status')).toBeInTheDocument()
            expect(screen.getByText('Tipo')).toBeInTheDocument()
            expect(screen.getByText('Ativo')).toBeInTheDocument()
            expect(screen.getByText('Inativo')).toBeInTheDocument()
        })

        it('should show clear button when filters are selected on desktop', () => {
            render(
                <ResponsiveFilterPanel
                    filterGroups={mockFilterGroups}
                    selectedFilters={['ativo']}
                    onFiltersChange={mockOnFiltersChange}
                />
            )

            expect(screen.getByText(/Limpar \(1\)/)).toBeInTheDocument()
        })

        it('should call onFiltersChange when filter is toggled on desktop', () => {
            render(
                <ResponsiveFilterPanel
                    filterGroups={mockFilterGroups}
                    selectedFilters={[]}
                    onFiltersChange={mockOnFiltersChange}
                />
            )

            const ativoCheckbox = screen.getByLabelText('Ativo')
            fireEvent.click(ativoCheckbox)

            expect(mockOnFiltersChange).toHaveBeenCalledWith(['ativo'])
        })
    })

    describe('Mobile behavior', () => {
        beforeEach(() => {
            mockUseIsMobile.mockReturnValue(true)
        })

        it('should render filter button on mobile', () => {
            render(
                <ResponsiveFilterPanel
                    filterGroups={mockFilterGroups}
                    selectedFilters={[]}
                    onFiltersChange={mockOnFiltersChange}
                />
            )

            // Should show "Filtros" button
            expect(screen.getByRole('button', { name: /Filtros/i })).toBeInTheDocument()
        })

        it('should show badge with filter count on mobile', () => {
            render(
                <ResponsiveFilterPanel
                    filterGroups={mockFilterGroups}
                    selectedFilters={['ativo', 'tipo1']}
                    onFiltersChange={mockOnFiltersChange}
                />
            )

            // Should show badge with count
            expect(screen.getByText('2')).toBeInTheDocument()
        })
    })

    describe('Filter interactions', () => {
        it('should clear all filters when clear button is clicked', () => {
            mockUseIsMobile.mockReturnValue(false)

            render(
                <ResponsiveFilterPanel
                    filterGroups={mockFilterGroups}
                    selectedFilters={['ativo', 'tipo1']}
                    onFiltersChange={mockOnFiltersChange}
                />
            )

            const clearButton = screen.getByText(/Limpar \(2\)/)
            fireEvent.click(clearButton)

            expect(mockOnFiltersChange).toHaveBeenCalledWith([])
        })

        it('should toggle filter selection correctly', () => {
            mockUseIsMobile.mockReturnValue(false)

            render(
                <ResponsiveFilterPanel
                    filterGroups={mockFilterGroups}
                    selectedFilters={['ativo']}
                    onFiltersChange={mockOnFiltersChange}
                />
            )

            // Unselect 'ativo'
            const ativoCheckbox = screen.getByLabelText('Ativo')
            fireEvent.click(ativoCheckbox)

            expect(mockOnFiltersChange).toHaveBeenCalledWith([])

            // Select 'tipo1' (with 'ativo' already selected)
            mockOnFiltersChange.mockClear()
            const tipo1Checkbox = screen.getByLabelText('Tipo 1')
            fireEvent.click(tipo1Checkbox)

            expect(mockOnFiltersChange).toHaveBeenCalledWith(['ativo', 'tipo1'])
        })
    })
})
