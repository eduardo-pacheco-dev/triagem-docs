# AGENTS.md

Guia para agentes de IA e desenvolvedores que trabalham neste repositório.

## Projeto

**Triagem Docs** — plataforma de check-in e fila de análise de documentos (AFL
Engenharia). Frontend Next.js (App Router) + backend **mock** via `json-server`
(`db.json` na porta 3001). Há apenas rotas públicas: check-in (`/`) e
acompanhamento de status (`/status/[siteId]`). **Não existe painel
administrativo nem autenticação.**

## Comandos obrigatórios

- **Rodar dev:** `npm run dev` (sobe Next.js na 3000 e json-server na 3001).
- **Mock isolado:** `npm run mock` (json-server na 3001).
- **Lint:** `npm run lint` — rode sempre após alterações.
- **Testes:** `npm test` (Vitest). Testes em `src/lib/__tests__/`.
- **Build:** `npm run build` (use se a mudança afetar rotas/páginas).
- **Node:** v20.19.2 (`.nvmrc`). Não troque de versão da stack sem necessidade.

Após qualquer alteração de código, rode `npm run lint` (e `npm test` se tocar em
`src/lib`).

## Arquitetura e decisões importantes

- **O backend ativo é o mock, não o Supabase.** O código consome `db.json` via
  `src/lib/api.ts` usando `NEXT_PUBLIC_API_URL` (`http://localhost:3001`).
  As migrações em `supabase/migrations/` são histórico/contrato futuro — **não**
  escreva integração com o cliente Supabase no código sem antes confirmar com o
  usuário. As skills `supabase*` aplicam-se a mudanças em `supabase/` apenas.
- **Sem autenticação.** Não há login, sessão, cookie ou middleware de proteção.
  Tudo é público. Não reintroduza `src/lib/session.ts`, `src/proxy.ts` ou rotas
  `/admin` e `/login` sem confirmar com o usuário.
- **Sem comentários em código** salvo quando explicitamente solicitado.
- **Padrões**: componentes "use client" (quase tudo é client-side), Carbon
  Design System (`@carbon/react`), utilitário `cn` em `src/lib/utils.ts`,
  tipagem via interfaces em `src/lib/queue.ts` e `src/lib/api.ts`.
- **SLA**: toda a lógica de tempo está em `src/lib/duration.ts` (`slaLabel`).

## Trabalhando com o mock (db.json)

- `json-server` reescreve `db.json` a cada escrita; alterações no arquivo são
  refletidas em runtime.
- Coleções: `queue_entries`, `request_types`. (Não há mais `users` nem `sla_config`.)
- Os status válidos de `queue_entries` são: `waiting`, `in_review`, `approved`
  e `rejected`.
- `position_seq` é a posição FIFO (0-based no arquivo; exibida 1-based na UI).
- Para resetar o estado, edite `db.json` ou reinicie o `npm run mock`.

## Regras de domínio (não quebrar)

- Fluxo de status: `waiting → in_review → approved|rejected`.
- Protocolo é gerado como `DOC-XXXX` e é único (`src/lib/api.ts` →
  `createCheckIn`).
- A fila ativa considera apenas `waiting` e `in_review`
  (`fetchBySiteId` em `src/lib/api.ts`).

## Metas de qualidade

- Manter o app 100% funcional com **apenas** o json-server como backend.
- Preservar o design system Carbon (não misturar com outro sistema de UI).
- Mensagens de erro em pt-BR, amigáveis.
- Rode `npm run lint` e `npm test` antes de finalizar qualquer tarefa.