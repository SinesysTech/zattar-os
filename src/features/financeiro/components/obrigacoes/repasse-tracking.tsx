'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParcelaObrigacao } from '../../types/obrigacoes';

interface RepasseTrackingProps {
    parcela: ParcelaObrigacao;
    onRegistrarDeclaracao?: () => void;
    onRegistrarComprovante?: () => void;
}

export function RepasseTracking({ parcela, onRegistrarDeclaracao, onRegistrarComprovante }: RepasseTrackingProps) {
    // Definir passos
    const passos = [
        { id: 'pendente', label: 'Aguardando Recebimento', icon: Clock },
        { id: 'declaracao', label: 'Declaração Emitida', icon: FileText },
        { id: 'repassado', label: 'Repasse Efetuado', icon: CheckCircle },
    ];

    const currentStepIndex = passos.findIndex(p => {
        if (parcela.statusRepasse === 'nao_aplicavel') return false;
        if (parcela.statusRepasse === 'repassado') return p.id === 'repassado';
        if (parcela.statusRepasse === 'pendente_transferencia') return p.id === 'declaracao';
        return p.id === 'pendente';
    });

    // Simplification for demo
    const activeIndex = parcela.statusRepasse === 'repassado' ? 2 : parcela.statusRepasse === 'pendente_transferencia' ? 1 : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Status do Repasse ao Cliente</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    {passos.map((step, index) => {
                        const isActive = index <= activeIndex;
                        const isCurrent = index === activeIndex;
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2">
                                <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border-2",
                                    isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-muted text-muted-foreground"
                                )}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span className={cn("text-xs font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    {activeIndex === 0 && (
                        <Button variant="outline" size="sm" onClick={onRegistrarDeclaracao} disabled={parcela.status !== 'recebida'}>
                            <FileText className="mr-2 h-4 w-4" />
                            Gerar Declaração
                        </Button>
                    )}
                    {activeIndex === 1 && (
                        <Button variant="outline" size="sm" onClick={onRegistrarComprovante}>
                            <Upload className="mr-2 h-4 w-4" />
                            Anexar Comprovante
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
