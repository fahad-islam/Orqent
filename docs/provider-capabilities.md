# Provider Capabilities

This document defines provider-neutral capability contracts for CRM, support, and contracts providers. Business Actions depend on these capabilities, not on vendor endpoints.

## Design Rules

- Business Actions declare required capability IDs.
- Provider adapters declare required and optional capabilities in manifests.
- Capability checks happen at planning time and execution time.
- Provider-specific fields, enum mappings, and endpoint quirks stay inside adapters.
- Adapter methods return normalized results plus external refs and redacted raw payloads.
- Orqent-level idempotency is owned by `ProviderExecutionRuntime`; adapters use provider idempotency or `externalId` support when available.

## Capability Manifest Format

```ts
type ProviderManifest = {
  provider: "twenty" | "chatwoot" | "documenso" | string
  category: "crm" | "support" | "contracts"
  version: string
  displayName: string
  auth: {
    supportedTypes: Array<"api_key" | "bearer_token" | "oauth2">
    requiresBaseUrl: boolean
  }
  capabilities: Record<string, CapabilitySupport>
  mappings: MappingRequirement[]
  webhooks: WebhookSupport[]
  limits?: {
    rateLimitPolicy?: string
    maxPageSize?: number
    notes?: string
  }
  knownLimitations: string[]
  contractTestSuiteVersion: string
}

type CapabilitySupport = {
  supported: boolean
  required?: boolean
  optional?: boolean
  idempotency: "native" | "external_id" | "orqent_ledger_only"
  dryRunSupport: "orqent_preview" | "provider_validate" | "none"
  notes?: string
}

type MappingRequirement = {
  category: string
  canonicalKeys: string[]
  required: boolean
}

type WebhookSupport = {
  canonicalEvent: string
  providerEvents: string[]
  verification: "signature" | "shared_secret" | "none"
}
```

Store the exact manifest snapshot on Provider Connection verification and copy the relevant snapshot onto Proposed Actions.

## Common Result Shape

Provider capability methods should return:

```ts
type ProviderResult<TNormalized> = {
  normalized: TNormalized
  externalRef: {
    provider: string
    providerConnectionId: string
    objectType: string
    objectId: string
    url?: string
  }
  raw: unknown
}
```

The `raw` payload must be redacted before persistence or logs.

## CRM Capability Contract

Category: `crm`

V1 provider: Twenty.

### Required CRM Capabilities For Golden Path

| Capability ID | Purpose | Required mappings |
| --- | --- | --- |
| `crm.findCompany` | Find a Customer Account candidate by domain/name/provider metadata. | none |
| `crm.createCompany` | Create provider company for a Customer Account. | owner mapping optional |
| `crm.findContact` | Find a Customer Person candidate by email/name/provider metadata. | none |
| `crm.createContact` | Create provider contact/person. | company link if known |
| `crm.createDeal` | Create a Deal/opportunity. | CRM stage mapping |
| `crm.createTask` | Create follow-up task. | owner/user mapping recommended |
| `crm.updateDealStage` | Move Deal to canonical stage. | CRM stage mapping |
| `crm.addNoteToRecord` | Attach support/contract summary or link. | none |

### Optional CRM Capabilities

| Capability ID | Purpose |
| --- | --- |
| `crm.batchWrite` | Execute multiple CRM writes efficiently. |
| `crm.customFields` | Store Orqent IDs or workflow metadata in provider fields. |
| `crm.customObjects` | Represent Orqent-specific objects if provider supports it. |
| `crm.timelineActivity` | Add richer timeline activity instead of plain note. |
| `crm.ownerAssignment` | Assign company/deal/task to provider user. |
| `crm.duplicateMerge` | Merge duplicate company/contact records. |
| `crm.attachFile` | Attach signed contract PDFs or files. Not v1 default. |

### CRM Normalized Types

```ts
type CrmCompany = {
  id: string
  name: string
  domain?: string
  ownerId?: string
  url?: string
}

type CrmContact = {
  id: string
  companyId?: string
  name?: string
  email?: string
  phone?: string
  url?: string
}

type CrmDeal = {
  id: string
  companyId?: string
  contactId?: string
  name: string
  canonicalStage?: string
  providerStage?: string
  amountMicros?: number
  currencyCode?: string
  ownerId?: string
  url?: string
}

type CrmTask = {
  id: string
  title: string
  status?: string
  dueAt?: string
  assigneeId?: string
  url?: string
}
```

### CRM Provider Notes

Twenty maps naturally to:

- company: `companies`
- contact: `people`
- deal: `opportunities`
- task: `tasks`

Twenty stage mappings are workspace-specific. Do not hard-code `PROPOSAL` or `CUSTOMER` in Business Actions.

