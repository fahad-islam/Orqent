# Orqent Project Plan

## Product Intent

Orqent is a workflow automation app for small service businesses that need to track customer requests, assign work, and follow up reliably. V1 starts with a support-to-sales-to-contract golden path across Chatwoot, Twenty, and Documenso.

Business Owners give text instructions in v1. Voice can be added later by transcribing into the same instruction pipeline.

## Core Product Loop

1. A Business Owner enters an instruction.
2. Orqent reads relevant provider context.
3. Orqent creates a typed Workflow Run.
4. Orqent prepares Proposed Actions with deterministic previews.
5. The Business Owner approves, rejects, or edits selected Proposed Actions.
6. A worker executes approved immutable External Writes.
7. Orqent records Execution Attempts, snapshots, Identity Links, and trace events.
8. Provider events or reconciliation jobs resume the Workflow Run when needed.

## Accepted Architecture Decisions

The durable decisions are recorded in `docs/adr/`:

- ADR 0001: Effect-native core.
- ADR 0002: Orqent-owned canonical IDs.
- ADR 0003: human approval for all v1 External Writes.
- ADR 0004: provider capability adapters.
- ADR 0005: Supabase/Postgres for v1.
- ADR 0006: single app plus worker.

## Implementation Reference Docs

Detailed implementation contracts live in:

- `docs/planner.md` for intent extraction, action selection, parameter extraction, clarification, capability planning, and Proposed Action generation.
- `docs/identity-graph.md` for identity matching, confidence, verified/unverified links, duplicate handling, and manual identity review.
- `docs/action-catalog.md` for Business Action definitions, provider-neutral capabilities, risk levels, approval defaults, and versioning.
- `docs/customer-context.md` for assembling provider snapshots, Identity Links, support history, CRM records, Contracts, warnings, and source evidence into Customer Context.
- `docs/evals.md` for planner, approval guardrail, privacy, provider capability, and golden-path evaluations.
- `docs/demo-mode.md` for fake provider adapters, demo datasets, simulation controls, and demo workspace isolation.
- `docs/workflow-lifecycle.md` for Workflow Run, Proposed Action, Approval Request, Execution Attempt, stale, expiry, retry, and provider event behavior.
- `docs/database-schema.md` for Supabase/Postgres tables, columns, indexes, RLS posture, audit tables, and queue table shape.
- `docs/provider-capabilities.md` for CRM, support, and contracts capability contracts, manifest format, required/optional capabilities, and provider test expectations.

## Domain Model Summary

Canonical language lives in `CONTEXT.md`. The most important concepts are:

- Business Owner
- Workspace
- Customer Account
- Customer Person
- Customer Request
- Support Conversation
- Deal
- Proposal Package
- Contract
- Signer
- Workflow
- Workflow Run
- Business Action
- Proposed Action
- Approval Request
- Approval Decision
- External Write
- Provider
- Identity Link
- Customer Context

Orqent owns coordination, approvals, identity, workflow state, snapshots, and audit history. Twenty, Chatwoot, and Documenso remain the operational sources of truth for their own records.

## Tech Stack

- Monorepo with separate app and worker entrypoints.
- Next.js for the web app and internal app surface.
- Effect-native backend and worker modules.
- Supabase Auth for authentication.
- Supabase/Postgres for durable state.
- Postgres-backed queue first.
- `@effect/rpc` for internal app APIs if the app stays fully TypeScript/Effect-native.
- REST endpoints for provider webhooks.
- Effect Language Service configured from the start.

Effect conventions:

- Business modules use `Effect.Service` with `accessors: true`.
- Service methods use `Effect.fn("Module.method")`.
- Domain and input/output types use `Schema`.
- Entity IDs use branded Schema types.
- Errors use explicit `Schema.TaggedError` types.
- Use `Config.*` and `Config.redacted`; do not read `process.env` inside modules.
- Use `Effect.log`, metrics, and span annotations instead of `console.log`.
- Use `Option` internally and JSON/null only at boundaries.

## Provider Strategy

Built-in v1 providers:

- Twenty for CRM.
- Chatwoot for support.
- Documenso for contracts/signatures.

Provider design:

- Provider adapters implement provider-neutral capabilities.
- Business Actions depend on capability IDs, not provider endpoints.
- Each provider has a versioned capability manifest.
- Required and optional capabilities are declared explicitly.
- Missing required capabilities fail at planning time with fallback suggestions.
- Provider-specific behavior stays inside adapters.
- Use provider `externalId` or metadata fields wherever available to round-trip Orqent IDs.

