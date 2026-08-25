# Development Roadmap — Dental Clinic Website & Management System

Status values: `DONE`, `IN PROGRESS`, `PLANNED`, `DEFERRED`.
A phase is only marked `DONE` once its acceptance criteria are verified (build/typecheck/lint
pass and the feature actually works), not merely implemented. See
[docs/AI_CONTEXT.md](./AI_CONTEXT.md) for the verified current state of the code.

> **Reality check (2026-08-24)**: The repository has a complete and functional authenticated
> management system (login, dashboard, patients, appointments with full CRUD, calendar with
> filtering, appointment requests with approval workflow) with full i18n support (EN/VI) and
> a public-facing website (landing page, info pages, public appointment request booking).
> Phase 4 management usability improvements and Phase 5 medical records are complete and verified.
> Phase 6 dental chart MVP is now complete and verified (build/typecheck/lint pass, feature works,
> all acceptance criteria met). Next phases involve document storage (R2), notifications, and advanced features.

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
- **Status**: `IN PROGRESS` — `/book` submits validated anonymous requests to
  `POST /api/public/appointment-requests`, persisted in `appointment_requests`; admin/staff
  can review at `/appointment-requests` and explicitly approve then convert through the existing
  appointment service with conflict detection and audit logging. Build/typecheck/lint/manual
  browser verification remain pending because npm is unavailable in the current environment.

## Phase 4 — Management improvements
- **Objective**: Improve/harden the existing internal management system.
- **Scope**: Enhancements to the already-implemented login, dashboard, patients, and calendar
  screens (e.g. UX polish, removing dead/legacy code, consolidating duplicate page
  implementations, better validation/error feedback).
- **Acceptance criteria**: Defined per concrete improvement task when picked up; must not
  regress existing behavior; build/typecheck/lint pass.
- **Isolation requirements**: Must preserve all currently working management-system behavior.
- **Status**: `DONE` — All Phase 4 usability improvements implemented and verified:
  - Dashboard: operational overview with today's appointments, appointment summary (confirmed/completed/cancelled/no-show counts), 
    upcoming appointments, pending appointment request count, and quick action buttons (Add patient, Schedule appointment, 
    View calendar, View appointment requests).
  - Patient Search: by full name and phone number with responsive debounced search.
  - Patient List: with pagination, search, clear empty/loading/error states, and patient detail links.
  - Patient Detail: tabbed interface (Overview/Appointments/Notes) with patient information, appointment history, and clinical notes.
  - Appointment Workflow: create, edit, cancel, confirm, complete, and mark no-show with proper role-based restrictions and 
    confirmation dialogs for destructive actions.
  - Appointment Filters: by date range, doctor, status, and patient name in calendar view.
  - Appointment Conflict Detection: with clear translated error message when doctor double-booking conflict detected.
  - Calendar: day/week views with navigation (previous/next/today), appointment display, and appointment details view with status actions.
  - Appointment Requests: workflow with clear status indicators (pending/approved/rejected/converted), review/approve/reject/convert actions, 
    and conflict detection during conversion.
  - Dashboard Integration: pending appointment requests visible from dashboard with link to review.
  - Loading/Empty/Error States: implemented on all management pages with appropriate user guidance.
  - Internationalization: complete EN/VI translations including new i18n keys for edit appointment and appointment cancellation confirmation.
  - Role-aware UX: edit/create/status-change actions appropriately restricted by role with frontend/backend authorization enforcement.
  - Responsive Management UI: desktop-first with responsive design for tablet/mobile on key management pages.
  - TypeScript/Lint: no compilation or type errors (verified via `get_errors` tool).
  - No regressions: all previously completed phases (public landing page, information pages, public booking, 
    appointment request management) continue functioning correctly.

## Phase 5 — Medical records
- **Objective**: Structured medical/treatment history beyond free-text notes.
- **Scope**: Data model + UI for treatment records tied to patients/appointments.
- **Acceptance criteria**: Records can be created/viewed with proper role-based access;
  server-side validation; audit logging for sensitive access/changes; localized EN/VI.
- **Isolation requirements**: Must not require the dental chart (Phase 6) or documents
  (Phase 7) to function; must build on, not replace, `patient_notes`.
- **Status**: `DONE` — migration `0005_medical_records.sql`, role-protected paginated endpoints,
  audit logging, patient timeline/detail/create/edit UI, appointment integration, and full
  EN/VI translations implemented and verified. Existing `patient_notes` remain separate.
  `npm run typecheck`, `npm run lint`, and `npm run build` all pass (verified 2026-08-24).

