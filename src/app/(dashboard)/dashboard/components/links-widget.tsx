'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, ExternalLink, GripVertical } from 'lucide-react';
import { useDashboardStore } from '@/_lib/stores/dashboard-store';
import { LinkPersonalizado } from '@/_lib/dashboard-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LinksWidgetProps {
  className?: string;
}

export function LinksWidget({ className }: LinksWidgetProps) {
  const { linksPersonalizados, createLink, updateLink, deleteLink } = useDashboardStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkPersonalizado | null>(null);
  const initialForm = { titulo: '', url: '', icone: '', ordem: 0 };
  const [formData, setFormData] = useState(initialForm);

  const handleCreate = async () => {
    if (editingLink) {
      await updateLink(editingLink.id, formData);
    } else {
      const maxOrder = Math.max(...linksPersonalizados.map(l => l.ordem), -1);
      await createLink({ ...formData, ordem: maxOrder + 1 });
    }
    setIsCreating(false);
    setEditingLink(null);
    setFormData(initialForm);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este link?')) {
      await deleteLink(id);
    }
  };

  const openEditDialog = (link: LinkPersonalizado) => {
    setEditingLink(link);
    setIsCreating(true);
    setFormData({
      titulo: link.titulo,
      url: link.url,
      icone: link.icone || '',
      ordem: link.ordem
    });
  };

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Links Úteis</CardTitle>
        <Dialog
          open={isCreating}
          onOpenChange={(open) => {
            setIsCreating(open);
            if (!open) {
              setEditingLink(null);
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
              <DialogTitle>Novo Link</DialogTitle>
              <DialogDescription>
                Adicione um link útil para acesso rápido.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  placeholder="Nome do link"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://exemplo.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="icone">Ícone (opcional)</Label>
                <Input
                  id="icone"
                  placeholder="lucide-icon-name"
                  value={formData.icone}
                  onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleCreate}>Criar Link</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {linksPersonalizados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center w-full py-4">
              Nenhum link criado ainda
            </p>
          ) : (
            linksPersonalizados.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-move" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-sm font-medium"
                  onClick={() => openLink(link.url)}
                >
                  {link.titulo}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => openEditDialog(link)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(link.id)}
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
