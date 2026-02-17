'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Play, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { listDifyAppsAction, createDifyAppAction, updateDifyAppAction, deleteDifyAppAction, checkDifyAppConnectionAction } from '../actions';
import { toast } from 'sonner';

interface DifyApp {
    id: string;
    name: string;
    api_url: string;
    api_key: string;
    app_type: 'chat' | 'chatflow' | 'workflow' | 'completion' | 'agent';
    is_active: boolean;
    created_at: string;
}

export function DifyAppsList() {
    const [apps, setApps] = useState<DifyApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<DifyApp | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        api_url: 'https://api.dify.ai/v1',
        api_key: '',
        app_type: 'chat'
    });

    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadApps();
    }, []);

    const loadApps = async () => {
        setLoading(true);
        try {
            const data = await listDifyAppsAction();
            setApps(data as Array<DifyApp>);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error('Erro ao listar apps: ' + message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            api_url: 'https://api.dify.ai/v1',
            api_key: '',
            app_type: 'chat'
        });
        setEditingApp(null);
        setTestStatus('idle');
    };

    const handleEdit = (app: DifyApp) => {
        setEditingApp(app);
        setFormData({
            name: app.name,
            api_url: app.api_url,
            api_key: app.api_key,
            app_type: app.app_type
        });
        setTestStatus('idle'); // Reset test status on edit
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este app?')) return;
        try {
            await deleteDifyAppAction(id);
            toast.success('App removido com sucesso.');
            loadApps();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error('Erro ao remover app: ' + message);
        }
    };

    const handleTestConnection = async () => {
        setSaving(true);
        try {
            const result = await checkDifyAppConnectionAction(formData.api_url, formData.api_key);
            if (result.success) {
                setTestStatus('success');
                toast.success('Conexão bem sucedida!');
            } else {
                setTestStatus('error');
                toast.error('Falha na conexão: ' + result.message);
            }
        } catch (error: unknown) {
            setTestStatus('error');
            const message = error instanceof Error ? error.message : String(error);
            toast.error('Erro ao testar: ' + message);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.api_key || !formData.api_url) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }

        setSaving(true);
        try {
            if (editingApp) {
                await updateDifyAppAction(editingApp.id, formData);
                toast.success('App atualizado com sucesso.');
            } else {
                await createDifyAppAction(formData);
                toast.success('App criado com sucesso.');
            }
            setIsDialogOpen(false);
            loadApps();
            resetForm();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error('Erro ao salvar: ' + message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Seus Apps Dify</h3>
                    <p className="text-sm text-muted-foreground">Gerencie seus chatbots e workflows conectados.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Adicionar App</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-125">
                        <DialogHeader>
                            <DialogTitle>{editingApp ? 'Editar App' : 'Novo App Dify'}</DialogTitle>
                            <DialogDescription>Conecte um novo aplicativo do Dify fornecendo a chave de API.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome do App</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Assistente Jurídico" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select value={formData.app_type} onValueChange={v => setFormData({ ...formData, app_type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="chat">Chatbot</SelectItem>
                                            <SelectItem value="chatflow">Chatflow</SelectItem>
                                            <SelectItem value="workflow">Workflow</SelectItem>
                                            <SelectItem value="agent">Agente</SelectItem>
                                            <SelectItem value="completion">Text Generator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>API URL</Label>
                                    <Input value={formData.api_url} onChange={e => setFormData({ ...formData, api_url: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>API Key</Label>
                                <div className="flex gap-2">
                                    <Input type="password" value={formData.api_key} onChange={e => setFormData({ ...formData, api_key: e.target.value })} placeholder="app-..." />
                                    <Button variant="outline" size="icon" onClick={handleTestConnection} disabled={saving} title="Testar Conexão">
                                        {testStatus === 'success' ? <CheckCircle className="text-green-500 h-4 w-4" /> :
                                            testStatus === 'error' ? <XCircle className="text-red-500 h-4 w-4" /> :
                                                <Play className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">Carregando apps...</div>
                ) : apps.length === 0 ? (
                    <div className="col-span-full text-center py-12 border rounded-lg bg-muted/20">
                        <p className="text-muted-foreground">Nenhum app configurado.</p>
                        <Button variant="link" onClick={() => setIsDialogOpen(true)}>Adicionar o primeiro</Button>
                    </div>
                ) : (
                    apps.map(app => (
                        <Card key={app.id}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-base truncate" title={app.name}>{app.name}</CardTitle>
                                    <span className="text-xs px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{app.app_type}</span>
                                </div>
                                <CardDescription className="text-xs truncate">{app.api_url}</CardDescription>
                            </CardHeader>
                            <CardFooter className="pt-2 flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(app)}><Edit2 className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(app.id)}><Trash2 className="h-3 w-3" /></Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
