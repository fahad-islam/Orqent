# Planner

The Planner turns a Business Owner instruction plus Customer Context into either a reviewable Workflow Run plan or one or more Clarification Questions. It does not execute External Writes.

## Responsibilities

The Planner owns:

- intent extraction
- action selection
- parameter extraction
- entity resolution requests
- clarification detection
- capability planning
- Proposed Action generation
- deterministic preview assembly orchestration

The Planner does not own:

- provider execution
- approval permission checks
- retries
- provider credential handling
- raw webhook processing
- long-term identity verification decisions

## Pipeline

```text
Instruction
→ normalize instruction
→ extract intent
→ assemble Customer Context
→ resolve referenced entities
→ select Business Actions
→ check capabilities and mappings
→ extract/validate parameters
→ ask clarification or build Proposed Actions
→ create Approval Request
```

Each stage produces structured output and is traceable inside the Workflow Run.

## LLM vs Deterministic Responsibilities

LLM may:

- summarize a Business Owner instruction
- classify intent
- suggest candidate Business Actions
- extract candidate parameters
- draft customer-facing text for approval
- explain why a plan was proposed

Deterministic code must:

- validate schemas
- enforce required fields
- check provider capabilities
- check workspace mappings
- check policy and risk level
- generate exact provider write payloads
- generate exact before/after previews
- decide whether approval is required
- create Proposed Actions and Approval Requests

Approval must be based on deterministic payloads and previews, not LLM prose.

## Intent Extraction

Input:

```ts
type PlannerInstructionInput = {
  workspaceId: WorkspaceId
  userId: UserId
  source: "text" | "voice_transcript" | "provider_event" | "system"
  text: string
  contextHints?: {
    supportConversationId?: string
    customerAccountId?: CustomerAccountId
    customerPersonId?: CustomerPersonId
    dealId?: DealId
    contractId?: ContractId
  }
}
```

Output:

```ts
type IntentExtraction = {
  primaryIntent:
    | "create_deal_from_support"
    | "create_crm_task_from_support"
    | "prepare_contract_from_deal"
    | "send_contract_for_signature"
    | "sync_contract_status_to_crm"
    | "renewal_review"
    | "unknown"
  confidence: number
  supportingText: string
  referencedEntities: ReferencedEntity[]
  requestedOutcomes: string[]
  missingInformation: MissingInformation[]
}
```

If `primaryIntent = "unknown"` or confidence is below the workspace threshold, the Planner returns a Clarification Question.

## Referenced Entities

```ts
type ReferencedEntity = {
  kind:
    | "customer_account"
    | "customer_person"
    | "support_conversation"
    | "deal"
    | "contract"
    | "template"
    | "provider_user"
  label: string
  sourceText: string
  candidates: EntityCandidate[]
}

type EntityCandidate = {
  canonicalEntityType: string
  canonicalEntityId?: string
  providerConnectionId?: string
  providerObjectType?: string
  providerObjectId?: string
  displayLabel: string
  matchMethod: string
  confidence: number
  verified: boolean
}
```

Entity candidates come from Identity Links, Customer Context, provider snapshots, and explicit instruction references.

## Entity Resolution Rules

The Planner may proceed without clarification when:

- exactly one verified candidate exists
- exact external ID or canonical ID is supplied
- exact email match is found and no conflicting verified link exists
- the Business Action can create a provisional canonical shell safely

The Planner must ask clarification when:

- multiple verified candidates match
- no required entity can be found or created provisionally
- only low-confidence fuzzy matches exist
- the instruction references "that conversation", "the contract", or "Acme" without enough context
- the selected Contract template is ambiguous
- the signer is missing or ambiguous

## Clarification Questions