V1 uses manual API-key/token setup and supports self-hosted base URLs.

## Data Model Outline

Use Postgres current-state tables plus append-only fact/audit tables.

Current-state tables:

- workspaces
- workspace_memberships
- provider_connections
- workspace_mappings
- customer_accounts
- customer_people
- deals
- contracts
- identity_links
- workflow_runs
- proposed_actions
- approval_requests
- external_record_snapshots

Append-only/audit tables:

- workflow_events
- provider_events
- approval_decisions
- execution_attempts
- llm_calls
- identity_events

Canonical shells should be minimal in v1. Provider-specific detail belongs in `external_record_snapshots`.

## Workflow And Action Model

Use both layers:

- Business Actions express business intent.
- Provider-neutral capabilities execute external operations.

Example:

```text
workflows.create_deal_from_support_conversation
→ support.readConversation
→ crm.findOrCreateCompany
→ crm.findOrCreateContact
→ crm.createDeal
→ crm.createTask
```

Business Action definitions include:

- id
- version
- group/domain metadata
- input/output Schema
- required capabilities
- default approval policy
- risk level
- mapping requirements
- eval metadata

Keep the existing `workflows.*` action IDs and use metadata for grouping.

## Approval And Policy Model

All v1 External Writes require approval.

Internal Orqent writes do not require approval:

- instructions
- transcripts
- extracted intent
- Workflow Runs
- Proposed Actions
- snapshots
- traces
- Identity Links marked unverified

Approval-required writes include:

- CRM company/contact/deal/task creation or update
- Chatwoot reply/assignment/status changes
- Documenso Contract creation/send
- CRM sync from signature status
- close-won or forecast updates

Policy is a deep module with a small interface:

```text
evaluateProposedAction
evaluateApprovalDecision
evaluateExecution
```

Store policy decision snapshots with Proposed Actions and approvals.

Approval Requests support bulk approval UX, but decisions are stored per Proposed Action. Edited Proposed Actions create new versions and require revalidation/reapproval.

## Module Shape

Primary command modules:

- `WorkflowRunModule`
- `ProviderConnectionModule`
- `WorkspaceMappingModule`
- `UserAccessModule`
- `PolicyModule`
- `ActionCatalogModule`
- `ProviderExecutionRuntime`

Read modules:

- `ApprovalQueueReadModule`
- `WorkflowTraceReadModule`
- `CustomerContextReadModule`
- `ProviderSetupReadModule`

`WorkflowRunModule` should be a deep module with a small external interface:

```text
startFromInstruction
getApprovalRequest
decideApproval
resumeFromProviderEvent
retryFailedStep
```

Workflow-related writes should go through `WorkflowRunModule`. Setup/admin writes belong to focused setup modules.

## API/RPC Shape

Internal app API:

- Workflow Runs
- Approval Requests
- Proposed Actions
- Provider Connections
- Workspace Mappings
- Customer Contexts
- Workflow Traces

Provider webhook API:

```text
POST /webhooks/:provider/:providerConnectionId
```

Webhook handlers authenticate, store raw provider events, dedupe, enqueue processing, and return quickly. Workers normalize events, update snapshots, and resume Workflow Runs.

Public developer API is not part of v1.

## UI And Design Direction

The app should feel like a command center, not a CRM or visual automation builder.

V1 primary surface:

- text command input
- generated plan/current run
- approval inbox
- business-readable before/after previews
- risk labels
- provider badges
- execution trace

Approval UI optimizes for caution first, speed second.

Design-system direction:

- light UI only for v1
- semantic tokens from the start
- dense but calm operational layout
- clear status and risk hierarchy
- responsive enough for mobile approval
- desktop-first for provider setup and deep trace inspection

Token categories should include:

- `surface.*`
- `text.*`
- `status.*`
- `risk.*`
- `provider.*`
- `actionState.*`

## Execution Phases

### Phase 1: Architecture Packet

Purpose: turn the accepted product and architecture decisions into a durable build reference.

Included artifacts:

- `CONTEXT.md` for domain language.
- ADRs for hard-to-reverse architecture decisions.
- module map and deep-module seams.
- provider capability strategy.
- approval and policy model.
- API/RPC shape.
- design-system direction.

