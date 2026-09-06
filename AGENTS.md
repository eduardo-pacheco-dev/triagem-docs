# AGENTS.md

Guia para agentes de IA e desenvolvedores que trabalham neste repositório.

## Projeto

**Triagem Docs** — plataforma de check-in e fila de análise de documentos (AFL
Engenharia). Frontend Next.js (App Router) + backend **mock** via `json-server`
(`db.json` na porta 3001).

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
- **Autenticação é baseada em cookie client-side** (`src/lib/session.ts` e
  `session-constants.ts`): compara o hash `bcrypt` do usuário em `db.json` e
  seta o cookie `admin_session`. O middleware `src/proxy.ts` protege `/admin/*`.
- **Sem comentários em código** salvo quando explicitamente solicitado.
- **Padrões**: componentes "use client" (quase tudo é client-side), Carbon
  Design System (`@carbon/react`), utilitário `cn` em `src/lib/utils.ts`,
  tipagem via interfaces em `src/lib/queue.ts` e `src/lib/api.ts`.
- **SLA**: toda a lógica de tempo está em `src/lib/duration.ts` (`slaLabel`) e o
  cálculo de métricas em `fetchDashboard` (`src/lib/api.ts`).

## Credenciais de desenvolvimento

- Usuário: `admin` / Senha: `admin123` (coleção `users` do `db.json`, hash bcrypt).
- O hash real de `admin123` já está em `db.json`. Se o login falhar, **regenere**
  o hash com:
  ```bash
  node -e "const b=require('bcryptjs'); b.hash('admin123',10).then(console.log)"
  ```

## Trabalhando com o mock (db.json)

- `json-server` reescreve `db.json` a cada escrita; alterações no arquivo são
  refletidas em runtime (ex.: troca de senha, novos tipos de solicitação).
- Coleções: `queue_entries`, `request_types`, `sla_config`, `users`.
- Os status válidos de `queue_entries` são: `waiting`, `in_review`, `approved`
  e `rejected`.
- `position_seq` é a posição FIFO (0-based no arquivo; exibida 1-based na UI).
- Para resetar o estado, edite `db.json` ou reinicie o `npm run mock`.

## Regras de domínio (não quebrar)

- Fluxo de status: `waiting → in_review → approved|rejected`. Uma solicitação
  `waiting` pode voltar para a fila (`waiting` zera `started_at`/`completed_at`).
- Protocolo é gerado como `DOC-XXXX` e é único.
- Tipos de solicitação não podem ter nomes duplicados (case-insensitive).
  Duplicados devem gerar erro amigável ("Este tipo já existe.").
- SLA mínimo de nome de senha: 6 caracteres.

## Metas de qualidade

- Manter o app 100% funcional com **apenas** o json-server como backend.
- Preservar o design system Carbon (não misturar com outro sistema de UI).
- Mensagens de erro em pt-BR, amigáveis.
- Não exponha/secrete tokens, hashes ou a `password_hash` em logs/UI.
- Rode `npm run lint` e `npm test` antes de finalizar qualquer tarefa.