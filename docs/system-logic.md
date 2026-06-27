# Orqent System And Business Logic

This document consolidates the business logic and system logic planned so far for Orqent. It is a reader-facing map of the existing contracts in `docs/PLAN.md`, `docs/planner.md`, `docs/workflow-lifecycle.md`, `docs/action-catalog.md`, `docs/customer-context.md`, `docs/identity-graph.md`, `docs/provider-capabilities.md`, `docs/database-schema.md`, `docs/evals.md`, and `docs/demo-mode.md`.

Orqent v1 coordinates a support-to-sales-to-contract path across Chatwoot, Twenty, and Documenso. The core invariant is that no External Write executes unless it is represented by an immutable approved Proposed Action.

## Operating Model

```mermaid
flowchart LR
    Owner["👤 Business Owner"] --> Web["🌐 Next.js Web App"]
    Web --> API["🔌 Internal API / RPC"]
    API --> Workflow["⚙️ WorkflowRunModule"]
    Workflow --> Planner["🧠 Planner"]
    Planner --> Context["📚 CustomerContextReadModule"]
    Planner --> Catalog["📋 ActionCatalogModule"]
    Planner --> Policy["🛡️ PolicyModule"]
    Workflow --> Approval["✅ Approval Request"]
    Approval --> Queue["📬 Postgres Queue"]
    Queue --> Worker["⚙️ Worker"]
    Worker --> Runtime["🔁 ProviderExecutionRuntime"]
    Runtime --> Support["💬 Chatwoot Adapter"]
    Runtime --> CRM["🏢 Twenty Adapter"]
    Runtime --> Contracts["📝 Documenso Adapter"]
    Runtime --> Store[("💾 Supabase / Postgres")]
    API --> Store
    Worker --> Store
    Support --> Store
    CRM --> Store
    Contracts --> Store

    classDef actor fill:#FFF2CC,stroke:#333,stroke-width:2px,color:#3D2E00
    classDef app fill:#D9EAD3,stroke:#333,stroke-width:2px,color:#123D12
    classDef logic fill:#D0E0E3,stroke:#333,stroke-width:2px,color:#0B3040
    classDef guard fill:#F4CCCC,stroke:#333,stroke-width:2px,color:#4A0000
    classDef data fill:#EADCF8,stroke:#333,stroke-width:2px,color:#240046
    classDef provider fill:#CFE2F3,stroke:#333,stroke-width:2px,color:#073763

    class Owner actor
    class Web,API app
    class Workflow,Planner,Context,Catalog,Runtime,Worker logic
    class Policy,Approval guard
    class Queue,Store data
    class Support,CRM,Contracts provider
```

System rules:

- The web app owns UI, internal API/RPC, webhook ingestion, and auth/session handling.
- The worker owns approved write execution, provider calls, retries, reconciliation, and scheduled jobs.
- Business modules use Effect services, Schema types, typed errors, Config, Effect logging, metrics, and span annotations.
- Orqent owns canonical IDs, workflow state, approvals, identity links, snapshots, and audit history.
- Providers remain operational sources of truth for their own records.

## Core Workflow Loop

