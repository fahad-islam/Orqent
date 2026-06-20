import { Schema } from "effect"
import {
  ApprovalDecisionId,
  ApprovalRequestId,
  BusinessActionId,
  BusinessActionVersion,
  CanonicalEventType,
  CapabilityId,
  ContractId,
  CredentialRef,
  CustomerAccountId,
  CustomerPersonId,
  DealId,
  ExecutionAttemptId,
  ExternalRecordSnapshotId,
  IdempotencyKey,
  IdentityLinkId,
  LlmCallId,
  MappingCanonicalKey,
  MappingCategoryId,
  ProposedActionId,
  ProviderConnectionId,
  ProviderEventId,
  ProviderEventType,
  ProviderName,
  ProviderObjectId,
  ProviderObjectType,
  QueueJobId,
  SupportConversationId,
  UserId,
  WebhookSecretRef,
  WorkflowEventId,
  WorkflowId,
  WorkflowRunId,
  WorkflowVersion,
  WorkspaceId,
  WorkspaceMappingId,
  WorkspaceMembershipId
} from "./ids.js"
import {
  ActionGroup,
  ActionKind,
  ApprovalDecisionType,
  ApprovalRequestStatus,
  CanonicalStatus,
  ContractStatus,
  DependencyKind,
  DryRunSupportKind,
  ExecutionAttemptStatus,
  IdempotencySupportKind,
  IdentityLinkStatus,
  InstructionSource,
  MatchMethod,
  ProposedActionStatus,
  ProviderAuthType,
  ProviderCategory,
  ProviderConnectionStatus,
  ProviderEventProcessingStatus,
  QueueJobStatus,
  RiskLevel,
  WebhookVerificationKind,
  WorkflowRunStatus,
  WorkspaceMembershipRole,
  WorkspaceMembershipStatus,
  WorkspaceStatus
} from "./statuses.js"

export const Timestamp = Schema.DateTimeUtc.annotations({
  identifier: "Timestamp"
})
export type Timestamp = Schema.Schema.Type<typeof Timestamp>

export const PositiveInt = Schema.Int.pipe(Schema.greaterThanOrEqualTo(1)).annotations({
  identifier: "PositiveInt"
})
export type PositiveInt = Schema.Schema.Type<typeof PositiveInt>

export const Confidence = Schema.Number.pipe(Schema.between(0, 1)).annotations({
  identifier: "Confidence"
})
export type Confidence = Schema.Schema.Type<typeof Confidence>

export const NonEmptyText = Schema.NonEmptyTrimmedString.annotations({
  identifier: "NonEmptyText"
})
export type NonEmptyText = Schema.Schema.Type<typeof NonEmptyText>

export const OptionalText = Schema.NullOr(NonEmptyText)
export type OptionalText = Schema.Schema.Type<typeof OptionalText>

export const CustomerAccountRef = Schema.Struct({
  type: Schema.Literal("customer_account"),
  id: CustomerAccountId
}).annotations({ identifier: "CustomerAccountRef" })
export type CustomerAccountRef = Schema.Schema.Type<typeof CustomerAccountRef>

export const CustomerPersonRef = Schema.Struct({
  type: Schema.Literal("customer_person"),
  id: CustomerPersonId
}).annotations({ identifier: "CustomerPersonRef" })
export type CustomerPersonRef = Schema.Schema.Type<typeof CustomerPersonRef>

export const DealRef = Schema.Struct({
  type: Schema.Literal("deal"),
  id: DealId
}).annotations({ identifier: "DealRef" })
export type DealRef = Schema.Schema.Type<typeof DealRef>

export const ContractRef = Schema.Struct({
  type: Schema.Literal("contract"),
  id: ContractId
}).annotations({ identifier: "ContractRef" })
export type ContractRef = Schema.Schema.Type<typeof ContractRef>

export const SupportConversationRef = Schema.Struct({
  type: Schema.Literal("support_conversation"),
  id: SupportConversationId
}).annotations({ identifier: "SupportConversationRef" })
export type SupportConversationRef = Schema.Schema.Type<typeof SupportConversationRef>

export const CanonicalEntityRef = Schema.Union(
  CustomerAccountRef,
  CustomerPersonRef,
  DealRef,
  ContractRef,
  SupportConversationRef
).annotations({ identifier: "CanonicalEntityRef" })
export type CanonicalEntityRef = Schema.Schema.Type<typeof CanonicalEntityRef>

