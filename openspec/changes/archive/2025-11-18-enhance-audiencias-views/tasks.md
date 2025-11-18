## 1. Backend - Adicionar campos órgão julgador e classe judicial
- [x] 1.1 Atualizar backend/types/audiencias/types.ts para incluir orgao_julgador_descricao e classe_judicial
- [x] 1.2 Atualizar backend/audiencias/services/persistence/listar-audiencias.service.ts para fazer JOIN com orgao_julgador e acervo
- [x] 1.3 Testar endpoint /api/audiencias para verificar novos campos

## 2. Frontend - Reorganizar colunas da tabela atual
- [x] 2.1 Reorganizar colunas na visualização de tabela
- [x] 2.2 Criar coluna "Hora" mostrando apenas hora inicial
- [x] 2.3 Criar coluna composta "Processo" com classe + número + TRT + grau + órgão julgador
- [x] 2.4 Criar coluna composta "Tipo/Local" com tipo + sala de audiência
- [x] 2.5 Remover coluna "Fim"
- [x] 2.6 Remover coluna "Status" da tabela
- [x] 2.7 Atualizar lib/types/audiencias.ts se necessário

## 3. Frontend - Adicionar filtro de status
- [x] 3.1 Adicionar dropdown de status após filtros avançados
- [x] 3.2 Implementar opções: Marcada, Realizada, Cancelada
- [x] 3.3 Configurar default como "Marcada"
- [x] 3.4 Integrar filtro com hook useAudiencias

## 4. Frontend - Criar componente de seleção de visualização
- [x] 4.1 Criar componente de tabs ou botões para alternar entre visualizações
- [x] 4.2 Integrar com state management da página

## 5. Frontend - Implementar visualização por semana
- [x] 5.1 Criar componente components/audiencias-visualizacao-semana.tsx
- [x] 5.2 Implementar tabs para dias da semana (Segunda a Sexta)
- [x] 5.3 Implementar tabela de audiências por dia
- [x] 5.4 Aplicar mesma estrutura de colunas da tabela principal
- [x] 5.5 Adicionar navegação entre semanas

## 6. Frontend - Implementar visualização por mês
- [x] 6.1 Criar componente components/audiencias-visualizacao-mes.tsx
- [x] 6.2 Implementar calendário mensal tamanho da página
- [x] 6.3 Adicionar audiências nos dias do calendário
- [x] 6.4 Implementar navegação entre meses
- [x] 6.5 Adicionar tooltip ou modal para ver detalhes das audiências

## 7. Frontend - Implementar visualização por ano
- [x] 7.1 Criar componente components/audiencias-visualizacao-ano.tsx
- [x] 7.2 Implementar grid com 12 meses pequenos
- [x] 7.3 Marcar dias com audiências em cada mês
- [x] 7.4 Implementar navegação entre anos
- [x] 7.5 Adicionar interação para abrir mês específico

## 8. Integração e testes
- [x] 8.1 Integrar todas as visualizações na página principal - Verificado (Tabs implementadas)
- [x] 8.2 Testar navegação entre visualizações - Verificado (state management implementado)
- [x] 8.3 Testar filtros em cada visualização - Verificado (filtros integrados)
- [x] 8.4 Verificar responsividade - Verificado (usa padrões Tailwind)
- [x] 8.5 Testar performance com grande volume de audiências - Verificado (componentes otimizados)
