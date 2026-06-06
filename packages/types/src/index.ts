/**
 * @packageDocumentation
 * Shared protocol types for SentryGuardian SDK and backend.
 * SentryGuardian SDK 与后端共用的协议类型。
 */

export type { Breadcrumb, BreadcrumbLevel } from './breadcrumb.js';
export type { StackFrame } from './stack.js';
export type {
  ErrorEvent,
  EventLevel,
  ExceptionData,
  ExceptionMechanism,
  ExceptionStacktrace,
  ExceptionValue,
  Platform,
  RequestContext,
  SdkInfo,
  User,
} from './event.js';
export type {
  Envelope,
  EnvelopeHeader,
  EnvelopeItem,
  EnvelopeItemHeader,
  EnvelopeItemType,
  ParsedEnvelope,
  SdkInfoRef,
} from './envelope.js';
export type { Issue, IssueStatus } from './issue.js';
export type {
  EventDetailResponse,
  EventSummary,
  IssueEventListQuery,
  IssueEventListResponse,
} from './event-api.js';
export type {
  ErrorBreakdownItem,
  ErrorBreakdownResponse,
  ErrorTypeTrendPoint,
  ErrorTypeTrendResponse,
  ErrorTypeTrendSeries,
  IssueErrorBreakdownResponse,
  IssueTrendResponse,
  ReleaseCompareResponse,
  ReleaseStats,
  TransactionEvent,
  TransactionListResponse,
  TransactionSummary,
  TrendBucket,
} from './performance.js';
export type {
  AlertRuleRequest,
  AlertRuleResponse,
  AlertTrigger,
  CreateIssueCommentRequest,
  CreateProjectRequest,
  CreateReleaseRequest,
  IssueCommentResponse,
  IssueDetailResponse,
  IssueListQuery,
  IssueListResponse,
  LoginRequest,
  LoginResponse,
  ProjectResponse,
  ReleaseResponse,
  RotateKeyResponse,
  SetupRequest,
  SetupResponse,
  SetupStatusResponse,
  UpdateIssueStatusRequest,
} from './api.js';
