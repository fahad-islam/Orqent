import { Schema } from "effect"

export const WorkspaceId = Schema.UUID.pipe(Schema.brand("WorkspaceId"))
export type WorkspaceId = Schema.Schema.Type<typeof WorkspaceId>

export const WorkspaceMembershipId = Schema.UUID.pipe(Schema.brand("WorkspaceMembershipId"))
export type WorkspaceMembershipId = Schema.Schema.Type<typeof WorkspaceMembershipId>

export const UserId = Schema.UUID.pipe(Schema.brand("UserId"))
export type UserId = Schema.Schema.Type<typeof UserId>

export const ProviderConnectionId = Schema.UUID.pipe(Schema.brand("ProviderConnectionId"))
export type ProviderConnectionId = Schema.Schema.Type<typeof ProviderConnectionId>

export const WorkspaceMappingId = Schema.UUID.pipe(Schema.brand("WorkspaceMappingId"))
export type WorkspaceMappingId = Schema.Schema.Type<typeof WorkspaceMappingId>

export const CustomerAccountId = Schema.UUID.pipe(Schema.brand("CustomerAccountId"))
export type CustomerAccountId = Schema.Schema.Type<typeof CustomerAccountId>

export const CustomerPersonId = Schema.UUID.pipe(Schema.brand("CustomerPersonId"))
export type CustomerPersonId = Schema.Schema.Type<typeof CustomerPersonId>

export const DealId = Schema.UUID.pipe(Schema.brand("DealId"))
export type DealId = Schema.Schema.Type<typeof DealId>

export const ContractId = Schema.UUID.pipe(Schema.brand("ContractId"))
export type ContractId = Schema.Schema.Type<typeof ContractId>

export const SupportConversationId = Schema.UUID.pipe(Schema.brand("SupportConversationId"))
export type SupportConversationId = Schema.Schema.Type<typeof SupportConversationId>

export const IdentityLinkId = Schema.UUID.pipe(Schema.brand("IdentityLinkId"))
export type IdentityLinkId = Schema.Schema.Type<typeof IdentityLinkId>

export const WorkflowRunId = Schema.UUID.pipe(Schema.brand("WorkflowRunId"))
export type WorkflowRunId = Schema.Schema.Type<typeof WorkflowRunId>

export const WorkflowEventId = Schema.UUID.pipe(Schema.brand("WorkflowEventId"))
export type WorkflowEventId = Schema.Schema.Type<typeof WorkflowEventId>

export const ProposedActionId = Schema.UUID.pipe(Schema.brand("ProposedActionId"))
export type ProposedActionId = Schema.Schema.Type<typeof ProposedActionId>

export const ApprovalRequestId = Schema.UUID.pipe(Schema.brand("ApprovalRequestId"))
export type ApprovalRequestId = Schema.Schema.Type<typeof ApprovalRequestId>

export const ApprovalDecisionId = Schema.UUID.pipe(Schema.brand("ApprovalDecisionId"))
export type ApprovalDecisionId = Schema.Schema.Type<typeof ApprovalDecisionId>

export const ExecutionAttemptId = Schema.UUID.pipe(Schema.brand("ExecutionAttemptId"))
export type ExecutionAttemptId = Schema.Schema.Type<typeof ExecutionAttemptId>

export const ExternalRecordSnapshotId = Schema.UUID.pipe(Schema.brand("ExternalRecordSnapshotId"))
export type ExternalRecordSnapshotId = Schema.Schema.Type<typeof ExternalRecordSnapshotId>

export const ProviderEventId = Schema.UUID.pipe(Schema.brand("ProviderEventId"))
export type ProviderEventId = Schema.Schema.Type<typeof ProviderEventId>

export const LlmCallId = Schema.UUID.pipe(Schema.brand("LlmCallId"))
export type LlmCallId = Schema.Schema.Type<typeof LlmCallId>

export const QueueJobId = Schema.UUID.pipe(Schema.brand("QueueJobId"))
export type QueueJobId = Schema.Schema.Type<typeof QueueJobId>

export type CanonicalEntityId =
  | CustomerAccountId
  | CustomerPersonId
  | DealId
  | ContractId
  | SupportConversationId

export const BusinessActionId = Schema.NonEmptyTrimmedString.pipe(Schema.brand("BusinessActionId"))
export type BusinessActionId = Schema.Schema.Type<typeof BusinessActionId>

export const BusinessActionVersion = Schema.NonEmptyTrimmedString.pipe(Schema.brand("BusinessActionVersion"))
export type BusinessActionVersion = Schema.Schema.Type<typeof BusinessActionVersion>

export const CapabilityId = Schema.NonEmptyTrimmedString.pipe(Schema.brand("CapabilityId"))
export type CapabilityId = Schema.Schema.Type<typeof CapabilityId>

export const WorkflowId = Schema.NonEmptyTrimmedString.pipe(Schema.brand("WorkflowId"))
export type WorkflowId = Schema.Schema.Type<typeof WorkflowId>

export const WorkflowVersion = Schema.NonEmptyTrimmedString.pipe(Schema.brand("WorkflowVersion"))
export type WorkflowVersion = Schema.Schema.Type<typeof WorkflowVersion>

export const ProviderName = Schema.NonEmptyTrimmedString.pipe(Schema.brand("ProviderName"))
export type ProviderName = Schema.Schema.Type<typeof ProviderName>

export const ProviderObjectType = Schema.NonEmptyTrimmedString.pipe(Schema.brand("ProviderObjectType"))
export type ProviderObjectType = Schema.Schema.Type<typeof ProviderObjectType>

export const ProviderObjectId = Schema.NonEmptyTrimmedString.pipe(Schema.brand("ProviderObjectId"))
export type ProviderObjectId = Schema.Schema.Type<typeof ProviderObjectId>

export const MappingCategoryId = Schema.NonEmptyTrimmedString.pipe(Schema.brand("MappingCategoryId"))
export type MappingCategoryId = Schema.Schema.Type<typeof MappingCategoryId>

export const MappingCanonicalKey = Schema.NonEmptyTrimmedString.pipe(Schema.brand("MappingCanonicalKey"))
export type MappingCanonicalKey = Schema.Schema.Type<typeof MappingCanonicalKey>

export const CredentialRef = Schema.NonEmptyTrimmedString.pipe(Schema.brand("CredentialRef"))
export type CredentialRef = Schema.Schema.Type<typeof CredentialRef>

export const WebhookSecretRef = Schema.NonEmptyTrimmedString.pipe(Schema.brand("WebhookSecretRef"))
export type WebhookSecretRef = Schema.Schema.Type<typeof WebhookSecretRef>

export const IdempotencyKey = Schema.NonEmptyTrimmedString.pipe(Schema.brand("IdempotencyKey"))
export type IdempotencyKey = Schema.Schema.Type<typeof IdempotencyKey>

export const CanonicalEventType = Schema.NonEmptyTrimmedString.pipe(Schema.brand("CanonicalEventType"))
export type CanonicalEventType = Schema.Schema.Type<typeof CanonicalEventType>

export const ProviderEventType = Schema.NonEmptyTrimmedString.pipe(Schema.brand("ProviderEventType"))
export type ProviderEventType = Schema.Schema.Type<typeof ProviderEventType>
