# Customer Context

Customer Context is the assembled view of a Customer Account, Customer People, support history, Deals, Contracts, Identity Links, approvals, and recent Workflow Runs used by the Planner and approval UI.

## Goals

- give the Planner enough evidence to select Business Actions
- give Business Owners enough context to approve safely
- avoid making Orqent a full CRM replacement
- keep provider-specific detail available through snapshots
- support deterministic previews and stale checks

## Inputs

Customer Context may be assembled from:

- explicit instruction references
- Support Conversation snapshot
- Chatwoot contact and messages
- Twenty company/person/opportunity/task snapshots
- Documenso document/envelope/recipient snapshots
- Identity Links
- canonical Customer Account/Person/Deal/Contract shells
- recent Workflow Runs
- pending Approval Requests
- workspace mappings

## Customer Context Shape

```ts
type CustomerContext = {
  workspaceId: WorkspaceId
  assembledAt: DateTime
  root: {
    customerAccount?: CustomerAccountSummary
    customerPerson?: CustomerPersonSummary
    supportConversation?: SupportConversationSummary
    deal?: DealSummary
    contract?: ContractSummary
  }
  identity: {
    verifiedLinks: IdentityLinkSummary[]
    suggestedLinks: IdentityLinkSummary[]
    conflicts: IdentityConflict[]
  }
  support: {
    recentConversations: SupportConversationSummary[]
    relevantMessages: SupportMessageSummary[]
    privateNotesIncluded: boolean
  }
  crm: {
    companies: CrmRecordSummary[]
    contacts: CrmRecordSummary[]
    deals: CrmRecordSummary[]
    tasks: CrmRecordSummary[]
  }
  contracts: {
    documents: ContractSummary[]
    signers: SignerSummary[]
  }
  workflowHistory: {
    recentRuns: WorkflowRunSummary[]
    pendingApprovals: ApprovalRequestSummary[]
  }
  warnings: CustomerContextWarning[]
  sourceSnapshotIds: string[]
}
```

## Assembly Flow

```text
instruction/context hint
→ load explicit canonical records
→ load existing Identity Links
→ fetch or read latest snapshots for referenced provider records
→ search related provider records if needed
→ score identity candidates
→ assemble normalized summaries
→ attach warnings and conflicts
→ return Customer Context
```

The read module may fetch fresh provider data when the user explicitly refreshes context. Approval views should render from stored snapshots first.

## Root Selection

Root context is selected in this order:

1. explicit canonical ID from instruction/UI
2. explicit provider object ID from instruction/UI
3. verified Identity Link from Support Conversation or provider object
4. exact email Customer Person match
5. exact domain Customer Account match
6. high-confidence suggested match
7. provisional shell if creation is safe

Ambiguity becomes a warning or Clarification Question depending on risk.

## Support Conversation Handling

For Chatwoot:

- include recent relevant customer-visible messages
- include private notes only for internal planning and label them clearly
- do not quote private notes in customer-facing drafts
- store `lastMessageId` or equivalent as an assumption for stale checks
- include labels, status, assignment, inbox, and contact summary

## CRM Handling

For Twenty:

- include linked company/person/opportunity/task snapshots
- include provider stage and canonical mapped stage
- include owner/user mapping when available
- include open Deal candidates to avoid duplicates
- include existing tasks related to follow-up

## Contracts Handling

For Documenso:

- include documents linked by external ID, Identity Link, Deal, or Customer Account
- normalize statuses to Orqent Contract status
- include recipient/signer status
- include template mapping where relevant
- do not include signed file content by default

## Warnings

```ts
type CustomerContextWarning = {
  code:
    | "identity_ambiguous"
    | "identity_unverified"
    | "missing_mapping"
    | "provider_snapshot_stale"
    | "private_notes_present"
    | "duplicate_candidate"
    | "missing_required_record"
  message: string
  blocksPlanning: boolean
  relatedRefs: string[]
}
```

Blocking warnings prevent Proposed Action generation for affected actions.

## Snapshot Policy

Customer Context should store `sourceSnapshotIds` so approvals can explain what evidence was used.

Use snapshots for:

- approval preview stability
- stale checks
- eval fixture generation
- trace replay

Do not send raw full snapshots wholesale to the LLM. Curate and redact before model calls.

## Planner Interaction

The Planner consumes Customer Context to:

- resolve entity references
- select Business Actions
- extract missing parameters
- detect duplicate Deal or Contract risk
- build Proposed Action assumptions
- decide whether clarification is required

## Approval UI Interaction

Approval views consume Customer Context to show:

- who the customer is
- what provider records are affected
- what evidence triggered the plan
- what changed since context was captured
- warnings, conflicts, and missing mappings