export const ExternalRef = Schema.Struct({
  provider: ProviderName,
  providerConnectionId: ProviderConnectionId,
  objectType: ProviderObjectType,
  objectId: ProviderObjectId,
  url: Schema.NullOr(NonEmptyText)
}).annotations({ identifier: "ExternalRef" })
export type ExternalRef = Schema.Schema.Type<typeof ExternalRef>

export const MappingRequirement = Schema.Struct({
  category: MappingCategoryId,
  canonicalKeys: Schema.Array(MappingCanonicalKey),
  required: Schema.Boolean
}).annotations({ identifier: "MappingRequirement" })
export type MappingRequirement = Schema.Schema.Type<typeof MappingRequirement>

export const CapabilitySupport = Schema.Struct({
  supported: Schema.Boolean,
  required: Schema.optionalWith(Schema.Boolean, { exact: true }),
  optional: Schema.optionalWith(Schema.Boolean, { exact: true }),
  idempotency: IdempotencySupportKind,
  dryRunSupport: DryRunSupportKind,
  notes: Schema.optionalWith(NonEmptyText, { exact: true })
}).annotations({ identifier: "CapabilitySupport" })
export type CapabilitySupport = Schema.Schema.Type<typeof CapabilitySupport>

export const WebhookSupport = Schema.Struct({
  canonicalEvent: CanonicalEventType,
  providerEvents: Schema.Array(ProviderEventType),
  verification: WebhookVerificationKind
}).annotations({ identifier: "WebhookSupport" })
export type WebhookSupport = Schema.Schema.Type<typeof WebhookSupport>

export const ProviderLimits = Schema.Struct({
  rateLimitPolicy: Schema.optionalWith(NonEmptyText, { exact: true }),
  maxPageSize: Schema.optionalWith(PositiveInt, { exact: true }),
  notes: Schema.optionalWith(NonEmptyText, { exact: true })
}).annotations({ identifier: "ProviderLimits" })
export type ProviderLimits = Schema.Schema.Type<typeof ProviderLimits>

export const ProviderManifest = Schema.Struct({
  provider: ProviderName,
  category: ProviderCategory,
  version: NonEmptyText,
  displayName: NonEmptyText,
  auth: Schema.Struct({
    supportedTypes: Schema.Array(ProviderAuthType),
    requiresBaseUrl: Schema.Boolean
  }),
  capabilities: Schema.Record({ key: CapabilityId, value: CapabilitySupport }),
  mappings: Schema.Array(MappingRequirement),
  webhooks: Schema.Array(WebhookSupport),
  limits: Schema.optionalWith(ProviderLimits, { exact: true }),
  knownLimitations: Schema.Array(NonEmptyText),
  contractTestSuiteVersion: NonEmptyText
}).annotations({ identifier: "ProviderManifest" })
export type ProviderManifest = Schema.Schema.Type<typeof ProviderManifest>

export const ProviderResult = <A extends Schema.Schema.Any>(normalized: A) =>
  Schema.Struct({
    normalized,
    externalRef: ExternalRef,
    raw: Schema.Unknown
  }).annotations({ identifier: "ProviderResult" })

export const Workspace = Schema.Struct({
  id: WorkspaceId,
  name: NonEmptyText,
  status: WorkspaceStatus,
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "Workspace" })
export type Workspace = Schema.Schema.Type<typeof Workspace>

export const WorkspaceMembership = Schema.Struct({
  id: WorkspaceMembershipId,
  workspaceId: WorkspaceId,
  userId: UserId,
  role: WorkspaceMembershipRole,
  status: WorkspaceMembershipStatus,
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "WorkspaceMembership" })
export type WorkspaceMembership = Schema.Schema.Type<typeof WorkspaceMembership>

