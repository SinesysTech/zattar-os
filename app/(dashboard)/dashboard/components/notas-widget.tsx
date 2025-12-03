'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useDashboardStore } from '@/_lib/stores/dashboard-store';
import { Nota } from '@/_lib/dashboard-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface NotasWidgetProps {
  className?: string;
}

export function NotasWidget({ className }: NotasWidgetProps) {
  const { notas, createNota, updateNota, deleteNota } = useDashboardStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingNota, setEditingNota] = useState<Nota | null>(null);
  const initialForm = { titulo: '', conteudo: '', etiquetas: [] as string[] };
  const [formData, setFormData] = useState(initialForm);
  const [newTag, setNewTag] = useState('');

  const handleCreate = async () => {
    if (editingNota) {
      await updateNota(editingNota.id, formData);
    } else {
      await createNota(formData);
    }
    setIsCreating(false);
    setEditingNota(null);
    setFormData(initialForm);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      await deleteNota(id);
    }
  };

  const openEditDialog = (nota: Nota) => {
    setEditingNota(nota);
    setIsCreating(true);
    setFormData({
      titulo: nota.titulo,
      conteudo: nota.conteudo || '',
      etiquetas: nota.etiquetas || []
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.etiquetas.includes(newTag.trim())) {
      setFormData({ ...formData, etiquetas: [...formData.etiquetas, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, etiquetas: formData.etiquetas.filter(tag => tag !== tagToRemove) });
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Notas Rápidas</CardTitle>
        <Dialog
          open={isCreating}
          onOpenChange={(open) => {
            setIsCreating(open);
            if (!open) {
              setEditingNota(null);
              setFormData(initialForm);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Nota</DialogTitle>
              <DialogDescription>
                Crie uma nota rápida para anotações importantes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Título da nota"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              />
              <Textarea
                placeholder="Conteúdo da nota"
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                rows={4}
              />
              <div>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Adicionar etiqueta"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.etiquetas.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={handleCreate}>Criar Nota</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {notas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma nota criada ainda
            </p>
          ) : (
            notas.slice(0, 4).map((nota) => (
              <div
                key={nota.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => openEditDialog(nota)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{nota.titulo}</h4>
                    {nota.conteudo && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {nota.conteudo}
                      </p>
                    )}
                    {nota.etiquetas && nota.etiquetas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {nota.etiquetas.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(nota);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(nota.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
