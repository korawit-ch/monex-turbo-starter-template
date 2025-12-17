# monex-turbo-starter-template-backend

> Backend monorepo with NestJS API and Prisma ORM

## What's inside?

```shell
.
├── apps
│   ├── api     # NestJS 11 API with Prisma    → http://localhost:3000
│   └── db      # PostgreSQL 16 (Docker)       → localhost:5433
└── packages
    ├── @repo/eslint-config       # ESLint configurations
    ├── @repo/jest-config         # Jest configurations
    ├── @repo/prisma              # Prisma client, schema, types (npm-ready)
    └── @repo/typescript-config   # TypeScript configurations
```

### Tech Stack

**Runtime & Apps**

| Component                                                 | Version         | Port |
| --------------------------------------------------------- | --------------- | ---- |
| **Node.js**                                               | >=22.12         | -    |
| [**NestJS API**](https://nestjs.com/) (`apps/api`)        | ^11.0.0         | 3000 |
| [**PostgreSQL**](https://www.postgresql.org/) (`apps/db`) | 16-alpine       | 5433 |
| **Swagger** (`/api`)                                      | @nestjs/swagger | 3000 |

**Core Libraries**

| Library                                           | Version |
| ------------------------------------------------- | ------- |
| [**Prisma ORM**](https://www.prisma.io/)          | ^7.1.0  |
| [**TypeScript**](https://www.typescriptlang.org/) | 5.5.4+  |

**Tooling**

| Tool                                                   | Purpose            |
| ------------------------------------------------------ | ------------------ |
| [**Turborepo**](https://turbo.build/repo)              | Monorepo build     |
| [**ESLint**](https://eslint.org/)                      | Code linting       |
| [**Prettier**](https://prettier.io)                    | Code formatting    |
| [**Jest**](https://jestjs.io/)                         | Testing            |
| [**Docker Compose**](https://docs.docker.com/compose/) | Database container |
| [**Husky**](https://typicode.github.io/husky/)         | Git hooks          |
| [**Commitlint**](https://commitlint.js.org/)           | Commit messages    |

## Getting Started

### Prerequisites

- Node.js >= 22.12 (required for Prisma 7)
- Docker and Docker Compose

### Setup

```bash
npm install
npm run db:start
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Opens: API (3000), Swagger (`http://localhost:3000/api`)

### Commands

| Command               | Description             |
| --------------------- | ----------------------- |
| `npm run dev`         | Start API server        |
| `npm run build`       | Build all packages      |
| `npm run lint`        | Lint all packages       |
| `npm run format`      | Format all files        |
| `npm run db:start`    | Start PostgreSQL        |
| `npm run db:stop`     | Stop PostgreSQL         |
| `npm run db:generate` | Generate Prisma client  |
| `npm run db:push`     | Push schema to database |
| `npm run db:seed`     | Seed database           |
| `npm run db:studio`   | Open Prisma Studio      |

## API Endpoints

Swagger documentation at `http://localhost:3000/api`:

- `GET /links` - Get all links
- `GET /links/:id` - Get a specific link
- `POST /links` - Create a new link
- `PATCH /links/:id` - Update a link
- `DELETE /links/:id` - Delete a link

### DTOs & Swagger

DTOs implement Prisma types to ensure type alignment:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import type { Prisma } from '@repo/prisma';

export class CreateLinkDto implements Prisma.LinkCreateInput {
  @ApiProperty({ example: 'https://google.com' })
  url: string;

  @ApiProperty({ example: 'Google' })
  title: string;

  @ApiProperty({ example: 'Search engine', required: false })
  description?: string;
}
```

## Publishing @repo/prisma

The `@repo/prisma` package is npm-ready for frontend consumption:

```bash
cd packages/prisma
npm run build
npm publish
```

Exports:

- `prisma` - Singleton Prisma client instance
- `Link`, `Prisma` - All Prisma-generated types

## Git Hooks & CI

**Pre-commit:** ESLint + Prettier on staged files

**Commit format:** `type(scope): message`

- Types: `build`, `chore`, `docs`, `feat`, `fix`, `refactor`, `test`, `release`

**CI:** Runs lint, format check, type check on all pushes/PRs
