export type MessageChannel =
  | 'notice'
  | 'internal_note'
  | 'counselor_note'
  | 'principal_note'
  | 'parent_request'
  | 'subscription'
  | 'audit'
  | 'system_event';

export interface WorkspaceMessage {
  id: string;
  tenantId: string;
  channel: MessageChannel;
  title: string;
  body: string;
  sourceModule?: string | null;
  sourceWorkspace?: string | null;
  rowIds?: string[] | null;
  createdBy?: string | null;
  createdAt: string;
  meta?: unknown;
}

export interface CreateMessageInput {
  tenantId: string;
  channel: MessageChannel;
  title: string;
  body: string;
  sourceModule?: string;
  sourceWorkspace?: string;
  rowIds?: string[];
  createdBy?: string;
  meta?: unknown;
}

export interface WorkspaceSubscription {
  id: string;
  tenantId: string;
  userId?: string | null;
  scope: string;
  targetKey?: string | null;
  enabled: boolean;
  delivery: string;
  meta?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertWorkspaceSubscriptionInput {
  tenantId: string;
  userId?: string | null;
  scope: string;
  targetKey?: string | null;
  enabled?: boolean;
  delivery?: string;
  meta?: unknown;
}

export interface AuditEventInput {
  tenantId: string;
  userId?: string;
  action: string;
  subjectType?: string;
  subjectId?: string;
  messageId?: string;
  meta?: unknown;
}

export interface WorkspaceAuditTrail {
  id: string;
  tenantId: string;
  userId?: string | null;
  action: string;
  subjectType?: string | null;
  subjectId?: string | null;
  messageId?: string | null;
  meta?: unknown;
  createdAt: string;
}