```mermaid
flowchart TD
    Start(["🚀 Instruction or provider event"]) --> Run["🧾 Create Workflow Run"]
    Run --> Context["📚 Assemble Customer Context"]
    Context --> Intent["🧠 Extract intent and referenced entities"]
    Intent --> Resolve{"✓ Safe to resolve entities?"}
    Resolve -->|"No"| Clarify["❓ Clarification Question"]
    Clarify --> Answer["👤 Business Owner answers"]
    Answer --> Context
    Resolve -->|"Yes"| Select["📋 Select Business Actions"]
    Select --> Capabilities{"✓ Capabilities and mappings available?"}
    Capabilities -->|"No"| Block["⛔ Block and route setup/admin"]
    Capabilities -->|"Yes"| Build["⚙️ Build Proposed Actions"]
    Build --> Preview["🔍 Deterministic payloads and previews"]
    Preview --> Approval["✅ Approval Request"]
    Approval --> Decision{"👤 Decision per Proposed Action"}
    Decision -->|"Reject"| Rejected["❌ Rejected; never execute"]
    Decision -->|"Edit"| Edited["✏️ New Proposed Action version"]
    Edited --> Build
    Decision -->|"Approve"| Queue["📬 Queue immutable approved write"]
    Queue --> Execute["⚙️ Worker executes External Write"]
    Execute --> Result{"✓ Execution result"}
    Result -->|"Succeeded"| Complete["✅ Snapshot refs, links, trace"]
    Result -->|"Retryable"| Retry["🔁 Retry within approval window"]
    Retry --> Execute
    Result -->|"Stale / expired / permanent failure"| Stop["⚠️ Stop; re-plan or manual intervention"]

    classDef start fill:#D9EAD3,stroke:#333,stroke-width:2px,color:#123D12
    classDef process fill:#D0E0E3,stroke:#333,stroke-width:2px,color:#0B3040
    classDef decision fill:#FFF2CC,stroke:#333,stroke-width:2px,color:#3D2E00
    classDef guard fill:#F4CCCC,stroke:#333,stroke-width:2px,color:#4A0000
    classDef done fill:#D9EAD3,stroke:#333,stroke-width:2px,color:#123D12

    class Start,Complete done
    class Run,Context,Intent,Select,Build,Preview,Approval,Queue,Execute,Retry process
    class Resolve,Capabilities,Decision,Result decision
    class Clarify,Block,Rejected,Edited,Stop guard
```

The Planner may use an LLM to classify intent, suggest Business Actions, extract candidate parameters, draft customer-facing text, and explain the proposal. Deterministic code must validate schemas, check capabilities and mappings, enforce policy, create exact provider write payloads, create exact before/after previews, and decide whether approval is required.

## Planner Logic

```mermaid
flowchart TD
    Input["📝 PlannerInstructionInput"] --> Normalize["🧹 Normalize instruction"]
    Normalize --> Extract["🧠 Extract intent"]
    Extract --> CustomerContext["📚 Assemble Customer Context"]
    CustomerContext --> EntityResolution["🔎 Resolve referenced entities"]
    EntityResolution --> EntityDecision{"✓ Entity confidence acceptable?"}
    EntityDecision -->|"No"| EntityClarification["❓ Missing or ambiguous entity clarification"]
    EntityDecision -->|"Yes"| ActionSelection["📋 Select candidate Business Actions"]
    ActionSelection --> CapabilityPlan["🔌 Check provider capabilities"]
    CapabilityPlan --> MappingCheck["🧭 Check workspace mappings"]
    MappingCheck --> CapabilityDecision{"✓ Required capability and mapping checks pass?"}
    CapabilityDecision -->|"No"| PlanningBlock["⛔ Typed planning block"]
    CapabilityDecision -->|"Yes"| Params["🧩 Extract and validate parameters"]
    Params --> ParamDecision{"✓ Required parameters present?"}
    ParamDecision -->|"No"| ParamClarification["❓ Missing parameter clarification"]
    ParamDecision -->|"Yes"| Proposals["⚙️ Deterministic Proposed Action generation"]
    Proposals --> ApprovalRequest["✅ Create Approval Request"]

    classDef input fill:#FFF2CC,stroke:#333,stroke-width:2px,color:#3D2E00
    classDef process fill:#D0E0E3,stroke:#333,stroke-width:2px,color:#0B3040
    classDef decision fill:#EADCF8,stroke:#333,stroke-width:2px,color:#240046
    classDef block fill:#F4CCCC,stroke:#333,stroke-width:2px,color:#4A0000
    classDef output fill:#D9EAD3,stroke:#333,stroke-width:2px,color:#123D12

    class Input input
    class Normalize,Extract,CustomerContext,EntityResolution,ActionSelection,CapabilityPlan,MappingCheck,Params,Proposals process
    class EntityDecision,CapabilityDecision,ParamDecision decision
    class EntityClarification,PlanningBlock,ParamClarification block
    class ApprovalRequest output
```

Planner failure modes:

- Ambiguous intent creates a Clarification Question.
- Missing or ambiguous Customer Account, Customer Person, Deal, Contract, signer, template, or support conversation creates clarification unless a provisional shell is safe.
- Missing workspace mapping blocks the affected action and routes to setup/admin.
- Unsupported provider capability blocks the affected action with a fallback suggestion.
- Schema validation failure blocks proposal creation and records a planner validation error.
- Low LLM confidence creates clarification rather than unsafe writes.

## Customer Context Logic

