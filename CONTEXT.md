# Orqent

Orqent is a workflow automation context for small service businesses that coordinate customer requests, sales follow-up, contracts, approvals, and cross-system work.

## Language

**Business Owner**:
The person responsible for instructing Orqent, reviewing proposed work, and approving external changes for a workspace.
_Avoid_: End user, operator, client

**Workspace**:
A business environment in Orqent containing its people, provider connections, workflows, approvals, and audit history.
_Avoid_: Tenant when speaking to users, account

**Customer Account**:
The company or organization receiving service from the business. Customer Accounts are the primary customer record in Orqent's business language.
_Avoid_: Account, client, company when the broader customer relationship is meant

**Customer Person**:
An individual contact linked to a Customer Account, such as a signer, support requester, or point of contact.
_Avoid_: User, lead, contact when the person is part of a known customer relationship

**Customer Request**:
A customer-originated need or question that may require support, sales follow-up, onboarding, renewal, or contract work.
_Avoid_: Ticket when the request may span systems

**Support Conversation**:
A support-system conversation that contains customer messages and internal handling context.
_Avoid_: Ticket when referring specifically to the message thread

**Deal**:
A sales opportunity connected to a Customer Account and, when known, a Customer Person.
_Avoid_: Opportunity in Orqent-facing language

**Proposal Package**:
A draft, read-only package prepared from customer, deal, and support context before a signature-ready Contract exists.
_Avoid_: Contract, agreement

**Contract**:
A signature-ready agreement managed through a contracts provider and linked back to the relevant Customer Account, Customer Person, and Deal when known.
_Avoid_: Proposal, document when signature lifecycle matters

**Signer**:
A Customer Person or other recipient expected to complete or review a Contract.
_Avoid_: Recipient when signature responsibility matters

**Workflow**:
A reusable business flow that turns an instruction or event into planned work across systems.
_Avoid_: Automation when discussing a single run

**Workflow Run**:
One execution instance of a Workflow, including the instruction, context, proposed work, approvals, execution attempts, and trace.
_Avoid_: Job, task

**Business Action**:
A named Orqent action that expresses business intent, such as creating a Deal from a Support Conversation or sending a Contract for signature.
_Avoid_: Tool call, endpoint

**Action Catalog**:
The collection of versioned Business Action definitions available to Orqent, including their schemas, required capabilities, risk, approval policy, and eval metadata.
_Avoid_: Tool registry when discussing business workflow actions

**Planner**:
The Orqent capability that turns a Business Owner instruction and Customer Context into a Workflow Run plan with Proposed Actions or Clarification Questions.
_Avoid_: Agent when the specific planning responsibility is meant

**Clarification Question**:
A question Orqent asks when it cannot safely create Proposed Actions because required intent, identity, mapping, or parameter information is missing or ambiguous.
_Avoid_: Error, prompt

**Proposed Action**:
A specific action instance prepared for review before any approval-required external change is executed.
_Avoid_: Action when approval state matters

**Approval Request**:
A request for a Business Owner or authorized teammate to approve, reject, or edit one or more Proposed Actions.
_Avoid_: Permission prompt

**Approval Decision**:
The recorded outcome for a Proposed Action, such as approved, rejected, edited, or expired.
_Avoid_: Approval when the specific decision result matters

**External Write**:
Any change Orqent makes to a connected provider system, especially customer-facing, CRM, support, or contract state.
_Avoid_: Write when internal Orqent state is meant

**Provider**:
An external business system connected to Orqent, such as a CRM, support system, or contracts system.
_Avoid_: Integration when referring to the external system itself

**Identity Link**:
A recorded relationship between an Orqent business entity and an external provider record, including how confidently the relationship is known.
_Avoid_: Mapping when referring to record identity

**Customer Context**:
The assembled view of a Customer Account, related Customer People, support history, deals, contracts, approvals, and recent Workflow Runs.
_Avoid_: Customer 360 unless referring to a materialized view

**Evaluation**:
A repeatable test case or suite that checks whether Orqent selected the right Workflow, Proposed Actions, clarifications, and approval guardrails for a scenario.
_Avoid_: Test when specifically measuring planner or workflow quality

**Demo Workspace**:
A workspace backed by fake or sandbox Providers that lets someone experience real Orqent workflow behavior without connecting their own business systems.
_Avoid_: Mock app, sample data only
