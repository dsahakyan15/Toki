# Repository Guidelines

## Project Structure & Module Organization
- `frontend/client/` is the Next.js (App Router) web client. Source lives in `src/app/`, global styles in `src/app/globals.css`, and static assets in `public/`.
- `backend/server/` is the Express API. Entry point is `server/index.js`; Prisma schema is in `prisma/schema.prisma`; environment configuration is in `.env`.
- `Documentation.md` contains the MVP spec and feature requirements for Vinyl Social.

## Build, Test, and Development Commands
- Frontend (`frontend/client`):
  - `npm install` installs dependencies.
  - `npm run dev` starts the dev server at `http://localhost:3000`.
  - `npm run build` creates a production build; `npm run start` serves it.
  - `npm run lint` runs ESLint (Next.js + TypeScript).
- Backend (`backend/server`):
  - `npm install` installs dependencies.
  - `node server/index.js` runs the API using `PORT` from `.env`.
  - `npx nodemon server/index.js` runs with auto-reload (devDependency).
  - After schema changes, run `npx prisma generate`; use `npx prisma migrate dev` when adding migrations.

## Coding Style & Naming Conventions
- Backend is CommonJS JavaScript; frontend is TypeScript/React with Tailwind CSS.
- Use 2-space indentation and semicolons; follow the local quote style (single quotes in backend, double quotes in frontend).
- React components use PascalCase; variables/functions use camelCase. Keep App Router files named `page.tsx`/`layout.tsx`.

## Testing Guidelines
- Automated tests are not configured yet. Backend `npm test` is a placeholder that exits with an error.
- If you add tests, document the runner in `package.json` and use standard naming (e.g., `*.test.ts`, `*.spec.js`).

## Commit & Pull Request Guidelines
- No Git history is available in this workspace, so there is no established commit convention.
- Recommended: short, imperative commit summaries; optionally adopt Conventional Commits (e.g., `feat: add listen-together endpoint`).
- PRs should include a concise summary, steps to test, and UI screenshots for frontend changes; link related issues when applicable.

## Configuration & Security Notes
- Backend expects `DATABASE_URL`, `PORT`, and `JWT_SECRET` in `backend/server/.env`.
- Do not commit real secrets; prefer local overrides or a sanitized `.env.example` when sharing.
