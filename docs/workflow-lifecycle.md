# Workflow Lifecycle

This document defines the implementation lifecycle for Workflow Runs, Proposed Actions, Approval Requests, Approval Decisions, Execution Attempts, stale state, expiry, and retries.

## Core Rule

No v1 External Write executes unless it is represented by an immutable approved Proposed Action. Approval and execution are separate state transitions.

## Workflow Run States

| State | Meaning | Allowed next states |
| --- | --- | --- |
| `draft` | Run shell exists but planning has not completed. | `planning`, `cancelled`, `failed` |
| `planning` | Context is being fetched, intent resolved, and Proposed Actions prepared. | `awaiting_approval`, `needs_clarification`, `failed`, `cancelled` |
| `needs_clarification` | Required intent, identity, mapping, or parameter data is missing. | `planning`, `cancelled` |
| `awaiting_approval` | One or more Proposed Actions are pending review. | `executing`, `partially_approved`, `cancelled`, `expired` |
| `partially_approved` | Some Proposed Actions were approved and others rejected, edited, blocked, or left pending. | `executing`, `awaiting_approval`, `cancelled`, `expired` |
| `executing` | Worker is executing approved External Writes. | `waiting_for_event`, `completed`, `failed`, `partially_completed` |
| `waiting_for_event` | Run is paused until a provider event, reconciliation result, or follow-up approval. | `planning`, `awaiting_approval`, `executing`, `completed`, `failed` |
| `partially_completed` | Some approved work succeeded and some remains blocked or failed. | `awaiting_approval`, `executing`, `completed`, `failed` |
| `completed` | Run has no remaining required work. | none |
| `failed` | Run cannot continue without manual intervention or a new plan. | `planning`, `cancelled` |
| `cancelled` | User or system cancelled the run. | none |
| `expired` | Pending approvals or assumptions expired before execution. | `planning`, `cancelled` |

## Proposed Action States

| State | Meaning | Allowed next states |
| --- | --- | --- |
| `draft` | Action is being assembled and is not visible for approval. | `pending_approval`, `blocked`, `superseded` |
| `pending_approval` | Action is ready for user review. | `approved`, `rejected`, `edited`, `expired`, `stale`, `blocked`, `superseded` |
| `approved` | User approved the exact immutable payload and policy snapshot. | `queued`, `expired`, `stale`, `superseded` |
| `rejected` | User rejected the action. It must never execute. | none |
| `edited` | User requested a change. A new Proposed Action version must be created. | `superseded` |
| `superseded` | A newer Proposed Action version replaced this one. | none |
| `queued` | Approved action is queued for worker execution. | `executing`, `stale`, `expired` |
| `executing` | Worker is attempting the External Write. | `executed`, `failed_retryable`, `failed_permanent`, `stale` |
| `executed` | External Write completed and external refs were recorded. | none |
| `failed_retryable` | Execution failed with a retryable provider/runtime error. | `queued`, `failed_permanent`, `expired` |
| `failed_permanent` | Execution failed with a non-retryable error or exhausted retry window. | none |
| `expired` | Approval validity window closed before execution. | none |
| `stale` | Provider state or assumptions changed after proposal/approval. | none |
| `blocked` | Required capability, mapping, dependency, identity, or policy condition is missing. | `pending_approval`, `superseded` |

## Approval Request States

| State | Meaning | Allowed next states |
| --- | --- | --- |
| `open` | Contains one or more pending Proposed Actions. | `partially_decided`, `approved`, `rejected`, `expired`, `cancelled` |
| `partially_decided` | Some Proposed Actions have decisions and some remain pending or blocked. | `approved`, `rejected`, `expired`, `cancelled` |
| `approved` | All selected Proposed Actions were approved; execution may be queued. | none |
| `rejected` | All selected Proposed Actions were rejected or no executable action remains. | none |
| `expired` | Approval window expired. | none |
| `cancelled` | Workflow Run or user cancelled the request. | none |

