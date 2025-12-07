# Exportações Financeiras

## Formatos Suportados
- PDF para relatórios completos.
- CSV (aceito pelo Excel) para dados tabulares.
- Excel (via CSV) em orçamentos específicos.

## Endpoints
- `GET /api/financeiro/plano-contas/exportar?formato=pdf|csv`
- `GET /api/financeiro/contas-pagar/exportar?formato=pdf|csv`
- `GET /api/financeiro/contas-receber/exportar?formato=pdf|csv`
- `GET /api/financeiro/conciliacao-bancaria/exportar?formato=pdf|csv`
- `GET /api/financeiro/orcamentos/{id}/exportar?formato=pdf|csv|excel`

## Permissões
- `plano_contas:exportar`
- `contas_pagar:exportar`
- `contas_receber:exportar`
- `conciliacao_bancaria:exportar`
- `orcamentos:exportar`

## Exemplos
```http
GET /api/financeiro/contas-pagar/exportar?formato=csv&status=pendente
```

```http
GET /api/financeiro/conciliacao-bancaria/exportar?formato=pdf&dataInicio=2025-01-01&dataFim=2025-01-31
```

Cada resposta retorna o arquivo com `Content-Disposition: attachment`.
