# AFL Engenharia — Triagem Docs

Plataforma de check-in e fila de espera para análise de documentos. O técnico
registra uma solicitação por **SITE ID** e acompanha a posição na fila; a equipe
administrativa gerencia a fila, o SLA e o cadastro de tipos de solicitação.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript**
- **IBM Carbon Design System** (`@carbon/react` + `@carbon/styles` e `@carbon/icons-react`)
- **Tailwind CSS 4** + `cva`/`tailwind-merge` (utilitários)
- **Mock backend**: `json-server` (arquivo `db.json`, porta `3001`)
- **Autenticação**: cookie `admin_session`, senha com hash `bcrypt`
- **Testes**: Vitest
- **Lint**: ESLint (flat config) · **Format**: Prettier

> **Backend atual em desenvolvimento:** o projeto usa `json-server` como backend
> mock. Há migrações Supabase em `supabase/migrations/` (histórico/target futuro),
> mas nenhuma integração do cliente Supabase é usada no código nesta fase.

## Requisitos

- Node.js **v20.19.2** (ver `.nvmrc`)

## Instalação

```bash
nvm install && nvm use   # ou use a versão do .nvmrc
npm install
```

## Executando em desenvolvimento

```bash
npm run dev
```

Esse comando sobe **dois** processos em paralelo:

| Serviço       | Comando                          | Porta  |
| ------------- | -------------------------------- | ------ |
| Next.js       | `next dev --turbopack`           | 3000   |
| Json-server   | `json-server --watch db.json`    | 3001   |

Acesso: http://localhost:3000

> Opcional: copie `.env.example` para `.env.local`. O padrão de
> `NEXT_PUBLIC_API_URL` já é `http://localhost:3001`.

## Credenciais de desenvolvimento

| Campo    | Valor       |
| -------- | ----------- |
| Usuário  | `admin`     |
| Senha    | `admin123`  |

O usuário padrão é definido na coleção `users` em `db.json` (hash `bcrypt`).
Para registrar um novo hash, rode:

```bash
node -e "const b=require('bcryptjs'); b.hash('SUA_SENHA',10).then(console.log)"
```

## Rotas

| Rota                     | Acesso  | Descrição                                        |
| ------------------------ | ------- | ------------------------------------------------ |
| `/`                      | Público | Check-in: nova solicitação + busca por SITE ID    |
| `/status/[siteId]`       | Público | Acompanhamento de status e posição na fila        |
| `/login`                 | Público | Login do painel administrativo                    |
| `/admin`                 | Restrito | Fila de análise (FIFO) com Ações (chamar/concluir/recusar) |
| `/admin/dashboard`       | Restrito | KPIs: total, status, tempo médio de espera/serviço |
| `/admin/arquivados`      | Restrito | Solicitações concluídas/recusadas                 |
| `/admin/configuracoes`   | Restrito | Tipos de solicitação, SLA e troca de senha        |

As rotas `/admin/*` são protegidas por `src/proxy.ts` (redireciona para `/login`
sem cookie `admin_session`).

## Fluxo de status

`waiting` (Aguardando Análise) → `in_review` (Em Análise) → `approved` (Aprovado)
ou `rejected` (Recusado).

## Banco mock (db.json)

Coleções:

- `queue_entries` — solicitações na fila (com `position_seq`, `started_at`, `completed_at`)
- `request_types` — catálogo de tipos de solicitação (ex.: Auditoria, Instalação)
- `sla_config` — `expected_wait_min` e `expected_service_min`
- `users` — usuários do painel (username + `password_hash`)

Ao reiniciar o `npm run mock`, o arquivo é persistido (o `json-server`
reescreve o `db.json` a cada alteração).

## Scripts

```bash
npm run dev          # Next.js + json-server em modo watch
npm run build        # build de produção (next build)
npm run start        # inicia a build (next start)
npm run lint         # ESLint
npm run format       # Prettier (--write)
npm run mock         # json-server --watch db.json --port 3001
npm test             # Vitest (run)
npm run test:watch   # Vitest (watch)
```

## Testes

```bash
npm test
```

Os testes ficam em `src/lib/__tests__/` (Vitest). A configuração fica em
`vitest.config.ts` (alias `@` → `src`).

## Estrutura relevante

```
src/
  app/                  # Rotas do App Router
    (auth)/login/       # Login
    admin/              # Painel (fila, dashboard, arquivados, configurações)
    status/[siteId]/    # Acompanhamento público
  components/           # AppHeader, nav etc.
  lib/
    api.ts              # Cliente da API mock (json-server) + lógica de negócio
    session.ts          # Login/logout via cookie + bcrypt
    queue.ts            # Tipos e rótulos de status
    duration.ts         # Cálculo de SLA (espera/serviço/total)
    utils.ts            # Utilitários (cn etc.)
  proxy.ts              # Middleware de proteção do /admin
db.json                 # Backend mock (json-server)
supabase/migrations/    # Migrações Supabase (histórico/futuro)
```

## Produção

```bash
npm run build
npm run start
```

Para produção, `NEXT_PUBLIC_API_URL` deve apontar para o backend real (ver
`supabase/migrations/` para o schema esperado).