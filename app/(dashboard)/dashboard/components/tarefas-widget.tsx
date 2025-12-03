'use client';

import { useState } from 'react';
import { Plus, CheckCircle, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { useDashboardStore } from '@/_lib/stores/dashboard-store';
import { Tarefa } from '@/_lib/dashboard-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TarefasWidgetProps {
  className?: string;
}

interface FormData {
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  prioridade: number;
  data_prevista: string;
}

export function TarefasWidget({ className }: TarefasWidgetProps) {
  const { tarefas, createTarefa, updateTarefa, deleteTarefa } = useDashboardStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<Tarefa | null>(null);
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    descricao: '',
    status: 'pendente',
    prioridade: 3,
    data_prevista: ''
  });

  const handleCreate = async () => {
    await createTarefa(formData);
    setIsCreating(false);
    setFormData({
      titulo: '',
      descricao: '',
      status: 'pendente',
      prioridade: 3,
      data_prevista: ''
    });
  };

  const _handleUpdate = async () => {
    if (!editingTarefa) return;
    await updateTarefa(editingTarefa.id, formData);
    setEditingTarefa(null);
    setFormData({
      titulo: '',
      descricao: '',
      status: 'pendente',
      prioridade: 3,
      data_prevista: ''
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      await deleteTarefa(id);
    }
  };

  const openEditDialog = (tarefa: Tarefa) => {
    setEditingTarefa(tarefa);
    setFormData({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao || '',
      status: tarefa.status,
      prioridade: tarefa.prioridade,
      data_prevista: tarefa.data_prevista || ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluida':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'em_andamento':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      case 'em_andamento':
        return 'Em Andamento';
      default:
        return 'Pendente';
    }
  };

  const getPriorityColor = (prioridade: number): "default" | "destructive" | "secondary" => {
    if (prioridade >= 4) return 'destructive';
    if (prioridade >= 3) return 'secondary';
    return 'secondary';
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Minhas Tarefas</CardTitle>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
              <DialogDescription>
                Adicione uma nova tarefa à sua lista de afazeres.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Título da tarefa"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as FormData['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Prioridade (1-5)"
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: parseInt(e.target.value) || 3 })}
                min="1"
                max="5"
              />
              <Input
                type="date"
                placeholder="Data prevista"
                value={formData.data_prevista}
                onChange={(e) => setFormData({ ...formData, data_prevista: e.target.value })}
              />
            </div>
            <Button onClick={handleCreate}>Criar Tarefa</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tarefas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma tarefa criada ainda
            </p>
          ) : (
            tarefas.slice(0, 5).map((tarefa) => (
              <div
                key={tarefa.id}
                className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-2 flex-1">
                  {getStatusIcon(tarefa.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tarefa.titulo}</p>
                    {tarefa.descricao && (
                      <p className="text-xs text-muted-foreground truncate">{tarefa.descricao}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getPriorityColor(tarefa.prioridade)} className="text-xs">
                        Prioridade {tarefa.prioridade}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getStatusLabel(tarefa.status)}
                      </span>
                      {tarefa.data_prevista && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(tarefa.data_prevista).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => openEditDialog(tarefa)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(tarefa.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