## Support Capability Contract

Category: `support`

V1 provider: Chatwoot.

### Required Support Capabilities For Golden Path

| Capability ID | Purpose | Required mappings |
| --- | --- | --- |
| `support.readConversation` | Fetch conversation, contact, messages, labels, status, assignment. | none |
| `support.readContact` | Fetch support contact details. | none |
| `support.createPrivateNote` | Add internal note with Orqent summary/link if approved. | none |
| `support.assignConversation` | Assign conversation to agent or team. | support team/agent mapping |
| `support.updateConversationStatus` | Resolve, reopen, pending, or snooze. | none |

### Optional Support Capabilities

| Capability ID | Purpose |
| --- | --- |
| `support.sendReply` | Send customer-facing reply. Approval required. |
| `support.addLabels` | Add routing/status labels. |
| `support.setCustomAttributes` | Store Orqent IDs or workflow metadata. |
| `support.searchConversations` | Find related conversations. |
| `support.webhooks` | Subscribe to support events. |

### Support Normalized Types

```ts
type SupportConversation = {
  id: string
  status: "open" | "pending" | "resolved" | "snoozed" | string
  contactId?: string
  inboxId?: string
  assigneeId?: string
  teamId?: string
  labels: string[]
  lastMessageId?: string
  updatedAt?: string
  url?: string
}

type SupportMessage = {
  id: string
  conversationId: string
  direction: "incoming" | "outgoing" | "activity" | "private_note" | string
  content: string
  private: boolean
  senderType?: string
  createdAt?: string
}

type SupportContact = {
  id: string
  name?: string
  email?: string
  phone?: string
  identifier?: string
}
```

### Support Provider Notes

Chatwoot supports conversation assignment by `assignee_id` or `team_id`. Prefer team assignment unless a verified user mapping exists.

Chatwoot private notes are internal context. They must never be quoted in customer-facing replies unless explicitly approved for that purpose.

Webhook events are coarse. Store raw events and fetch current state before continuing important workflows.

## Contracts Capability Contract

Category: `contracts`

V1 provider: Documenso.

### Required Contracts Capabilities For Golden Path

| Capability ID | Purpose | Required mappings |
| --- | --- | --- |
| `contracts.listTemplates` | Fetch available contract templates for setup. | none |
| `contracts.createDocumentFromTemplate` | Create draft Contract from mapped template and form fields. | contract template mapping |
| `contracts.sendForSignature` | Distribute/send Contract to Signers. | signer data |
| `contracts.readDocumentStatus` | Fetch current Contract status and recipients. | none |

### Optional Contracts Capabilities

| Capability ID | Purpose |
| --- | --- |
| `contracts.createDocumentFromFile` | Create contract from uploaded/generated file. Not v1 default. |
| `contracts.downloadCompletedDocument` | Download signed PDF. Not synced by default. |
| `contracts.addRecipients` | Modify recipients before send. |
| `contracts.prefillFields` | Fill template fields/form values. |
| `contracts.webhooks` | Receive signing lifecycle events. |

### Contracts Normalized Types

```ts
type ContractDocument = {
  id: string
  envelopeId?: string
  title: string
  canonicalStatus: ContractStatus
  providerStatus?: string
  externalId?: string
  templateId?: string
  url?: string
  completedAt?: string
}

type ContractSigner = {
  id?: string
  name?: string
  email: string
  role?: "signer" | "viewer" | "approver" | "cc" | string
  status?: string
  signingOrder?: number
}

type ContractStatus =
  | "draft"
  | "ready_to_send"
  | "sent"
  | "viewed"
  | "partially_signed"
  | "completed"
  | "declined"
  | "expired"
  | "voided"
  | "failed"
```

### Contracts Provider Notes

Documenso supports:

- template-to-document creation through `/template/use`
- document distribution through `/document/distribute`
- external IDs on documents/templates
- document statuses including `DRAFT`, `PENDING`, `COMPLETED`, `REJECTED`

Business Actions must depend on canonical Contract statuses, not Documenso enum names.

## V1 Provider Manifests

### Twenty CRM Manifest Sketch