export const ProviderConnection = Schema.Struct({
  id: ProviderConnectionId,
  workspaceId: WorkspaceId,
  category: ProviderCategory,
  provider: ProviderName,
  displayName: NonEmptyText,
  baseUrl: OptionalText,
  authType: ProviderAuthType,
  credentialRef: CredentialRef,
  webhookSecretRef: Schema.NullOr(WebhookSecretRef),
  externalAccountId: OptionalText,
  capabilityManifestVersion: NonEmptyText,
  capabilityManifestSnapshot: ProviderManifest,
  status: ProviderConnectionStatus,
  lastVerifiedAt: Schema.NullOr(Timestamp),
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "ProviderConnection" })
export type ProviderConnection = Schema.Schema.Type<typeof ProviderConnection>

export const WorkspaceMapping = Schema.Struct({
  id: WorkspaceMappingId,
  workspaceId: WorkspaceId,
  providerConnectionId: ProviderConnectionId,
  category: MappingCategoryId,
  canonicalKey: MappingCanonicalKey,
  providerValue: NonEmptyText,
  displayLabel: OptionalText,
  verified: Schema.Boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "WorkspaceMapping" })
export type WorkspaceMapping = Schema.Schema.Type<typeof WorkspaceMapping>

export const CustomerAccount = Schema.Struct({
  id: CustomerAccountId,
  workspaceId: WorkspaceId,
  displayName: NonEmptyText,
  domain: OptionalText,
  lifecycleStatus: OptionalText,
  canonicalStatus: CanonicalStatus,
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "CustomerAccount" })
export type CustomerAccount = Schema.Schema.Type<typeof CustomerAccount>

export const CustomerPerson = Schema.Struct({
  id: CustomerPersonId,
  workspaceId: WorkspaceId,
  customerAccountId: Schema.NullOr(CustomerAccountId),
  displayName: NonEmptyText,
  primaryEmail: OptionalText,
  primaryPhone: OptionalText,
  canonicalStatus: CanonicalStatus,
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "CustomerPerson" })
export type CustomerPerson = Schema.Schema.Type<typeof CustomerPerson>

export const Deal = Schema.Struct({
  id: DealId,
  workspaceId: WorkspaceId,
  customerAccountId: Schema.NullOr(CustomerAccountId),
  customerPersonId: Schema.NullOr(CustomerPersonId),
  displayName: NonEmptyText,
  canonicalStage: OptionalText,
  canonicalStatus: CanonicalStatus,
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "Deal" })
export type Deal = Schema.Schema.Type<typeof Deal>

export const Contract = Schema.Struct({
  id: ContractId,
  workspaceId: WorkspaceId,
  customerAccountId: Schema.NullOr(CustomerAccountId),
  customerPersonId: Schema.NullOr(CustomerPersonId),
  dealId: Schema.NullOr(DealId),
  displayName: NonEmptyText,
  canonicalStatus: ContractStatus,
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "Contract" })
export type Contract = Schema.Schema.Type<typeof Contract>

export const SupportConversation = Schema.Struct({
  id: SupportConversationId,
  workspaceId: WorkspaceId,
  displayName: OptionalText,
  canonicalStatus: CanonicalStatus,
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "SupportConversation" })
export type SupportConversation = Schema.Schema.Type<typeof SupportConversation>

export const IdentityLink = Schema.Struct({
  id: IdentityLinkId,
  workspaceId: WorkspaceId,
  canonicalEntityRef: CanonicalEntityRef,
  providerConnectionId: ProviderConnectionId,
  provider: ProviderName,
  providerObjectType: ProviderObjectType,
  providerObjectId: ProviderObjectId,
  matchMethod: MatchMethod,
  confidence: Confidence,
  verified: Schema.Boolean,
  status: IdentityLinkStatus,
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "IdentityLink" })
export type IdentityLink = Schema.Schema.Type<typeof IdentityLink>

export const WorkflowRun = Schema.Struct({
  id: WorkflowRunId,
  workspaceId: WorkspaceId,
  createdByUserId: Schema.NullOr(UserId),
  workflowId: WorkflowId,
  workflowVersion: WorkflowVersion,
  status: WorkflowRunStatus,
  instructionSource: InstructionSource,
  instructionText: OptionalText,
  currentStep: OptionalText,
  startedAt: Timestamp,
  completedAt: Schema.NullOr(Timestamp),
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "WorkflowRun" })
export type WorkflowRun = Schema.Schema.Type<typeof WorkflowRun>