```mermaid
flowchart TD
    Hint["🧭 Instruction or context hint"] --> Canonical["🧾 Load canonical records"]
    Canonical --> Links["🔗 Load Identity Links"]
    Links --> Snapshots["📸 Fetch or read latest provider snapshots"]
    Snapshots --> Search["🔎 Search related provider records when needed"]
    Search --> Score["📊 Score identity candidates"]
    Score --> Root{"✓ Select root context"}
    Root -->|"Exact canonical ID"| Assemble["📚 Assemble normalized summaries"]
    Root -->|"Exact provider ID"| Assemble
    Root -->|"Verified Identity Link"| Assemble
    Root -->|"Exact email/domain"| Assemble
    Root -->|"High-confidence suggestion"| Warnings["⚠️ Attach warning"]
    Root -->|"Ambiguous or missing"| BlockingWarning["⛔ Blocking warning"]
    Warnings --> Assemble
    BlockingWarning --> Output["📦 Customer Context with blocksPlanning"]
    Assemble --> Evidence["🧾 Attach sourceSnapshotIds"]
    Evidence --> Output

    classDef process fill:#D0E0E3,stroke:#333,stroke-width:2px,color:#0B3040
    classDef decision fill:#FFF2CC,stroke:#333,stroke-width:2px,color:#3D2E00
    classDef warn fill:#FCE5CD,stroke:#333,stroke-width:2px,color:#5B2C00
    classDef block fill:#F4CCCC,stroke:#333,stroke-width:2px,color:#4A0000
    classDef output fill:#D9EAD3,stroke:#333,stroke-width:2px,color:#123D12

    class Hint,Canonical,Links,Snapshots,Search,Score,Assemble,Evidence process
    class Root decision
    class Warnings warn
    class BlockingWarning block
    class Output output
```

Customer Context contains the evidence the Planner and approval UI need: customer account/person summaries, support history, CRM records, contract/signature state, recent workflow history, identity conflicts, warnings, and source snapshot IDs. Raw provider payloads should not be sent wholesale to the LLM; context must be curated and redacted.

## Identity Graph Logic

```mermaid
flowchart TD
    Gather["📥 Gather provider records, snapshots, hints, existing links"] --> Score["📊 Score candidates"]
    Score --> Match{"✓ Match method"}
    Match -->|"external_id / manual / exact safe write result"| AutoVerify["✅ Auto-verify link"]
    Match -->|"exact email with no conflict"| AutoVerify
    Match -->|"domain/name/context suggested"| Suggest["💡 Create unverified suggestion"]
    Match -->|"fuzzy or LLM suggested"| Review["👤 Manual identity review"]
    Suggest --> Conflict{"⚠️ Conflicts or low confidence?"}
    Conflict -->|"Yes"| Review
    Conflict -->|"No, read-only planning"| ReadUse["📖 May use for read-only planning"]
    Review --> Decision{"👤 Reviewer decision"}
    Decision -->|"Verify"| Verified["✅ Active verified Identity Link"]
    Decision -->|"Reject"| Rejected["❌ Rejected link"]
    Decision -->|"Replace"| Replaced["♻️ Replace existing link"]
    Decision -->|"Defer"| Block["⛔ Block dependent External Writes"]
    AutoVerify --> Verified
    Verified --> Event["🧾 Append identity event"]
    Rejected --> Event
    Replaced --> Event
    Block --> Event

    classDef process fill:#D0E0E3,stroke:#333,stroke-width:2px,color:#0B3040
    classDef decision fill:#FFF2CC,stroke:#333,stroke-width:2px,color:#3D2E00
    classDef success fill:#D9EAD3,stroke:#333,stroke-width:2px,color:#123D12
    classDef guard fill:#F4CCCC,stroke:#333,stroke-width:2px,color:#4A0000

    class Gather,Score,Suggest,Review,ReadUse,Event process
    class Match,Conflict,Decision decision
    class AutoVerify,Verified success
    class Rejected,Replaced,Block guard
```

Identity rules:

- Verified links are stronger than confidence scores.
- External Writes that depend on uncertain identity must ask clarification, require manual identity review, or create a provisional shell with explicit approval preview.
- Duplicate detection creates suggestions and review paths; Orqent does not merge provider records automatically in v1.
- Provider external IDs should be written when possible because round-trip IDs are the strongest identity signal.

