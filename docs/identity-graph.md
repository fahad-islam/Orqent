# Identity Graph

The Identity Graph records how Orqent canonical entities relate to provider records across Twenty, Chatwoot, Documenso, and future providers.

## Goals

- prevent duplicate Customer Accounts and Customer People
- avoid linking provider records to the wrong customer
- support provider replacement later
- explain why a link was suggested or verified
- provide stable canonical IDs for Workflow Runs and Proposed Actions

## Core Concepts

Canonical entities:

- Customer Account
- Customer Person
- Deal
- Contract
- Support Conversation

External records:

- Twenty company/person/opportunity/task
- Chatwoot contact/conversation/message
- Documenso document/envelope/recipient/template

Identity Links connect canonical entities to external records.

## Match Methods

| Match method | Example | Suggested confidence |
| --- | --- | --- |
| `external_id` | Provider record contains Orqent ID. | 1.0 |
| `manual` | User selected and verified the match. | 1.0 |
| `exact_email` | Chatwoot contact email equals Twenty person email. | 0.98 |
| `exact_domain` | Company domain equals email/domain. | 0.90 |
| `domain_and_name` | Domain plus similar company name. | 0.80 |
| `provider_relationship` | Documenso recipient came from a known Contract link. | 0.85 |
| `conversation_context` | Conversation was already linked to a Customer Account. | 0.75 |
| `fuzzy_name` | Similar company/person name only. | 0.40 |
| `llm_suggested` | Model suggested a link from context. | 0.35 |

Confidence is advisory. `verified = true` is the stronger signal.

## Identity Link Shape

```ts
type IdentityLink = {
  id: IdentityLinkId
  workspaceId: WorkspaceId
  canonicalEntityType:
    | "customer_account"
    | "customer_person"
    | "deal"
    | "contract"
    | "support_conversation"
  canonicalEntityId: string
  providerConnectionId: ProviderConnectionId
  provider: string
  providerObjectType: string
  providerObjectId: string
  matchMethod: MatchMethod
  confidence: number
  verified: boolean
  status: "active" | "rejected" | "replaced" | "retired"
}
```

## Link Creation Flow

1. Gather candidates from provider snapshots, existing Identity Links, and instruction hints.
2. Score candidates using deterministic match methods.
3. Create provisional canonical shell when needed.
4. Create unverified Identity Links for likely matches.
5. Require manual review for ambiguous or low-confidence matches.
6. Mark verified links after user confirmation or reliable external ID round-trip.
7. Emit an identity event.

## Automatic Verification Rules

Allowed automatic verification:

- `external_id` match where provider metadata contains a valid Orqent canonical ID.
- exact provider object returned immediately after an approved Orqent write.
- exact email match for Customer Person when no conflicting active link exists.

Require manual verification:

- multiple candidates above threshold
- fuzzy name match
- LLM-suggested match
- same email appears under multiple Customer Accounts
- domain-only match when several Customer Accounts share a domain

## Duplicate Handling

Duplicate detection creates suggestions, not destructive changes.

Duplicate cases:

- two Customer Accounts point to same provider company
- two Customer People share exact email
- one Chatwoot contact maps to multiple Twenty people
- one Contract recipient maps to multiple Customer People

Resolution options:

- verify one link and reject others
- replace an existing link
- retire duplicate canonical shell
- keep duplicates intentionally with reason

Do not merge provider records automatically in v1. If provider merge is needed, create a Proposed Action that requires approval and provider capability support.

## Manual Identity Review

Manual review UI should show:

- candidate records
- provider source
- match method
- confidence
- evidence fields
- related Workflow Runs
- consequences of verification

User actions:

- verify link
- reject link
- replace existing link
- create new Customer Account/Person shell
- defer and block dependent Proposed Actions

## Identity Events

Append-only events:

- `identity.link_suggested`
- `identity.link_verified`
- `identity.link_rejected`
- `identity.link_replaced`
- `identity.link_retired`
- `identity.link_confidence_changed`

Events preserve why a link changed and who changed it.

## Planner Interaction

The Planner may use unverified high-confidence links for read-only planning, but External Writes that depend on uncertain identity must either:

- ask clarification
- require manual identity review
- create a provisional shell and make provider writes explicit in the approval preview

## Provider External IDs

Whenever possible, write Orqent IDs into provider metadata:

- Twenty custom fields or note metadata
- Chatwoot custom attributes
- Documenso `externalId`

External ID round-trip is the strongest identity signal.