```ts
type ClarificationQuestion = {
  id: ClarificationQuestionId
  workflowRunId: WorkflowRunId
  reason:
    | "ambiguous_intent"
    | "missing_entity"
    | "ambiguous_entity"
    | "missing_mapping"
    | "missing_required_parameter"
    | "unsupported_capability"
  question: string
  options?: ClarificationOption[]
  freeTextAllowed: boolean
  blocks: string[]
}

type ClarificationOption = {
  label: string
  value: string
  entityRef?: {
    canonicalEntityType?: string
    canonicalEntityId?: string
    providerObjectType?: string
    providerObjectId?: string
  }
  confidence?: number
}
```

Examples:

- "I found two Acme Customer Accounts. Which one should I use?"
- "Which Documenso template should I use for the onboarding Contract?"
- "Who should receive the Contract for signature?"
- "Do you want me to create a Deal or only a CRM task?"

Clarification answers resume the same Workflow Run and re-enter planning.

## Action Selection

Action selection maps intent to Business Actions.

Examples:

| Intent | Candidate Business Actions |
| --- | --- |
| `create_deal_from_support` | `workflows.categorize_customer_message`, `workflows.create_deal_from_support_conversation`, `workflows.create_crm_task_from_support_message` |
| `prepare_contract_from_deal` | `workflows.prepare_quote_to_contract_package`, `workflows.create_contract_from_deal` |
| `send_contract_for_signature` | `workflows.send_deal_contract_for_signature` |
| `sync_contract_status_to_crm` | `workflows.sync_signer_status_to_crm`, `workflows.create_followup_task_after_signature` |

The Planner may propose multiple Business Actions when the instruction explicitly asks for multiple outcomes, but it should keep dependencies explicit.

## Capability Planning

Before Proposed Action generation:

1. Load active provider connection per category.
2. Load manifest snapshot.
3. Check required capabilities for selected Business Actions.
4. Check required workspace mappings.
5. Return Clarification Question or typed planning error if blocked.

Example:

```text
Instruction: "Send the onboarding contract."
Requires:
- contracts.createDocumentFromTemplate
- contracts.sendForSignature
- contract_template:onboarding_agreement mapping
- signer email
```

If `contract_template:onboarding_agreement` is missing, return a missing mapping clarification/admin setup requirement rather than generating an invalid Proposed Action.

## Parameter Extraction

Extracted parameters must be schema validated before use.

```ts
type ActionParameterExtraction = {
  businessActionId: string
  businessActionVersion: string
  parameters: unknown
  confidence: number
  missing: MissingInformation[]
  assumptions: PlannerAssumption[]
}
```

Common parameters:

- Support Conversation ID
- Customer Account ID
- Customer Person ID
- Deal ID
- Contract template key
- signer name/email
- amount/currency
- due date
- owner/assignee
- reply text

Low-confidence parameters become assumptions or clarifications depending on risk.

## Proposed Action Generation

The Planner creates Proposed Actions through deterministic builders owned by Workflow Run implementation.

Each Proposed Action includes:

- Business Action ID/version
- capability ID
- provider connection target
- canonical entity refs
- exact input payload
- exact provider write payload if applicable
- deterministic before/after preview
- human explanation
- risk level
- approval policy snapshot
- capability manifest snapshot
- dependencies
- assumptions
- idempotency key

The LLM may draft `human_explanation`, but the structured preview and provider payload come from deterministic code.

## Planner Failure Modes

| Failure | Behavior |
| --- | --- |
| ambiguous intent | ask Clarification Question |
| missing required entity | ask Clarification Question or create provisional shell if safe |
| missing signer | ask Clarification Question |
| missing mapping | block and route to setup/admin |
| unsupported capability | block with fallback suggestion |
| schema validation failure | block and record planner validation error |
| low LLM confidence | ask clarification |

## Planner Trace

Store trace entries for:

- instruction normalization
- intent extraction
- entity candidates considered
- selected Business Actions
- rejected Business Actions and reasons
- capability checks
- parameter extraction
- clarifications
- Proposed Action generation

Do not store unredacted prompts or raw provider payloads in planner trace.

