# Patch 21 - Decommission Readiness, Parity Matrix, and Cutover Controls

> Objective: add the final migration control layer that records parity evidence, manages dual-run cutover, and keeps rollback/fallback paths available until the legacy surface is proven safe to retire.

## What This Patch Adds

- `public.migration_parity_matrix` for tenant-scoped parity records.
- `public.migration_cutover_controls` for dual-run and fallback flags.
- `public.migration_audit_log` for parity and cutover change history.
- `GET /api/migration/parity` for reading the matrix and audit summary.
- `POST /api/migration/parity` for updating parity evidence and status.
- `GET /api/migration/cutover` for reading persisted cutover state.
- `PATCH /api/migration/cutover` for updating dual-run, primary, fallback, and freeze flags.

## Parity Rules

- `missing`, `partial`, and `matched` are not cutover-safe.
- `verified` requires evidence.
- `retired` requires:
  - the feature already marked `verified`,
  - the new system already primary,
  - dual-run still enabled,
  - legacy fallback still enabled,
  - migration freeze approved,
  - no parity blockers remaining.

## Cutover Rules

- New system primary is only allowed when all tracked features are verified or retired.
- Legacy fallback stays enabled until retirement is complete.
- Dual-run stays enabled during the cutover window.
- The parity matrix remains the source of truth for migration completion.

## Files Added

- `src/lib/migration-controls.ts`
- `src/lib/migration-controls.test.ts`
- `src/lib/module-registry.ts`
- `app/api/migration/parity/route.ts`
- `app/api/migration/cutover/route.ts`
- `supabase/migrations/20260524190016_migration_parity_and_cutover_controls.sql`

## Notes

- The Migration page now includes a tenant-scoped decommission readiness panel.
- The panel loads parity evidence, displays gate checks, and persists cutover controls.
