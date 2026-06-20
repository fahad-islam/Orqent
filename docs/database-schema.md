# Database Schema

This document defines the initial Supabase/Postgres schema target for Orqent. It is implementation-level guidance, not a finalized migration file.

## Design Rules

- Every tenant-scoped table includes `workspace_id`.
- Current-state tables support product queries.
- Append-only tables preserve auditability and replay.
- External provider records are referenced by Orqent canonical IDs and Identity Links.
- Provider-specific payloads live in snapshots and event tables, not in the core canonical shells.
- Supabase RLS provides tenant isolation defense; Orqent `PolicyModule` owns business authorization.

## Extensions

Recommended Postgres extensions:

```sql
create extension if not exists pgcrypto;
create extension if not exists citext;
```

Use `gen_random_uuid()` for UUID defaults.

## Enums

Prefer database check constraints or text enums during early iteration. If Postgres enums are used, plan migrations carefully.

Core status values:

```text
workspace_status: active | disabled
provider_connection_status: draft | verified | disabled | error
canonical_status: provisional | linked | retired
workflow_run_status: draft | planning | needs_clarification | awaiting_approval | partially_approved | executing | waiting_for_event | partially_completed | completed | failed | cancelled | expired
proposed_action_status: draft | pending_approval | approved | rejected | edited | superseded | queued | executing | executed | failed_retryable | failed_permanent | expired | stale | blocked
approval_request_status: open | partially_decided | approved | rejected | expired | cancelled
approval_decision: approved | rejected | edited | expired | cancelled
execution_attempt_status: started | succeeded | failed_retryable | failed_permanent | skipped_stale | skipped_expired | idempotency_replayed
```

## Current-State Tables

### `workspaces`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `name` | text | display name |
| `status` | text | `active` or `disabled` |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- primary key on `id`
- index on `status`

### `workspace_memberships`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | references `workspaces` |
| `user_id` | uuid | Supabase Auth user id |
| `role` | text | `owner`, `admin`, `operator`, `viewer` |
| `status` | text | `active`, `disabled`, `invited` |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- unique `(workspace_id, user_id)`
- index `(user_id, status)`

### `provider_connections`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `category` | text | `crm`, `support`, `contracts` |
| `provider` | text | `twenty`, `chatwoot`, `documenso` |
| `display_name` | text | user-facing name |
| `base_url` | text | supports self-hosted providers |
| `auth_type` | text | `api_key`, `bearer_token`, future `oauth2` |
| `credential_ref` | text | reference to vault/encrypted secret |
| `webhook_secret_ref` | text nullable | per-connection webhook secret |
| `external_account_id` | text nullable | provider workspace/account/team id |
| `capability_manifest_version` | text | provider manifest version |
| `capability_manifest_snapshot` | jsonb | manifest at verification time |
| `status` | text | `draft`, `verified`, `disabled`, `error` |
| `last_verified_at` | timestamptz nullable | verification timestamp |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- unique partial `(workspace_id, category) where status = 'verified'` for v1 one-active-provider rule
- index `(workspace_id, provider, status)`

### `workspace_mappings`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `provider_connection_id` | uuid fk | target provider |
| `category` | text | e.g. `crm_pipeline_stage`, `contract_template`, `support_team` |
| `canonical_key` | text | e.g. `proposal`, `won`, `onboarding_agreement` |
| `provider_value` | text | provider-specific id/value |
| `display_label` | text nullable | user-facing label |
| `verified` | boolean | default false |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- unique `(workspace_id, provider_connection_id, category, canonical_key)`
- index `(workspace_id, category)`

### `customer_accounts`

Minimal canonical shell.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `display_name` | text | provisional or linked display name |
| `domain` | citext nullable | best-known domain |
| `lifecycle_status` | text nullable | lightweight status |
| `canonical_status` | text | `provisional`, `linked`, `retired` |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- index `(workspace_id, canonical_status)`
- index `(workspace_id, domain)`