## Business Action Catalog

```mermaid
flowchart LR
    Catalog["📋 Action Catalog"] --> SupportToSales["💬 Support To Sales"]
    Catalog --> SalesToContract["📝 Sales To Contract"]
    Catalog --> Governance["🛡️ Governance"]

    SupportToSales --> Categorize["categorize_customer_message<br/>read-only"]
    SupportToSales --> CreateDeal["create_deal_from_support_conversation<br/>CRM company/contact/deal writes"]
    SupportToSales --> CreateTask["create_crm_task_from_support_message<br/>CRM task write"]
    SupportToSales --> AddSummary["add_support_summary_to_crm_contact<br/>CRM note write"]

    SalesToContract --> PreparePackage["prepare_quote_to_contract_package<br/>read-only"]
    SalesToContract --> CreateContract["create_contract_from_deal<br/>Documenso draft write"]
    SalesToContract --> SendContract["send_deal_contract_for_signature<br/>customer-facing send"]
    SalesToContract --> SyncStatus["sync_signer_status_to_crm<br/>CRM note write"]
    SalesToContract --> Followup["create_followup_task_after_signature<br/>CRM task write"]
    SalesToContract --> CloseWon["close_won_after_signature<br/>CRM stage write"]

    Governance --> DryRun["dry_run_external_writes<br/>read-only"]
    Governance --> BulkApproval["request_bulk_approval<br/>internal"]
    Governance --> ExecuteBatch["execute_approved_write_batch<br/>approved writes only"]
    Governance --> Trace["produce_trace_summary<br/>read-only"]
    Governance --> GuardrailEval["create_approval_guardrail_eval<br/>read-only"]

    classDef catalog fill:#EADCF8,stroke:#333,stroke-width:2px,color:#240046
    classDef group fill:#FFF2CC,stroke:#333,stroke-width:2px,color:#3D2E00
    classDef readonly fill:#D9EAD3,stroke:#333,stroke-width:2px,color:#123D12
    classDef write fill:#F4CCCC,stroke:#333,stroke-width:2px,color:#4A0000
    classDef internal fill:#D0E0E3,stroke:#333,stroke-width:2px,color:#0B3040

    class Catalog catalog
    class SupportToSales,SalesToContract,Governance group
    class Categorize,PreparePackage,DryRun,Trace,GuardrailEval readonly
    class CreateDeal,CreateTask,AddSummary,CreateContract,SendContract,SyncStatus,Followup,CloseWon,ExecuteBatch write
    class BulkApproval internal
```

Approval defaults:

- Read-only Business Actions do not require approval.
- Every v1 External Write requires approval.
- Medium-risk writes require Admin/Owner or a permitted Operator.
- High-risk and customer-facing writes require Admin/Owner and exact payload/text preview.
- Bulk approval is UI grouping only; decisions are stored per Proposed Action.

## Provider Capability Logic

```mermaid
flowchart TD
    Action["📋 Selected Business Action"] --> Required["🔌 Required capability IDs and mappings"]
    Required --> Connection["🔑 Active verified Provider Connection"]
    Connection --> Manifest["📜 Manifest snapshot"]
    Manifest --> SupportCheck{"✓ Capability supported?"}
    SupportCheck -->|"No"| Unsupported["⛔ UnsupportedCapabilityError"]
    SupportCheck -->|"Yes"| MappingCheck{"✓ Required verified mappings exist?"}
    MappingCheck -->|"No"| MissingMapping["⛔ MissingWorkspaceMappingError"]
    MappingCheck -->|"Yes"| Proposal["⚙️ Create Proposed Action"]
    Proposal --> Snapshot["📜 Copy manifest snapshot onto Proposed Action"]
    Snapshot --> Approval["✅ Approval review"]
    Approval --> ExecCheck["🔁 Re-check connection, manifest, mappings, stale assumptions"]
    ExecCheck --> ExecDecision{"✓ Still valid?"}
    ExecDecision -->|"No"| Skip["⚠️ Mark stale/blocked/failed"]
    ExecDecision -->|"Yes"| Adapter["🔌 Execute provider-neutral capability"]

    classDef process fill:#D0E0E3,stroke:#333,stroke-width:2px,color:#0B3040
    classDef decision fill:#FFF2CC,stroke:#333,stroke-width:2px,color:#3D2E00
    classDef block fill:#F4CCCC,stroke:#333,stroke-width:2px,color:#4A0000
    classDef success fill:#D9EAD3,stroke:#333,stroke-width:2px,color:#123D12

    class Action,Required,Connection,Manifest,Proposal,Snapshot,Approval,ExecCheck process
    class SupportCheck,MappingCheck,ExecDecision decision
    class Unsupported,MissingMapping,Skip block
    class Adapter success
```

