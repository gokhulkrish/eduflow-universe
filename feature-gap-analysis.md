# Feature Gap Analysis

This analysis is produced from the live registry snapshot in `src/lib/migration-registry.ts`.

## Gap Types

- `bridge`: the module exists in the new system, but a compatibility bridge is still needed.
- `workflow`: the module rollout is intentionally deferred.
- `registry`: the surface should stay isolated in the legacy-pack registry until promotion.
- `capability-shared`: the surface is part of a shared runtime cluster and should not be cloned visually.
- `duplicate-surface`: a potential duplicate or collision that should be reviewed before activation.

## Current Migration Guidance

- Treat patch 001 and patch 002 as the foundation.
- Keep later patches default-off until the page and runtime controls show them as ready.
- Use the registry page to inspect the current gap list, capability clusters, and ownership buckets.

