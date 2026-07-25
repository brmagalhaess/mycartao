# Step-by-step 042 — Landing estilo Gravatar + i18n (pt/en/es)

## Objetivo
Landing page inspirada no gravatar.com (mais moderna, com nossa paleta) e sistema
multi-idioma com detecção automática do idioma do navegador em todo o site.

## i18n — como funciona
- **Idiomas:** Português, English, Español
- **Detecção:** 1º o cookie `NEXT_LOCALE` (escolha manual), senão o header
  `Accept-Language` do navegador. Visitante do Brasil abre em PT; EUA em EN; etc.
- **Troca:** seletor de idioma no header/footer da landing, em pricing, login e na
  navegação do app. Salva cookie por 1 ano e refaz o render no servidor.
- **Sem mudança de URLs** (não usa /en, /es) — cookie + Accept-Language.

## Arquivos novos
| Arquivo | Função |
|---------|--------|
| `lib/i18n/config.ts` | Locales, cookie, parser do Accept-Language |
| `lib/i18n/dictionaries/{pt,en,es}.ts` | Dicionários tipados (pt é a fonte do tipo) |
| `lib/i18n/index.ts` | `getDictionary(locale)` |
| `lib/i18n/server.ts` | `getLocale()` (cookie → Accept-Language) |
| `components/I18nProvider.tsx` | Contexto client + hook `useI18n()` |
| `components/LanguageSwitcher.tsx` | Select de idioma (grava cookie + refresh) |
| `components/LandingAvatars.tsx` | Chips de perfis flutuantes (estilo Gravatar) |
| `components/LandingFaq.tsx` | FAQ accordion nativo (`details`, sem JS) |

## Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| `app/layout.tsx` | Async: detecta locale, `<html lang>`, provider global |
| `app/page.tsx` | Landing Gravatar-style: hero central + chips, faixa “funciona onde você está”, atualize-uma-vez, perfil do seu jeito, seção portfólio-é-sua-página, developers com código, FAQ, CTA |
| `app/pricing/page.tsx` | Traduzida + switcher |
| `app/login/page.tsx` | Traduzida + switcher |
| `components/AppNav.tsx` | Nav do app traduzida + switcher |
| `app/p/[slugOrId]/page.tsx` | Página de perfil: avatar, nome, headline, copiar link, traduzida |

## Portfólio como página do usuário
`/p/{slug-ou-id}` agora abre com cabeçalho de perfil (foto, nome, headline vindos do
cartão público), botão “Copiar link da página” e link para o cartão — pronto para
compartilhar como página pessoal. Com slug Pro fica `mycartao.com/p/seu-nome`.

## Validação
```bash
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```
Todos passando (build de produção OK).

## Pendências (próxima fase)
- Traduzir páginas internas do app (dashboard, settings, billing, editor) — o
  provider e o padrão `useI18n()` já cobrem tudo; falta migrar as strings.
- Página `/developers` segue em PT (conteúdo técnico).
- `metadata` (title/description) por idioma + `og:image`.

## Análise
Cookie + Accept-Language evita reestruturar rotas (sem /en/...) e funciona com o
proxy same-origin já usado no Dokploy. O dicionário PT é a fonte de tipo
(`Dictionary`), então qualquer chave faltante em EN/ES quebra o typecheck — proteção
contra tradução incompleta. FAQ com `details` nativo mantém a landing 100% server
component.
