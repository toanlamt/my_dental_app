# Copilot Instructions — Dental Clinic Website & Management System

These instructions are permanent for this repository. Follow them in every session without
being asked to repeat them.

## Before writing any code

1. Read [docs/AI_CONTEXT.md](../docs/AI_CONTEXT.md) — actual architecture, stack, schema, routes, and current status.
2. Read [docs/DEVELOPMENT_ROADMAP.md](../docs/DEVELOPMENT_ROADMAP.md) — phase definitions and current phase status.
3. Inspect the current repository state yourself (grep/read relevant files) before assuming
   something exists or is missing. `AI_CONTEXT.md` is a snapshot and can drift from the code.

## Core principles

- **Preserve existing working functionality.** Never remove or break a completed phase's
  behavior while implementing a later phase.
- **Every phase must be independently deployable.** After finishing a phase, the app must
  still `build`, `start`, and display all previously completed functionality even if no
  further AI credits/work follow. Never make a later phase a hard dependency of an earlier one.
- **Implement only the requested phase.** Do not jump ahead to future phases or silently
  expand scope.
- **Avoid unnecessary refactoring.** Touch only what the task requires.

## Internationalization (permanent requirement)

- The application must support **English and Vietnamese** for all user-facing text, forever.
- Use the existing i18n system for all new and modified user-facing text — never hardcode
  user-facing strings once an i18n system exists.
- As of this writing there is **no i18n library installed yet** (see `AI_CONTEXT.md`). If a
  phase needs user-facing text before i18n is introduced, flag this explicitly rather than
  hardcoding strings that will be hard to retrofit; if the task is to build i18n foundation,
  do so before/alongside adding new user-facing screens.

## Backend / security requirements

- Validate all input server-side (this repo uses `zod` in `functions/lib/validation.ts`) —
  never rely on frontend validation alone.
- Enforce authorization on the backend for every route using the existing `requireAuth` /
  `requireRole` middleware (`functions/lib/auth.ts`). Role checks must never live only in the
  frontend.
- Patient and medical data is sensitive: never log it in plaintext, never expose it to a role
  that shouldn't see it, and record relevant actions via `logAudit` (`functions/lib/audit.ts`).
- Passwords are hashed with PBKDF2 (`functions/lib/password.ts`) — never store or log plaintext
  passwords.

## Verification

- Run available checks after changes: `npm run typecheck`, `npm run lint`, `npm run build`,
  and any tests, before considering a task done. Report failures instead of silently ignoring them.

## Keeping docs in sync

- After a meaningful implementation change, update [docs/AI_CONTEXT.md](../docs/AI_CONTEXT.md)
  (stack, routes, API, schema, completed/incomplete features, limitations) to match the new
  reality of the code.
- After completing a phase, update its status in
  [docs/DEVELOPMENT_ROADMAP.md](../docs/DEVELOPMENT_ROADMAP.md). Only mark a phase `DONE` once
  its acceptance criteria have actually been verified (build/typecheck/lint pass and the
  feature works), not just implemented.
