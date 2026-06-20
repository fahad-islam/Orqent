import { Schema } from "effect"

export const workspaceStatuses = [
  "active",
  "disabled"
] as const
export type WorkspaceStatus = (typeof workspaceStatuses)[number]
export const WorkspaceStatus = Schema.Literal(...workspaceStatuses)

export const workspaceMembershipRoles = [
  "owner",
  "admin",
  "operator",
  "viewer"
] as const
export type WorkspaceMembershipRole = (typeof workspaceMembershipRoles)[number]
export const WorkspaceMembershipRole = Schema.Literal(...workspaceMembershipRoles)

export const workspaceMembershipStatuses = [
  "active",
  "disabled",
  "invited"
] as const
export type WorkspaceMembershipStatus = (typeof workspaceMembershipStatuses)[number]
export const WorkspaceMembershipStatus = Schema.Literal(...workspaceMembershipStatuses)

export const providerCategories = [
  "crm",
  "support",
  "contracts",
  "notification"
] as const
export type ProviderCategory = (typeof providerCategories)[number]
export const ProviderCategory = Schema.Literal(...providerCategories)

export const providerConnectionStatuses = [
  "draft",
  "verified",
  "disabled",
  "error"
] as const
export type ProviderConnectionStatus = (typeof providerConnectionStatuses)[number]
export const ProviderConnectionStatus = Schema.Literal(...providerConnectionStatuses)

export const providerAuthTypes = [
  "api_key",
  "bearer_token",
  "oauth2"
] as const
export type ProviderAuthType = (typeof providerAuthTypes)[number]
export const ProviderAuthType = Schema.Literal(...providerAuthTypes)

export const canonicalStatuses = [
  "provisional",
  "linked",
  "retired"
] as const
export type CanonicalStatus = (typeof canonicalStatuses)[number]
export const CanonicalStatus = Schema.Literal(...canonicalStatuses)

export const canonicalEntityTypes = [
  "customer_account",
  "customer_person",
  "deal",
  "contract",
  "support_conversation"
] as const
export type CanonicalEntityType = (typeof canonicalEntityTypes)[number]
export const CanonicalEntityType = Schema.Literal(...canonicalEntityTypes)

export const contractStatuses = [
  "draft",
  "ready_to_send",
  "sent",
  "viewed",
  "partially_signed",
  "completed",
  "declined",
  "expired",
  "voided",
  "failed"
] as const
export type ContractStatus = (typeof contractStatuses)[number]
export const ContractStatus = Schema.Literal(...contractStatuses)

export const identityLinkStatuses = [
  "active",
  "rejected",
  "replaced",
  "retired"
] as const
export type IdentityLinkStatus = (typeof identityLinkStatuses)[number]
export const IdentityLinkStatus = Schema.Literal(...identityLinkStatuses)

export const matchMethods = [
  "external_id",
  "manual",
  "exact_email",
  "exact_domain",
  "domain_and_name",
  "provider_relationship",
  "conversation_context",
  "fuzzy_name",
  "llm_suggested"
] as const
export type MatchMethod = (typeof matchMethods)[number]
export const MatchMethod = Schema.Literal(...matchMethods)

export const workflowRunStatuses = [
  "draft",
  "planning",
  "needs_clarification",
  "awaiting_approval",
  "partially_approved",
  "executing",
  "waiting_for_event",
  "partially_completed",
  "completed",
  "failed",
  "cancelled",
  "expired"
] as const
export type WorkflowRunStatus = (typeof workflowRunStatuses)[number]
export const WorkflowRunStatus = Schema.Literal(...workflowRunStatuses)

export const proposedActionStatuses = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "edited",
  "superseded",
  "queued",
  "executing",
  "executed",
  "failed_retryable",
  "failed_permanent",
  "expired",
  "stale",
  "blocked"
] as const
export type ProposedActionStatus = (typeof proposedActionStatuses)[number]
export const ProposedActionStatus = Schema.Literal(...proposedActionStatuses)

export const approvalRequestStatuses = [
  "open",
  "partially_decided",
  "approved",
  "rejected",
  "expired",
  "cancelled"
] as const
export type ApprovalRequestStatus = (typeof approvalRequestStatuses)[number]
export const ApprovalRequestStatus = Schema.Literal(...approvalRequestStatuses)

export const approvalDecisionTypes = [
  "approved",
  "rejected",
  "edited",
  "expired",
  "cancelled"
] as const
export type ApprovalDecisionType = (typeof approvalDecisionTypes)[number]
export const ApprovalDecisionType = Schema.Literal(...approvalDecisionTypes)

export const executionAttemptStatuses = [
  "started",
  "succeeded",
  "failed_retryable",
  "failed_permanent",
  "skipped_stale",
  "skipped_expired",
  "idempotency_replayed"
] as const
export type ExecutionAttemptStatus = (typeof executionAttemptStatuses)[number]
export const ExecutionAttemptStatus = Schema.Literal(...executionAttemptStatuses)

export const instructionSources = [
  "text",
  "voice",
  "provider_event",
  "system"
] as const
export type InstructionSource = (typeof instructionSources)[number]
export const InstructionSource = Schema.Literal(...instructionSources)