### `customer_people`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `customer_account_id` | uuid nullable fk | may be unknown initially |
| `display_name` | text | best-known name |
| `primary_email` | citext nullable | best-known email |
| `primary_phone` | text nullable | best-known phone |
| `canonical_status` | text | `provisional`, `linked`, `retired` |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- index `(workspace_id, customer_account_id)`
- index `(workspace_id, primary_email)`

### `deals`

Minimal canonical shell for sales work.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `customer_account_id` | uuid nullable fk | linked account |
| `customer_person_id` | uuid nullable fk | point of contact |
| `display_name` | text | deal label |
| `canonical_stage` | text nullable | e.g. `new`, `proposal`, `won`, `lost` |
| `canonical_status` | text | `provisional`, `linked`, `retired` |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- index `(workspace_id, customer_account_id)`
- index `(workspace_id, canonical_stage)`

### `contracts`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `customer_account_id` | uuid nullable fk | linked account |
| `customer_person_id` | uuid nullable fk | primary signer/contact |
| `deal_id` | uuid nullable fk | linked Deal |
| `display_name` | text | contract label |
| `canonical_status` | text | `draft`, `ready_to_send`, `sent`, `viewed`, `partially_signed`, `completed`, `declined`, `expired`, `voided`, `failed` |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- index `(workspace_id, customer_account_id)`
- index `(workspace_id, deal_id)`
- index `(workspace_id, canonical_status)`

### `identity_links`

Current verified or suggested cross-system identity links.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `canonical_entity_type` | text | `customer_account`, `customer_person`, `deal`, `contract`, `support_conversation` |
| `canonical_entity_id` | uuid | Orqent canonical id |
| `provider_connection_id` | uuid fk | provider connection |
| `provider` | text | denormalized for query |
| `provider_object_type` | text | provider object type |
| `provider_object_id` | text | provider object id |
| `match_method` | text | see `docs/identity-graph.md` when created |
| `confidence` | numeric | 0 to 1 |
| `verified` | boolean | manual or external-id verified |
| `status` | text | `active`, `rejected`, `replaced`, `retired` |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- unique partial `(workspace_id, provider_connection_id, provider_object_type, provider_object_id) where status = 'active'`
- index `(workspace_id, canonical_entity_type, canonical_entity_id, status)`
- index `(workspace_id, verified, confidence)`

### `workflow_runs`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `created_by_user_id` | uuid nullable | Supabase Auth user id |
| `workflow_id` | text | e.g. `workflows.create_deal_from_support_conversation` |
| `workflow_version` | text | exact version |
| `status` | text | lifecycle state |
| `instruction_source` | text | `text`, future `voice`, `provider_event`, `system` |
| `instruction_text` | text nullable | original instruction text |
| `current_step` | text nullable | product/debug summary |
| `started_at` | timestamptz | default now |
| `completed_at` | timestamptz nullable | completion timestamp |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- index `(workspace_id, status, created_at desc)`
- index `(workspace_id, created_by_user_id, created_at desc)`

### `proposed_actions`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `workflow_run_id` | uuid fk | owning run |
| `approval_request_id` | uuid nullable fk | current request |
| `business_action_id` | text | action id |
| `business_action_version` | text | exact action version |
| `capability_id` | text | provider-neutral capability |
| `target_provider_connection_id` | uuid nullable fk | required for External Writes |
| `status` | text | lifecycle state |
| `version` | integer | starts at 1 |
| `supersedes_proposed_action_id` | uuid nullable fk | previous version |
| `risk_level` | text | `low`, `medium`, `high` |
| `canonical_entity_refs` | jsonb | canonical IDs and types |
| `input_payload` | jsonb | action input |
| `provider_write_payload` | jsonb nullable | exact external write payload |
| `preview_before` | jsonb | deterministic before preview |
| `preview_after` | jsonb | deterministic after preview |
| `human_explanation` | text | business-readable explanation |
| `approval_policy_snapshot` | jsonb | policy at proposal time |
| `capability_manifest_snapshot` | jsonb | provider manifest at proposal time |
| `dependency_refs` | jsonb | dependencies |
| `assumptions` | jsonb | stale checks |
| `idempotency_key` | text | stable per immutable proposed write |
| `expires_at` | timestamptz nullable | approval/execution expiry |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- unique `(workspace_id, idempotency_key)` where `idempotency_key is not null`
- index `(workspace_id, workflow_run_id, status)`
- index `(workspace_id, approval_request_id)`
- index `(workspace_id, target_provider_connection_id, status)`

