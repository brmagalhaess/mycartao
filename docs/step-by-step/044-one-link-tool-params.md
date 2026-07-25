# 044 — Um link público + parâmetro `?tool=` por ferramenta

## Contexto

A página de Configurações ainda mostrava 2 links (cartão e portfólio). O
usuário pediu **somente 1 link**, com parâmetros para cada ferramenta.

## Modelo

```
https://app/c/{key}                 → cartão (padrão)
https://app/c/{key}?tool=portfolio  → portfólio
https://app/c/{key}?tool=presence   → Presence Mode
https://app/c/{key}?tool=smart      → Smart Card (/go)
```

`{key}` = slug Pro (se personalizado) ou ID do cartão primário.

## O que foi feito

### Frontend

- `frontend/src/lib/public-tools.ts` — catálogo de ferramentas + `publicToolUrl()`.
- **Configurações**: um único `CopyableLink`; seletor de ferramenta (pílulas)
  altera o `?tool=` no mesmo campo.
- **ShareLinksBlock** (Cartões / Portfólio / Editor): mesma UX de 1 link + tools.
- **`/c/[slugOrId]`**: lê `?tool=` e redireciona para `/p`, `/presence` ou `/go`.
- **Smart**: link de compartilhamento passa a ser `/c/{key}?tool=smart`.

### Backend (mesmo identificador para todas as tools)

- `portfolio._resolve_profile`: resolve também por **card UUID**.
- `cards.get_public_card`: resolve também por **profile UUID**.

## Validação

- Teste novo: `test_public_portfolio_by_card_id`
- `pytest` + `tsc` + `lint` + `build`
