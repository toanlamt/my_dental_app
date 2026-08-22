# Development Roadmap — Dental Clinic Website & Management System

Status values: `DONE`, `IN PROGRESS`, `PLANNED`, `DEFERRED`.
A phase is only marked `DONE` once its acceptance criteria are verified (build/typecheck/lint
pass and the feature actually works), not merely implemented. See
[docs/AI_CONTEXT.md](./AI_CONTEXT.md) for the verified current state of the code.

> **Reality check (2026-08-22)**: the repository already has a working authenticated
> management system (login, dashboard, patients, calendar) built directly on React + Vite +
> Tailwind + Cloudflare Pages/D1/Hono, but it has **no i18n foundation** and **no public
> website** yet. The phases below are numbered per the original plan; actual implementation
> order in the code has not followed 0→1→2→3 strictly (management-system work happened before
> the public site or i18n foundation existed). Status reflects the code as found, not the
> numbering order.

## Phase 0 — Foundation + internationalization
- **Objective**: Establish the base app foundation and the i18n system that every later phase
  (public site and management system alike) must use for user-facing text.
- **Scope**: Project scaffolding (already present: Vite + React + TS + Tailwind + Cloudflare
  Pages/D1/Hono); introduce an i18n library, English + Vietnamese locale files, a language
  switcher, and a convention for all new/modified UI strings to go through it.
- **Acceptance criteria**:
  - i18n library installed and wired at the app root.
  - At least English and Vietnamese locale resource files exist and are loadable.
  - A documented pattern (e.g. `useTranslation`/`t()`) is used for at least one real screen as
    a reference implementation.
  - `npm run build`, `npm run typecheck`, `npm run lint` pass.
- **Isolation requirements**: Must not break the existing login/dashboard/patients/calendar
  screens. Introducing i18n should not require rewriting every existing string in the same
  phase (can be incremental), but must not regress current functionality.
- **Status**: `IN PROGRESS` — project scaffolding (React/Vite/Tailwind/Cloudflare stack) is
  done; i18n dependencies and EN/VI locale files are now declared, with a persisted language
  switcher and several live screens migrated. Calendar and patient detail still have substantial
  hardcoded strings, and npm is unavailable in both Windows and WSL for verification.

## Phase 1 — Public landing page
- **Objective**: Public-facing landing page for the clinic.
- **Scope**: Landing page route/content only, using the i18n system from Phase 0.
- **Acceptance criteria**: Route renders for unauthenticated visitors; text is localized
  (EN/VI); build/typecheck/lint pass.
- **Isolation requirements**: Must not require authentication; must not affect existing
  management routes.
- **Status**: `IN PROGRESS` — the static bilingual landing page and dedicated public layout are
  implemented. Required build/typecheck/lint and manual browser verification remain blocked
  because `npm` is unavailable in both Windows PowerShell and WSL; do not mark `DONE` until
  those checks are run successfully.

## Phase 2 — Public information pages
- **Objective**: Services, About, Doctors, FAQ, Contact pages.
- **Scope**: Static/content-driven public pages, localized EN/VI.
- **Acceptance criteria**: All listed pages exist as routes, are reachable without auth, and
  are localized; build/typecheck/lint pass.
- **Isolation requirements**: Independent of management-system routes and of booking (Phase 3).
- **Status**: `IN PROGRESS` — static bilingual services, service detail, about, doctors, doctor
  detail, FAQ, and contact pages are implemented with route-aware navigation, metadata,
  breadcrumbs, and invalid-slug states. Build/typecheck/lint/manual browser verification remain
  blocked because `npm` is unavailable in Windows PowerShell and Ubuntu WSL on 2026-08-22; do
  not mark `DONE` until those checks run successfully.

## Phase 3 — Public appointment booking
- **Objective**: Allow a visitor to request/book an appointment without logging in.
- **Scope**: Public booking form + backend endpoint(s) to create a booking request; validation
  server-side (zod); must not allow booking abuse (e.g. rate limiting/captcha considerations).
- **Acceptance criteria**: A visitor can submit a booking request that is persisted and visible
  to staff/admin in the management system; input is validated server-side; localized EN/VI.
- **Isolation requirements**: Must not require the visitor to have an account; must not break
  the existing internal appointment-creation flow used by staff/admin.
- **Status**: `PLANNED` — no public booking form or endpoint exists; the only appointment
  creation path today is `POST /api/appointments`, which requires `requireAuth` + role
  `admin`/`staff`.

## Phase 4 — Management improvements
- **Objective**: Improve/harden the existing internal management system.
- **Scope**: Enhancements to the already-implemented login, dashboard, patients, and calendar
  screens (e.g. UX polish, removing dead/legacy code, consolidating duplicate page
  implementations, better validation/error feedback).
