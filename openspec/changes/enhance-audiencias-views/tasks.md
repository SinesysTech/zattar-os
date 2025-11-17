## 1. Backend - Adicionar campos órgão julgador e classe judicial
- [ ] 1.1 Atualizar backend/types/audiencias/types.ts para incluir orgao_julgador_descricao e classe_judicial
- [ ] 1.2 Atualizar backend/audiencias/services/persistence/listar-audiencias.service.ts para fazer JOIN com orgao_julgador e acervo
- [ ] 1.3 Testar endpoint /api/audiencias para verificar novos campos

## 2. Frontend - Reorganizar colunas da tabela atual
- [ ] 2.1 Reorganizar colunas na visualização de tabela
- [ ] 2.2 Criar coluna "Hora" mostrando apenas hora inicial
- [ ] 2.3 Criar coluna composta "Processo" com classe + número + TRT + grau + órgão julgador
- [ ] 2.4 Criar coluna composta "Tipo/Local" com tipo + sala de audiência
- [ ] 2.5 Remover coluna "Fim"
- [ ] 2.6 Remover coluna "Status" da tabela
- [ ] 2.7 Atualizar lib/types/audiencias.ts se necessário

## 3. Frontend - Adicionar filtro de status
- [ ] 3.1 Adicionar dropdown de status após filtros avançados
- [ ] 3.2 Implementar opções: Marcada, Realizada, Cancelada
- [ ] 3.3 Configurar default como "Marcada"
- [ ] 3.4 Integrar filtro com hook useAudiencias

## 4. Frontend - Criar componente de seleção de visualização
- [ ] 4.1 Criar componente de tabs ou botões para alternar entre visualizações
- [ ] 4.2 Integrar com state management da página

## 5. Frontend - Implementar visualização por semana
- [ ] 5.1 Criar componente components/audiencias-visualizacao-semana.tsx
- [ ] 5.2 Implementar tabs para dias da semana (Segunda a Sexta)
- [ ] 5.3 Implementar tabela de audiências por dia
- [ ] 5.4 Aplicar mesma estrutura de colunas da tabela principal
- [ ] 5.5 Adicionar navegação entre semanas

## 6. Frontend - Implementar visualização por mês
- [ ] 6.1 Criar componente components/audiencias-visualizacao-mes.tsx
- [ ] 6.2 Implementar calendário mensal tamanho da página
- [ ] 6.3 Adicionar audiências nos dias do calendário
- [ ] 6.4 Implementar navegação entre meses
- [ ] 6.5 Adicionar tooltip ou modal para ver detalhes das audiências

## 7. Frontend - Implementar visualização por ano
- [ ] 7.1 Criar componente components/audiencias-visualizacao-ano.tsx
- [ ] 7.2 Implementar grid com 12 meses pequenos
- [ ] 7.3 Marcar dias com audiências em cada mês
- [ ] 7.4 Implementar navegação entre anos
- [ ] 7.5 Adicionar interação para abrir mês específico

## 8. Integração e testes
- [ ] 8.1 Integrar todas as visualizações na página principal
- [ ] 8.2 Testar navegação entre visualizações
- [ ] 8.3 Testar filtros em cada visualização
- [ ] 8.4 Verificar responsividade
- [ ] 8.5 Testar performance com grande volume de audiências
