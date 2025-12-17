# Guia de Desenvolvimento

<cite>
**Arquivos Referenciados neste Documento**   
- [direitos-essenciais.tsx](file://components/direitos-essenciais.tsx) - *Atualizado na refatoração da identidade visual*
- [quem-somos.tsx](file://components/quem-somos.tsx) - *Atualizado na refatoração da identidade visual*
- [consultoria-empresarial.tsx](file://components/consultoria-empresarial.tsx)
- [lib/utils.ts](file://lib/utils.ts)
- [ui/card.tsx](file://components/ui/card.tsx)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Adicionando Novos Direitos Trabalhistas](#adicionando-novos-direitos-trabalhistas)
3. [Atualizando Pilares de Atuação](#atualizando-pilares-de-atuação)
4. [Utilizando o Utilitário cn()](#utilizando-o-utilitário-cn)
5. [Criando Novos Componentes](#criando-novos-componentes)
6. [Estilização com Tailwind CSS](#estilização-com-tailwind-css)
7. [Implementando Interatividade com 'use client'](#implementando-interatividade-com-use-client)
8. [Boas Práticas de Código, Acessibilidade e SEO](#boas-práticas-de-código-acessibilidade-e-seo)

## Introdução
Este guia prático orienta contribuidores sobre como desenvolver e manter componentes no projeto, com foco em consistência, acessibilidade e aderência às convenções estabelecidas. Ele cobre desde a atualização de dados estruturados até a criação de novos componentes reutilizáveis, utilizando TypeScript, React, Tailwind CSS e as melhores práticas do Next.js. O projeto foi recentemente atualizado para refletir a nova identidade visual do escritório **Zattar Advogados**, substituindo a antiga marca PZ Advogados em todo o código e conteúdo.

## Adicionando Novos Direitos Trabalhistas
Para adicionar novos direitos trabalhistas no componente `direitos-essenciais.tsx`, é necessário modificar o array `direitosTrabalhistas`. Cada item do array deve conter três propriedades: `icon`, `title` e `description`. O ícone deve ser um componente de ícone importado (por exemplo, do pacote `lucide-react`), enquanto o título e a descrição devem ser strings claras e informativas.

O novo direito será automaticamente renderizado no grid de direitos, mantendo a consistência visual e funcional com os demais itens.

**Seção fontes**
- [direitos-essenciais.tsx](file://components/direitos-essenciais.tsx#L15-L130)

## Atualizando Pilares de Atuação
Os pilares de atuação são definidos em dois componentes: `quem-somos.tsx` e `consultoria-empresarial.tsx`. Ambos utilizam estruturas de dados semelhantes baseadas em arrays tipados (`PilarDeAtuacao` e `ConsultancyPillar`, respectivamente).

Para adicionar ou modificar um pilar:
1. Localize o array `pilaresDeAtuacao` ou `consultancyPillars`.
2. Adicione um novo objeto com as propriedades: `id`, `name`, `description`, `icon`, `color`, `principles` e opcionalmente `image`.
3. Certifique-se de que o `id` seja único e em kebab-case.
4. O `icon` deve ser um componente de ícone válido.
5. A `color` deve ser uma classe Tailwind válida (por exemplo, `text-blue-500`).
6. A lista `principles` deve conter strings concisas que reflitam os valores do pilar.

Essas alterações são refletidas automaticamente nas abas e no dropdown responsivo.

**Seção fontes**
- [quem-somos.tsx](file://components/quem-somos.tsx#L25-L236)
- [consultoria-empresarial.tsx](file://components/consultoria-empresarial.tsx#L27-L238)

## Utilizando o Utilitário cn()
O utilitário `cn()` localizado em `lib/utils.ts` é essencial para a manipulação de classes CSS no projeto. Ele combina `clsx` e `tailwind-merge` para permitir a fusão inteligente de classes, garantindo que classes conflitantes sejam resolvidas corretamente (por exemplo, `bg-blue-500` substitui `bg-red-500`).

Use `cn()` sempre que precisar condicionalmente aplicar classes ou combinar classes de props com classes padrão.

```mermaid
fluxograma TD
A["Entrada de classes (strings, objetos, arrays)"] --> B["clsx: avalia condições e monta lista"]
B --> C["tailwind-merge: mescla e resolve conflitos"]
C --> D["Saída: string de classes otimizada"]
```

**Fontes do Diagrama**
- [lib/utils.ts](file://lib/utils.ts#L3-L5)

**Seção fontes**
- [lib/utils.ts](file://lib/utils.ts#L3-L5)
- [ui/card.tsx](file://components/ui/card.tsx#L5-L79)

## Criando Novos Componentes
Ao criar novos componentes, siga o padrão estabelecido no projeto:
- Use componentes funcionais do React com TypeScript.
- Para componentes reutilizáveis, utilize `React.forwardRef` para permitir o encaminhamento de refs.
- Defina sempre `Component.displayName` para facilitar a depuração em ferramentas de desenvolvimento.
- Tipagem rigorosa com interfaces ou types para props.

O exemplo do componente `Card` demonstra claramente esse padrão.

```mermaid
diagrama de classes
classe Card {
+encaminharRef : HTMLDivElement
+displayName : "Card"
+className : string
+props : HTMLAttributes
}
classe CardHeader {
+encaminharRef : HTMLDivElement
+displayName : "CardHeader"
}
classe CardTitle {
+encaminharRef : HTMLHeadingElement
+displayName : "CardTitle"
}
classe CardDescription {
+encaminharRef : HTMLParagraphElement
+displayName : "CardDescription"
}
Card --> CardHeader : "composição"
CardHeader --> CardTitle : "composição"
CardHeader --> CardDescription : "composição"
```

**Fontes do Diagrama**
- [ui/card.tsx](file://components/ui/card.tsx#L5-L79)

**Seção fontes**
- [ui/card.tsx](file://components/ui/card.tsx#L5-L79)
- [openspec/project.md](file://openspec/project.md#L43-L64)

## Estilização com Tailwind CSS
A estilização é feita exclusivamente com Tailwind CSS. Utilize classes utilitárias diretamente nas propriedades `className`. Sempre envolva as classes com a função `cn()` para garantir a fusão correta, especialmente quando há classes dinâmicas ou provenientes de props.

Evite criar classes CSS personalizadas. Priorize a configuração do `tailwind.config.ts` para novas variações. Utilize as classes de tema (`bg-muted`, `text-foreground`) para manter a consistência com o design system.

**Seção fontes**
- [direitos-essenciais.tsx](file://components/direitos-essenciais.tsx#L100-L110)
- [quem-somos.tsx](file://components/quem-somos.tsx#L180-L190)

## Implementando Interatividade com 'use client'
Componentes que requerem interatividade do lado do cliente (como estado com `useState`, efeitos, ou manipuladores de eventos) devem incluir a diretiva `"use client"` no início do arquivo. Isso é necessário mesmo em um aplicativo Next.js com Server Components padrão.

Todos os componentes que usam hooks do React ou interagem com o DOM devem ser marcados como Client Components.

**Seção fontes**
- [quem-somos.tsx](file://components/quem-somos.tsx#L1)
- [consultoria-empresarial.tsx](file://components/consultoria-empresarial.tsx#L1)
- [etapas-processuais.tsx](file://components/etapas-processuais.tsx#L1)

## Boas Práticas de Código, Acessibilidade e SEO
Siga rigorosamente as convenções do projeto:
- **Padrão de Componentes**: Use `forwardRef` e `displayName` em componentes UI.
- **Nomenclatura**: Arquivos em kebab-case, componentes em PascalCase.
- **Idioma**: Todo conteúdo e nomes de componentes relacionados ao domínio devem estar em português brasileiro.
- **Acessibilidade**: Use elementos semânticos, forneça textos alternativos para imagens (`alt`) e labels adequadas para formulários.
- **SEO**: Utilize hierarquia de cabeçalhos (`h1`, `h2`, etc.) corretamente, especialmente no componente `page.tsx`. Meta tags são gerenciadas no `layout.tsx`.
- **Tipagem**: TypeScript em modo estrito está habilitado; evite o uso de `any`.
- **Linting**: O projeto utiliza ESLint; siga as regras definidas para manter a qualidade do código.

**Seção fontes**
- [openspec/project.md](file://openspec/project.md#L43-L64)
- [README.md](file://README.md#L108-L148)