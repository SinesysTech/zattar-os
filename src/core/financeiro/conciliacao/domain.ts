export interface Conciliacao {
    id: number;
    data_conciliacao: string;
    saldo_banco: number;
    saldo_sistema: number;
    diferenca: number;
}