Provider boundaries:

- Business Actions depend on capability IDs, not provider endpoint shapes.
- Twenty implements CRM capabilities.
- Chatwoot implements support capabilities.
- Documenso implements contract capabilities.
- Provider-specific enum mappings, endpoints, quirks, and raw payload handling stay inside adapters.
- Adapter results return normalized output, external refs, and redacted raw payloads.

## Approval And Execution Logic

```mermaid
sequenceDiagram
    actor Owner as 👤 Business Owner
    participant Web as 🌐 Web App
    participant Workflow as ⚙️ WorkflowRunModule
    participant Policy as 🛡️ PolicyModule
    participant DB as 💾 Postgres
    participant Queue as 📬 Queue
    participant Worker as ⚙️ Worker
    participant Runtime as 🔁 ProviderExecutionRuntime
    participant Provider as 🔌 Provider Adapter

    Owner->>Web: Review Approval Request
    Web->>Workflow: decideApproval(actionId, decision)
    Workflow->>Policy: evaluateApprovalDecision
    Policy-->>Workflow: policy decision snapshot
    Workflow->>DB: append approval_decision
    alt approved exact Proposed Action
        Workflow->>DB: mark Proposed Action approved
        Workflow->>Queue: enqueue execute_proposed_action
        Worker->>DB: load approved immutable Proposed Action
        Worker->>Runtime: execute approved write
        Runtime->>DB: append execution_attempt started
        Runtime->>Runtime: check expiry, stale assumptions, capabilities, idempotency
        alt valid
            Runtime->>Provider: call provider-neutral capability
            Provider-->>Runtime: normalized result + external ref
            Runtime->>DB: append succeeded attempt, snapshot, identity link, trace
        else stale or expired
            Runtime->>DB: append skipped_stale or skipped_expired
            Runtime->>DB: mark Proposed Action stale or expired
        end
    else rejected or edited
        Workflow->>DB: record rejection or create superseding version path
    end
```

Execution constraints:

- `provider_write_payload` is immutable after approval.
- Edits create a new Proposed Action version and require revalidation/reapproval.
- Retry uses the same immutable payload and same idempotency key.
- Expired actions cannot execute.
- Stale assumptions must be checked immediately before provider calls.
- Execution attempts are append-only.

## Lifecycle State Logic

```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> planning
    draft --> cancelled
    draft --> failed
    planning --> awaiting_approval
    planning --> needs_clarification
    planning --> failed
    planning --> cancelled
    needs_clarification --> planning
    needs_clarification --> cancelled
    awaiting_approval --> executing
    awaiting_approval --> partially_approved
    awaiting_approval --> cancelled
    awaiting_approval --> expired
    partially_approved --> executing
    partially_approved --> awaiting_approval
    partially_approved --> cancelled
    partially_approved --> expired
    executing --> waiting_for_event
    executing --> completed
    executing --> failed
    executing --> partially_completed
    waiting_for_event --> planning
    waiting_for_event --> awaiting_approval
    waiting_for_event --> executing
    waiting_for_event --> completed
    waiting_for_event --> failed
    partially_completed --> awaiting_approval
    partially_completed --> executing
    partially_completed --> completed
    partially_completed --> failed
    failed --> planning
    failed --> cancelled
    completed --> [*]
    cancelled --> [*]
    expired --> planning
    expired --> cancelled
```

The domain package owns status transition checks for Workflow Runs, Proposed Actions, and Approval Requests. Invalid transitions fail with typed domain errors.

## Provider Event Continuation

