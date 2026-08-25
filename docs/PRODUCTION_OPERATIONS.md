# Production Operations Checklist

Date: 2026-08-25

This document describes the current operational state from repository evidence only. It does not assume Cloudflare account settings that are not represented in code/config.

## D1

- Production database binding exists in config: `DB` in `wrangler.toml`.
- Current blocker: `database_id` is still `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
- Manual prerequisite:
  1. Obtain the real production D1 database ID (Cloudflare dashboard, or `wrangler d1 list` in the correct account).
  2. Replace the placeholder value in `wrangler.toml`.
  3. Apply migrations to production: `wrangler d1 migrations apply my-dental-app-db --remote`.
- Backup/recovery status in repo: no automated backup workflow or restore runbook is implemented in code.

## R2

- R2 binding exists in config: `DOCUMENTS` with bucket name `my-dental-app-documents`.
- Document object keys are UUID-based: `patients/{patientId}/documents/{uuid}`.
- Manual prerequisites:
  1. Ensure production bucket exists with this exact name.
  2. Ensure the bucket is private and not publicly listed/exposed.
  3. Verify access is only through authenticated API routes.
- Backup/versioning/recovery status in repo: no automated object versioning policy, backup job, or restore automation is defined here.

## Secrets

- Required secret: `JWT_SECRET`.
- Source of truth in code: runtime env lookup in `functions/lib/auth.ts`.
- Manual prerequisites:
  1. Set `JWT_SECRET` as a production secret in Cloudflare Pages (dashboard or CLI).
  2. Do not store production secret in `.dev.vars` or repository files.
  3. Rotate secret with a planned maintenance window if needed.

## Deployment

- Deployment target: Cloudflare Pages + Pages Functions.
- Required runtime bindings:
  - D1 binding `DB`
  - R2 binding `DOCUMENTS`
  - Environment secret `JWT_SECRET`
- Manual deployment checklist:
  1. Build locally: `npm run build`.
  2. Confirm `wrangler.toml` production `database_id` is real (not placeholder).
  3. Confirm `JWT_SECRET` exists in production environment.
  4. Confirm R2 bucket exists and is private.
  5. Deploy and perform smoke checks on auth, patient access, appointment access, public booking, and document endpoints.

## Recovery

Current state: recovery is not automated in this repository.

If D1 data is lost:
1. Create/restore a D1 database from available Cloudflare backups/snapshots if present in account tooling.
2. Rebind the database ID in `wrangler.toml` and deployment settings.
3. Re-apply migrations only as needed for schema consistency.
4. Re-validate authentication, patient, appointment, and medical-record routes.

If R2 objects are lost:
1. Restore objects from available Cloudflare retention/versioning if configured externally.
2. Verify D1 `patient_documents.object_key` references point to existing objects.
3. Reconcile orphaned metadata/object references manually.

Not automated currently:
- Scheduled D1 backup job defined in repo.
- Scheduled R2 backup/export job defined in repo.
- One-command disaster recovery pipeline.