### `approval_requests`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `workflow_run_id` | uuid fk | owning run |
| `status` | text | lifecycle state |
| `requested_by_user_id` | uuid nullable | who/what requested |
| `assigned_to_user_id` | uuid nullable | optional approver |
| `summary` | text | short business summary |
| `expires_at` | timestamptz nullable | overall request expiry |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- index `(workspace_id, status, created_at desc)`
- index `(workspace_id, assigned_to_user_id, status)`
- index `(workspace_id, workflow_run_id)`

### `external_record_snapshots`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `provider_connection_id` | uuid fk | provider connection |
| `provider` | text | denormalized |
| `provider_object_type` | text | provider object type |
| `provider_object_id` | text | provider object id |
| `canonical_type` | text nullable | Orqent normalized type |
| `canonical_entity_id` | uuid nullable | related Orqent entity |
| `normalized_payload` | jsonb | redacted normalized data |
| `raw_payload` | jsonb | redacted raw provider data |
| `content_hash` | text | hash of relevant payload |
| `fetched_at` | timestamptz | fetch time |
| `observed_at` | timestamptz | provider observed timestamp if known |
| `created_at` | timestamptz | default now |

Indexes:

- index `(workspace_id, provider_connection_id, provider_object_type, provider_object_id, fetched_at desc)`
- index `(workspace_id, canonical_type, canonical_entity_id, fetched_at desc)`
- index `(workspace_id, content_hash)`

## Append-Only Tables

### `workflow_events`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `workflow_run_id` | uuid fk | run |
| `event_type` | text | canonical event type |
| `event_payload` | jsonb | redacted payload |
| `created_at` | timestamptz | default now |

Indexes:

- index `(workspace_id, workflow_run_id, created_at)`
- index `(workspace_id, event_type, created_at desc)`

### `provider_events`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `provider_connection_id` | uuid fk | provider connection |
| `provider` | text | provider name |
| `provider_event_type` | text | raw provider event type |
| `dedupe_key` | text | provider event id or content hash |
| `raw_payload` | jsonb | redacted raw event |
| `headers_hash` | text nullable | never store secret headers |
| `canonical_event_type` | text nullable | normalized event if processed |
| `processing_status` | text | `received`, `processed`, `ignored`, `failed` |
| `received_at` | timestamptz | default now |
| `processed_at` | timestamptz nullable | processing timestamp |

Indexes:

- unique `(provider_connection_id, dedupe_key)`
- index `(workspace_id, processing_status, received_at)`

### `approval_decisions`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `approval_request_id` | uuid fk | request |
| `proposed_action_id` | uuid fk | action |
| `decision` | text | decision type |
| `decided_by_user_id` | uuid nullable | Supabase Auth user id |
| `reason` | text nullable | user/system reason |
| `policy_decision_snapshot` | jsonb | policy at decision time |
| `decided_at` | timestamptz | default now |

Indexes:

- unique `(workspace_id, proposed_action_id)` where `decision in ('approved', 'rejected', 'edited')`
- index `(workspace_id, approval_request_id, decided_at)`