- **Acceptance criteria**: Defined per concrete improvement task when picked up; must not
  regress existing behavior; build/typecheck/lint pass.
- **Isolation requirements**: Must preserve all currently working management-system behavior.
- **Status**: `IN PROGRESS` — the base management system (auth, dashboard, patients CRUD +
  search, calendar/appointments with conflict detection, audit logging) is already implemented
  and functional. Known cleanup item: duplicate page implementations exist for every screen
  (`*-page.tsx` vs `*-page-v2.tsx`); only the `-v2` versions are routed, and the default Vite
  starter (`App.tsx`/`App.css` + unused sample assets) is dead code — see `docs/AI_CONTEXT.md` §2/§11.

## Phase 5 — Medical records
- **Objective**: Structured medical/treatment history beyond free-text notes.
- **Scope**: Data model + UI for treatment records tied to patients/appointments.
- **Acceptance criteria**: Records can be created/viewed with proper role-based access;
  server-side validation; audit logging for sensitive access/changes; localized EN/VI.
- **Isolation requirements**: Must not require the dental chart (Phase 6) or documents
  (Phase 7) to function; must build on, not replace, `patient_notes`.
- **Status**: `PLANNED` — only free-text `patient_notes` exist today; no structured medical
  record schema or endpoints exist.

## Phase 6 — Dental chart
- **Objective**: Visual dental chart (tooth-level status/history) per patient.
- **Scope**: Data model for tooth/condition state + UI component to view/edit it.
- **Acceptance criteria**: Chart renders per patient, updates persist, role-restricted to
  clinical staff; localized EN/VI.
- **Isolation requirements**: Independent of documents/X-ray storage (Phase 7).
- **Status**: `PLANNED` — no dental chart schema, endpoints, or UI exist.

## Phase 7 — Patient documents / X-ray / R2
- **Objective**: Upload/store/view patient documents and X-ray images.
- **Scope**: Cloudflare R2 bucket binding + upload/download endpoints + UI; access control tied
  to patient/role.
- **Acceptance criteria**: Authorized users can upload and retrieve documents scoped to a
  patient; no R2 binding currently exists in `wrangler.toml` and must be added; server-side
  validation of file type/size; audit logging.
- **Isolation requirements**: Must not require the dental chart (Phase 6) or medical records
  (Phase 5) to be present to build/run, though it will typically be linked from them.
- **Status**: `PLANNED` — no R2 binding, upload endpoints, or document UI exist.

## Phase 8 — Notifications
- **Objective**: Real, persisted, actionable notifications (beyond the current derived feed).
- **Scope**: Notification data model (read/unread, per-user), delivery (in-app at minimum),
  and UI; may extend to email in a later sub-phase.
- **Acceptance criteria**: Notifications persist and can be marked read; localized EN/VI.
- **Isolation requirements**: Must not remove the existing derived-notifications endpoint
  behavior for consumers until the replacement is verified working.
- **Status**: `PLANNED` — current `GET /api/notifications` derives a read-only feed from
  `appointments`/`audit_logs`; there is no notifications table, no read/unread state, and no
  push/email delivery.

## Phase 9 — SEO / accessibility / performance
- **Objective**: Make the public site SEO-friendly, accessible (WCAG), and performant.
- **Scope**: Meta tags/structured data, semantic HTML/ARIA audit, image optimization, bundle
  size/performance passes, Lighthouse-driven fixes.
- **Acceptance criteria**: Defined per concrete audit findings; must not regress functionality;
  build/typecheck/lint pass.
- **Isolation requirements**: Applies mainly to public pages (Phases 1–3); should not require
  management-system changes.
- **Status**: `PLANNED` — not started; depends on the public website (Phases 1–3) existing
  first.

## Phase 10 — Production readiness audit
- **Objective**: Final audit before/for production deployment.
- **Scope**: Secrets management (replace `.dev.vars.example`/placeholder `database_id` in
  `wrangler.toml`), error handling/logging review, security review (OWASP top 10), backup/
  migration strategy for D1, CI setup, monitoring.
- **Acceptance criteria**: Checklist of production concerns explicitly reviewed and resolved or
  consciously deferred with rationale; build/typecheck/lint/tests pass; no plaintext secrets or
  demo credentials in a shipped/production configuration.
- **Isolation requirements**: Should not change feature behavior, only hardening/config.
- **Status**: `PLANNED` — not started. Current repo still ships a placeholder D1
  `database_id` and a `migrations/0002_seed.sql` with well-known demo credentials intended for
  local development only.
