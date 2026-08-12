# 2026-08-12 — Logo e favicon MyCartao (monograma MC)

## Objetivo

Criar identidade visual mínima e nítida: monograma **MC** em SVG + wordmark
“MyCartao” na landing e no app shell, com favicon via App Router do Next.js.

## Decisões aprovadas

| Decisão | Escolha |
|---|---|
| Direção | Monograma tipográfico **MC** |
| Formato | SVG vetorial + wordmark na UI |
| Integração | `app/icon.svg` + assets em `public/brand/` + uso na landing/`AppShell` |

## Escopo

### Dentro

1. **Marca**
   - Monograma **MC** (um glyfo tipográfico pesado, estilo próximo a Fraunces).
   - Cores: teal `#0f766e` (marca), ink `#0c2a2e` no wordmark, paper `#faf8f5` se houver fundo no mark.
   - Sem glow, sem roxo, sem ilustração complexa.

2. **Arquivos**
   - `frontend/public/brand/logo-mark.svg` — só o monograma (favicon / ícone).
   - `frontend/public/brand/logo-lockup.svg` — ícone + texto “MyCartao” (uso marketing opcional).
   - `frontend/src/app/icon.svg` — favicon automático do Next (pode ser cópia/adaptado do mark, otimizado para 32px).

3. **UI**
   - Componente `BrandMark` (client ou server-safe img/svg) para o ícone.
   - Landing (nav + hero brand signal): ícone + wordmark.
   - `AppShell` sidebar: ícone + “MyCartao” no link home.

4. **Docs**
   - `docs/step-by-step/048-logo-favicon.md`

### Fora de escopo

- Apple touch icon PNG 180×180 (pode vir depois).
- Redesign completo da landing.
- Troca de tipografia do site.
- Geração de PNG/ICO legado.

## Critérios de aceite

1. Aba do browser mostra favicon MC legível em ~16–32px.
2. Landing e AppShell exibem mark + “MyCartao” sem cards/overlays no logo.
3. SVGs usam tokens de cor da marca (teal/ink/paper).
4. Sem novas dependências npm.
5. Step-by-step 048 documenta arquivos e função.

## Notas

- Preferir paths SVG inline ou `<img src="/brand/...">` simples; evitar `dangerouslySetInnerHTML` desnecessário.
- Não sobrescrever `.env`.
- Data do documento: 2026-08-12 (entrega da marca).
