# Demo Mode

Demo Mode lets someone experience Orqent's real workflow engine without connecting real Twenty, Chatwoot, or Documenso credentials.

## Goals

- let recruiters, reviewers, and prospects try the product quickly
- prove the command-to-approval-to-execution loop
- show workflow traces and guardrails
- support demos without sensitive customer data
- provide stable fixtures for evals and development

## Core Principle

Demo Mode uses the real Orqent workflow, planner, approval, policy, and execution modules with fake provider adapters.

Do not build a separate fake app.

## Demo Providers

Fake providers should implement the same capability contracts as real providers:

- `DemoCrmConnector`
- `DemoSupportConnector`
- `DemoContractsConnector`

They should return realistic normalized results, external refs, provider statuses, failures, and webhook events.

## Demo Dataset

Include:

- sample Customer Accounts
- sample Customer People
- sample Support Conversations
- sample Deals
- sample Contract templates
- sample draft/sent/completed Contracts
- sample provider users/teams/stages
- sample ambiguous identities

Scenarios:

1. pricing request from Support Conversation
2. bug report that should not create a Deal
3. ambiguous Acme Customer Account
4. missing signer email
5. Contract completed event
6. provider failure and retry
7. stale conversation after customer sends a new message

## Demo Workspace Setup

Demo Workspace should have:

- preconfigured provider connections
- verified workspace mappings
- fake credentials references
- seeded snapshots
- seeded Identity Links
- seeded Approval Requests optional for landing state

The user should not need real provider credentials.

## Demo Actions

Demo users can:

- enter a text command
- review Proposed Actions
- approve/reject actions
- see fake provider writes execute
- trigger simulated provider events
- inspect Workflow Run trace
- test clarification flows

Demo users should not:

- connect real providers from the demo workspace
- export fake data as if it were production
- change global action catalog definitions

## Simulation Controls

For demos and testing, expose safe controls:

- simulate provider success
- simulate provider 429/5xx retryable failure
- simulate provider validation failure
- simulate Documenso Contract completion
- simulate new Chatwoot customer message
- reset demo workspace

Controls should be clearly labeled as demo-only.

## Implementation Shape

```text
packages/providers-demo
  crm
  support
  contracts
  fixtures
  simulation
```

Demo providers should satisfy the same Effect service interfaces as production providers.

## Data Isolation

Demo data should be isolated from production workspaces:

- `workspace.mode = demo`
- no real credentials
- no outbound calls to real provider base URLs
- clear visual demo badge in UI
- resettable fixtures

## Acceptance Criteria

- [ ] A new user can enter a demo workspace without provider credentials.
- [ ] Golden path works using fake providers.
- [ ] Approval guardrails behave exactly like production.
- [ ] Workflow trace looks like production trace.
- [ ] Demo provider failures and stale states can be simulated.
- [ ] Demo data cannot leak into production workspaces.