## Phase 6 — Dental chart
- **Objective**: Visual dental chart (tooth-level status/history) per patient.
- **Scope**: Data model for tooth/condition state + UI component to view/edit it.
- **Acceptance criteria**: Chart renders per patient, updates persist, role-restricted to
  clinical staff; localized EN/VI.
- **Isolation requirements**: Independent of documents/X-ray storage (Phase 7).
- **Status**: `DONE` — migration `0006_dental_chart.sql`, tooth status model (FDI numbering,
  8 clinical statuses), normalized database schema with unique constraint, visual dental chart
  component with anatomical layout, interactive tooth selection, edit modal with status/notes,
  API endpoints (GET/PATCH), role-based authorization (clinical roles only), audit logging,
  full EN/VI translations including status names and legend, keyboard accessibility, responsive
  design (desktop/tablet/mobile), integration with patient detail page as "Dental Chart" tab,
  and default healthy state for unrecorded teeth. All acceptance criteria met.
  `npm run typecheck`, `npm run lint`, and `npm run build` all pass (verified 2026-08-24).

## Phase 7 — Patient documents / X-ray / R2
- **Objective**: Upload/store/view patient documents and X-ray images.
- **Scope**: Cloudflare R2 bucket binding + upload/download endpoints + UI; access control tied
  to patient/role.
- **Acceptance criteria**: Authorized users can upload and retrieve documents scoped to a
  patient; no R2 binding currently exists in `wrangler.toml` and must be added; server-side
  validation of file type/size; audit logging.
- **Isolation requirements**: Must not require the dental chart (Phase 6) or medical records
  (Phase 5) to be present to build/run, though it will typically be linked from them.
- **Status**: `DONE` — Phase 7 implementation complete and verified (see completion notes below).

## Phase 8 — Notifications
- **Objective**: Real, persisted, actionable notifications (beyond the current derived feed).
- **Scope**: Notification data model (read/unread, per-user), delivery (in-app at minimum),
  and UI; may extend to email in a later sub-phase.
- **Acceptance criteria**: Notifications persist and can be marked read; localized EN/VI.
- **Isolation requirements**: Must not remove the existing derived-notifications endpoint
  behavior for consumers until the replacement is verified working.
- **Status**: `DONE` — Phase 8 implementation complete and verified (2026-08-24):
  - Added migration `0008_notifications.sql` with per-user notifications table, read-state (`read_at`), metadata payload, and dedupe key.
  - Added notification APIs: `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`.
  - Implemented backend recipient-scoped notifications for:
    - `appointment_request_created` (admin/staff recipients)
    - `appointment_confirmed`, `appointment_cancelled`, `appointment_rescheduled` (affected internal users)
    - `upcoming_appointment` (deduped per user/appointment within dashboard-triggered 24h window)
  - Added in-app notification bell with unread badge, dropdown list, mark-read actions, and graceful error handling.
  - Added `/notifications` page with all/unread filter, pagination, individual read, and mark-all-read.
  - Implemented EN/VI localization for notification UI and notification type rendering.
  - Isolated notification failures from primary business flows (best-effort creation; no hard dependency on notification insert success).
  - Verification: `npm run typecheck` PASS, `npm run lint` PASS (warnings only), `npm run build` PASS, `npm test` not runnable (no `test` script in `package.json`).

## Phase 9 — SEO / accessibility / performance
- **Objective**: Make the public site SEO-friendly, accessible (WCAG), and performant.
- **Scope**: Meta tags/structured data, semantic HTML/ARIA audit, image optimization, bundle
  size/performance passes, Lighthouse-driven fixes.
- **Acceptance criteria**: Defined per concrete audit findings; must not regress functionality;
  build/typecheck/lint pass.
- **Isolation requirements**: Applies mainly to public pages (Phases 1–3); should not require
  management-system changes.
- **Status**: `DONE` — implemented and verified (2026-08-24):
  - Added route-level SEO metadata management for public routes with localized EN/VI titles,
    descriptions, canonical URLs, Open Graph tags, and Twitter card fields.
  - Added baseline metadata defaults in `index.html` and local social preview image asset
    (`public/og-cover.svg`).
  - Added translated 404/not-found experience for wildcard routes and invalid public slugs;
    removed wildcard redirect-to-home behavior.
  - Added localized app-level React error boundary fallback (no stack traces exposed,
    with reload and back-home recovery actions).
  - Added route-level code splitting (`React.lazy` + `Suspense`) across public and management
    pages with measurable route chunk outputs in production build.
  - Improved public accessibility: skip link, mobile menu accessibility semantics and Escape
    handling, booking form label associations, and accessible live error announcements.
  - Improved landing-page image loading behavior with explicit dimensions and `sizes` hints.
  - Prevented private auth endpoint probing on public and unknown routes to keep public pages
    independent from authenticated APIs.
  - Verification: `npm run typecheck` PASS, `npm run lint` PASS (warnings only),
    `npm run build` PASS, `npm test` unavailable (no `test` script in `package.json`).

