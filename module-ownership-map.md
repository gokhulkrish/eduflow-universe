# Module Ownership Map

The live ownership map is derived from `src/lib/migration-registry.ts`.

## Ownership Buckets

- `new-system`: modules already safe to treat as compatible in the new system
- `compatibility-bridge`: modules that still need incremental wiring
- `migration-backlog`: modules that are intentionally deferred behind a feature gate
- `legacy-pack`: modules preserved as a legacy surface while compatibility work continues

## How To Read It

- `compatibility` describes whether a module is currently compatible, bridge-required, or deferred.
- `ownership` describes which migration lane owns the module today.
- `notes` records why the module is in that lane.

## Practical Rule

- Keep `new-system` modules on by default.
- Gate `compatibility-bridge` modules behind the rollback registry.
- Leave `migration-backlog` modules disabled until their state contract is safe.
- Keep `legacy-pack` modules isolated until they are promoted into the new registry.

