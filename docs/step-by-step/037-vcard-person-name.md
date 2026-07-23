# Step-by-step 037 — vCard: nome da pessoa, não da empresa

## Problema
Ao tocar em “Salvar contato” no celular, o contato era salvo com o **nome da empresa**.

## Causa raiz
O `.vcf` tinha `FN` + `ORG`, mas **sem** a propriedade estruturada `N`. No iOS (e em alguns Androids), quando `ORG` existe e `N` falta, a agenda trata o contato como organização e exibe a empresa no lugar do nome.

## Correção
| Arquivo | Função |
|---------|--------|
| `backend/app/services/vcard.py` | Emite `N` + `FN` a partir de `display_name` (nunca usa company como nome) |
| `backend/tests/test_vcard.py` | Garante FN pessoa + ORG empresa + N estruturado |
| `frontend/.../presence/page.tsx` | Presence Mode mostra `display_name` (antes só `title`) |

## Validação
```bash
cd backend && python3 -m pytest tests/test_vcard.py tests/test_exports.py -q
```

No celular: abrir cartão → Salvar contato → nome = usuário; empresa = campo Empresa.

## Análise
Separar `FN`/`N` (pessoa) de `ORG` (empresa) alinha o export ao comportamento das agendas móveis sem mudar o modelo de dados. Próximo passo opcional: campos explícitos nome/sobrenome no perfil para `N` mais preciso em nomes compostos.