```json
{
  "provider": "twenty",
  "category": "crm",
  "version": "1.0.0",
  "displayName": "Twenty",
  "auth": {
    "supportedTypes": ["bearer_token"],
    "requiresBaseUrl": true
  },
  "capabilities": {
    "crm.findCompany": { "supported": true, "required": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" },
    "crm.createCompany": { "supported": true, "required": true, "idempotency": "external_id", "dryRunSupport": "orqent_preview" },
    "crm.findContact": { "supported": true, "required": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" },
    "crm.createContact": { "supported": true, "required": true, "idempotency": "external_id", "dryRunSupport": "orqent_preview" },
    "crm.createDeal": { "supported": true, "required": true, "idempotency": "external_id", "dryRunSupport": "orqent_preview" },
    "crm.createTask": { "supported": true, "required": true, "idempotency": "external_id", "dryRunSupport": "orqent_preview" },
    "crm.updateDealStage": { "supported": true, "required": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" },
    "crm.addNoteToRecord": { "supported": true, "required": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" }
  },
  "mappings": [
    { "category": "crm_pipeline_stage", "canonicalKeys": ["new", "proposal", "won", "lost"], "required": true },
    { "category": "crm_owner", "canonicalKeys": ["default_owner"], "required": false }
  ],
  "webhooks": [],
  "knownLimitations": [
    "Workspace-specific fields and stages must be mapped during setup."
  ],
  "contractTestSuiteVersion": "1.0.0"
}
```

### Chatwoot Support Manifest Sketch

```json
{
  "provider": "chatwoot",
  "category": "support",
  "version": "1.0.0",
  "displayName": "Chatwoot",
  "auth": {
    "supportedTypes": ["api_key"],
    "requiresBaseUrl": true
  },
  "capabilities": {
    "support.readConversation": { "supported": true, "required": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" },
    "support.readContact": { "supported": true, "required": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" },
    "support.createPrivateNote": { "supported": true, "required": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" },
    "support.assignConversation": { "supported": true, "required": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" },
    "support.updateConversationStatus": { "supported": true, "required": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" },
    "support.sendReply": { "supported": true, "optional": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" }
  },
  "mappings": [
    { "category": "support_team", "canonicalKeys": ["default_sales", "default_support"], "required": true },
    { "category": "support_agent", "canonicalKeys": ["default_owner"], "required": false }
  ],
  "webhooks": [
    {
      "canonicalEvent": "support.message_received",
      "providerEvents": ["message_created"],
      "verification": "shared_secret"
    },
    {
      "canonicalEvent": "support.conversation_resolved",
      "providerEvents": ["conversation_status_changed"],
      "verification": "shared_secret"
    }
  ],
  "knownLimitations": [
    "Webhook events are coarse; fetch current conversation state before workflow continuation."
  ],
  "contractTestSuiteVersion": "1.0.0"
}
```

### Documenso Contracts Manifest Sketch

```json
{
  "provider": "documenso",
  "category": "contracts",
  "version": "1.0.0",
  "displayName": "Documenso",
  "auth": {
    "supportedTypes": ["api_key"],
    "requiresBaseUrl": true
  },
  "capabilities": {
    "contracts.listTemplates": { "supported": true, "required": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" },
    "contracts.createDocumentFromTemplate": { "supported": true, "required": true, "idempotency": "external_id", "dryRunSupport": "orqent_preview" },
    "contracts.sendForSignature": { "supported": true, "required": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" },
    "contracts.readDocumentStatus": { "supported": true, "required": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "orqent_preview" },
    "contracts.downloadCompletedDocument": { "supported": true, "optional": true, "idempotency": "orqent_ledger_only", "dryRunSupport": "none" }
  },
  "mappings": [
    { "category": "contract_template", "canonicalKeys": ["onboarding_agreement", "sales_agreement", "renewal_agreement"], "required": true }
  ],
  "webhooks": [
    {
      "canonicalEvent": "contract.completed",
      "providerEvents": ["document.completed", "recipient.signed"],
      "verification": "shared_secret"
    }
  ],
  "knownLimitations": [
    "Do not sync signed files to CRM by default; store links and metadata first.",
    "Provider status names must be normalized to Orqent ContractStatus."
  ],
  "contractTestSuiteVersion": "1.0.0"
}
```

## Contract Tests

Every provider adapter must pass tests for each supported required capability.

Minimum test groups:

- auth failure
- capability metadata load
- setup metadata fetch
- dry-run/proposal payload generation
- successful write in sandbox/mock mode
- duplicate/idempotent write handling
- provider validation failure
- retryable provider failure
- webhook ingestion/replay where supported

Tests should verify behavior through the capability interface, not provider adapter internals.

## Planning-Time Capability Check

For each Business Action:

1. Load connected provider category for workspace.
2. Load capability manifest snapshot.
3. Verify all required capability IDs are supported.
4. Verify required workspace mappings exist and are verified.
5. If unsupported, return a typed planning error with fallback suggestion.

## Execution-Time Capability Check

Before execution:

1. Reload Provider Connection.
2. Ensure connection is still verified.
3. Compare required manifest version/snapshot assumptions.
4. Verify mappings still exist.
5. Verify Proposed Action stale assumptions.
6. Execute only if checks pass.