Bulk approval is a UX convenience. The system stores Approval Decisions per Proposed Action.

## Approval Decision Types

| Decision | Meaning |
| --- | --- |
| `approved` | User approved the exact Proposed Action version. |
| `rejected` | User rejected the Proposed Action. |
| `edited` | User supplied constrained edits; system creates a new Proposed Action version. |
| `expired` | System recorded expiry before approval or execution. |
| `cancelled` | Decision path closed because the Workflow Run was cancelled. |

Every decision records `decided_by`, `decided_at`, `reason`, and the policy snapshot evaluated at decision time.

## Execution Attempt States

| State | Meaning |
| --- | --- |
| `started` | Worker began an attempt for an approved Proposed Action. |
| `succeeded` | Provider write completed and external refs were recorded. |
| `failed_retryable` | Attempt failed with retryable provider/runtime error. |
| `failed_permanent` | Attempt failed with non-retryable error. |
| `skipped_stale` | Execution did not run because preconditions failed. |
| `skipped_expired` | Execution did not run because approval expired. |
| `idempotency_replayed` | Runtime detected previous successful execution for the same idempotency key. |

Attempts are append-only. Do not update old attempts except to fill completion metadata for the attempt itself.

## Required Proposed Action Fields

Each Proposed Action must store:

- `business_action_id`
- `business_action_version`
- `capability_id`
- `target_provider_connection_id`
- `canonical_entity_refs`
- `input_payload`
- `provider_write_payload`
- `preview_before`
- `preview_after`
- `human_explanation`
- `risk_level`
- `approval_policy_snapshot`
- `capability_manifest_snapshot`
- `dependency_refs`
- `assumptions`
- `idempotency_key`
- `version`
- `supersedes_proposed_action_id`

`provider_write_payload` is immutable after approval. Edits create a new Proposed Action version.

## Dependencies

Dependencies are explicit. A Proposed Action may depend on:

- another Proposed Action being executed
- a canonical entity existing
- an Identity Link being verified
- a workspace mapping existing
- a provider capability being available
- a provider state assumption still holding

If a dependency is not satisfied, the action is `blocked`, not `approved`.

## Stale Behavior

A Proposed Action becomes `stale` when provider state changes in a way that invalidates the approved assumptions.

Examples:

- Chatwoot conversation has a newer customer message than the approved preview used.
- Twenty Deal stage changed since approval.
- Documenso Contract is no longer `draft` before send.
- Signer email changed after approval.
- Required workspace mapping changed.
- Provider connection was reconnected with a different account/workspace.

Execution must check assumptions immediately before the External Write. If assumptions fail, record `skipped_stale`, mark the Proposed Action `stale`, and require re-plan or re-approval.

## Expiry Behavior

Approval expiry is risk-based. Suggested defaults:

- low-risk CRM task: 24 hours
- CRM company/contact/deal write: 12 hours
- customer-facing Chatwoot reply: 30 minutes
- Documenso send-for-signature: 30 minutes
- close-won or forecast update: 2 hours

Expired actions cannot execute. A new Proposed Action version must be created if the work is still desired.

## Retry Behavior

Retry only within the approval validity window and only with the same immutable payload.

Retryable:

- network timeout
- provider 429 rate limit
- provider 5xx
- transient worker/runtime failure

Not retryable:

- validation failure
- missing permission
- provider 401/403
- not found when the provider record is required
- stale assumptions
- expired approval

Each retry creates a new Execution Attempt. The idempotency key remains stable for the approved Proposed Action.

## Provider Event Continuation

Provider webhooks are facts, not commands.

Flow:

1. Store raw provider event.
2. Dedupe event.
3. Fetch current provider state when the event matters.
4. Normalize to a canonical event.
5. Update snapshots.
6. Resume affected Workflow Runs.
7. Create new Proposed Actions if External Writes are needed.

Example:

```text
Documenso completed
→ verify current document status
→ update Contract snapshot
→ emit contract.completed
→ propose CRM sync and follow-up actions
→ require approval before CRM writes
```

