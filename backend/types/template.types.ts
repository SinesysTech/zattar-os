/**
 * Tipos principais usados no mapeamento de templates de PDF do Formsign.
 * São reduzidos ao essencial para renderização de campos no gerador.
 */

export type TipoCampo =
  | 'texto'
  | 'cpf'
  | 'cnpj'
  | 'data'
  | 'telefone'
  | 'endereco'
  | 'assinatura'
  | 'foto'
  | 'sistema'
  | 'segmento'
  | 'texto_composto';

export type TipoVariavel = string;

export interface PosicaoCampo {
  x: number;
  y: number;
  width: number;
  height: number;
  pagina: number;
}

export interface EstiloCampo {
  fonte?: string;
  tamanho_fonte?: number;
  cor?: string;
  negrito?: boolean;
  italico?: boolean;
  alinhamento?: 'left' | 'center' | 'right';
}

export interface ConteudoComposto {
  json: Record<string, unknown>;
  template: string;
}

export interface TemplateCampo {
  id: string;
  template_id: string;
  nome: string;
  variavel?: TipoVariavel;
  tipo: TipoCampo;
  posicao: PosicaoCampo;
  estilo?: EstiloCampo;
  obrigatorio: boolean;
  formato?: string;
  valor_padrao?: string;
  ordem?: number;
  condicional?: {
    variavel: TipoVariavel;
    operador: '=' | '!=' | '>' | '<' | 'contains';
    valor: string;
  };
  conteudo_composto?: ConteudoComposto;
  criado_em?: Date;
  atualizado_em?: Date;
}
