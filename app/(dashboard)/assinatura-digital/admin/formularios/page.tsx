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

type Segmento = { id: number; nome: string };
type Formulario = {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  segmento_id: number;
  ativo: boolean;
};

export default function FormulariosPage() {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    nome: "",
    slug: "",
    segmento_id: "",
    descricao: "",
    ativo: true,
  });

  const filtered = useMemo(() => {
    if (!search) return formularios;
    return formularios.filter(
      (f) => f.nome.toLowerCase().includes(search.toLowerCase()) || f.slug.toLowerCase().includes(search.toLowerCase())
    );
  }, [formularios, search]);

  async function loadSegmentos() {
    const res = await fetch("/api/assinatura-digital/admin/segmentos");
    const json = await res.json();
    if (res.ok && json.data) {
      setSegmentos(json.data.map((s: any) => ({ id: s.id, nome: s.nome })));
    }
  }

  async function loadFormularios() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assinatura-digital/admin/formularios");
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Erro ao carregar formulários");
      setFormularios(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast.error(err instanceof Error ? err.message : "Erro ao carregar formulários");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSegmentos();
    loadFormularios();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/assinatura-digital/admin/formularios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          slug: form.slug,
          descricao: form.descricao || undefined,
          segmento_id: Number(form.segmento_id),
          ativo: form.ativo,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Erro ao criar formulário");
      setForm({ nome: "", slug: "", descricao: "", segmento_id: "", ativo: true });
      loadFormularios();
      toast.success("Formulário criado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast.error(err instanceof Error ? err.message : "Erro ao criar formulário");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Formulários</h1>
        <p className="text-sm text-muted-foreground">Cadastre formulários e vincule a um segmento.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo formulário</CardTitle>
          <CardDescription>Defina nome, slug e segmento.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label>Segmento</Label>
              <select
                className="border rounded px-2 py-2 bg-background"
                value={form.segmento_id}
                onChange={(e) => setForm({ ...form, segmento_id: e.target.value })}
                required
              >
                <option value="">Selecione</option>
                {segmentos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
              <Label>Ativo</Label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Criar formulário"}
              </Button>
            </div>
            {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Formulários</CardTitle>
            <CardDescription>Busca por nome ou slug.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
            <Button variant="outline" onClick={loadFormularios} disabled={loading}>
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
                  <TableHead>Slug</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      Nenhum formulário encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((f) => (
                  <TableRow key={f.formulario_uuid}>
                    <TableCell>
                      <div className="font-medium">{f.nome}</div>
                      {f.formulario_uuid && (
                        <div className="text-xs text-muted-foreground">{f.formulario_uuid}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{f.slug}</TableCell>
                    <TableCell>#{f.segmento_id}</TableCell>
                    <TableCell>{f.ativo ? "Ativo" : "Inativo"}</TableCell>
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
