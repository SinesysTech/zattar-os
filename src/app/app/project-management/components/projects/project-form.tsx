"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  STATUS_PROJETO_LABELS,
  STATUS_PROJETO_VALUES,
  PRIORIDADE_LABELS,
  PRIORIDADE_VALUES,
  type Projeto,
  type StatusProjeto,
  type Prioridade,
} from "../../lib/domain";
import {
  actionCriarProjeto,
  actionAtualizarProjeto,
} from "../../lib/actions";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(255),
  descricao: z.string().max(5000).optional(),
  status: z.enum(STATUS_PROJETO_VALUES),
  prioridade: z.enum(PRIORIDADE_VALUES),
  dataInicio: z.string().optional(),
  dataPrevisaoFim: z.string().optional(),
  clienteId: z.string().optional(),
  responsavelId: z.string().min(1, "Responsável é obrigatório"),
  orcamento: z.string().optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  projeto?: Projeto;
  clientes: ComboboxOption[];
  usuarios: ComboboxOption[];
  usuarioAtualId: number;
}

export function ProjectForm({
  projeto,
  clientes,
  usuarios,
  usuarioAtualId,
}: ProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const isEditing = !!projeto;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: projeto?.nome ?? "",
      descricao: projeto?.descricao ?? "",
      status: projeto?.status ?? "planejamento",
      prioridade: projeto?.prioridade ?? "media",
      dataInicio: projeto?.dataInicio ?? "",
      dataPrevisaoFim: projeto?.dataPrevisaoFim ?? "",
      clienteId: projeto?.clienteId?.toString() ?? "",
      responsavelId:
        projeto?.responsavelId?.toString() ?? usuarioAtualId.toString(),
      orcamento: projeto?.orcamento?.toString() ?? "",
      tags: projeto?.tags?.join(", ") ?? "",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const payload = {
        nome: values.nome,
        descricao: values.descricao || null,
        status: values.status as StatusProjeto,
        prioridade: values.prioridade as Prioridade,
        dataInicio: values.dataInicio || null,
        dataPrevisaoFim: values.dataPrevisaoFim || null,
        clienteId: values.clienteId ? Number(values.clienteId) : null,
        responsavelId: Number(values.responsavelId),
        orcamento: values.orcamento ? Number(values.orcamento) : null,
        tags: values.tags
          ? values.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };

      let result;
      if (isEditing) {
        result = await actionAtualizarProjeto(projeto.id, payload);
      } else {
        result = await actionCriarProjeto(payload, usuarioAtualId);
      }

      if (result.success) {
        router.push(
          isEditing
            ? `/app/project-management/projects/${projeto.id}`
            : "/app/project-management/projects"
        );
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Editar Projeto" : "Novo Projeto"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nome <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do projeto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o projeto..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_PROJETO_VALUES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_PROJETO_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORIDADE_VALUES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {PRIORIDADE_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="clienteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Combobox
                        options={clientes}
                        value={field.value ? [field.value] : []}
                        onValueChange={(vals) =>
                          field.onChange(vals[0] ?? "")
                        }
                        placeholder="Selecione o cliente..."
                        searchPlaceholder="Buscar cliente..."
                        emptyText="Nenhum cliente encontrado."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Responsável{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        options={usuarios}
                        value={field.value ? [field.value] : []}
                        onValueChange={(vals) =>
                          field.onChange(vals[0] ?? "")
                        }
                        placeholder="Selecione o responsável..."
                        searchPlaceholder="Buscar usuário..."
                        emptyText="Nenhum usuário encontrado."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataPrevisaoFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previsão de Conclusão</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="orcamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orçamento (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Separadas por vírgula..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Salvar Alterações" : "Criar Projeto"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
