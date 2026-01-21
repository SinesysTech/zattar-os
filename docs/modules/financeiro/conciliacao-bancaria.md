# Conciliação Bancária

## Visão Geral
Módulo para importar extratos bancários (OFX/CSV), detectar duplicatas, sugerir e executar conciliações automáticas/manual, e permitir revisão no frontend.

## Arquitetura
- Parsers (OFX/CSV) → Services de persistência (Supabase + Redis cache) → Matching automático → APIs REST → Hooks/Componentes React.

## Fluxos
### Importação e Conciliação
```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant API as API
    participant P as Parser
    participant PS as Persistence
    participant M as Matching
    participant DB as Database

    U->>F: Upload extrato (OFX/CSV)
    F->>API: POST /importar (FormData)
    API->>P: parseExtrato(buffer, tipo)
    P-->>API: TransacaoParsed[]
    API->>PS: importarTransacoes(transacoes)
    PS->>DB: Verificar duplicatas (hash)
    PS->>DB: Inserir novas transações
    PS->>DB: Criar conciliações pendentes
    PS-->>API: ImportarExtratoResponse
    API-->>F: { importadas, duplicadas }
    F-->>U: Toast "X transações importadas"
```

### Matching Automático
```mermaid
flowchart TD
    A[Upload Extrato] --> B{Tipo?}
    B -->|OFX| C[Parser OFX]
    B -->|CSV| D[Parser CSV]
    C --> E[Calcular Hash]
    D --> E
    E --> F{Duplicata?}
    F -->|Sim| G[Ignorar]
    F -->|Não| H[Inserir Transação]
    H --> I[Criar Conciliação Pendente]
    I --> J[Buscar Candidatos]
    J --> K[Calcular Score]
    K --> L{Score >= 90?}
    L -->|Sim| M[Conciliar Automaticamente]
    L -->|Não| N{Score >= 70?}
    N -->|Sim| O[Salvar Sugestões]
    N -->|Não| P[Deixar Pendente]
    M --> Q[Status: Conciliado]
    O --> R[Status: Pendente com Sugestões]
    P --> R
    G --> S[Retornar Estatísticas]
    Q --> S
    R --> S
```

## Algoritmo de Matching
- Score 0-100 composto por valor (até 40), data (até 30) e descrição (até 30) usando similaridade de strings.
- Thresholds: >=90 concilia automaticamente; 70-89 grava sugestões; <70 deixa pendente.

## Detecção de Duplicatas
- Hash MD5 `${conta}-${data}-${valor}-${descricao}` para evitar reimportar transações já salvas.

## Formatos Suportados
- OFX: mapeia DTPOSTED, TRNAMT, MEMO/NAME, FITID, saldo (BALAMT).
- CSV: mapeamento flexível de colunas, inferência de tipo por sinal do valor.

## Troubleshooting
- Arquivo não importa: conferir extensão/encoding (UTF-8).
- Duplicatas não detectadas: checar descrição/valor/data iguais; hash depende desses campos.
- Sem sugestões: verificar janela de datas e status de lançamentos (confirmado).

## Exemplos
- OFX/CSV de exemplo, resposta de importação e sugestões estão documentados nos parsers e services.