export const DependencyRef = Schema.Struct({
  kind: DependencyKind,
  ref: NonEmptyText,
  satisfied: Schema.Boolean,
  reason: OptionalText
}).annotations({ identifier: "DependencyRef" })
export type DependencyRef = Schema.Schema.Type<typeof DependencyRef>

export const StateAssumption = Schema.Struct({
  key: NonEmptyText,
  description: NonEmptyText,
  observedAt: Schema.NullOr(Timestamp),
  value: Schema.Unknown
}).annotations({ identifier: "StateAssumption" })
export type StateAssumption = Schema.Schema.Type<typeof StateAssumption>

export const ProposedAction = Schema.Struct({
  id: ProposedActionId,
  workspaceId: WorkspaceId,
  workflowRunId: WorkflowRunId,
  approvalRequestId: Schema.NullOr(ApprovalRequestId),
  businessActionId: BusinessActionId,
  businessActionVersion: BusinessActionVersion,
  capabilityId: CapabilityId,
  targetProviderConnectionId: Schema.NullOr(ProviderConnectionId),
  status: ProposedActionStatus,
  version: PositiveInt,
  supersedesProposedActionId: Schema.NullOr(ProposedActionId),
  riskLevel: RiskLevel,
  canonicalEntityRefs: Schema.Array(CanonicalEntityRef),
  inputPayload: Schema.Unknown,
  providerWritePayload: Schema.Unknown,
  previewBefore: Schema.Unknown,
  previewAfter: Schema.Unknown,
  humanExplanation: NonEmptyText,
  approvalPolicySnapshot: Schema.Unknown,
  capabilityManifestSnapshot: ProviderManifest,
  dependencyRefs: Schema.Array(DependencyRef),
  assumptions: Schema.Array(StateAssumption),
  idempotencyKey: IdempotencyKey,
  expiresAt: Schema.NullOr(Timestamp),
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "ProposedAction" })
export type ProposedAction = Schema.Schema.Type<typeof ProposedAction>

export const ApprovalRequest = Schema.Struct({
  id: ApprovalRequestId,
  workspaceId: WorkspaceId,
  workflowRunId: WorkflowRunId,
  status: ApprovalRequestStatus,
  requestedByUserId: Schema.NullOr(UserId),
  assignedToUserId: Schema.NullOr(UserId),
  summary: NonEmptyText,
  expiresAt: Schema.NullOr(Timestamp),
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "ApprovalRequest" })
export type ApprovalRequest = Schema.Schema.Type<typeof ApprovalRequest>

export const ApprovalDecision = Schema.Struct({
  id: ApprovalDecisionId,
  workspaceId: WorkspaceId,
  approvalRequestId: ApprovalRequestId,
  proposedActionId: ProposedActionId,
  decision: ApprovalDecisionType,
  decidedByUserId: Schema.NullOr(UserId),
  reason: OptionalText,
  policyDecisionSnapshot: Schema.Unknown,
  decidedAt: Timestamp
}).annotations({ identifier: "ApprovalDecision" })
export type ApprovalDecision = Schema.Schema.Type<typeof ApprovalDecision>

export const ExecutionAttempt = Schema.Struct({
  id: ExecutionAttemptId,
  workspaceId: WorkspaceId,
  workflowRunId: WorkflowRunId,
  proposedActionId: ProposedActionId,
  providerConnectionId: Schema.NullOr(ProviderConnectionId),
  idempotencyKey: IdempotencyKey,
  attemptNumber: PositiveInt,
  status: ExecutionAttemptStatus,
  requestPayload: Schema.Unknown,
  responsePayload: Schema.Unknown,
  externalRef: Schema.NullOr(ExternalRef),
  errorPayload: Schema.Unknown,
  startedAt: Timestamp,
  completedAt: Schema.NullOr(Timestamp)
}).annotations({ identifier: "ExecutionAttempt" })
export type ExecutionAttempt = Schema.Schema.Type<typeof ExecutionAttempt>

export const WorkflowEvent = Schema.Struct({
  id: WorkflowEventId,
  workspaceId: WorkspaceId,
  workflowRunId: WorkflowRunId,
  eventType: CanonicalEventType,
  eventPayload: Schema.Unknown,
  createdAt: Timestamp
}).annotations({ identifier: "WorkflowEvent" })
export type WorkflowEvent = Schema.Schema.Type<typeof WorkflowEvent>