```mermaid
flowchart TD
    Webhook["📨 POST /webhooks/:provider/:providerConnectionId"] --> Verify["🔐 Verify webhook secret/signature when supported"]
    Verify --> StoreRaw["💾 Store redacted raw provider event"]
    StoreRaw --> Dedupe{"✓ Dedupe key already seen?"}
    Dedupe -->|"Yes"| Ignore["🚫 Ignore replay"]
    Dedupe -->|"No"| Fetch["🔎 Fetch current provider state"]
    Fetch --> Normalize["🧭 Normalize canonical event"]
    Normalize --> Snapshot["📸 Update external_record_snapshots"]
    Snapshot --> Link["🔗 Update or suggest Identity Links"]
    Link --> Resume["🔁 Resume affected Workflow Runs"]
    Resume --> NeedsWrite{"✓ External Write needed?"}
    NeedsWrite -->|"No"| Complete["✅ Record trace and complete continuation"]
    NeedsWrite -->|"Yes"| Propose["⚙️ Create new Proposed Actions"]
    Propose --> Approval["✅ Require approval before writes"]

    classDef process fill:#D0E0E3,stroke:#333,stroke-width:2px,color:#0B3040
    classDef decision fill:#FFF2CC,stroke:#333,stroke-width:2px,color:#3D2E00
    classDef guard fill:#F4CCCC,stroke:#333,stroke-width:2px,color:#4A0000
    classDef done fill:#D9EAD3,stroke:#333,stroke-width:2px,color:#123D12

    class Webhook,Verify,StoreRaw,Fetch,Normalize,Snapshot,Link,Resume,Propose,Approval process
    class Dedupe,NeedsWrite decision
    class Ignore guard
    class Complete done
```

Provider webhooks are facts, not commands. For example, a Documenso completed event verifies current document status, updates the Contract snapshot, emits `contract.completed`, proposes CRM sync and follow-up actions, and still requires approval before CRM writes.

## Persistence And Audit Logic

```mermaid
flowchart LR
    Current["📦 Current-state tables"] --> ProductQueries["🔎 Product queries"]
    Audit["🧾 Append-only tables"] --> Replay["🔁 Audit, replay, and trace"]
    Queue["📬 Queue table"] --> Worker["⚙️ Worker execution"]
    RLS["🔐 Supabase RLS"] --> Isolation["🏢 Workspace isolation"]
    Policy["🛡️ PolicyModule"] --> Authorization["✅ Business authorization"]

    Current --> Workspaces["workspaces<br/>memberships<br/>provider_connections<br/>mappings"]
    Current --> Canonical["customer_accounts<br/>customer_people<br/>deals<br/>contracts<br/>identity_links"]
    Current --> Workflow["workflow_runs<br/>proposed_actions<br/>approval_requests<br/>external_record_snapshots"]

    Audit --> Facts["workflow_events<br/>provider_events<br/>approval_decisions<br/>execution_attempts<br/>llm_calls<br/>identity_events"]

    classDef data fill:#EADCF8,stroke:#333,stroke-width:2px,color:#240046
    classDef process fill:#D0E0E3,stroke:#333,stroke-width:2px,color:#0B3040
    classDef guard fill:#F4CCCC,stroke:#333,stroke-width:2px,color:#4A0000

    class Current,Audit,Queue,Workspaces,Canonical,Workflow,Facts data
    class ProductQueries,Replay,Worker process
    class RLS,Isolation,Policy,Authorization guard
```

Persistence rules:

- Every tenant-scoped table includes `workspace_id`.
- Current-state tables support product queries.
- Append-only tables preserve auditability and replay.
- Provider-specific payloads live in snapshots/events, not canonical shells.
- Normal frontend roles do not directly mutate workflow execution tables.
- Provider credentials and sensitive raw payloads are service-role-only until explicit redaction views exist.

## Demo Mode Logic

