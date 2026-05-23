# Compatibility Matrix

This matrix is generated live by `src/lib/migration-registry.ts` and rendered in the Migration page.

## Columns

- `module`
- `status`
- `compatibility`
- `ownership`
- `domain`
- `launchType`
- `sourceLine`

## States

- `compatible`: safe to run in the new system
- `bridge-required`: compatible surface exists, but incremental wiring is still needed
- `deferred`: rollout is intentionally held back

## Notes

- The matrix is meant for incremental migration, not UI cloning.
- Shared renderers and shared workspace keys are tracked as capability clusters, not automatic collisions.
- Exact route or module-key duplicates are treated as collision candidates and should be reviewed before activation.

