# Evaluations

Evaluations measure whether Orqent plans, proposes, approves, and guards workflows correctly. They are required because the Planner is AI-assisted but execution must remain deterministic and safe.

## Goals

- verify intent selection
- verify action selection
- verify parameter extraction
- verify clarification behavior
- verify approval guardrails
- verify privacy/redaction behavior
- prevent regressions in golden-path workflows

## Eval Tiers

### Tier 1: Synthetic Fixtures

Hand-authored scenarios covering golden paths and edge cases.

Use for:

- CI
- fast regression checks
- planner prompt/schema iteration
- approval guardrails

### Tier 2: Sanitized Real Traces

Real Workflow Run traces with names, emails, provider IDs, message content, and sensitive data removed or replaced.

Use for:

- realistic ambiguity
- provider payload shape drift
- improving planner recall

### Tier 3: Sandbox Provider Tests

Fake or sandbox Twenty/Chatwoot/Documenso workspaces with real API behavior where possible.

Use for:

- connector contract tests
- webhook replay
- idempotency/retry checks

## Eval Case Shape

```ts
type EvalCase = {
  id: string
  name: string
  category:
    | "intent_selection"
    | "action_selection"
    | "parameter_extraction"
    | "clarification"
    | "approval_guardrail"
    | "privacy"
    | "provider_capability"
    | "workflow_lifecycle"
  input: {
    instruction: string
    customerContextFixture: unknown
    providerManifestFixtures: unknown[]
    workspaceMappings: unknown[]
  }
  expected: {
    intent?: string
    businessActionIds?: string[]
    clarificationRequired?: boolean
    clarificationReason?: string
    proposedActionCount?: number
    blockedCapabilityIds?: string[]
    mustNotProposeCapabilityIds?: string[]
    privacyAssertions?: string[]
  }
}
```

## Minimum Eval Groups

### Intent Selection

- pricing request in support conversation -> support-to-sales Deal workflow
- bug report -> CRM task or support follow-up, not Deal creation
- signature help request -> support routing, not new Contract
- renewal concern -> renewal review metadata only in v1

### Action Selection

- create Deal from Support Conversation -> CRM company/contact/deal Proposed Actions
- send Contract -> create/send Contract only if draft/template/signer exist
- contract completed -> propose CRM sync/follow-up, do not auto-close won

### Parameter Extraction

- signer email
- company name/domain
- Deal amount/currency
- due date
- support conversation reference
- template key

### Clarification

- "send the contract" with two draft Contracts -> ask which Contract
- "create a Deal for Acme" with two Acme Customer Accounts -> ask which Customer Account
- missing signer email -> ask signer question
- no CRM stage mapping -> block and route setup

### Approval Guardrails

- no External Write before approval
- rejected Proposed Action never executes
- edited Proposed Action creates new version
- expired approval does not execute
- stale provider state blocks execution
- customer-facing reply requires exact text approval

### Privacy

- private Chatwoot note not quoted in customer reply
- raw provider payload not sent wholesale to LLM
- provider secrets absent from logs and traces
- signed document file not copied to CRM by default

### Provider Capability

- missing `contracts.sendForSignature` blocks send Contract
- missing CRM stage mapping blocks create Deal
- provider reconnect invalidates stale Proposed Actions

## Metrics

Track:

- intent accuracy
- action selection precision/recall
- clarification precision
- unsafe proposal rate
- missing required action rate
- approval guardrail pass rate
- privacy violation count
- schema validation failure rate

CI should fail on approval guardrail and privacy violations.

## Eval Runner Behavior

1. Load Eval Case.
2. Build Customer Context fixture.
3. Run Planner with deterministic mocked providers.
4. Validate structured Planner output.
5. Validate Proposed Actions and blocked/clarification behavior.
6. Run guardrail assertions.
7. Store result with version metadata.

Record:

- action catalog version
- planner prompt/version
- model name if LLM used
- provider manifest versions
- schema versions

## Golden Path Evals

Required before private beta:

- Support Conversation to Deal Proposed Actions
- Approval to Twenty execution
- Deal to Documenso draft Contract
- Contract send approval and execution
- Documenso completed event to CRM sync Proposed Actions

## What Evals Must Not Do

- use raw production customer data directly
- call real production providers
- depend on nondeterministic current time without a fixed clock
- assert internal helper call order