```mermaid
flowchart TD
    DemoWorkspace["🎭 Demo Workspace"] --> RealEngine["⚙️ Real workflow, planner, approval, policy, execution modules"]
    RealEngine --> DemoProviders["🔌 Fake providers implementing real capability contracts"]
    DemoProviders --> DemoCRM["🏢 DemoCrmConnector"]
    DemoProviders --> DemoSupport["💬 DemoSupportConnector"]
    DemoProviders --> DemoContracts["📝 DemoContractsConnector"]
    DemoWorkspace --> Fixtures["📦 Seeded accounts, people, conversations, deals, templates, contracts, identities"]
    Fixtures --> Scenarios["🧪 Demo scenarios"]
    Scenarios --> Golden["pricing request to Deal"]
    Scenarios --> Ambiguous["ambiguous Acme Customer Account"]
    Scenarios --> MissingSigner["missing signer email"]
    Scenarios --> ContractDone["contract completed event"]
    Scenarios --> Failure["provider failure and retry"]
    Scenarios --> Stale["stale conversation after new customer message"]
    RealEngine --> Trace["🧾 Production-like Workflow Run trace"]

    classDef demo fill:#FFF2CC,stroke:#333,stroke-width:2px,color:#3D2E00
    classDef logic fill:#D0E0E3,stroke:#333,stroke-width:2px,color:#0B3040
    classDef provider fill:#CFE2F3,stroke:#333,stroke-width:2px,color:#073763
    classDef data fill:#EADCF8,stroke:#333,stroke-width:2px,color:#240046

    class DemoWorkspace,Scenarios demo
    class RealEngine,Trace logic
    class DemoProviders,DemoCRM,DemoSupport,DemoContracts provider
    class Fixtures,Golden,Ambiguous,MissingSigner,ContractDone,Failure,Stale data
```

Demo Mode must not become a separate fake app. It uses fake provider adapters behind the same contracts so approval guardrails, workflow trace, retries, stale checks, and provider event continuation behave like production.

## Evaluation Logic

```mermaid
flowchart TD
    Case["🧪 Eval Case"] --> Fixtures["📦 Customer Context, manifests, mappings"]
    Fixtures --> Runner["⚙️ Eval Runner"]
    Runner --> Planner["🧠 Planner with deterministic mocked providers"]
    Planner --> Output["📋 Structured Planner output"]
    Output --> Assertions["✅ Assertions"]
    Assertions --> Intent["intent selection"]
    Assertions --> Actions["action selection"]
    Assertions --> Params["parameter extraction"]
    Assertions --> Clarification["clarification behavior"]
    Assertions --> Guardrails["approval guardrails"]
    Assertions --> Privacy["privacy and redaction"]
    Assertions --> Capabilities["provider capability checks"]
    Guardrails --> Fail{"✓ Any guardrail/privacy violation?"}
    Privacy --> Fail
    Fail -->|"Yes"| CIFail["❌ CI fails"]
    Fail -->|"No"| Pass["✅ Record versioned result"]

    classDef process fill:#D0E0E3,stroke:#333,stroke-width:2px,color:#0B3040
    classDef data fill:#EADCF8,stroke:#333,stroke-width:2px,color:#240046
    classDef decision fill:#FFF2CC,stroke:#333,stroke-width:2px,color:#3D2E00
    classDef fail fill:#F4CCCC,stroke:#333,stroke-width:2px,color:#4A0000
    classDef pass fill:#D9EAD3,stroke:#333,stroke-width:2px,color:#123D12

    class Case,Fixtures,Output data
    class Runner,Planner,Assertions,Intent,Actions,Params,Clarification,Guardrails,Privacy,Capabilities process
    class Fail decision
    class CIFail fail
    class Pass pass
```

Minimum required golden path evals before private beta:

- Support Conversation to Deal Proposed Actions.
- Approval to Twenty execution.
- Deal to Documenso draft Contract.
- Contract send approval and execution.
- Documenso completed event to CRM sync Proposed Actions.

CI must fail on approval guardrail and privacy violations.

## Source Contract Index

| Logic area | Source contracts |
| --- | --- |
| Product loop and module shape | `docs/PLAN.md`, `CONTEXT.md` |
| Planner pipeline | `docs/planner.md` |
| Workflow, Proposed Action, approval, execution state machines | `docs/workflow-lifecycle.md` |
| Business Actions and capabilities | `docs/action-catalog.md`, `packages/workflows/src/catalog.ts` |
| Customer Context | `docs/customer-context.md` |
| Identity Graph | `docs/identity-graph.md` |
| Provider manifests and adapter boundaries | `docs/provider-capabilities.md`, `packages/provider-runtime/src/capabilities.ts` |
| Persistence, queue, RLS, retention | `docs/database-schema.md`, `packages/db/src/schema.ts` |
| Demo providers and fixtures | `docs/demo-mode.md` |
| Evaluations and quality gates | `docs/evals.md` |
| Durable architecture decisions | `docs/adr/0001-effect-native-core.md` through `docs/adr/0006-single-app-plus-worker.md` |
