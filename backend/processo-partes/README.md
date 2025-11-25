import { criarProcessoParte } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';

const result = await criarProcessoParte({
  processo_id: 123,
  tipo_entidade: 'cliente',
  entidade_id: 456,
  id_pje: 789,
  id_pessoa_pje: 101112,
  tipo_parte: 'RECLAMANTE',
  polo: 'ATIVO',
  trt: '02',
  grau: 'primeiro_grau',
  numero_processo: '0000123-45.2024.5.02.0001',
  principal: true,
  ordem: 0,
  dados_pje_completo: { /* dados do PJE */ }
});

if (result.success) {
  console.log('Vínculo criado:', result.data);
} else {
  console.error('Erro:', result.error);
}
```

### Buscar Todas as Partes Ativas de um Processo
```typescript
import { buscarPartesPorProcesso } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';

const partesAtivas = await buscarPartesPorProcesso({
  processo_id: 123,
  polo: 'ATIVO'
});

// partesAtivas contém array de ParteComDadosCompletos com nome, CPF, emails, etc.
```

### Buscar Todos os Processos de um Cliente
```typescript
import { buscarProcessosPorEntidade } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';

const processos = await buscarProcessosPorEntidade({
  tipo_entidade: 'cliente',
  entidade_id: 456
});

// processos contém array de ProcessoComParticipacao com numero_processo, trt, tipo_parte, etc.
```

### Atualizar Ordem de Exibição das Partes
```typescript
import { atualizarProcessoParte } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';

const result = await atualizarProcessoParte({
  id: 789, // ID do vínculo
  ordem: 1, // Nova ordem
  principal: false
});

if (result.success) {
  console.log('Ordem atualizada');
} else {
  console.error('Erro:', result.error);
}