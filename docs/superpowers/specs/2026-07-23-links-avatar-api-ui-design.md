# MyCartao — Links custom, Avatar API, Smart UI e refresh visual

**Data:** 2026-07-23  
**Status:** Aguardando review do usuário  
**Escopo:** Avatar público por e-mail, links personalizados (Pro), UI Smart Card (Pro), página Developers, modernização de layout (app + público)

---

## 1. Resumo

Complementar o SaaS com:

1. **API de avatar** estilo Gravatar (endpoint MyCartao por e-mail) + página `/developers` com exemplos (HTML, JS, **Next.js**, Python, PHP, cURL).
2. **Links personalizados** no cartão (Pro) + painel **Smart Card** (Pro) sobre a API já existente.
3. **Refresh de layout** no app inteiro e nas páginas públicas (cartão + Presence), mantendo a identidade teal/sand atual.

**Fora desta rodada:** compatibilidade com hash MD5 do Gravatar; tabela SQL dedicada a links; redesign com novo framework de UI.

---

## 2. Decisões aprovadas

| Tema | Escolha |
|------|---------|
| Personalizar links | Links extras (estilo Linktree) **e** Smart Card |
| Planos | Free: só campos clássicos. Pro: links custom + Smart Card |
| Avatar API | `GET /api/v1/public/avatar?email=` (não hash Gravatar) |
| Dev docs | Página `/developers` com exemplos, incluindo **Next.js** |
| Layout | App completo + cartão público / Presence |
| Abordagem técnica | Incremental: `fields.custom_links`, UI em smart-rules existentes, tokens CSS atuais |

---

## 3. Avatar API

### Endpoint

`GET /api/v1/public/avatar?email={email}&s={size}`

- `email` (obrigatório): trim + lowercase antes do lookup.
- `s` (opcional): tamanho lógico 80–512 (default 200); usado no placeholder SVG e em `Cache-Control` / headers se aplicável.

### Resolução

1. Buscar `User` pelo e-mail.
2. Resolver avatar na ordem: `profile.avatar_key` / mídia de purpose `avatar` / `fields.avatar` do cartão primário (URL same-origin `/api/v1/media/files/...`).
3. Se houver arquivo: **stream** (ou redirect 302 interno same-origin para o proxy de mídia). Preferir stream com `Content-Type` e `Cache-Control: public, max-age=3600`.
4. Se usuário existe sem foto **ou** e-mail desconhecido: responder **200** com SVG placeholder (iniciais do display_name/e-mail ou padrão MyCartao) — evita quebra de `<img>` em sites terceiros.
5. E-mail inválido: `400` `{ detail, code: "invalid_email" }`.

### Privacidade

- Não vazar se o e-mail está ou não cadastrado via status diferente (sempre 200 imagem ou 400 só para formato inválido).
- Rate limit no endpoint público (reutilizar padrão dos endpoints públicos).

### Frontend / proxy

- Browser e docs usam path same-origin: `/api/v1/public/avatar?email=...` (Next rewrite já cobre `/api/*`).

---

## 4. Links personalizados (Pro)

### Modelo (sem migration)

Em `cards.fields`:

```json
{
  "phone": "...",
  "custom_links": [
    { "id": "uuid", "title": "Meu site", "url": "https://...", "icon": "link", "sort": 0 }
  ]
}
```

- `id`: string uuid gerada no client ou backend.
- `title`: 1–60 chars.
- `url`: http(s) obrigatório.
- `icon`: opcional, whitelist curta (`link`, `globe`, `calendar`, `shop`, `video`, `music`) ou vazio.
- `sort`: inteiro ≥ 0.

### Regras de plano

- **Free:** `PATCH` que inclua `custom_links` não vazio → `403` `code: custom_links_pro_only`. Campos clássicos continuam livres.
- **Pro/admin:** sem limite rígido no MVP (soft cap 20 links por cartão para abuso).

### UI

- Editor do cartão: seção **Links** (Pro) — adicionar / editar / remover / reordenar (botões ↑↓ no MVP).
- Free: seção com preview bloqueada + CTA upgrade.
- Página pública `/c/[slugOrId]`: botões/listagem dos `custom_links` ordenados, abaixo dos campos clássicos.
- Presence Mode: opcionalmente os 3 primeiros links como CTAs secundários (não poluir o hero).

---

## 5. Smart Card UI (Pro)

### Já existe (backend)

- CRUD `/api/v1/smart-rules`
- Público `GET /api/v1/public/go/{slug_or_id}` → `{ target, url }`
- Frontend mínimo `/go/[slugOrId]` (redirect)

### Novo

- Página autenticada `/app/smart`:
  - listar regras
  - criar/editar/excluir (condições + target: `card` | `portfolio` | `whatsapp`)
  - exibir URL pública `/go/{slug|id}` com botão copiar
- Nav: item **Smart** (visível; Free vê upsell na página).
- Copy de ajuda: “Um QR / NFC aponta para `/go/...`; o destino muda conforme as regras.”

---

## 6. Página Developers

### Rota

`/developers` (pública, marketing)

### Conteúdo

1. Explicação curta do Avatar API.
2. URL base = origem do site (`PUBLIC_APP_URL` / `window.location.origin` na doc estática).
3. Exemplos com abas ou blocos:
   - HTML (`<img>`)
   - JavaScript (`fetch` / URL)
   - **Next.js** (`next/image` ou `<img>` com URL absoluta same-origin)
   - Python (`urllib` / `requests`)
   - PHP
   - cURL
4. Nota: o e-mail deve ser o **mesmo cadastrado** no MyCartao; a foto é a do perfil/cartão.
5. Link na landing e, se fizer sentido, no rodapé do app.

---

## 7. Refresh de layout

### Princípios (respeitar design system existente)

- Manter tipografia Fraunces + DM Sans e paleta teal/sand/ink.
- Evitar cards genéricos no hero; uma composição por seção.
- App: nav mais clara, espaçamento consistente, headers de página com título + uma frase.
- Editor: seções bem separadas (Perfil, Contatos, Links Pro, Tema).
- Público: hierarquia forte (avatar → nome → headline → ações → links → vCard).
- Presence: manter tela cheia; refinar tipografia e CTAs.
- Landing: CTA para `/developers` e reforço do Pro (links + Smart).

### Não fazer nesta rodada

- Trocar para outra lib de componentes.
- Dark mode obrigatório.
- Temas purple/glow genéricos de IA.

---

## 8. Testes

- Backend: avatar e-mail válido com/sem foto; e-mail inválido; rate limit smoke; Free não salva `custom_links`; Pro salva e público devolve.
- Frontend smoke: `/developers` renderiza; editor mostra seção Links; `/app/smart` gated.

---

## 9. Critérios de sucesso

1. Site terceiro embute `<img src="https://{app}/api/v1/public/avatar?email=user@x.com">` e vê a foto do usuário MyCartao (ou placeholder).
2. `/developers` mostra exemplos incluindo Next.js.
3. Usuário Pro adiciona links custom e eles aparecem no cartão público.
4. Usuário Pro configura Smart Rules na UI e `/go/{slug}` respeita o destino.
5. Free não consegue persistir links custom; vê upsell.
6. App + páginas públicas visualmente mais coerentes e modernas sem quebrar fluxos atuais.

---

## 10. Ordem de implementação sugerida

1. Avatar API + testes  
2. Página `/developers`  
3. `custom_links` (validação + editor + público)  
4. UI `/app/smart`  
5. Passada de layout (tokens, shell, público, Presence, landing)
