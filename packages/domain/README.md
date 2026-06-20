# Domain

Canonical Orqent domain types, branded IDs, Effect Schemas, lifecycle statuses, transition maps, and typed domain errors shared across apps, workflows, providers, policy, RPC, database, and evals.

## Surface

- `src/ids.ts`: branded UUID and text identifiers.
- `src/statuses.ts`: shared enum/status literals and workflow lifecycle transition maps.
- `src/schemas.ts`: core Effect Schemas for workspaces, providers, canonical entities, identity links, workflow runs, proposed actions, approvals, attempts, events, and catalog definitions.
- `src/errors.ts`: explicit `Schema.TaggedError` domain errors.