export const ProviderEvent = Schema.Struct({
  id: ProviderEventId,
  workspaceId: WorkspaceId,
  providerConnectionId: ProviderConnectionId,
  provider: ProviderName,
  providerEventType: ProviderEventType,
  dedupeKey: NonEmptyText,
  rawPayload: Schema.Unknown,
  headersHash: OptionalText,
  canonicalEventType: Schema.NullOr(CanonicalEventType),
  processingStatus: ProviderEventProcessingStatus,
  receivedAt: Timestamp,
  processedAt: Schema.NullOr(Timestamp)
}).annotations({ identifier: "ProviderEvent" })
export type ProviderEvent = Schema.Schema.Type<typeof ProviderEvent>

export const ExternalRecordSnapshot = Schema.Struct({
  id: ExternalRecordSnapshotId,
  workspaceId: WorkspaceId,
  providerConnectionId: ProviderConnectionId,
  provider: ProviderName,
  providerObjectType: ProviderObjectType,
  providerObjectId: ProviderObjectId,
  canonicalType: OptionalText,
  canonicalEntityRef: Schema.NullOr(CanonicalEntityRef),
  normalizedPayload: Schema.Unknown,
  rawPayload: Schema.Unknown,
  contentHash: NonEmptyText,
  fetchedAt: Timestamp,
  observedAt: Schema.NullOr(Timestamp),
  createdAt: Timestamp
}).annotations({ identifier: "ExternalRecordSnapshot" })
export type ExternalRecordSnapshot = Schema.Schema.Type<typeof ExternalRecordSnapshot>

export const LlmCall = Schema.Struct({
  id: LlmCallId,
  workspaceId: WorkspaceId,
  workflowRunId: Schema.NullOr(WorkflowRunId),
  purpose: NonEmptyText,
  model: NonEmptyText,
  inputContextRef: OptionalText,
  redactedPrompt: Schema.Unknown,
  structuredOutput: Schema.Unknown,
  validationErrors: Schema.Unknown,
  latencyMs: Schema.NullOr(PositiveInt),
  costUnits: Schema.NullOr(Schema.Number),
  createdAt: Timestamp
}).annotations({ identifier: "LlmCall" })
export type LlmCall = Schema.Schema.Type<typeof LlmCall>

export const QueueJob = Schema.Struct({
  id: QueueJobId,
  workspaceId: Schema.NullOr(WorkspaceId),
  jobType: NonEmptyText,
  payload: Schema.Unknown,
  status: QueueJobStatus,
  runAfter: Timestamp,
  attempts: Schema.Int,
  maxAttempts: PositiveInt,
  lockedBy: OptionalText,
  lockedAt: Schema.NullOr(Timestamp),
  lastError: Schema.Unknown,
  createdAt: Timestamp,
  updatedAt: Timestamp
}).annotations({ identifier: "QueueJob" })
export type QueueJob = Schema.Schema.Type<typeof QueueJob>

export const BusinessActionDefinition = Schema.Struct({
  id: BusinessActionId,
  version: BusinessActionVersion,
  group: ActionGroup,
  kind: ActionKind,
  title: NonEmptyText,
  description: NonEmptyText,
  inputSchema: Schema.Unknown,
  outputSchema: Schema.Unknown,
  requiredCapabilities: Schema.Array(CapabilityId),
  requiredMappings: Schema.Array(MappingRequirement),
  defaultApprovalPolicy: Schema.Unknown,
  riskLevel: RiskLevel,
  plannerHints: Schema.Array(NonEmptyText),
  evals: Schema.Struct({
    goldenPathRequired: Schema.Boolean,
    guardrailRequired: Schema.Boolean
  })
}).annotations({ identifier: "BusinessActionDefinition" })
export type BusinessActionDefinition = Schema.Schema.Type<typeof BusinessActionDefinition>

export const CapabilityDefinition = Schema.Struct({
  id: CapabilityId,
  category: ProviderCategory,
  title: NonEmptyText,
  inputSchema: Schema.Unknown,
  outputSchema: Schema.Unknown,
  externalWrite: Schema.Boolean,
  defaultRiskLevel: RiskLevel
}).annotations({ identifier: "CapabilityDefinition" })
export type CapabilityDefinition = Schema.Schema.Type<typeof CapabilityDefinition>
