# Sistema de Editor de Documentos

Sistema completo de criação, edição e gerenciamento de documentos colaborativos com editor rich-text baseado no Plate.js.

## Visão Geral

O módulo de documentos permite:

- **Criar e editar documentos** com formatação rica (negrito, itálico, listas, tabelas, imagens, etc.)
- **Organizar em pastas** com hierarquia ilimitada
- **Compartilhar documentos** com outros usuários (visualizar ou editar)
- **Usar templates** para acelerar a criação de documentos padronizados
- **Histórico de versões** com possibilidade de restaurar versões anteriores
- **Auto-save** automático a cada 2 segundos de inatividade
- **Upload de arquivos** (imagens, PDFs, vídeos) diretamente no editor
- **Exportação** para PDF e DOCX
- **Chat integrado** por documento para colaboração

## Acesso

- **URL**: `/documentos`
- **Permissões**: Usuários autenticados podem criar documentos
- **Navegação**: Menu lateral > Serviços > Editor de Documentos

## Funcionalidades

### 1. Criação de Documentos

1. Acesse `/documentos`
2. Clique em "Novo Documento"
3. Preencha o título (obrigatório)
4. Opcionalmente escolha uma pasta ou use um template
5. Clique em "Criar"

### 2. Edição

O editor suporta:

- **Formatação de texto**: Negrito, itálico, sublinhado, riscado
- **Títulos**: H1, H2, H3
- **Listas**: Ordenadas, não-ordenadas, checklists
- **Tabelas**: Com redimensionamento de colunas
- **Mídia**: Imagens, vídeos, arquivos
- **Código**: Blocos de código com syntax highlighting
- **Menções**: @usuário para notificar pessoas
- **Datas**: Seletor de data inline
- **Emojis**: Picker completo
- **Callouts**: Caixas de destaque (info, warning, error)

### 3. Pastas

- **Criar pastas**: Organize documentos em hierarquia
- **Tipos**: Comum (visível para todos) ou Privada (apenas criador)
- **Cores e ícones**: Personalize a aparência
- **Arrastar e soltar**: Mova documentos entre pastas

### 4. Compartilhamento

1. No documento, clique no ícone de compartilhar
2. Busque o usuário pelo nome ou email
3. Escolha a permissão:
   - **Visualizar**: Apenas leitura
   - **Editar**: Pode modificar o documento
4. Clique em "Compartilhar"

### 5. Templates

Templates são documentos modelo que podem ser reutilizados:

1. **Criar template**: No editor, menu > "Salvar como Template"
2. **Usar template**: Na criação de documento, selecione um template
3. **Visibilidade**: Público (todos podem usar) ou Privado (apenas você)

### 6. Versões

O sistema mantém histórico de versões:

1. No editor, clique em "Histórico de Versões"
2. Visualize versões anteriores
3. Compare diferenças
4. Restaure uma versão se necessário

### 7. Lixeira

Documentos deletados vão para a lixeira:

- **Restaurar**: Recupere documentos deletados
- **Deletar permanentemente**: Remove sem possibilidade de recuperação
- **Retenção**: 30 dias antes da deleção automática

### 8. Exportação

- **PDF**: Exporta mantendo formatação visual
- **DOCX**: Exporta para Microsoft Word

### 9. Chat

Cada documento tem um chat integrado:

1. No editor, clique no ícone de chat
2. Converse com colaboradores em tempo real
3. Mensagens são persistidas

## APIs

### Documentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/documentos` | Lista documentos |
| POST | `/api/documentos` | Cria documento |
| GET | `/api/documentos/:id` | Busca documento |
| PUT | `/api/documentos/:id` | Atualiza documento |
| DELETE | `/api/documentos/:id` | Deleta (soft delete) |
| POST | `/api/documentos/:id/auto-save` | Auto-save |
| POST | `/api/documentos/:id/upload` | Upload de arquivo |
| GET | `/api/documentos/:id/versoes` | Lista versões |
| POST | `/api/documentos/:id/versoes/:versaoId/restaurar` | Restaura versão |

### Pastas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/pastas` | Lista pastas |
| POST | `/api/pastas` | Cria pasta |
| GET | `/api/pastas/:id` | Busca pasta |
| PUT | `/api/pastas/:id` | Atualiza pasta |
| DELETE | `/api/pastas/:id` | Deleta pasta |

### Compartilhamento

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/documentos/:id/compartilhar` | Compartilha documento |
| PATCH | `/api/documentos/:id/compartilhar` | Atualiza permissão |
| DELETE | `/api/documentos/:id/compartilhar` | Remove compartilhamento |

### Templates

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/templates` | Lista templates |
| POST | `/api/templates` | Cria template |
| GET | `/api/templates/:id` | Busca template |
| PUT | `/api/templates/:id` | Atualiza template |
| DELETE | `/api/templates/:id` | Deleta template |
| POST | `/api/templates/:id/usar` | Cria documento de template |

### Lixeira

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/lixeira` | Lista itens deletados |
| POST | `/api/lixeira/:id/restaurar` | Restaura item |
| DELETE | `/api/lixeira/:id` | Deleta permanentemente |

## Estrutura de Dados

### Documento

```typescript
interface Documento {
  id: number;
  titulo: string;
  conteudo: any; // JSON do Plate.js
  pasta_id: number | null;
  criado_por: number;
  editado_por: number | null;
  versao: number;
  descricao: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

### Pasta

```typescript
interface Pasta {
  id: number;
  nome: string;
  pasta_pai_id: number | null;
  tipo: 'comum' | 'privada';
  criado_por: number;
  descricao: string | null;
  cor: string | null; // Formato hex (#RRGGBB)
  icone: string | null;
  created_at: string;
  deleted_at: string | null;
}
```

### Compartilhamento

```typescript
interface DocumentoCompartilhado {
  id: number;
  documento_id: number;
  usuario_id: number;
  permissao: 'visualizar' | 'editar';
  compartilhado_por: number;
  created_at: string;
}
```

## Segurança

### Row Level Security (RLS)

- Usuários só veem documentos que criaram ou foram compartilhados
- Apenas criador pode deletar permanentemente
- Pastas privadas são visíveis apenas para o criador
- Compartilhamentos respeitam níveis de permissão

### Validações

- Título obrigatório (1-500 caracteres)
- Uploads limitados a 50MB
- Tipos de arquivo permitidos: imagens, PDFs, vídeos, áudio
- Prevenção de ciclos em hierarquia de pastas

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| Ctrl+K | Command Menu (busca rápida) |
| Ctrl+S | Força salvamento |
| Ctrl+B | Negrito |
| Ctrl+I | Itálico |
| Ctrl+U | Sublinhado |
| Ctrl+Z | Desfazer |
| Ctrl+Shift+Z | Refazer |
| Ctrl+Shift+S | Riscado |
| Ctrl+1/2/3 | Títulos H1/H2/H3 |

## Troubleshooting

### Auto-save não está funcionando

1. Verifique a conexão com a internet
2. Verifique se está autenticado
3. Observe o indicador de status no editor

### Upload falhou

1. Verifique o tamanho do arquivo (máx 50MB)
2. Verifique o tipo de arquivo
3. Tente novamente em alguns segundos

### Não consigo compartilhar

1. Apenas o criador pode compartilhar
2. Verifique se o usuário existe
3. Não é possível compartilhar consigo mesmo

### Documento não aparece na lista

1. Verifique se não está na lixeira
2. Verifique filtros ativos (pasta, tags)
3. Verifique permissões de acesso
