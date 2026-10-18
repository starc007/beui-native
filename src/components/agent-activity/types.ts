import type { ReactNode } from "react";

export type AgentActivityStatus = "working" | "complete";
export type AgentStepStatus = "pending" | "active" | "complete";

export type AgentActivityStep = {
  id: string;
  type: "step";
  label: ReactNode;
  /** Defaults to "complete". */
  status?: AgentStepStatus;
  meta?: ReactNode;
};

export type AgentActivityText = {
  id: string;
  type: "text";
  content: ReactNode;
};

export type AgentSearchResult = {
  id: string;
  title: ReactNode;
  domain?: ReactNode;
  /** Makes the result tappable through `onOpenResult`. */
  url?: string;
  icon?: ReactNode;
};

export type AgentActivitySearch = {
  id: string;
  type: "search";
  query: ReactNode;
  results?: AgentSearchResult[];
  moreCount?: number;
};

export type AgentActivityTool = {
  id: string;
  type: "tool";
  action: "read" | "edit" | "run" | (string & {});
  target: ReactNode;
  additions?: number;
  deletions?: number;
};

export type AgentTraceKind =
  | "thinking"
  | "message"
  | "write"
  | "run"
  | "read"
  | (string & {});

export type AgentActivityTrace = {
  id: string;
  type: "trace";
  kind: AgentTraceKind;
  label: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
};

export type AgentActivityItem =
  | AgentActivityStep
  | AgentActivityText
  | AgentActivitySearch
  | AgentActivityTool
  | AgentActivityTrace;

export type AgentActivityContentType = AgentActivityItem["type"] | "mixed";
