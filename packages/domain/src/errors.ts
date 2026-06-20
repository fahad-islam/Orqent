import { Schema } from "effect"
import {
  ApprovalRequestId,
  BusinessActionId,
  CapabilityId,
  IdempotencyKey,
  MappingCanonicalKey,
  MappingCategoryId,
  ProposedActionId,
  ProviderConnectionId,
  ProviderName,
  UserId,
  WorkflowRunId,
  WorkspaceId
} from "./ids.js"
import {
  ApprovalRequestStatus,
  CanonicalEntityType,
  DependencyKind,
  ProposedActionStatus,
  WorkflowRunStatus
} from "./statuses.js"
import { CanonicalEntityRef, NonEmptyText, Timestamp } from "./schemas.js"

export const LifecycleEntityKind = Schema.Literal(
  "workflow_run",
  "proposed_action",
  "approval_request"
).annotations({ identifier: "LifecycleEntityKind" })
export type LifecycleEntityKind = Schema.Schema.Type<typeof LifecycleEntityKind>

export class DomainValidationError extends Schema.TaggedError<DomainValidationError>("DomainValidationError")(
  "DomainValidationError",
  {
    schema: NonEmptyText,
    message: NonEmptyText,
    issues: Schema.Unknown,
    input: Schema.Unknown
  }
) {}

export class InvalidWorkflowRunTransitionError
  extends Schema.TaggedError<InvalidWorkflowRunTransitionError>("InvalidWorkflowRunTransitionError")(
    "InvalidWorkflowRunTransitionError",
    {
      workflowRunId: WorkflowRunId,
      from: WorkflowRunStatus,
      to: WorkflowRunStatus
    }
  )
{}

export class InvalidProposedActionTransitionError
  extends Schema.TaggedError<InvalidProposedActionTransitionError>("InvalidProposedActionTransitionError")(
    "InvalidProposedActionTransitionError",
    {
      proposedActionId: ProposedActionId,
      from: ProposedActionStatus,
      to: ProposedActionStatus
    }
  )
{}

export class InvalidApprovalRequestTransitionError
  extends Schema.TaggedError<InvalidApprovalRequestTransitionError>("InvalidApprovalRequestTransitionError")(
    "InvalidApprovalRequestTransitionError",
    {
      approvalRequestId: ApprovalRequestId,
      from: ApprovalRequestStatus,
      to: ApprovalRequestStatus
    }
  )
{}

export class ExternalWriteNotApprovedError
  extends Schema.TaggedError<ExternalWriteNotApprovedError>("ExternalWriteNotApprovedError")(
    "ExternalWriteNotApprovedError",
    {
      proposedActionId: ProposedActionId,
      status: ProposedActionStatus
    }
  )
{}

export class ProposedActionExpiredError
  extends Schema.TaggedError<ProposedActionExpiredError>("ProposedActionExpiredError")(
    "ProposedActionExpiredError",
    {
      proposedActionId: ProposedActionId,
      expiresAt: Timestamp,
      checkedAt: Timestamp
    }
  )
{}

export class ProposedActionStaleError
  extends Schema.TaggedError<ProposedActionStaleError>("ProposedActionStaleError")(
    "ProposedActionStaleError",
    {
      proposedActionId: ProposedActionId,
      assumptionKey: NonEmptyText,
      reason: NonEmptyText
    }
  )
{}

export class MissingDependencyError extends Schema.TaggedError<MissingDependencyError>("MissingDependencyError")(
  "MissingDependencyError",
  {
    proposedActionId: ProposedActionId,
    dependencyKind: DependencyKind,
    dependencyRef: NonEmptyText,
    reason: NonEmptyText
  }
) {}

export class UnsupportedCapabilityError
  extends Schema.TaggedError<UnsupportedCapabilityError>("UnsupportedCapabilityError")(
    "UnsupportedCapabilityError",
    {
      workspaceId: WorkspaceId,
      providerConnectionId: ProviderConnectionId,
      provider: ProviderName,
      capabilityId: CapabilityId
    }
  )
{}

export class MissingWorkspaceMappingError
  extends Schema.TaggedError<MissingWorkspaceMappingError>("MissingWorkspaceMappingError")(
    "MissingWorkspaceMappingError",
    {
      workspaceId: WorkspaceId,
      providerConnectionId: ProviderConnectionId,
      category: MappingCategoryId,
      canonicalKey: MappingCanonicalKey
    }
  )
{}

export class ProviderConnectionUnavailableError
  extends Schema.TaggedError<ProviderConnectionUnavailableError>("ProviderConnectionUnavailableError")(
    "ProviderConnectionUnavailableError",
    {
      workspaceId: WorkspaceId,
      providerConnectionId: ProviderConnectionId,
      provider: ProviderName,
      reason: NonEmptyText
    }
  )
{}

export class IdentityResolutionRequiredError
  extends Schema.TaggedError<IdentityResolutionRequiredError>("IdentityResolutionRequiredError")(
    "IdentityResolutionRequiredError",
    {
      workspaceId: WorkspaceId,
      canonicalEntityType: CanonicalEntityType,
      reason: NonEmptyText,
      candidates: Schema.Array(CanonicalEntityRef)
    }
  )
{}

export class ApprovalPolicyDeniedError
  extends Schema.TaggedError<ApprovalPolicyDeniedError>("ApprovalPolicyDeniedError")(
    "ApprovalPolicyDeniedError",
    {
      workspaceId: WorkspaceId,
      proposedActionId: ProposedActionId,
      decidedByUserId: UserId,
      reason: NonEmptyText
    }
  )
{}

export class DuplicateIdempotencyKeyError
  extends Schema.TaggedError<DuplicateIdempotencyKeyError>("DuplicateIdempotencyKeyError")(
    "DuplicateIdempotencyKeyError",
    {
      workspaceId: WorkspaceId,
      proposedActionId: ProposedActionId,
      idempotencyKey: IdempotencyKey
    }
  )
{}

export class BusinessActionNotFoundError
  extends Schema.TaggedError<BusinessActionNotFoundError>("BusinessActionNotFoundError")(
    "BusinessActionNotFoundError",
    {
      businessActionId: BusinessActionId
    }
  )
{}

export class WorkflowRunNotFoundError extends Schema.TaggedError<WorkflowRunNotFoundError>("WorkflowRunNotFoundError")(
  "WorkflowRunNotFoundError",
  {
    workflowRunId: WorkflowRunId
  }
) {}

export type DomainError =
  | DomainValidationError
  | InvalidWorkflowRunTransitionError
  | InvalidProposedActionTransitionError
  | InvalidApprovalRequestTransitionError
  | ExternalWriteNotApprovedError
  | ProposedActionExpiredError
  | ProposedActionStaleError
  | MissingDependencyError
  | UnsupportedCapabilityError
  | MissingWorkspaceMappingError
  | ProviderConnectionUnavailableError
  | IdentityResolutionRequiredError
  | ApprovalPolicyDeniedError
  | DuplicateIdempotencyKeyError
  | BusinessActionNotFoundError
  | WorkflowRunNotFoundError