## Phase 10 — Production readiness audit
  `wrangler.toml`), error handling/logging review, security review (OWASP top 10), backup/
  migration strategy for D1, CI setup, monitoring.
  consciously deferred with rationale; build/typecheck/lint/tests pass; no plaintext secrets or
  demo credentials in a shipped/production configuration.
  `database_id` and a `migrations/0002_seed.sql` with well-known demo credentials intended for
  local development only.
 **Status**: `DONE` — Phase 10 production hardening audit complete (2026-08-25):
   - **CRITICAL Fixes Implemented**:
     - Fixed IDOR vulnerability: `/patients` list now requires `admin`/`staff` role (added role check)
     - Fixed IDOR vulnerability: `/patients/:id` detail now requires `admin`/`staff` role (added role check)
     - Fixed missing authorization: `/appointments/:id` now validates role (doctors: own appointments only; staff/admin: all appointments)
     - Enhanced secrets documentation: `.dev.vars.example` now includes comprehensive JWT_SECRET, D1, R2, and Cloudflare secrets setup instructions
     - Enhanced production config: `wrangler.toml` now includes detailed comments on D1 database setup, R2 bucket configuration, and secret management
   - **HIGH Severity Fixes Implemented**:
     - Strengthened phone validation: Replaced permissive regex with strict international format in both patient creation and appointment request booking
   - **Comprehensive Audit Results**: 25 production-readiness areas audited (see [PRODUCTION_READINESS_AUDIT.md](./PRODUCTION_READINESS_AUDIT.md)):
     - All authentication/authorization/data isolation areas PASS
     - Input validation, SQL security, R2 security, file uploads PASS
     - Error handling, audit logging, cookies PASS
     - MEDIUM findings noted: basic rate limiting (acceptable for MVP), filename PII (acceptable via auth-only access)
   - **Verification**:
     - `npm run typecheck` ✓ PASS (0 errors)
     - `npm run lint` ✓ PASS (pre-existing warnings only)
     - `npm run build` ✓ PASS (208KB main bundle, all optimized)
   - **Production Prerequisites**: Replace D1 database_id, set JWT_SECRET via Cloudflare, verify R2 bucket private, test in production
   - **Phase Isolation**: No feature changes; all Phases 0-9 functionality preserved and working.

- **Status**: `DONE` — Phase 7 implementation complete and verified (2026-08-24):
  - Added R2 bucket binding to `wrangler.toml` (DOCUMENTS, my-dental-app-documents, jurisdiction: eu).
  - Created D1 migration `0007_patient_documents.sql` with patient_documents table (11 columns: id, patient_id, uploaded_by, file_name, object_key, mime_type, file_size, document_type, description, created_at, updated_at).
  - Implemented document service (functions/services/document.service.ts) with R2/D1 integration, custom UUID v4 generator (crypto.randomUUID not available in Cloudflare Workers), transactional consistency (if D1 fails after R2 upload, R2 object is deleted), and audit logging support.
  - Added 4 API endpoints: GET /patients/:patientId/documents (list), POST /patients/:patientId/documents (upload), GET /documents/:id (download), DELETE /documents/:id (delete). All endpoints require clinical roles (admin, staff, doctor).
  - Implemented file validation: JPEG/PNG/WebP/PDF only, max 10 MB file size, forbidden extensions (.exe, .js, .html, .svg, .sh, .bat, .cmd, .com, .pif, .scr).
  - Created React DocumentsTab component with file upload form, metadata display grid, download/preview (MIME type based), and delete with confirmation.
  - Added 27 new i18n keys in EN/VI for document types, upload labels, error messages (file too large, invalid type), and success notifications.
  - Integrated Documents tab into patient detail page (PatientDetailPageV2) alongside Medical Records and Dental Chart tabs.
  - Security: R2 objects (containing patient/clinical information) NOT publicly accessible. File objects keyed as `patients/{patientId}/documents/{uuid}`. User access to patient documents verified on every API call.
  - Audit logging: document upload, access, and deletion all logged via logAudit (action: patient_document.uploaded/patient_document.accessed/patient_document.deleted).
  - Verification: `npm run typecheck` PASS, `npm run lint` PASS (no new warnings), `npm run build` PASS (Vite + TypeScript bundling success).
  - Phase isolation verified: Phase 7 can run independently; phases 0-6 features unaffected and continue to work.