Completion criteria:

- [ ] Domain terms are captured and agreed.
- [ ] ADRs exist for core architecture choices.
- [ ] Core modules and their interfaces are named.
- [ ] Provider adapter strategy is explicit.
- [ ] V1 non-goals are documented.

Current status: mostly captured in this plan, `CONTEXT.md`, and `docs/adr/`.

### Phase 2: Database Schema

Purpose: design the Supabase/Postgres schema that supports Workflow Runs, approvals, provider connections, identity, snapshots, and audit history.

Primary tables:

- workspaces
- workspace_memberships
- provider_connections
- workspace_mappings
- customer_accounts
- customer_people
- deals
- contracts
- identity_links
- workflow_runs
- proposed_actions
- approval_requests
- external_record_snapshots
- workflow_events
- provider_events
- approval_decisions
- execution_attempts
- llm_calls
- identity_events

Completion criteria:

- [ ] Tables include `workspace_id` where tenant isolation is required.
- [ ] RLS strategy is defined as a defensive isolation layer.
- [ ] Orqent business authorization remains in `PolicyModule`.
- [ ] Append-only audit tables are separated from current-state tables.
- [ ] Provider secrets are referenced, not stored directly in normal provider connection rows.
- [ ] Migration files are ready for Supabase.

### Phase 3: Repository Structure

Purpose: create the monorepo skeleton and package seams before feature implementation.

Recommended structure:

```text
apps/web
apps/worker
packages/domain
packages/workflows
packages/provider-runtime
packages/providers-twenty
packages/providers-chatwoot
packages/providers-documenso
packages/policy
packages/db
packages/ai-planner
packages/rpc
packages/evals
```

Completion criteria:

- [ ] Next.js app runs.
- [ ] Worker entrypoint runs.
- [ ] Effect Language Service is configured.
- [ ] Shared domain package exports branded IDs, Schemas, and errors.
- [ ] Base Effect layers compose.
- [ ] CI can run typecheck, lint, and tests.
- [ ] Provider generated clients are separated from provider adapters.

### Phase 4: Workflow Lifecycle Prototype

Purpose: validate the Proposed Action lifecycle before production database and UI decisions harden around it.

Prototype question:

```text
Does the Proposed Action lifecycle correctly handle approval, edit, expiry,
stale provider state, partial execution, and workflow continuation?
```

Prototype state:

- Workflow Run
- Proposed Actions
- Approval Request
- Approval Decisions
- Execution Attempts
- Provider Events

Prototype actions:

- propose actions
- approve/reject/edit
- expire approvals
- execute approved actions
- simulate provider drift
- simulate provider failure
- receive contract completed event

Completion criteria:

- [ ] Prototype is clearly marked throwaway.
- [ ] It runs with one command.
- [ ] State is in memory only.
- [ ] The state machine is portable and separate from the terminal shell.
- [ ] The result is captured before production implementation begins.

### Phase 5: Implementation Roadmap

Purpose: build the real product in vertical slices after architecture, schema, repo shape, and lifecycle assumptions are settled.

Implementation order:

1. M0: repo foundation and runnable shell.
2. M1: provider setup and mapping.
3. M2: support-to-sales Proposed Actions.
4. M3: approval inbox and Twenty execution.
5. M4: Documenso Contract draft, send, and status.
6. M5: end-to-end golden path private beta.
7. M6: hardening, evals, and demo mode.

Completion criteria:

- [ ] Each milestone has behavior-based acceptance criteria.
- [ ] External Writes remain approval-gated.
- [ ] Tests verify public module behavior, not internal helpers.
- [ ] Golden path works with real provider connections before workflow expansion.
- [ ] Onboarding and renewal workflows remain metadata-only until golden path hardening is complete.

## Milestone Roadmap

### M0: Repo Foundation And Runnable Shell

Acceptance criteria:

- Monorepo boots.
- Next.js app runs.
- Worker entrypoint runs.
- Effect Language Service configured.
- Supabase config path exists.
- Base Effect layers compose.
- One health/check RPC or route works.
- CI runs typecheck, lint, and placeholder tests.

Out of scope:

- real provider writes
- LLM planning
- full UI polish

### M1: Provider Setup And Mapping

Acceptance criteria:

- Create Provider Connections for Twenty, Chatwoot, and Documenso.
- Verify credentials and base URLs.
- Fetch setup metadata:
  - Twenty stages/users
  - Chatwoot inboxes/teams/agents
  - Documenso templates
- Save capability manifest snapshots.
- Save required workspace mappings.
- Provider secrets are never exposed to the frontend.
- Mock tests and at least one real credential smoke test pass.

Out of scope:

- OAuth provider connection flows
- full admin console

### M2: Support-To-Sales Proposed Actions

Acceptance criteria:

- Given a Chatwoot conversation, fetch and snapshot conversation/contact/messages.
- Assemble Customer Context.
- Suggest or create provisional Customer Account, Customer Person, and Deal shells.
- Build Proposed Actions for Twenty company/contact/deal/task.
- Render deterministic before/after previews.
- Create an Approval Request.
- Execute nothing externally.

Out of scope:

- real Twenty writes
- LLM planner
- Documenso work

### M3: Approval Inbox And Twenty Execution

Acceptance criteria:

- Approve selected Proposed Actions.
- Reject selected Proposed Actions.
- Record Approval Decisions.
- Enqueue execution jobs.
- Execute approved Twenty writes.
- Record Execution Attempts.
- Prevent rejected or unapproved writes.
- Block stale Proposed Actions before execution.
- Retry transient provider failures within approval validity.
- Support basic edits for simple business fields if time allows.

Out of scope:

- rich edit UI
- contract sending
- auto-approval

### M4: Documenso Contract Draft, Send, And Status

Acceptance criteria:

- Map canonical contract template to Documenso template.
- Create Documenso draft Contract from approved Deal context.
- Store Documenso external refs and snapshot.
- Create a separate Proposed Action to send Contract.
- Require approval before sending.
- Send via Documenso after approval.
- Receive webhook or poll Documenso status.
- Normalize Contract status.
- Propose CRM sync/follow-up after status changes.

Out of scope:

- auto-close won
- full document authoring

### M5: End-To-End Golden Path Private Beta

Acceptance criteria:

- A real workspace can connect Twenty, Chatwoot, and Documenso.
- Required stages/users/teams/templates can be mapped.
- A Business Owner can enter a text command for a real Chatwoot conversation.
- Proposed Actions can be reviewed and selectively approved.
- Twenty writes execute and trace correctly.
- Documenso Contract can be created and sent after approval.
- Contract status updates or reconciliation are reflected.
- CRM sync/follow-up is proposed after signature state changes.
- No normal-path manual database intervention is required.

Out of scope:

- billing
- public API
- broad workflow catalog execution

### M6: Hardening, Evals, And Demo Mode

Acceptance criteria:

- Golden-path eval suite exists.
- Approval guardrail evals exist.
- Provider contract tests exist.
- Webhook replay tests exist.
- Retry/failure dashboard or report exists.
- Demo workspace mode exists.
- Redaction/retention checks exist.
- Setup diagnostics exist.
- Operational runbook exists.

Out of scope:

- broad onboarding/renewal implementation
- marketplace/plugin SDK

## Initial Backlog Briefs

### Brief 1: Repo Foundation

**Category:** enhancement
**Summary:** Create the Orqent monorepo foundation and runnable app/worker shell.

**Current behavior:** The repo contains planning docs but no runnable application.

**Desired behavior:** The repo should boot a Next.js app and a worker entrypoint, with shared Effect-based packages and baseline CI commands.

**Key interfaces:**

- App entrypoint for UI/internal app surface.
- Worker entrypoint for background jobs.
- Shared domain package for Schema, branded IDs, and errors.
- Base Effect layer composition.

**Acceptance criteria:**

- [ ] Web app starts locally.
- [ ] Worker starts locally.
- [ ] Effect Language Service is configured.
- [ ] Typecheck/lint/test commands exist.
- [ ] One health/check endpoint or RPC works.

**Out of scope:**

- Provider integrations.
- Real workflows.
- Production deployment.

### Brief 2: Domain Schemas And Errors

**Category:** enhancement
**Summary:** Define initial Orqent domain schemas, branded IDs, and explicit error types.

**Current behavior:** Domain language exists in `CONTEXT.md`; no typed implementation exists.

**Desired behavior:** Core entities and command inputs should be represented with Effect Schema, branded IDs, and `Schema.TaggedError` failures.

**Key interfaces:**

