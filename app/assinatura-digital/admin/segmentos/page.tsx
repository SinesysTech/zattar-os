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

type Segmento = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo: boolean;
};

export default function SegmentosPage() {
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    nome: "",
    slug: "",
    descricao: "",
    ativo: true,
  });

  const filtered = useMemo(() => {
    if (!search) return segmentos;
    return segmentos.filter((s) => s.nome.toLowerCase().includes(search.toLowerCase()) || s.slug.includes(search));
  }, [segmentos, search]);

  async function loadSegmentos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assinatura-digital/admin/segmentos");
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Erro ao carregar segmentos");
      setSegmentos(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast.error(err instanceof Error ? err.message : "Erro ao carregar segmentos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSegmentos();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/assinatura-digital/admin/segmentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          slug: form.slug,
          descricao: form.descricao || undefined,
          ativo: form.ativo,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Erro ao criar segmento");
      setForm({ nome: "", slug: "", descricao: "", ativo: true });
      loadSegmentos();
      toast.success("Segmento criado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast.error(err instanceof Error ? err.message : "Erro ao criar segmento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Segmentos</h1>
        <p className="text-sm text-muted-foreground">Cadastre segmentos de negócio para os formulários.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo segmento</CardTitle>
          <CardDescription>Defina nome e slug do segmento.</CardDescription>
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
                {loading ? "Salvando..." : "Criar segmento"}
              </Button>
            </div>
            {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Segmentos</CardTitle>
            <CardDescription>Busca por nome ou slug.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
            <Button variant="outline" onClick={loadSegmentos} disabled={loading}>
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
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm text-muted-foreground">
                      Nenhum segmento encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((seg) => (
                  <TableRow key={seg.id}>
                    <TableCell>
                      <div className="font-medium">{seg.nome}</div>
                      {seg.descricao && <div className="text-xs text-muted-foreground">{seg.descricao}</div>}
                    </TableCell>
                    <TableCell className="text-xs">{seg.slug}</TableCell>
                    <TableCell>{seg.ativo ? "Ativo" : "Inativo"}</TableCell>
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
