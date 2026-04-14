import type { Usuario } from '../../domain';

export interface CompletenessItem {
  key: string;
  label: string;
  done: boolean;
}

const CARGO_COM_OAB = ['advogado', 'advogada', 'diretor'];

function isCargoComOAB(usuario: Usuario): boolean {
  const nome = usuario.cargo?.nome?.toLowerCase().trim() ?? '';
  return CARGO_COM_OAB.includes(nome);
}

export function calcularCompleteness(usuario: Usuario): {
  items: CompletenessItem[];
  score: number;
  total: number;
  completed: number;
} {
  const items: CompletenessItem[] = [
    {
      key: 'avatar',
      label: 'Foto de perfil',
      done: Boolean(usuario.avatarUrl),
    },
    {
      key: 'telefone',
      label: 'Telefone',
      done: Boolean(usuario.telefone),
    },
    {
      key: 'endereco',
      label: 'Endereço',
      done: Boolean(
        usuario.endereco?.logradouro &&
          usuario.endereco?.cidade &&
          usuario.endereco?.estado,
      ),
    },
    {
      key: 'emailPessoal',
      label: 'E-mail pessoal',
      done: Boolean(usuario.emailPessoal),
    },
    {
      key: 'dataNascimento',
      label: 'Data de nascimento',
      done: Boolean(usuario.dataNascimento),
    },
    {
      key: 'rg',
      label: 'RG',
      done: Boolean(usuario.rg),
    },
  ];

  if (isCargoComOAB(usuario)) {
    items.push({
      key: 'oab',
      label: 'OAB',
      done: Boolean(usuario.oab && usuario.ufOab),
    });
  }

  const total = items.length;
  const completed = items.filter((item) => item.done).length;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { items, score, total, completed };
}

export function getCompletenessColor(
  score: number,
): 'success' | 'warning' | 'destructive' {
  if (score >= 70) return 'success';
  if (score >= 30) return 'warning';
  return 'destructive';
}

export function getCompletenessColorClass(score: number): string {
  const color = getCompletenessColor(score);
  return `text-${color}`;
}
