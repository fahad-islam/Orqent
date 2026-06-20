# Action Catalog

The Action Catalog defines versioned Business Actions and lower-level provider-neutral capabilities available to Orqent.

## Responsibilities

The Action Catalog owns:

- action IDs and versions
- input and output schemas
- required capabilities
- required mappings
- risk levels
- default approval policy
- dependency metadata
- eval coverage metadata

It does not execute actions. Execution belongs to `WorkflowRunModule` and `ProviderExecutionRuntime`.

## Business Action Definition

```ts
type BusinessActionDefinition = {
  id: string
  version: string
  group:
    | "sales_to_contract"
    | "support_to_sales"
    | "onboarding"
    | "renewals"
    | "governance"
  kind: "business_action"
  title: string
  description: string
  inputSchema: Schema
  outputSchema: Schema
  requiredCapabilities: string[]
  requiredMappings: MappingRequirement[]
  defaultApprovalPolicy: ApprovalPolicy
  riskLevel: "low" | "medium" | "high"
  plannerHints: string[]
  evals: {
    goldenPathRequired: boolean
    guardrailRequired: boolean
  }
}
```

## Capability Definition

```ts
type CapabilityDefinition = {
  id: string
  category: "crm" | "support" | "contracts" | "notification"
  title: string
  inputSchema: Schema
  outputSchema: Schema
  externalWrite: boolean
  defaultRiskLevel: "low" | "medium" | "high"
}
```

## V1 Business Actions

### Support To Sales

#### `workflows.categorize_customer_message`

- Type: read-only
- Risk: low
- Approval: not required
- Required capabilities:
  - `support.readConversation`
- Output:
  - category
  - urgency
  - sales intent confidence
  - suggested next actions

#### `workflows.create_deal_from_support_conversation`

- Type: write plan
- Risk: medium
- Approval: required for generated External Writes
- Required capabilities:
  - `support.readConversation`
  - `crm.findCompany`
  - `crm.createCompany`
  - `crm.findContact`
  - `crm.createContact`
  - `crm.createDeal`
- Required mappings:
  - `crm_pipeline_stage:proposal`
- Proposed Actions:
  - create/link Customer Account
  - create/link Customer Person
  - create Deal

#### `workflows.create_crm_task_from_support_message`

- Type: write plan
- Risk: low/medium
- Approval: required
- Required capabilities:
  - `support.readConversation`
  - `crm.createTask`
- Proposed Actions:
  - create CRM follow-up task

#### `workflows.add_support_summary_to_crm_contact`

- Type: write plan
- Risk: medium
- Approval: required
- Required capabilities:
  - `support.readConversation`
  - `crm.addNoteToRecord`
- Proposed Actions:
  - add support summary/link to CRM record

### Sales To Contract

#### `workflows.prepare_quote_to_contract_package`

- Type: read-only
- Risk: low
- Approval: not required
- Required capabilities:
  - `crm.findCompany`
  - `crm.findContact`
- Output:
  - Proposal Package draft
  - Deal context summary
  - Contract readiness checklist

#### `workflows.create_contract_from_deal`

- Type: write plan
- Risk: medium
- Approval: required
- Required capabilities:
  - `contracts.createDocumentFromTemplate`
  - `contracts.readDocumentStatus`
- Required mappings:
  - `contract_template:sales_agreement`
- Proposed Actions:
  - create Documenso draft Contract

#### `workflows.send_deal_contract_for_signature`

- Type: external customer-facing write
- Risk: high
- Approval: required
- Required capabilities:
  - `contracts.sendForSignature`
  - `contracts.readDocumentStatus`
- Proposed Actions:
  - send Contract to Signer

#### `workflows.sync_signer_status_to_crm`

- Type: write plan
- Risk: medium
- Approval: required in v1
- Required capabilities:
  - `contracts.readDocumentStatus`
  - `crm.addNoteToRecord`
- Proposed Actions:
  - add signer/Contract status summary to CRM

#### `workflows.create_followup_task_after_signature`

- Type: write plan
- Risk: low/medium
- Approval: required in v1
- Required capabilities:
  - `crm.createTask`
- Proposed Actions:
  - create CRM follow-up task

#### `workflows.close_won_after_signature`

- Type: CRM state update
- Risk: high
- Approval: required
- Required capabilities:
  - `crm.updateDealStage`
- Required mappings:
  - `crm_pipeline_stage:won`
- Proposed Actions:
  - update Deal stage to won

### Governance

#### `workflows.dry_run_external_writes`

- Type: read-only
- Risk: low
- Approval: not required
- Purpose:
  - materialize previews and proposed payloads without execution

#### `workflows.request_bulk_approval`

- Type: internal
- Risk: low
- Approval: not required
- Purpose:
  - group Proposed Actions for review

#### `workflows.execute_approved_write_batch`

- Type: External Write execution
- Risk: high
- Approval: required through selected Proposed Actions
- Purpose:
  - enqueue approved immutable writes

#### `workflows.produce_trace_summary`

- Type: read-only
- Risk: low
- Approval: not required
- Purpose:
  - summarize Workflow Run trace for user/admin

#### `workflows.create_approval_guardrail_eval`

- Type: read-only
- Risk: low
- Approval: not required
- Purpose:
  - verify approval gate behavior

## Provider-Neutral Capabilities

CRM:

- `crm.findCompany`
- `crm.createCompany`
- `crm.findContact`
- `crm.createContact`
- `crm.createDeal`
- `crm.createTask`
- `crm.updateDealStage`
- `crm.addNoteToRecord`
- `crm.batchWrite`
- `crm.customFields`
- `crm.ownerAssignment`
- `crm.duplicateMerge`

Support:

- `support.readConversation`
- `support.readContact`
- `support.createPrivateNote`
- `support.assignConversation`
- `support.updateConversationStatus`
- `support.sendReply`
- `support.addLabels`
- `support.setCustomAttributes`

Contracts:

- `contracts.listTemplates`
- `contracts.createDocumentFromTemplate`
- `contracts.sendForSignature`
- `contracts.readDocumentStatus`
- `contracts.downloadCompletedDocument`
- `contracts.prefillFields`

## Approval Policy Defaults

| Risk | Default v1 policy |
| --- | --- |
| low read-only | no approval |
| low write | approval required |
| medium write | approval required, Admin/Owner or permitted Operator |
| high write | approval required, Admin/Owner |
| customer-facing write | approval required, exact text/payload preview |

V1 does not auto-approve External Writes.

## Versioning

Action versions use semantic versions.

- patch: internal implementation or copy changes
- minor: additive optional fields or non-breaking behavior
- major: changed required schema, approval semantics, or execution meaning

Workflow Runs and Proposed Actions store the exact action version used.