export const riskLevels = [
  "low",
  "medium",
  "high"
] as const
export type RiskLevel = (typeof riskLevels)[number]
export const RiskLevel = Schema.Literal(...riskLevels)

export const actionGroups = [
  "sales_to_contract",
  "support_to_sales",
  "onboarding",
  "renewals",
  "governance"
] as const
export type ActionGroup = (typeof actionGroups)[number]
export const ActionGroup = Schema.Literal(...actionGroups)

export const actionKinds = [
  "business_action"
] as const
export type ActionKind = (typeof actionKinds)[number]
export const ActionKind = Schema.Literal(...actionKinds)

export const idempotencySupportKinds = [
  "native",
  "external_id",
  "orqent_ledger_only"
] as const
export type IdempotencySupportKind = (typeof idempotencySupportKinds)[number]
export const IdempotencySupportKind = Schema.Literal(...idempotencySupportKinds)

export const dryRunSupportKinds = [
  "orqent_preview",
  "provider_validate",
  "none"
] as const
export type DryRunSupportKind = (typeof dryRunSupportKinds)[number]
export const DryRunSupportKind = Schema.Literal(...dryRunSupportKinds)

export const webhookVerificationKinds = [
  "signature",
  "shared_secret",
  "none"
] as const
export type WebhookVerificationKind = (typeof webhookVerificationKinds)[number]
export const WebhookVerificationKind = Schema.Literal(...webhookVerificationKinds)

export const dependencyKinds = [
  "proposed_action",
  "canonical_entity",
  "identity_link",
  "workspace_mapping",
  "provider_capability",
  "provider_state_assumption"
] as const
export type DependencyKind = (typeof dependencyKinds)[number]
export const DependencyKind = Schema.Literal(...dependencyKinds)

export const providerEventProcessingStatuses = [
  "received",
  "processed",
  "ignored",
  "failed"
] as const
export type ProviderEventProcessingStatus = (typeof providerEventProcessingStatuses)[number]
export const ProviderEventProcessingStatus = Schema.Literal(...providerEventProcessingStatuses)

export const queueJobStatuses = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "dead"
] as const
export type QueueJobStatus = (typeof queueJobStatuses)[number]
export const QueueJobStatus = Schema.Literal(...queueJobStatuses)

export const workflowRunStatusTransitions = {
  draft: ["planning", "cancelled", "failed"],
  planning: ["awaiting_approval", "needs_clarification", "failed", "cancelled"],
  needs_clarification: ["planning", "cancelled"],
  awaiting_approval: ["executing", "partially_approved", "cancelled", "expired"],
  partially_approved: ["executing", "awaiting_approval", "cancelled", "expired"],
  executing: ["waiting_for_event", "completed", "failed", "partially_completed"],
  waiting_for_event: ["planning", "awaiting_approval", "executing", "completed", "failed"],
  partially_completed: ["awaiting_approval", "executing", "completed", "failed"],
  completed: [],
  failed: ["planning", "cancelled"],
  cancelled: [],
  expired: ["planning", "cancelled"]
} as const satisfies Record<WorkflowRunStatus, readonly WorkflowRunStatus[]>

export const proposedActionStatusTransitions = {
  draft: ["pending_approval", "blocked", "superseded"],
  pending_approval: ["approved", "rejected", "edited", "expired", "stale", "blocked", "superseded"],
  approved: ["queued", "expired", "stale", "superseded"],
  rejected: [],
  edited: ["superseded"],
  superseded: [],
  queued: ["executing", "stale", "expired"],
  executing: ["executed", "failed_retryable", "failed_permanent", "stale"],
  executed: [],
  failed_retryable: ["queued", "failed_permanent", "expired"],
  failed_permanent: [],
  expired: [],
  stale: [],
  blocked: ["pending_approval", "superseded"]
} as const satisfies Record<ProposedActionStatus, readonly ProposedActionStatus[]>

export const approvalRequestStatusTransitions = {
  open: ["partially_decided", "approved", "rejected", "expired", "cancelled"],
  partially_decided: ["approved", "rejected", "expired", "cancelled"],
  approved: [],
  rejected: [],
  expired: [],
  cancelled: []
} as const satisfies Record<ApprovalRequestStatus, readonly ApprovalRequestStatus[]>

export const terminalWorkflowRunStatuses = [
  "completed",
  "cancelled"
] as const satisfies readonly WorkflowRunStatus[]

export const terminalProposedActionStatuses = [
  "rejected",
  "superseded",
  "executed",
  "failed_permanent",
  "expired",
  "stale"
] as const satisfies readonly ProposedActionStatus[]

export const terminalApprovalRequestStatuses = [
  "approved",
  "rejected",
  "expired",
  "cancelled"
] as const satisfies readonly ApprovalRequestStatus[]

export const canTransitionWorkflowRunStatus = (
  from: WorkflowRunStatus,
  to: WorkflowRunStatus
): boolean => workflowRunStatusTransitions[from].some((next) => next === to)

export const canTransitionProposedActionStatus = (
  from: ProposedActionStatus,
  to: ProposedActionStatus
): boolean => proposedActionStatusTransitions[from].some((next) => next === to)

export const canTransitionApprovalRequestStatus = (
  from: ApprovalRequestStatus,
  to: ApprovalRequestStatus
): boolean => approvalRequestStatusTransitions[from].some((next) => next === to)
