"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type Template = {
  id: number;
  template_uuid: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
};

type ListResponse = {
  success?: boolean;
  data?: Template[];
  total?: number;
  error?: string;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    nome: "",
    arquivo_original: "",
    arquivo_nome: "",
    arquivo_tamanho: 0,
    descricao: "",
    ativo: true,
  });

  const filteredTemplates = useMemo(() => {
    if (!search) return templates;
    return templates.filter((t) => t.nome.toLowerCase().includes(search.toLowerCase()) || t.template_uuid.includes(search));
  }, [templates, search]);

  async function loadTemplates() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/formsign-admin/templates");
      const json: ListResponse = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Erro ao carregar templates");
      }
      setTemplates(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast.error(err instanceof Error ? err.message : "Erro ao carregar templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = {
        nome: form.nome,
        descricao: form.descricao || undefined,
        arquivo_original: form.arquivo_original,
        arquivo_nome: form.arquivo_nome,
        arquivo_tamanho: Number(form.arquivo_tamanho),
        ativo: form.ativo,
      };
      const res = await fetch("/api/formsign-admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Erro ao criar template");
      }
      setForm({
        nome: "",
        descricao: "",
        arquivo_original: "",
        arquivo_nome: "",
        arquivo_tamanho: 0,
        ativo: true,
      });
      loadTemplates();
      toast.success("Template criado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast.error(err instanceof Error ? err.message : "Erro ao criar template");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja deletar este template?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/formsign-admin/templates/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Erro ao deletar template");
      }
      loadTemplates();
      toast.success("Template deletado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast.error(err instanceof Error ? err.message : "Erro ao deletar template");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Templates de Assinatura</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre e gerencie templates usados na geração de PDFs assinados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo template</CardTitle>
          <CardDescription>Defina os metadados do template e a URL do PDF base no storage.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Arquivo (URL pública ou presign)</Label>
              <Input
                value={form.arquivo_original}
                onChange={(e) => setForm({ ...form, arquivo_original: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Nome do arquivo</Label>
              <Input
                value={form.arquivo_nome}
                onChange={(e) => setForm({ ...form, arquivo_nome: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Tamanho (bytes)</Label>
              <Input
                type="number"
                value={form.arquivo_tamanho}
                onChange={(e) => setForm({ ...form, arquivo_tamanho: Number(e.target.value) })}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={(value) => setForm({ ...form, ativo: value })} />
              <Label>Ativo</Label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Criar template"}
              </Button>
            </div>
            {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Busca por nome ou UUID.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
            <Button variant="outline" onClick={loadTemplates} disabled={loading}>
              Recarregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>UUID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && filteredTemplates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredTemplates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      Nenhum template encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {filteredTemplates.map((tpl) => (
                  <TableRow key={tpl.template_uuid}>
                    <TableCell>
                      <div className="font-medium">{tpl.nome}</div>
                      {tpl.descricao && <div className="text-xs text-muted-foreground">{tpl.descricao}</div>}
                    </TableCell>
                    <TableCell className="text-xs">{tpl.template_uuid}</TableCell>
                    <TableCell>{tpl.ativo ? "Ativo" : "Inativo"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(tpl.template_uuid)}
                      >
                        Deletar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
