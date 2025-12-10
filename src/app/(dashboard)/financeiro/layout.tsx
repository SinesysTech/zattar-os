import Link from 'next/link';

const abas = [
  { href: '/financeiro', label: 'Dashboard' },
  { href: '/financeiro/contas-pagar', label: 'Contas a Pagar' },
  { href: '/financeiro/contas-receber', label: 'Contas a Receber' },
  { href: '/financeiro/plano-contas', label: 'Plano de Contas' },
  { href: '/financeiro/dre', label: 'DRE' },
  { href: '/financeiro/orcamentos', label: 'Orçamentos' },
  { href: '/financeiro/conciliacao-bancaria', label: 'Conciliação' },
  { href: '/financeiro/obrigacoes', label: 'Obrigações' },
];

export default function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2">
        {abas.map((aba) => (
          <Link
            key={aba.href}
            href={aba.href}
            className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            {aba.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