### `execution_attempts`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `workflow_run_id` | uuid fk | run |
| `proposed_action_id` | uuid fk | action |
| `provider_connection_id` | uuid nullable fk | target provider |
| `idempotency_key` | text | stable key |
| `attempt_number` | integer | starts at 1 |
| `status` | text | attempt state |
| `request_payload` | jsonb nullable | redacted request |
| `response_payload` | jsonb nullable | redacted response |
| `external_ref` | jsonb nullable | provider object refs |
| `error_payload` | jsonb nullable | typed error details |
| `started_at` | timestamptz | default now |
| `completed_at` | timestamptz nullable | completion timestamp |

Indexes:

- unique `(workspace_id, proposed_action_id, attempt_number)`
- index `(workspace_id, idempotency_key)`
- index `(workspace_id, status, started_at desc)`

### `llm_calls`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `workflow_run_id` | uuid nullable fk | related run |
| `purpose` | text | intent extraction, parameter extraction, draft text, etc. |
| `model` | text | provider/model |
| `input_context_ref` | text nullable | reference to curated context |
| `redacted_prompt` | jsonb | redacted prompt/messages |
| `structured_output` | jsonb nullable | model output |
| `validation_errors` | jsonb nullable | schema validation failures |
| `latency_ms` | integer nullable | performance |
| `cost_units` | numeric nullable | optional |
| `created_at` | timestamptz | default now |

Indexes:

- index `(workspace_id, workflow_run_id, created_at)`
- index `(workspace_id, purpose, created_at desc)`

### `identity_events`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid fk | tenant scope |
| `identity_link_id` | uuid nullable fk | link |
| `canonical_entity_type` | text | entity type |
| `canonical_entity_id` | uuid | entity id |
| `event_type` | text | suggested, verified, rejected, replaced, confidence_changed |
| `event_payload` | jsonb | redacted details |
| `created_by_user_id` | uuid nullable | actor |
| `created_at` | timestamptz | default now |

Indexes:

- index `(workspace_id, canonical_entity_type, canonical_entity_id, created_at)`
- index `(workspace_id, identity_link_id, created_at)`

## Postgres Queue Tables

Use a simple Postgres-backed queue in v1. Exact implementation may use a library, but the logical job shape should include:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | default `gen_random_uuid()` |
| `workspace_id` | uuid nullable | tenant scope when applicable |
| `job_type` | text | `execute_proposed_action`, `process_provider_event`, `reconcile_provider`, etc. |
| `payload` | jsonb | redacted job payload |
| `status` | text | `queued`, `running`, `succeeded`, `failed`, `dead` |
| `run_after` | timestamptz | delayed jobs |
| `attempts` | integer | attempt count |
| `max_attempts` | integer | retry cap |
| `locked_by` | text nullable | worker id |
| `locked_at` | timestamptz nullable | lease start |
| `last_error` | jsonb nullable | typed/redacted error |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes:

- index `(status, run_after)`
- index `(workspace_id, status, created_at)`

## RLS Strategy

RLS should enforce workspace isolation, not all business policy.

Rules:

- Authenticated users can read rows for workspaces where they have active membership.
- Only backend/worker service role can mutate workflow execution tables directly.
- Frontend mutations go through RPC/command modules, not direct table writes.
- Provider credentials and raw/redacted sensitive payloads are never selectable by normal frontend roles.
- `provider_events`, `execution_attempts`, `llm_calls`, and raw snapshot payloads are admin/developer-only views or service-role-only until explicit redaction views exist.

Suggested helper:

```sql
exists (
  select 1
  from workspace_memberships m
  where m.workspace_id = <table>.workspace_id
    and m.user_id = auth.uid()
    and m.status = 'active'
)
```

## Redaction And Retention

Do not store secrets in logs, snapshots, provider events, or execution attempts.

Retention should be configurable by table family:

- raw provider payloads
- redacted normalized snapshots
- LLM prompts/outputs
- execution request/response logs
- audit facts

Audit facts should outlive raw payloads where possible.

