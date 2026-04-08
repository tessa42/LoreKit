export interface LorcheckQuickInput {
  text: string;
  genre?: string;
  existingSetting?: string;
}

export interface NormalizedLorcheckQuickInput {
  text: string;
  genre: string;
  existingSetting: string;
}

export interface LorcheckAnalyzeResult {
  genre: string;
  era: string;
  setting: string;
  materials: string[];
  groups: string[];
  uses_intentional_imagination: boolean;
}

export type IssueType = 'immersion_break' | 'intentional' | 'insider_context';
export type IssueSeverity = 'low' | 'medium' | 'high';

export interface LorcheckIssue {
  type: IssueType;
  severity?: IssueSeverity; // intentional 타입은 severity 없음
  description: string;
  suggestion: string;
}

export interface LorcheckCheckResult {
  issues: LorcheckIssue[];
}

export interface LorcheckResearchResult {
  insider_rules: {
    subject: string;
    rules: string[];
  }[];
}

export interface LorcheckQuickPayload {
  text: string;
  genre: string;
  existingSetting: string;
  issues: LorcheckIssue[];
  checked_at: string;
}
