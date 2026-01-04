## Context
Este change introduz um novo fluxo “principal” de assinatura digital: upload de PDF pronto + múltiplos assinantes + links públicos por assinante + posicionamento visual de âncoras (assinatura/rubrica). Também remove o simulador (“Fluxo de Assinatura”) da navegação padrão, mantendo seu código para possível uso interno futuro.

## Goals / Non-Goals
- Goals:
  - Permitir criação de um documento de assinatura via PDF uploadado.
  - Suportar 1..N assinantes em paralelo, cada um com link público próprio.
  - Suportar assinantes de entidades existentes e convidados (sem criar entidade).
  - Permitir posicionamento visual de âncoras por assinante e tipo (`assinatura` | `rubrica`).
  - Assinante executa 1 captura por tipo e o sistema replica em todas as âncoras daquele tipo.
  - Implementar metadados de segurança padrão (IP, user-agent, geo, hash/cripto) de forma invariável e sem exposição na UI.
- Non-Goals:
  - Envio automático por WhatsApp/E-mail (apenas exibir/copiar links).
  - Expiração de links.
  - Fluxo sequencial (ordem de assinantes).
  - Transformar convidados em entidades do sistema.

## Decisions
- **Tokens de link público**:
  - Decisão: link público por assinante com token opaco, não enumerável, sem expiração.
  - Racional: acesso público exige identificador imprevisível; ausência de expiração segue requisito; estado de reuso bloqueado por status.
- **Modelagem de assinantes**:
  - Decisão: armazenar “convidado” em `jsonb` no contexto do documento/assinante; entidades existentes referenciadas por tipo+id (polimórfico).
  - Racional: não criar entidade; manter vínculo auditável; suportar múltiplas origens.
- **Âncoras**:
  - Decisão: registrar âncoras como lista de posições (página + bbox + tipo + assinante).
  - Racional: permitir replicação do carimbo; múltiplas ocorrências por assinante/tipo.
- **Captura única por tipo**:
  - Decisão: guardar 1 artefato de assinatura e 1 de rubrica por assinante (quando aplicável) e aplicar em todas as âncoras do tipo.
  - Racional: UX simples e alinhada ao requisito (assina 1x, replica N posições).

## Risks / Trade-offs
- **Segurança do link público sem expiração** → mitigação: token opaco longo, estado one-time, validação rigorosa, e bloqueio após conclusão.
- **Polimorfismo de assinante (tipo+id)** pode aumentar complexidade de joins → mitigação: normalizar o “snapshot” dos dados exibidos no link no registro do assinante do documento, evitando dependência de tabelas externas na jornada pública.
- **Editor visual de âncoras** pode ser a parte mais complexa → mitigação: primeira versão com seleção simples por página + bbox, sem features avançadas; iterar.

## Migration Plan
- Adicionar schema declarativo para novas tabelas/colunas.
- Implementar endpoints admin e público.
- Atualizar navegação removendo tab do simulador; manter rota/código interno.
- Rollout por feature flag (opcional) se necessário para validação controlada.

## Open Questions
- Formato exato de coordenadas/bbox (unidades, origem, rotação).
- Compatibilidade com PDFs com rotação/escala variável.
- Onde armazenar e como versionar o PDF final (um por “documento” após todos assinarem vs por assinante).


