import { notFound } from 'next/navigation';
import { carregarContextoPublico } from '@/shared/prestacao-contas/service';
import { buscarDadosBancariosAtivos } from '@/shared/prestacao-contas/repository';
import { PrestacaoContasFlow } from './_components/PrestacaoContasFlow';

interface PageProps {
  params: Promise<{ token: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Prestação de Contas',
    description: 'Declaração de prestação de contas para assinatura digital.',
  };
}

export default async function PrestacaoContasPage({ params }: PageProps) {
  const { token } = await params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token,
    )
  ) {
    notFound();
  }

  let ctx: Awaited<ReturnType<typeof carregarContextoPublico>>;
  try {
    ctx = await carregarContextoPublico(token);
  } catch {
    notFound();
  }

  const dadosAtivos = await buscarDadosBancariosAtivos(ctx.clienteId).catch(
    () => null,
  );

  return (
    <PrestacaoContasFlow
      token={token}
      clienteNome={ctx.clienteNome}
      clienteCpfMascara={maskCpf(ctx.clienteCpf)}
      dadosBancariosAtivos={dadosAtivos}
      jaAssinado={ctx.jaAssinado}
      linkExpirado={ctx.linkExpirado}
      templateMarkdown={ctx.templateMarkdown}
    />
  );
}

function maskCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}