- Branded IDs for Workspace, Workflow Run, Proposed Action, Approval Request, Provider Connection, Customer Account, Customer Person, Deal, and Contract.
- Domain Schemas for Workflow Run, Proposed Action, Approval Request, Approval Decision, Provider Connection, Identity Link, and External Record Snapshot.
- Explicit errors for approval expiry, stale Proposed Actions, missing mappings, unsupported capabilities, unauthorized provider connections, and ambiguous identity links.

**Acceptance criteria:**

- [ ] No plain string IDs cross domain interfaces.
- [ ] Errors are explicit and serializable.
- [ ] Schemas can decode unknown inputs at boundaries.
- [ ] No `null`/`undefined` domain fields where `Option` should be used.

**Out of scope:**

- Database migrations.
- UI rendering.

### Brief 3: Provider Connection Setup

**Category:** enhancement
**Summary:** Add provider connection setup for Twenty, Chatwoot, and Documenso.

**Current behavior:** Providers are planned but not connectable.

**Desired behavior:** A workspace admin can configure base URL and manual token/API key credentials, verify the connection, fetch setup metadata, and save capability/mapping data.

**Key interfaces:**

- ProviderConnectionModule.
- Provider manifests.
- Workspace mapping records.
- Secrets/credential reference storage.

**Acceptance criteria:**

- [ ] Twenty connection can verify and fetch stages/users.
- [ ] Chatwoot connection can verify and fetch inboxes/teams/agents.
- [ ] Documenso connection can verify and fetch templates.
- [ ] Secrets are never returned to the frontend.
- [ ] Capability manifest snapshots are stored.

**Out of scope:**

- OAuth.
- Workflow execution.

### Brief 4: Proposed Action Lifecycle Prototype

**Category:** enhancement
**Summary:** Build a throwaway logic prototype for the Proposed Action lifecycle.

**Current behavior:** The lifecycle is agreed conceptually but not exercised interactively.

**Desired behavior:** A terminal prototype should let a user drive Workflow Run state through proposal, approval, edit, expiry, stale provider state, execution failure, and provider event continuation.

**Key interfaces:**

- Pure lifecycle state machine.
- Throwaway terminal shell.

**Acceptance criteria:**

- [ ] User can propose actions.
- [ ] User can approve/reject/edit actions.
- [ ] Approval expiry can be simulated.
- [ ] Provider drift can mark actions stale.
- [ ] Execution failure and retry states can be simulated.
- [ ] Contract completed event can resume a run.

**Out of scope:**

- Persistence.
- Tests.
- Real provider calls.

### Brief 5: Support-To-Sales Proposed Actions

**Category:** enhancement
**Summary:** Create Proposed Actions from a Chatwoot Support Conversation.

**Current behavior:** No workflow planning path exists.

**Desired behavior:** Given a Chatwoot conversation reference, Orqent should snapshot context and create reviewable Proposed Actions for Twenty company/contact/deal/task writes without executing them.

**Key interfaces:**

- WorkflowRunModule.startFromInstruction.
- CustomerContextReadModule.
- ActionCatalogModule.
- PolicyModule.
- Support and CRM connector capabilities.

**Acceptance criteria:**

- [ ] Chatwoot conversation is fetched and snapshotted.
- [ ] Customer Context is assembled.
- [ ] Provisional canonical shells are created when needed.
- [ ] Proposed Actions include immutable payloads and before/after previews.
- [ ] Approval Request is created.
- [ ] No External Write executes.

**Out of scope:**

- LLM planner.
- Documenso Contract work.

## V1 Non-Goals

- No visual workflow builder.
- No public developer API.
- No marketplace or third-party plugin publishing.
- No billing/subscriptions.
- No autonomous External Writes.
- No full CRM replacement.
- No full document authoring system.
- No dedicated mobile app.
- No production third-party adapter SDK.
- No broad onboarding/renewal implementation before golden path hardening.

## Risks And Open Questions

- Exact Supabase credential storage path: Supabase Vault vs encrypted table vs deployment secrets manager.
- Queue implementation choice: custom Postgres queue vs existing library.
- How much LLM planning enters before private beta.
- Which deployment platform will host Next.js and the worker.
- Whether `@effect/rpc` is sufficient for all internal app needs or whether some internal REST endpoints are simpler.
- How provider webhook verification differs across self-hosted installations.
- How much real customer data can be stored in snapshots before retention/redaction policy must be implemented.
