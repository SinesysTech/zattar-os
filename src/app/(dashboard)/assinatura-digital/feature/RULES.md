# Assinatura Digital - Regras de Negocio

## Conformidade Legal

### MP 2.200-2/2001 (Infraestrutura de Chaves Publicas Brasileira)

O modulo de assinatura digital segue as diretrizes da Medida Provisoria 2.200-2/2001 que institui a ICP-Brasil e estabelece:

1. **Autenticidade**: Verificacao da identidade do signatario atraves de:
   - CPF/CNPJ validado
   - Foto do signatario (quando necessario)
   - Device fingerprint
   - Geolocalizacao (opcional)

2. **Integridade**: Garantia de que o documento nao foi alterado atraves de:
   - Hash SHA-256 do documento original
   - Hash SHA-256 do documento final com manifesto
   - Auditoria de integridade disponivel

3. **Nao-Repudio**: Evidencias de que a assinatura foi realizada pelo signatario:
   - Timestamp da assinatura
   - IP do dispositivo
   - User-Agent do navegador
   - Fingerprint do dispositivo
   - Aceite explicito dos termos

## Fluxo de Assinatura

### Etapas Obrigatorias

1. **Identificacao do Cliente**: Selecao obrigatoria do cliente (cliente_id)
2. **Selecao de Segmento**: Escolha do segmento de negocio
3. **Selecao de Template**: Escolha do template (PDF ou Markdown)
4. **Selecao de Formulario**: Escolha do formulario associado
5. **Captura de Assinatura**: Imagem da assinatura manuscrita
6. **Aceite dos Termos**: Aceite obrigatorio com versao registrada

### Etapas Opcionais

- **Foto do Signatario**: Configuravel por formulario
- **Geolocalizacao**: Configuravel por formulario
- **Contrato ID**: Vínculo opcional com contrato

## Validacoes Obrigatorias

### Cliente
- Deve existir no sistema
- CPF/CNPJ deve ser valido

### Template
- Deve estar ativo
- Tipo deve ser PDF ou Markdown
- Conteudo deve estar preenchido (pdf_url ou conteudo_markdown)

### Formulario
- Deve estar ativo
- Deve pertencer ao segmento selecionado

### Assinatura
- Imagem obrigatoria em formato base64
- Deve ser uma imagem valida (PNG, JPG, etc.)

### Termos
- `termos_aceite` deve ser `true`
- `termos_aceite_versao` deve ser informada

## Integracao com Outros Modulos

### Partes
- Utiliza `actionListarClientesSugestoes` para busca de clientes
- Busca por CPF via `findClienteByCPF`
- Busca partes contrarias via `findParteContrariaByCPF`/`findParteContrariaByCNPJ`

### Contratos
- Campo `contrato_id` referencia o contrato associado
- Vínculo opcional com contratos do sistema

### AI/Indexacao
- Templates sao indexados automaticamente apos criacao
- Suporte a indexacao de PDFs e Markdown

## Seguranca

### Metadados de Seguranca
- IP do dispositivo
- User-Agent do navegador
- Device fingerprint com multiplos atributos:
  - Resolucao de tela
  - Timezone
  - Idioma
  - Plataforma
  - Canvas hash
  - WebGL hash

### Armazenamento
- PDFs assinados sao armazenados em storage seguro
- Hashes sao calculados e armazenados para auditoria
- Imagens de assinatura e foto sao armazenadas separadamente

## Componentes de UI

### Selects Especializados
- `SegmentoSelect`: Carrega segmentos ativos
- `TemplateSelect`: Carrega templates, filtra por segmento
- `FormularioSelect`: Carrega formularios, filtra por segmento
- `ClienteSelect`: Autocomplete de clientes com busca

### Formulario de Fluxo
- `AssinaturaFluxoForm`: Formulario completo com multi-step
- Barra de progresso visual
- Validacao em tempo real
- Preview de PDF antes de finalizar

### Navegacao
- `AssinaturaDigitalTabsContent`: Tabs unificadas (Fluxo, Templates, Formularios)
- URL params para persistencia da tab ativa

## Boas Praticas

1. **Sempre validar dados no backend**: Nao confiar apenas em validacao de frontend
2. **Registrar auditoria**: Toda assinatura deve ter trail de auditoria completo
3. **Usar componentes especializados**: Preferir selects especificos aos inputs de ID
4. **Vínculo com contrato**: Campo `contrato_id` para referenciar o contrato associado
5. **Tratar erros graciosamente**: Mostrar mensagens claras ao usuario
